import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import {
  createContactRequest,
  createProject,
  listContactRequests,
  listProjectsForTeam,
  listPublicProjects,
  updateProject,
} from "./db.js";
import { guardInquiryDistributed } from "./contactGuard.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { systemRouter } from "./_core/systemRouter.js";
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "./_core/trpc.js";
import { TRPCError } from "@trpc/server";

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

const projectStatus = z.enum(["idea", "active", "shipped", "paused"]);
const projectVisibility = z.enum(["public", "private"]);
const projectAccent = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex color");

export const projectInput = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(96)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(2).max(120),
  codename: z.string().trim().min(2).max(48),
  summary: z.string().trim().min(8).max(280),
  description: z.string().trim().min(20).max(4000),
  status: projectStatus.default("idea"),
  visibility: projectVisibility.default("private"),
  progress: z.number().int().min(0).max(100).default(0),
  accent: projectAccent.default("#ef3d32"),
});

const projectUpdateInput = projectInput.partial().extend({
  id: z.number().int().positive(),
});

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
  projects: router({
    publicList: publicProcedure.query(() => listPublicProjects()),
    teamList: protectedProcedure.query(() => listProjectsForTeam()),
    create: protectedProcedure.input(projectInput).mutation(({ ctx, input }) =>
      createProject({
        ...input,
        visibility: ctx.user.role === "admin" ? input.visibility : "private",
        leadOpenId: ctx.user.openId,
      })
    ),
    update: protectedProcedure
      .input(projectUpdateInput)
      .mutation(async ({ ctx, input }) => {
        const { id, ...changes } = input;
        if (ctx.user.role !== "admin") {
          const owned = (await listProjectsForTeam()).find(
            project => project.id === id
          );
          if (!owned || owned.leadOpenId !== ctx.user.openId) {
            throw new TRPCError({ code: "FORBIDDEN" });
          }
          changes.visibility = "private";
        }
        return updateProject(id, changes);
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
