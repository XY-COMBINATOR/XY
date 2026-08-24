import { createRemoteJWKSet, jwtVerify } from "jose";
import type { Request } from "express";
import type { User } from "../drizzle/schema";
import * as db from "./db";
import { ENV } from "./_core/env";

type SupabaseClaims = {
  email?: unknown;
  sub?: unknown;
  user_metadata?: { full_name?: unknown; name?: unknown };
};

function normalizedEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function memberName(claims: SupabaseClaims, email: string) {
  const candidate =
    claims.user_metadata?.full_name ?? claims.user_metadata?.name;
  return typeof candidate === "string" && candidate.trim()
    ? candidate.trim().slice(0, 160)
    : (email.split("@")[0] ?? "Member");
}

export function isTeamAdmin(email: string, adminEmail = ENV.teamAdminEmail) {
  return (
    Boolean(adminEmail) &&
    normalizedEmail(email) === normalizedEmail(adminEmail)
  );
}

/** The verified Supabase email is authoritative; stored roles must not become stale. */
export function roleForSupabaseEmail(
  email: string,
  adminEmail = ENV.teamAdminEmail
): User["role"] {
  return isTeamAdmin(email, adminEmail) ? "admin" : "user";
}

function bearerToken(request: Request) {
  const header = request.headers.authorization;
  return typeof header === "string" && header.startsWith("Bearer ")
    ? header.slice(7)
    : null;
}

let remoteKeys: ReturnType<typeof createRemoteJWKSet> | null = null;
let keyOrigin = "";

function supabaseKeys() {
  if (!ENV.supabaseUrl) return null;

  if (!remoteKeys || keyOrigin !== ENV.supabaseUrl) {
    keyOrigin = ENV.supabaseUrl;
    remoteKeys = createRemoteJWKSet(
      new URL(`${ENV.supabaseUrl}/auth/v1/.well-known/jwks.json`)
    );
  }

  return remoteKeys;
}

/** Verify an access token locally against the provider's rotating public keys. */
export async function authenticateSupabaseRequest(
  request: Request
): Promise<User | null> {
  const token = bearerToken(request);
  const keys = supabaseKeys();
  if (!token || !keys || !ENV.supabaseUrl) return null;

  try {
    const { payload } = await jwtVerify(token, keys, {
      audience: "authenticated",
      issuer: `${ENV.supabaseUrl}/auth/v1`,
    });
    const claims = payload as SupabaseClaims;
    const email = normalizedEmail(claims.email);
    const subject = typeof claims.sub === "string" ? claims.sub : "";

    if (!email || !subject) return null;

    const openId = `supabase:${subject}`;
    const verifiedRole = roleForSupabaseEmail(email);
    await db.upsertUser({
      openId,
      email,
      name: memberName(claims, email),
      loginMethod: "email-link",
      role: verifiedRole,
      lastSignedIn: new Date(),
    });

    const storedUser = await db.getUserByOpenId(openId);
    if (!storedUser) return null;

    // Never trust a stale database role over the verified identity on this request.
    return { ...storedUser, role: verifiedRole };
  } catch {
    // Invalid, expired, or mis-scoped tokens are treated as anonymous requests.
    return null;
  }
}
