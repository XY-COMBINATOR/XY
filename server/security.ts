import type { NextFunction, Request, Response } from "express";
import { ENV } from "./_core/env";

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
