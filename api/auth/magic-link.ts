type VercelRequest = {
  method?: string;
  body?: unknown;
};

type VercelResponse = {
  setHeader(name: string, value: string): void;
  status(code: number): VercelResponse;
  json(body: unknown): void;
};

type AuthReply = {
  status: number;
  body: { accepted: true } | { error: string };
};

const redirectTarget = "https://xy-combinator.vercel.app";

type RateLimitRecord = { count: number; expiresAt: number };

const magicLinkRecords = new Map<string, RateLimitRecord>();

function checkMagicLinkRateLimit(
  key: string,
  limit = 5,
  windowMs = 15 * 60 * 1000
): boolean {
  const now = Date.now();
  if (magicLinkRecords.size > 500) {
    magicLinkRecords.forEach((record, k) => {
      if (record.expiresAt <= now) magicLinkRecords.delete(k);
    });
  }
  const current = magicLinkRecords.get(key);
  const record =
    !current || current.expiresAt <= now
      ? { count: 0, expiresAt: now + windowMs }
      : current;
  if (record.count >= limit) return false;
  record.count += 1;
  magicLinkRecords.set(key, record);
  return true;
}

/** Apply the endpoint security baseline without booting the full API service. */
function setRouteHeaders(response: VercelResponse, projectUrl: string) {
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
      "connect-src 'self'" + (projectUrl ? ` ${projectUrl}` : ""),
    ].join("; ")
  );
}

function safeMessage(payload: unknown) {
  if (!payload || typeof payload !== "object")
    return "Unable to send a sign-in link.";
  const candidate = payload as {
    msg?: unknown;
    errorDescription?: unknown;
    error?: unknown;
  };
  for (const value of [
    candidate.msg,
    candidate.errorDescription,
    candidate.error,
  ]) {
    if (typeof value === "string" && value.trim())
      return value.trim().slice(0, 240);
  }
  return "Unable to send a sign-in link.";
}

function readEmail(input: unknown) {
  if (!input || typeof input !== "object") return null;
  const email = (input as { email?: unknown }).email;
  if (typeof email !== "string") return null;
  const normalized = email.trim().toLowerCase();
  if (
    normalized.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
  ) {
    return null;
  }
  return normalized;
}

async function sendMagicLink(input: unknown): Promise<AuthReply> {
  const email = readEmail(input);
  if (!email) {
    return { status: 400, body: { error: "Enter a valid email address." } };
  }

  if (!checkMagicLinkRateLimit(email)) {
    return {
      status: 429,
      body: { error: "Too many sign-in attempts. Please try again later." },
    };
  }

  const projectUrl =
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";

  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
  if (!projectUrl || !publishableKey) {
    return {
      status: 503,
      body: { error: "Team sign-in is not configured yet." },
    };
  }

  const endpoint = `${projectUrl.replace(/\/+$/, "")}/auth/v1/otp?redirect_to=${encodeURIComponent(redirectTarget)}`;

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        create_user: false,
        data: {},
        gotrue_meta_security: {},
      }),
    });

    const text = await upstream.text();
    let payload: unknown = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }

    if (!upstream.ok) {
      return { status: upstream.status, body: { error: safeMessage(payload) } };
    }

    return { status: 200, body: { accepted: true } };
  } catch (error) {
    console.error("[Auth proxy] Supabase request failed", error);
    return {
      status: 502,
      body: {
        error: "The sign-in service is temporarily unreachable. Try again.",
      },
    };
  }
}

/** Handle one same-origin invite-only magic-link request on Vercel. */
export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  const projectUrl =
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
  setRouteHeaders(response, projectUrl);

  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const result = await sendMagicLink(request.body);
  response.status(result.status).json(result.body);
}
