import type { Express, Request, Response } from "express";
import { z } from "zod";
import { ENV } from "./_core/env";

const magicLinkInput = z.object({
  email: z.string().trim().email().max(254),
});

const canonicalSite = "https://xy-combinator.vercel.app";

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
 * Keep the Auth request same-origin for browsers that block direct Supabase
 * connections. The server forwards only the public publishable key and never
 * accepts a user-controlled upstream URL or redirect destination.
 */
export function registerAuthProxy(app: Express) {
  app.post(
    "/api/auth/magic-link",
    async (request: Request, response: Response) => {
      const parsed = magicLinkInput.safeParse(request.body);
      if (!parsed.success) {
        response.status(400).json({ error: "Enter a valid email address." });
        return;
      }

      if (!ENV.supabaseUrl || !ENV.supabasePublishableKey) {
        response
          .status(503)
          .json({ error: "Team sign-in is not configured yet." });
        return;
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
          response
            .status(upstream.status)
            .json({ error: safeMessage(payload) });
          return;
        }

        response.status(200).json({ accepted: true });
      } catch (error) {
        console.error("[Auth proxy] Supabase request failed", error);
        response.status(502).json({
          error: "The sign-in service is temporarily unreachable. Try again.",
        });
      }
    }
  );
}
