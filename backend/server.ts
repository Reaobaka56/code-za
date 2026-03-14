import "dotenv/config";
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
  const PORT = Number(process.env.PORT || 3000);

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(cors());
  app.use(requestMetadata);
  app.use(globalRateLimit);
  app.use(express.json({ limit: "1mb" }));

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
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
