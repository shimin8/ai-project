import LifeThirdPartyApiLog from "../models/LifeThirdPartyApiLogModel.js";

export default class GeminiService {

    retryLimit = 3;
    resouceExhaustedError = "RESOURCE_EXHAUSTED";

    constructor() {

    }

    async analyseTPLogsErrors(req) {
        try {
            const reqBody = req.body;
            const { query, projection, options } = this.getQuery(reqBody);
            const data = [];//await LifeThirdPartyApiLog.find(query, projection, options);
            const geminiRes = await this.geminiAPIResponse(reqBody, data);
            // await GeminiQuotesResponseModel.insertMany(geminiRes);
            // await this.sendDataToDataDog(geminiRes);
            return geminiRes;
        } catch (err) {
            console.log("line 26", err)
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
        
                const options = {
                    method: 'post',
                    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + process.env.GEMINI_API_KEY,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    data: data,
                    json: false,
                    timeout: 20000,
                };

                // responseArr.push(LifeRestHttpUtil.sendPostRequest(options));
                let retryFlag = true;
                let retryCount = 0;
                while (retryFlag && retryCount <= this.retryLimit) {
                    try {
                        retryCount++;
                        responseArr.push(await LifeRestHttpUtil.sendPostRequest(options));
                        retryFlag = false;
                    } catch (err) {
                        console.log('line 87', retryCount, err);
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

            const geminiRes = [];
            for (const res of responseArr) {
                let semiParsedRes = JSON.parse(res.response);
                try {
                    if (!Utils.isEmpty(semiParsedRes.error) && semiParsedRes.error.status === this.resouceExhaustedError) {
                        continue;
                    }
                    const actualText = semiParsedRes.candidates[0].content.parts[0].text;
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
                    console.log('line 118: ', err);
                }
            }

            return geminiRes;
        } catch (err) {
            console.log('line 124: ', err);
            err.text = "Gemini gave an error"
            throw err;
        }
    }

    // async sendDataToDataDog(jsonData) {
    //     try {

    //         const options = {
    //             method: 'post',
    //             url: 'https://http-intake.logs.datadoghq.com/v1/input',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'DD-API-KEY': process.env.DATADOG_API_KEY
    //             },
    //             data: jsonData,
    //             json: true,
    //         };

    //         const apiResponse = await LifeRestHttpUtil.sendPostRequest(options);
    //         console.log(apiResponse);
    //     } catch (err) {
    //         throw err;
    //     }
    // }
}