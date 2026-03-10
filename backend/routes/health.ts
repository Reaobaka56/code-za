import express from "express";

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "code-za-backend",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  });
});

export default router;
