import { Request, Response } from "express";
import JSZip from "jszip";
import axios from "axios";
import { getGitHubApp, isGitHubAppConfigured } from "../services/githubService";

type RepoTreeNode = {
  id: string;
  name: string;
  type: "file" | "folder";
  content?: string;
  children?: RepoTreeNode[];
};

const parseGitHubUrl = (repoUrl: string): { owner: string; repo: string; branch?: string } | null => {
  try {
    const url = new URL(repoUrl.trim());
    if (url.hostname !== "github.com") {
      return null;
    }

    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) {
      return null;
    }

    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, "");

    let branch: string | undefined;
    if (parts[2] === "tree" && parts[3]) {
      branch = parts[3];
    }

    return { owner, repo, branch };
  } catch {
    return null;
  }
};

const isTextFile = (filePath: string): boolean => {
  const binaryExtensions = [
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".pdf", ".zip", ".gz", ".tar", ".mp4", ".mov", ".mp3", ".wav",
    ".woff", ".woff2", ".ttf", ".eot", ".class", ".jar", ".exe", ".dll", ".so", ".o", ".a"
  ];

  const normalized = filePath.toLowerCase();
  return !binaryExtensions.some((ext) => normalized.endsWith(ext));
};

const buildTree = (entries: Array<{ path: string; content: string }>): RepoTreeNode[] => {
  const root: RepoTreeNode = { id: "root", name: "root", type: "folder", children: [] };

  for (const entry of entries) {
    const segments = entry.path.split("/").filter(Boolean);
    let current = root;

    for (let i = 0; i < segments.length; i += 1) {
      const segment = segments[i];
      const isFile = i === segments.length - 1;
      current.children ??= [];

      let next = current.children.find((node) => node.name === segment && node.type === (isFile ? "file" : "folder"));
      if (!next) {
        next = {
          id: `${current.id}/${segment}`,
          name: segment,
          type: isFile ? "file" : "folder",
          ...(isFile ? { content: entry.content } : { children: [] }),
        };
        current.children.push(next);
      }
      current = next;
    }
  }

  const sortNodes = (nodes: RepoTreeNode[]): RepoTreeNode[] => {
    nodes.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === "folder" ? -1 : 1;
    });

    for (const node of nodes) {
      if (node.children) {
        node.children = sortNodes(node.children);
      }
    }

    return nodes;
  };

  return sortNodes(root.children ?? []);
};

export const getAppInfo = async (_req: Request, res: Response) => {
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
    return res.json(data);
  } catch (error: any) {
    console.error("Error fetching GitHub App info:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const cloneRepository = async (req: Request, res: Response) => {
  try {
    const { repoUrl } = req.body;
    if (!repoUrl || typeof repoUrl !== "string") {
      return res.status(400).json({ error: "Repository URL is required." });
    }

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return res.status(400).json({ error: "Invalid GitHub repository URL." });
    }

    const branchSegment = parsed.branch ? `/${encodeURIComponent(parsed.branch)}` : "";
    const zipUrl = `https://codeload.github.com/${parsed.owner}/${parsed.repo}/zip/refs/heads${branchSegment || "/main"}`;

    const downloadZip = async (url: string): Promise<Buffer | null> => {
      try {
        const response = await axios.get<ArrayBuffer>(url, {
          responseType: "arraybuffer",
          timeout: 15000,
          proxy: false,
          headers: {
            "User-Agent": "code-za-clone-client",
          },
        });
        return Buffer.from(response.data);
      } catch {
        return null;
      }
    };

    const zipBuffer =
      (await downloadZip(zipUrl)) ||
      (await downloadZip(`https://codeload.github.com/${parsed.owner}/${parsed.repo}/zip/refs/heads/master`));

    if (!zipBuffer) {
      return res.status(502).json({ error: "Unable to download repository archive from GitHub." });
    }

    const zip = await JSZip.loadAsync(zipBuffer);
    const files: Array<{ path: string; content: string }> = [];

    await Promise.all(
      Object.values(zip.files).map(async (file) => {
        if (file.dir) return;
        const relative = file.name.split("/").slice(1).join("/");
        if (!relative || !isTextFile(relative)) return;
        const content = await file.async("string");
        files.push({ path: relative, content });
      })
    );

    return res.json({ success: true, files: buildTree(files) });
  } catch (error: any) {
    console.error("Error cloning repository:", error.message);
    return res.status(500).json({ error: "Failed to clone repository." });
  }
};
