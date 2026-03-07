import { Request, Response } from "express";
import { getGitHubApp, isGitHubAppConfigured } from "../services/githubService";

export const getAppInfo = async (req: Request, res: Response) => {
  try {
    if (!isGitHubAppConfigured()) {
      return res.status(503).json({ 
        error: "GitHub App not configured. Set GITHUB_APP_ID, GITHUB_PRIVATE_KEY, and GITHUB_INSTALLATION_ID in .env." 
      });
    }

    const app = getGitHubApp();
    if (!app) {
      return res.status(500).json({ error: "Failed to initialize GitHub App" });
    }

    const { data } = await app.octokit.request("GET /app");
    res.json(data);
  } catch (error: any) {
    console.error("Error fetching GitHub App info:", error.message);
    res.status(500).json({ error: error.message });
  }
};
