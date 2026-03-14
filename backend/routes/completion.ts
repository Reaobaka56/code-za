import express from "express";
import { getCompletions, explainCode, chatWithAssistant } from "../controllers/completionController";

const router = express.Router();

router.post("/complete", getCompletions);
router.post("/explain", explainCode);
router.post("/chat", chatWithAssistant);

export default router;
