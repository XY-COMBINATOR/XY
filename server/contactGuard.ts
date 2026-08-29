import { createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { recordContactAttempt } from "./db.js";

type GuardRecord = { attempts: number; expiresAt: number };
type GuardOptions = { limit?: number; windowMs?: number; maxEntries?: number };

/**
 * Create a small in-memory abuse guard for public contact requests. Each guard
 * keeps only short-lived source keys and bounds cleanup work in long-lived apps.
 */
export function createInquiryGuard(options: GuardOptions = {}) {
  const limit = options.limit ?? 4;
  const windowMs = options.windowMs ?? 15 * 60 * 1000;
  const maxEntries = options.maxEntries ?? 250;
  const records = new Map<string, GuardRecord>();

  function prune(now: number) {
    if (records.size < maxEntries) return;

    records.forEach((record, source) => {
      if (record.expiresAt <= now) records.delete(source);
    });
  }

  return (source: string) => {
    const now = Date.now();
    prune(now);
    const current = records.get(source);
    const record =
      !current || current.expiresAt <= now
        ? { attempts: 0, expiresAt: now + windowMs }
        : current;

    if (record.attempts >= limit) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Please wait before sending another enquiry.",
      });
    }

    record.attempts += 1;
    records.set(source, record);
  };
}

/** Shared production guard. Gateway-level protections still cover multi-instance traffic. */
export const guardInquiry = createInquiryGuard();

/** Create a stable, privacy-preserving database key for a request source. */
export function hashInquirySource(source: string) {
  return createHash("sha256").update(source).digest("hex");
}

/**
 * Use shared database state in production so contact throttling remains intact
 * across autoscaled instances. Local development retains the bounded guard when
 * a database connection has not been configured.
 */
export async function guardInquiryDistributed(source: string) {
  const now = new Date();
  const windowEndsAt = new Date(now.getTime() + 15 * 60 * 1000);
  const accepted = await recordContactAttempt(
    hashInquirySource(source),
    now,
    windowEndsAt,
    4
  );

  if (accepted === null) {
    guardInquiry(source);
    return;
  }

  if (!accepted) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Please wait before sending another enquiry.",
    });
  }
}

/**
 * Sanitize text to prevent Discord mention abuse (@everyone, @here, role/user pings).
 */
export function sanitizeDiscordContent(text: string): string {
  if (!text) return "";
  return text
    .replace(/@everyone/gi, match => `@\u200b${match.slice(1)}`)
    .replace(/@here/gi, match => `@\u200b${match.slice(1)}`)
    .replace(/<@/g, "<@\u200b")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // strip control chars
    .trim();
}

/**
 * Dispatches an instant notification to a configured Discord or Slack webhook URL
 * when a new lead submits the contact form.
 */
export async function notifyLeadWebhook(inquiry: {
  name: string;
  email: string;
  message: string;
}) {
  const webhookUrl =
    process.env.CONTACT_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const safeName = sanitizeDiscordContent(inquiry.name).slice(0, 100);
  const safeEmail = sanitizeDiscordContent(inquiry.email).slice(0, 254);
  const safeMessage = sanitizeDiscordContent(inquiry.message).slice(0, 1000);

  try {
    const payload = {
      content: "📬 **New Client Inquiry — XY COMBINATOR**",
      embeds: [
        {
          title: `New Message from ${safeName}`,
          color: 0xe4382f,
          fields: [
            { name: "Name", value: safeName, inline: true },
            { name: "Email", value: safeEmail, inline: true },
            { name: "Message", value: safeMessage },
          ],
          footer: { text: "XY COMBINATOR Inbound Lead" },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn("[ContactWebhook] Failed to dispatch webhook:", error);
  }
}
