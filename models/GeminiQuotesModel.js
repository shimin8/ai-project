import mongoose, { Schema } from "mongoose";
import MongoDB from "../database/db.js";

const GeminiQuotesResponseSchema = new mongoose.Schema(
    {
        logId: { type: String },
        leadId: { type: String },
        apiName: { type: String },
        insurer: { type: String },
        url: { type: String },
        errorCategory: { type: String },
        errorMsg: { type: String },
        actionableInsights: { type: String },
        logCreatedAt: { type: Date },
        logUpdatedAt: { type: Date },
    },
    {
        collection: "gemini_quotes_response", timestamps: true,
    }
);

const dbConnection = MongoDB.getConnection();
const GeminiQuotesResponseModel = dbConnection.model("GeminiQuotesResponseModel", GeminiQuotesResponseSchema);

export default GeminiQuotesResponseModel;