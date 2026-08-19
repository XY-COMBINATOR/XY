import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { createContactRequest, listContactRequests } from "./db";
import { guardInquiryDistributed } from "./contactGuard";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";

/** Public inquiry contract: strict limits and a hidden honeypot reject common bot payloads before storage. */
export const contactInput = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(20).max(2000),
  website: z.string().max(0).optional().default(""),
});

function requestSource(request: {
  ip?: string;
  socket?: { remoteAddress?: string | undefined };
}) {
  const candidate = request.ip || request.socket?.remoteAddress || "unknown";
  return candidate.trim().slice(0, 120) || "unknown";
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
    submit: publicProcedure
      .input(contactInput)
      .mutation(async ({ ctx, input }) => {
        await guardInquiryDistributed(requestSource(ctx.req));
        const { website, ...contactRequest } = input;
        void website;
        await createContactRequest(contactRequest);
        return { accepted: true } as const;
      }),
    list: adminProcedure
      .input(z.object({ limit: z.number().int().min(1).max(50).default(25) }))
      .query(({ input }) => listContactRequests(input.limit)),
  }),
});

export type AppRouter = typeof appRouter;
