import express from "express";
import { runCode, runTerminal } from "../controllers/executionController";

const router = express.Router();

router.post("/run", runCode);
router.post("/terminal", runTerminal);

export default router;
