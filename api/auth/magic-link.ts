import { handleMagicLinkRequest } from "../../server/authProxy";
import { ENV } from "../../server/_core/env";

type VercelRequest = {
  method?: string;
  body?: unknown;
};

type VercelResponse = {
  setHeader(name: string, value: string): void;
  status(code: number): VercelResponse;
  json(body: unknown): void;
};

/** Apply the endpoint security baseline without booting the full API service. */
function setRouteHeaders(response: VercelResponse) {
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
  response.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "connect-src 'self'" + (ENV.supabaseUrl ? ` ${ENV.supabaseUrl}` : ""),
    ].join("; ")
  );
}

/** Handle one same-origin invite-only magic-link request on Vercel. */
export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  setRouteHeaders(response);

  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const result = await handleMagicLinkRequest(request.body);
  response.status(result.status).json(result.body);
}
