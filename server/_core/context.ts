import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema.js";
import { authenticateSupabaseRequest } from "../supabaseAuth.js";
import type {
  ContextOptions,
  SessionRequest,
  SessionResponse,
} from "./httpTypes.js";

export type TrpcContext = {
  req: SessionRequest;
  res: SessionResponse;
  user: User | null;
};

export async function createContext(
  opts: ContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await authenticateSupabaseRequest(opts.req);
  } catch {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}

export function createExpressContext({
  req,
  res,
}: Pick<CreateExpressContextOptions, "req" | "res">) {
  return createContext({
    req: req as unknown as SessionRequest,
    res: res as unknown as SessionResponse,
  });
}
