import type { Express, Request, Response } from "express";
import { z } from "zod";
import { ENV } from "./_core/env";

const magicLinkInput = z.object({
  email: z.string().trim().email().max(254),
});

const canonicalSite = "https://xy-combinator.vercel.app";

type AuthProxyReply = {
  status: number;
  body: { accepted: true } | { error: string };
};

function safeMessage(payload: unknown) {
  if (!payload || typeof payload !== "object")
    return "Unable to send a sign-in link.";
  const candidate = payload as {
    msg?: unknown;
    error_description?: unknown;
    error?: unknown;
  };
  for (const value of [
    candidate.msg,
    candidate.error_description,
    candidate.error,
  ]) {
    if (typeof value === "string" && value.trim())
      return value.trim().slice(0, 240);
  }
  return "Unable to send a sign-in link.";
}

/**
 * Validate and forward one invite-only Auth request without accepting any
 * user-controlled upstream URL or redirect destination.
 */
export async function handleMagicLinkRequest(
  input: unknown
): Promise<AuthProxyReply> {
  const parsed = magicLinkInput.safeParse(input);
  if (!parsed.success) {
    return { status: 400, body: { error: "Enter a valid email address." } };
  }

  if (!ENV.supabaseUrl || !ENV.supabasePublishableKey) {
    return {
      status: 503,
      body: { error: "Team sign-in is not configured yet." },
    };
  }

  const endpoint = `${ENV.supabaseUrl.replace(/\/+$/, "")}/auth/v1/otp?redirect_to=${encodeURIComponent(canonicalSite)}`;

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: ENV.supabasePublishableKey,
        Authorization: `Bearer ${ENV.supabasePublishableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: parsed.data.email.toLowerCase(),
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

/** Register the same bounded handler on the main Express API application. */
export function registerAuthProxy(app: Express) {
  app.post(
    "/api/auth/magic-link",
    async (request: Request, response: Response) => {
      const result = await handleMagicLinkRequest(request.body);
      response.status(result.status).json(result.body);
    }
  );
}
