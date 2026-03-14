import express, { NextFunction, Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import path from "path";
import authRoutes from "./routes/auth";
import executionRoutes from "./routes/execution";
import completionRoutes from "./routes/completion";
import githubRoutes from "./routes/github";
import healthRoutes from "./routes/health";
import { globalRateLimit, requestMetadata } from "./middleware/apiHardening";

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
  app.use("/api", healthRoutes);

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

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "API route not found" });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled server error:", err);
    res.status(500).json({ error: "Internal server error" });
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
  process.exit(1);
});
