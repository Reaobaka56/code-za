import express from "express";
import { runCode, runTerminal } from "../controllers/executionController";
import { executionRateLimit } from "../middleware/apiHardening";

const router = express.Router();

router.post("/run", executionRateLimit, runCode);
router.post("/terminal", executionRateLimit, runTerminal);

export default router;
