import { Request, Response, NextFunction } from "express";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

/**
 * Clean in-memory rate limiting middleware for Express.
 */
export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = "Too many requests. Please slow down and try again shortly.",
    keyGenerator = (req: Request) => {
      const forwarded = req.headers["x-forwarded-for"];
      if (typeof forwarded === "string") {
        return forwarded.split(",")[0].trim();
      }
      return req.ip || req.socket.remoteAddress || "anonymous";
    },
  } = options;

  const hits = new Map<string, ClientRecord>();

  // Periodic cleanup of expired records to avoid memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(key);
      }
    }
  }, Math.max(windowMs, 60 * 1000));

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = keyGenerator(req);
    const record = hits.get(key);

    if (!record || now > record.resetTime) {
      hits.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", max - 1);
      res.setHeader("X-RateLimit-Reset", Math.ceil((now + windowMs) / 1000));
      next();
      return;
    }

    record.count++;
    const remaining = Math.max(0, max - record.count);
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader("Retry-After", retryAfterSeconds);
      res.status(429).json({
        success: false,
        error: "RATE_LIMITED",
        message,
        retryAfter: retryAfterSeconds,
      });
      return;
    }

    next();
  };
}

// Pre-configured rate limiters for different sensitivity levels
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 40,
  message: "Too many authentication attempts. Please wait before trying again.",
});

export const reservationRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 60,
  message: "Too many reservation requests. Please wait a moment before trying again.",
});

export const paymentRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 60,
  message: "Too many payment requests. Please wait a moment before trying again.",
});

export const adminRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 150,
  message: "Too many administrative requests. Please slow down.",
});
