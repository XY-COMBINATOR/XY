import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { ENV } from "./_core/env";
import type { SessionResponse } from "./_core/httpTypes";

type HeaderValue = string | string[] | undefined;

type VercelRequestLike = {
  method?: string;
  url?: string;
  headers: Record<string, HeaderValue>;
  body?: unknown;
  socket?: { remoteAddress?: string };
};

type VercelResponseLike = {
  setHeader(name: string, value: string | string[]): void;
  status(code: number): VercelResponseLike;
  end(body?: string): void;
};

function applySecurityHeaders(response: VercelResponseLike) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  response.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  response.setHeader("X-DNS-Prefetch-Control", "off");
  response.setHeader("Origin-Agent-Cluster", "?1");
  response.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );

  const supabaseConnectSource = ENV.supabaseUrl ? ` ${ENV.supabaseUrl}` : "";
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

function createSessionResponse(response: VercelResponseLike): SessionResponse {
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

function toWebRequest(request: VercelRequestLike) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(name, item);
    } else if (typeof value === "string") {
      headers.set(name, value);
    }
  }

  const host = headers.get("host") ?? "localhost";
  const url = new URL(request.url ?? "/api/trpc", `https://${host}`);
  const method = request.method ?? "GET";
  const init: RequestInit = { method, headers };

  if (method !== "GET" && method !== "HEAD") {
    init.body =
      typeof request.body === "string"
        ? request.body
        : JSON.stringify(request.body ?? {});
  }

  return new Request(url, init);
}

/** Handle Vercel tRPC requests using the runtime-native Fetch adapter. */
export default async function vercelTrpcHandler(
  request: VercelRequestLike,
  response: VercelResponseLike
) {
  applySecurityHeaders(response);
  const webRequest = toWebRequest(request);
  const webResponse = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req: webRequest,
    router: appRouter,
    createContext: () =>
      createContext({
        req: {
          headers: Object.fromEntries(webRequest.headers.entries()),
          protocol: "https",
          socket: { remoteAddress: request.socket?.remoteAddress },
        },
        res: createSessionResponse(response),
      }),
  });

  webResponse.headers.forEach((value, key) => {
    response.setHeader(key, value);
  });
  response.status(webResponse.status).end(await webResponse.text());
}

export const vercelTrpcRoute = vercelTrpcHandler;
