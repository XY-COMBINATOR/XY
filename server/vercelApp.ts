import { createApiApp } from "./app";

/**
 * Vercel functions authenticate with Supabase bearer tokens and can safely
 * serve public and authenticated reads while the autoscaled database is cold.
 * The normal Node server keeps the stricter database and Supabase startup validation.
 */
export const vercelApiApp = createApiApp({
  requireDatabase: false,
  requireSupabase: false,
});
