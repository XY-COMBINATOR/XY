import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createContactRequest, listContactRequests } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";

const contactInput = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(20).max(2000),
});

type GuardRecord = { attempts: number; expiresAt: number };
const inquiryGuard = new Map<string, GuardRecord>();
const inquiryWindowMs = 15 * 60 * 1000;
const inquiryLimit = 4;

/**
 * Apply a small, in-memory throttle before storage. This limits accidental or
 * abusive form submissions in a single runtime; upstream gateway controls
 * continue to protect distributed traffic.
 */
function guardInquiry(source: string) {
  const now = Date.now();
  const current = inquiryGuard.get(source);
  const record = !current || current.expiresAt <= now ? { attempts: 0, expiresAt: now + inquiryWindowMs } : current;

  if (record.attempts >= inquiryLimit) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait before sending another enquiry." });
  }

  record.attempts += 1;
  inquiryGuard.set(source, record);
}

function requestSource(request: { ip?: string; socket?: { remoteAddress?: string | undefined } }) {
  return request.ip || request.socket?.remoteAddress || "unknown";
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  contact: router({
    submit: publicProcedure.input(contactInput).mutation(async ({ ctx, input }) => {
      guardInquiry(requestSource(ctx.req));
      const savedRequest = await createContactRequest(input);
      return { id: savedRequest.id, accepted: true } as const;
    }),
    list: adminProcedure.input(z.object({ limit: z.number().int().min(1).max(50).default(25) })).query(({ input }) => listContactRequests(input.limit)),
  }),
});

export type AppRouter = typeof appRouter;
