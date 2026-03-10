import express from "express";
import { cloneRepository, getAppInfo } from "../controllers/githubController";

const router = express.Router();

router.get("/app-info", getAppInfo);
router.post("/clone", cloneRepository);

export default router;
