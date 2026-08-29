import type { NextFunction, Request, Response } from "express";
import { ENV } from "./_core/env";

type RateLimitRecord = { count: number; expiresAt: number };

/**
 * Creates an in-memory sliding window rate limiter for abuse prevention.
 */
export function createRateLimiter(options: {
  limit: number;
  windowMs: number;
  maxEntries?: number;
}) {
  const { limit, windowMs, maxEntries = 1000 } = options;
  const records = new Map<string, RateLimitRecord>();

  function prune(now: number) {
    if (records.size < maxEntries) return;
    records.forEach((record, key) => {
      if (record.expiresAt <= now) records.delete(key);
    });
  }

  return (key: string): boolean => {
    const now = Date.now();
    prune(now);
    const existing = records.get(key);
    const record =
      !existing || existing.expiresAt <= now
        ? { count: 0, expiresAt: now + windowMs }
        : existing;

    if (record.count >= limit) {
      return false;
    }

    record.count += 1;
    records.set(key, record);
    return true;
  };
}

/** Global API rate limiter: max 120 requests per minute per IP */
const globalApiLimiter = createRateLimiter({
  limit: 120,
  windowMs: 60 * 1000,
  maxEntries: 2000,
});

/**
 * Check if the given origin is trusted for cross-origin or same-origin requests.
 */
export function isAllowedOrigin(
  origin: string | undefined,
  host: string | undefined
): boolean {
  if (!origin) return true; // Direct non-browser or same-origin without Origin header

  try {
    const parsed = new URL(origin);
    const originHost = parsed.host.toLowerCase();

    // Match exact request Host
    if (host && originHost === host.toLowerCase()) return true;

    // Match local development hosts
    if (
      originHost.startsWith("localhost:") ||
      originHost === "localhost" ||
      originHost.startsWith("127.0.0.1:") ||
      originHost === "127.0.0.1"
    ) {
      return true;
    }

    // Match production domains
    if (
      originHost === "xy-combinator.vercel.app" ||
      originHost.endsWith(".vercel.app")
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Guard against Cross-Site Request Forgery (CSRF) by validating the Origin header
 * on state-modifying requests (POST, PUT, PATCH, DELETE).
 */
export function applyOriginGuard(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const method = request.method?.toUpperCase();
  const isMutating =
    method === "POST" ||
    method === "PUT" ||
    method === "PATCH" ||
    method === "DELETE";

  if (isMutating && request.path.startsWith("/api/")) {
    const origin = (request.headers.origin || request.headers.referer) as
      | string
      | undefined;
    const host = request.headers.host;

    if (origin && !isAllowedOrigin(origin, host)) {
      response.status(403).json({
        error: "Cross-origin request rejected for security.",
      });
      return;
    }
  }

  next();
}

/**
 * Global rate limiter middleware for /api/* endpoints.
 */
export function applyApiRateLimit(
  request: Request,
  response: Response,
  next: NextFunction
) {
  if (request.path.startsWith("/api/")) {
    const clientIp =
      (request.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      request.socket?.remoteAddress ||
      "unknown-client";

    if (!globalApiLimiter(clientIp)) {
      response.status(429).json({
        error: "Too many requests. Please slow down.",
      });
      return;
    }
  }

  next();
}

/**
 * Apply a narrow security baseline before routes handle data. The production
 * content policy deliberately permits only resources this public site needs.
 */
export function applySecurityHeaders(
  request: Request,
  response: Response,
  next: NextFunction
) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  response.setHeader("X-DNS-Prefetch-Control", "off");
  response.setHeader("Origin-Agent-Cluster", "?1");

  if (request.path.startsWith("/api/")) {
    response.setHeader("Cache-Control", "no-store");
  }

  if (process.env.NODE_ENV === "production") {
    const supabaseConnectSource = ENV.supabaseUrl ? ` ${ENV.supabaseUrl}` : "";
    response.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
    response.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "img-src 'self' data: https:",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "script-src 'self'",
        `connect-src 'self'${supabaseConnectSource}`,
        "upgrade-insecure-requests",
      ].join("; ")
    );
  }

  next();
}
