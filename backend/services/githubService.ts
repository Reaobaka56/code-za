import { Octokit } from "octokit";
import { App } from "octokit";

let githubApp: App | null = null;

export const isGitHubAppConfigured = (): boolean => {
  return !!(process.env.GITHUB_APP_ID && process.env.GITHUB_PRIVATE_KEY && process.env.GITHUB_INSTALLATION_ID);
};

export const getGitHubApp = () => {
  if (!githubApp) {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_PRIVATE_KEY;

    if (!appId || !privateKey) {
      console.warn(
        "⚠️  GitHub App not configured. Server-side operations (gists, etc.) will not work.\n" +
        "   Set GITHUB_APP_ID and GITHUB_PRIVATE_KEY in .env to enable."
      );
      return null;
    }

    // Handle potential formatting issues with private key (e.g., escaped newlines)
    const formattedKey = privateKey.replace(/\\n/g, '\n');

    try {
      githubApp = new App({
        appId,
        privateKey: formattedKey,
      });
    } catch (error) {
      console.error("Failed to initialize GitHub App:", error);
      return null;
    }
  }
  return githubApp;
};

export const getAppOctokit = async () => {
  const app = getGitHubApp();
  if (!app) {
    throw new Error(
      "GitHub App not initialized. Configure GITHUB_APP_ID, GITHUB_PRIVATE_KEY, and GITHUB_INSTALLATION_ID in .env."
    );
  }
  const installationId = Number(process.env.GITHUB_INSTALLATION_ID);
  if (!installationId) {
    throw new Error("GITHUB_INSTALLATION_ID not set.");
  }
  return await app.getInstallationOctokit(installationId);
};

export const createGist = async (files: Record<string, { content: string }>, description: string, isPublic: boolean = false) => {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY;

  // If we have App credentials, we can act as the app
  // But usually, Gists are created on behalf of a user.
  // For now, let's assume we use a personal access token if available, 
  // or the App's installation token if configured.
  
  // If the user is logged in via OAuth, we should use their token.
  // This service will be expanded as needed.
};
