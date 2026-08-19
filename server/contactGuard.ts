import { TRPCError } from "@trpc/server";

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
    const record = !current || current.expiresAt <= now ? { attempts: 0, expiresAt: now + windowMs } : current;

    if (record.attempts >= limit) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait before sending another enquiry." });
    }

    record.attempts += 1;
    records.set(source, record);
  };
}

/** Shared production guard. Gateway-level protections still cover multi-instance traffic. */
export const guardInquiry = createInquiryGuard();
