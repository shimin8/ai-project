import express from "express";
const router = express.Router();
import GeminiService from "../services/geminiService.js";

router.post("/gemini-api", (req, res) => {
    const geminiService = new GeminiService();
    return geminiService.analyseTPLogsErrors(req);
});

export default router;
