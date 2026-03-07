import express from "express";
import { getGitHubAuthUrl, handleGitHubCallback } from "../controllers/authController";

const router = express.Router();

router.get("/github/url", getGitHubAuthUrl);
router.get("/github/callback", handleGitHubCallback);

export default router;
