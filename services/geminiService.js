import LifeThirdPartyApiLogModel from "../models/LifeThirdPartyApiLogModel.js";
import axios from "axios";
import Constants from "../constants.js";
import GeminiQuotesResponseModel from "../models/GeminiQuotesModel.js"

export default class GeminiService {

    retryLimit = 3;
    resouceExhaustedError = "RESOURCE_EXHAUSTED";

    constructor() {

    }

    async analyseTPLogsErrors(req) {
        try {
            const reqBody = req.body;
            const { query, projection, options } = this.getQuery(reqBody);
            const data = await LifeThirdPartyApiLogModel.find(query, projection, options);
            const geminiRes = await this.geminiAPIResponse(reqBody, data);
            // const records = await GeminiQuotesResponseModel.find({ insurer: "digit_life" }, { limit: 5 });
            await GeminiQuotesResponseModel.insertMany(geminiRes);
            await this.sendDataToNewRelic(geminiRes);
            // await this.sendDataToDataDog(geminiRes);
            return geminiRes;
        } catch (err) {
            console.log('#### line 26 ####', err)
            throw err;
        }
    }

    getQuery(reqBody) {

        let query = {
            is_success: false,
            insurer_id: reqBody.insurer_id,
            api_name: { $in: reqBody.apiName }
        };
        const projection = {
            lead_id: 1,
            insurer_id: 1,
            request_method: 1,
            request_data: 1,
            response_data: 1,
            api_name: 1,
            url: 1,
            createdAt: 1,
            updatedAt: 1,
        };
        const options = { limit: reqBody.limit }

        return { query, projection, options };
    }

    async geminiAPIResponse(reqBody, logData) {
        try {

            const responseFormat = ["_id", "apiName", "url", "leadId", "insurerId", "errorCategory", "errorMsg", "actionableInsights", "createdAt", "updatedAt"];
            const responseArr = [];
            for (let i = 0; i < reqBody.limit && i < logData.length; i += 5) {
                const range = Math.min(5, logData.length - i);
                const prompt = `Hi, Can you please help me with the following query?
                            Analyze the given data, which can be in JSON or XML
                            ${JSON.stringify(logData.slice(i, i + range))}

                            For each log entry, identify the following:
                            1. Specifically, analyze the request body and response body for any **errors** (only if errors are present, otherwise skip the entry).
                            2. **For entries with errors**:
                                - Categorize the errors based on their types (e.g., validation error, timeout, etc.).
                                - Format the analysis in an array of objects using the following structure:
                                ${JSON.stringify(responseFormat)}
                            3. For **errorCategory**, keep the name clear and self-explanatory (e.g., "Authentication Error" or "Validation Error").
                            4. For **actionableInsights**, ensure the suggestions are concise (20-30 words), practical, and relevant.
                            
                            Thank you!`;

                const data = JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt,
                                },
                            ],
                        },
                    ],
                });

                const config = {
                    method: 'post',
                    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + process.env.GEMINI_API_KEY,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    data: data,
                    json: false,
                    timeout: 20000,
                };

                // responseArr.push(this.sendPostRequest(config));
                let retryFlag = true;
                let retryCount = 0;
                while (retryFlag && retryCount <= this.retryLimit) {
                    try {
                        retryCount++;
                        responseArr.push(await this.sendPostRequest(config));
                        retryFlag = false;
                    } catch (err) {
                        console.log('#### line 87 ####', retryCount, err);
                    }
                }
            }
            // let apiResponse = []
            // try {
            //     apiResponse = await Promise.all(responseArr);
            // } catch (err) {
            //     console.log(err);
            //     throw err;
            // }

            const C = new Constants();
            const geminiRes = [];
            for (const res of responseArr) {
                try {
                    if (res.error && res.error.status === this.resouceExhaustedError) {
                        continue;
                    }
                    const actualText = res.candidates[0].content.parts[0].text;
                    // if (actualText.slice(-3) !== "```") {
                    //     console.log('actualText: ', actualText);
                    //     continue;
                    // }
                    let semiParsedResArr = actualText.slice(7, -4);
                    semiParsedResArr = JSON.parse(semiParsedResArr);
                    for (const obj of semiParsedResArr) {
                        obj.insurer = C.INSURER_ID_SLUG_MAPPING[obj.insurerId];
                        obj.logId = obj._id;
                        obj.logCreatedAt = obj.createdAt;
                        obj.logUpdatedAt = obj.updatedAt;
                        delete obj.insurerId;
                        delete obj._id;
                        delete obj.createdAt;
                        delete obj.updatedAt;
                    }
                    geminiRes.push(...semiParsedResArr);
                } catch (err) {
                    console.log('#### line 118 ####', err);
                }
            }

            return geminiRes;
        } catch (err) {
            console.log('#### line 124 ####', err);
            err.text = "Gemini gave an error"
            throw err;
        }
    }

    async sendPostRequest(config) {
        try {
            const apiRes = await axios(config);
            return apiRes.data;
        } catch (err) {
            console.log("#### line 158 ####", err);
            throw err;
        }
    }

    async sendDataToNewRelic(jsonData) {
        try {

            const formattedData = [];
            for (const obj of jsonData) {
                formattedData.push({
                    message: obj.errorMsg,
                    attributes: {
                        ...obj
                    }
                });
            }
            const config = {
                method: 'post',
                url: 'https://log-api.newrelic.com/log/v1',
                headers: {
                    'Content-Type': 'application/json',
                    'Api-Key': process.env.NEW_RELIC_LICENSE_KEY,
                },
                data: formattedData,
                json: false,
                timeout: 20000,
            };

            const apiRes = await this.sendPostRequest(config);
            return apiRes;
        } catch (err) {
            console.log("### line 173 ###", err);
            throw err;
        }
    }

    // async sendDataToDataDog(jsonData) {
    //     try {

    //         const config = {
    //             method: 'post',
    //             url: 'https://http-intake.logs.datadoghq.com/v1/input',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'DD-API-KEY': process.env.DATADOG_API_KEY
    //             },
    //             data: jsonData,
    //             json: true,
    //         };

    //         const apiResponse = await sendPostRequest(config);
    //         console.log(apiResponse);
    //     } catch (err) {
    //         throw err;
    //     }
    // }
}