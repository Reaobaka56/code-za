import express from "express";
import { cloneRepository, getAppInfo } from "../controllers/githubController";
import { cloneRateLimit } from "../middleware/apiHardening";

const router = express.Router();

router.get("/app-info", getAppInfo);
router.post("/clone", cloneRateLimit, cloneRepository);

export default router;
