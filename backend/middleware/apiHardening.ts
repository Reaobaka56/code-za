import { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";

type Entry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Entry>();

const now = () => Date.now();

const getIp = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || "unknown";
};

const rateLimit = (windowMs: number, maxRequests: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${getIp(req)}:${req.baseUrl || ""}:${req.path}`;
    const current = store.get(key);
    const timestamp = now();

    if (!current || current.resetAt <= timestamp) {
      store.set(key, { count: 1, resetAt: timestamp + windowMs });
      return next();
    }

    current.count += 1;

    if (current.count > maxRequests) {
      const retryAfterSeconds = Math.ceil((current.resetAt - timestamp) / 1000);
      res.setHeader("Retry-After", retryAfterSeconds.toString());
      return res.status(429).json({ error: "Too many requests. Please slow down." });
    }

    return next();
  };
};

export const globalRateLimit = rateLimit(60_000, 300);
export const executionRateLimit = rateLimit(60_000, 40);
export const cloneRateLimit = rateLimit(60_000, 15);

export const requestMetadata = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers["x-request-id"]?.toString() || randomUUID();
  res.setHeader("x-request-id", requestId);
  res.setHeader("x-content-type-options", "nosniff");
  res.setHeader("x-frame-options", "SAMEORIGIN");
  res.setHeader("referrer-policy", "strict-origin-when-cross-origin");
  res.setHeader("permissions-policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("cross-origin-opener-policy", "same-origin");

  const start = now();
  res.on("finish", () => {
    const duration = now() - start;
    console.log(
      JSON.stringify({
        requestId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: duration,
        ip: getIp(req),
      })
    );
  });

  next();
};
