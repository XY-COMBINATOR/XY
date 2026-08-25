import {
  createURL,
  nodeHTTPRequestHandler,
} from "@trpc/server/adapters/node-http";
import type {
  NodeHTTPCreateContextFnOptions,
  NodeHTTPRequest,
  NodeHTTPResponse,
} from "@trpc/server/adapters/node-http";
import type { Request, Response } from "express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { ENV } from "./_core/env";

function applyNodeSecurityHeaders(
  request: NodeHTTPRequest,
  response: NodeHTTPResponse,
  next: (error?: unknown) => void
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

  const requestPath = request.url?.split("?", 1)[0] ?? "";
  if (requestPath.startsWith("/api/")) {
    response.setHeader("Cache-Control", "no-store");
  }

  if (ENV.isProduction) {
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

function createNodeContext({
  req,
  res,
}: NodeHTTPCreateContextFnOptions<NodeHTTPRequest, NodeHTTPResponse>) {
  return createContext({
    req: req as unknown as Request,
    res: res as unknown as Response,
  });
}

/** Handle Vercel tRPC requests without importing the Express server wrapper. */
export default async function vercelTrpcHandler(
  request: NodeHTTPRequest,
  response: NodeHTTPResponse
) {
  const pathname = createURL(request).pathname;
  const path = pathname.startsWith("/api/trpc/")
    ? pathname.slice("/api/trpc/".length)
    : pathname === "/api/trpc"
      ? ""
      : pathname.replace(/^\/api\//, "");

  await nodeHTTPRequestHandler({
    router: appRouter,
    req: request,
    res: response,
    path,
    maxBodySize: 256 * 1024,
    middleware: applyNodeSecurityHeaders,
    createContext: createNodeContext,
  });
}

export const vercelTrpcRoute = vercelTrpcHandler;
