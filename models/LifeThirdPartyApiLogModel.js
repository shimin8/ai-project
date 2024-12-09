import mongoose, { Schema } from "mongoose";
import MongoDBLogger from "../database/logger.db.js";

const LifeThirdPartyApiLogSchema = new mongoose.Schema(
    {
        url: { type: String },
        lead_id: { type: String, index: true },
        policy_case_id: { type: String },
        group_id: { type: String },
        request_method: { type: String },
        request_type: { type: String },
        insurer_id: { type: Number },
        headers: { type: Schema.Types.Mixed, default: "" },
        api_name: { type: String },
        plan_name: { type: String },
        plan_tenure: { type: String },
        request_data: { type: Schema.Types.Mixed },
        duration: { type: String },
        is_success: { type: String },
        insurer_reference: { type: String },
        response_data: { type: Schema.Types.Mixed },
        raw_request : { type: Schema.Types.Mixed },
    },
    {
        collection: "life_third_party_api_log", timestamps: true,
    }
);

const dbConnection = MongoDBLogger.getConnection();
const LifeThirdPartyApiLogModel = dbConnection.model("LifeThirdPartyApiLogModel", LifeThirdPartyApiLogSchema);

export default LifeThirdPartyApiLogModel;