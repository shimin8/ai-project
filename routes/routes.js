import express from "express";
const router = express.Router();
import GeminiService from "../services/geminiService.js";

router.post("/gemini-api", async (req, res) => {
    const geminiService = new GeminiService();
    const result = await geminiService.analyseTPLogsErrors(req);

    res.json(result);
});

export default router;
