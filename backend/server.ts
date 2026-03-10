import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import path from "path";
import authRoutes from "./routes/auth";
import executionRoutes from "./routes/execution";
import completionRoutes from "./routes/completion";
import githubRoutes from "./routes/github";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api", executionRoutes);
  app.use("/api/completion", completionRoutes);
  app.use("/api/github", githubRoutes);
  
  // OAuth callback route (not under /api)
  app.use("/auth", authRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on http://localhost:" + PORT);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
