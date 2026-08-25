import {
  createURL,
  nodeHTTPRequestHandler,
} from "@trpc/server/adapters/node-http";
import type {
  NodeHTTPCreateContextFnOptions,
  NodeHTTPRequest,
  NodeHTTPResponse,
} from "@trpc/server/adapters/node-http";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { ENV } from "./_core/env";
import type { SessionResponse } from "./_core/httpTypes";

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

function createSessionResponse(response: NodeHTTPResponse): SessionResponse {
  return {
    clearCookie(name, options = {}) {
      const cookieParts = [
        `${encodeURIComponent(name)}=`,
        `Path=${options.path ?? "/"}`,
        "Max-Age=0",
        "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
      ];
      if (options.domain) cookieParts.push(`Domain=${options.domain}`);
      if (options.httpOnly ?? true) cookieParts.push("HttpOnly");
      if (options.secure ?? ENV.isProduction) cookieParts.push("Secure");
      if (options.sameSite) {
        cookieParts.push(
          `SameSite=${options.sameSite === true ? "Strict" : options.sameSite}`
        );
      }
      response.setHeader("Set-Cookie", cookieParts.join("; "));
      return this;
    },
  };
}

function createNodeContext({
  req,
  res,
}: NodeHTTPCreateContextFnOptions<NodeHTTPRequest, NodeHTTPResponse>) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = Array.isArray(forwardedProto)
    ? (forwardedProto[0] ?? "")
    : (forwardedProto?.split(",")[0] ?? "");

  return createContext({
    req: {
      headers: req.headers,
      protocol,
      socket: { remoteAddress: req.socket?.remoteAddress },
    },
    res: createSessionResponse(res),
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
