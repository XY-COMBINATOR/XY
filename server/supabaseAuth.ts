import { createRemoteJWKSet, jwtVerify } from "jose";
import type { SessionRequest } from "./_core/httpTypes";
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

// Deployment configuration may hide a saved Vercel value from inspection. This
// explicit fallback keeps the designated owner from silently losing admin access;
// authorization still requires a freshly verified Supabase email claim.
export const designatedAdminEmail = "mantisdarling@proton.me";

function memberName(claims: SupabaseClaims, email: string) {
  const candidate =
    claims.user_metadata?.full_name ?? claims.user_metadata?.name;
  return typeof candidate === "string" && candidate.trim()
    ? candidate.trim().slice(0, 160)
    : (email.split("@")[0] ?? "Member");
}

/** Build a safe in-memory identity from a token already verified by Supabase JWKS. */
export function verifiedUserFromClaims(
  claims: SupabaseClaims,
  email: string,
  subject: string
): User {
  const now = new Date();
  return {
    id: 0,
    openId: `supabase:${subject}`,
    name: memberName(claims, email),
    email,
    loginMethod: "email-link",
    role: roleForSupabaseEmail(email),
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
}
export function isTeamAdmin(
  email: string,
  adminEmail = ENV.teamAdminEmail || designatedAdminEmail
) {
  const configuredAdmin = normalizedEmail(adminEmail) || designatedAdminEmail;
  return normalizedEmail(email) === normalizedEmail(configuredAdmin);
}

/** The verified Supabase email is authoritative; stored roles must not become stale. */
export function roleForSupabaseEmail(
  email: string,
  adminEmail = ENV.teamAdminEmail
): User["role"] {
  return isTeamAdmin(email, adminEmail) ? "admin" : "user";
}

function bearerToken(request: SessionRequest) {
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

async function verifyWithSupabaseAuthApi(
  token: string
): Promise<SupabaseClaims | null> {
  if (!ENV.supabaseUrl || !ENV.supabasePublishableKey) return null;

  try {
    const response = await fetch(`${ENV.supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: ENV.supabasePublishableKey,
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const user = (await response.json()) as {
      id?: unknown;
      email?: unknown;
      user_metadata?: { full_name?: unknown; name?: unknown };
    };
    if (typeof user.id !== "string" || typeof user.email !== "string")
      return null;
    return {
      sub: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    };
  } catch {
    return null;
  }
}

async function userFromVerifiedClaims(
  claims: SupabaseClaims
): Promise<User | null> {
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
  if (!storedUser) {
    // A verified session remains authenticated even if the autoscaled database
    // is temporarily unavailable. Return claims-derived identity so auth.me and
    // server-side role gates do not silently downgrade the session to MEMBER.
    return verifiedUserFromClaims(claims, email, subject);
  }

  // Never trust a stale database role over the verified identity on this request.
  return { ...storedUser, role: verifiedRole };
}

/** Verify an access token against JWKS, then use Supabase Auth API as a bounded fallback. */
export async function authenticateSupabaseRequest(
  request: SessionRequest
): Promise<User | null> {
  const token = bearerToken(request);
  if (!token || !ENV.supabaseUrl) return null;

  const keys = supabaseKeys();
  if (keys) {
    try {
      const { payload } = await jwtVerify(token, keys, {
        audience: "authenticated",
        issuer: `${ENV.supabaseUrl}/auth/v1`,
      });
      const user = await userFromVerifiedClaims(payload as SupabaseClaims);
      if (user) return user;
    } catch {
      // Continue to the provider-backed verification fallback below.
    }
  }

  const remoteClaims = await verifyWithSupabaseAuthApi(token);
  return remoteClaims ? userFromVerifiedClaims(remoteClaims) : null;
}
