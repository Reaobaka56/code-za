import { Request, Response } from "express";
import axios from "axios";

export const getGitHubAuthUrl = (req: Request, res: Response) => {
  const client_id = process.env.GITHUB_CLIENT_ID;
  const app_url = process.env.APP_URL || `http://localhost:3000`;
  const redirect_uri = `${app_url}/auth/github/callback`;
  
  if (!client_id) {
    return res.status(500).json({ error: "GITHUB_CLIENT_ID is not configured" });
  }

  const params = new URLSearchParams({
    client_id,
    redirect_uri,
    scope: "user:email",
    allow_signup: "true",
  });

  const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
  res.json({ url: authUrl });
};

export const handleGitHubCallback = async (req: Request, res: Response) => {
  const { code } = req.query;
  const client_id = process.env.GITHUB_CLIENT_ID;
  const client_secret = process.env.GITHUB_CLIENT_SECRET;

  if (!code) {
    return res.status(400).send("No code provided");
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id,
        client_secret,
        code,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    const { access_token } = tokenResponse.data;

    if (!access_token) {
      throw new Error("Failed to obtain access token");
    }

    // Send success message to parent window and close popup
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'GITHUB_AUTH_SUCCESS', 
                accessToken: '${access_token}' 
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error("GitHub OAuth error:", error.response?.data || error.message);
    res.status(500).send("Authentication failed");
  }
};
