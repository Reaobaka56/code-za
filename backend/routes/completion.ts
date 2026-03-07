import express from "express";
import { getCompletions, explainCode } from "../controllers/completionController";

const router = express.Router();

router.post("/complete", getCompletions);
router.post("/explain", explainCode);

export default router;
