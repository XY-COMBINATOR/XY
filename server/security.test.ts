import { describe, expect, it } from "vitest";
import { getSessionSameSite } from "./_core/cookies";
import { ENV, validateProductionEnvironment } from "./_core/env";
import { applySecurityHeaders } from "./security";
import { isTeamAdmin, roleForSupabaseEmail } from "./supabaseAuth";

function createResponse() {
  const values = new Map<string, string>();
  return {
    values,
    response: {
      setHeader: (name: string, value: string) => values.set(name, value),
    },
  };
}

describe("applySecurityHeaders", () => {
  it("sets anti-framing, anti-sniffing, and API no-store protections", () => {
    const { values, response } = createResponse();
    let continued = false;

    applySecurityHeaders(
      { path: "/api/trpc" } as never,
      response as never,
      () => {
        continued = true;
      }
    );

    expect(values.get("X-Content-Type-Options")).toBe("nosniff");
    expect(values.get("X-Frame-Options")).toBe("DENY");
    expect(values.get("Cache-Control")).toBe("no-store");
    expect(continued).toBe(true);
  });

  it("adds strict transport and content security policies in production", () => {
    const originalEnvironment = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const { values, response } = createResponse();

    try {
      applySecurityHeaders(
        { path: "/" } as never,
        response as never,
        () => undefined
      );
      expect(values.get("Strict-Transport-Security")).toContain(
        "max-age=31536000"
      );
      expect(values.get("Content-Security-Policy")).toContain(
        "upgrade-insecure-requests"
      );
    } finally {
      process.env.NODE_ENV = originalEnvironment;
    }
  });
});

describe("production security configuration", () => {
  it("rejects incomplete and weak production environment configuration", () => {
    expect(() =>
      validateProductionEnvironment({
        appId: "app",
        cookieSecret: "short",
        databaseUrl: "database",
        isProduction: true,
        supabaseUrl: "https://project.supabase.co",
        supabasePublishableKey: "sb_publishable_test",
      })
    ).toThrow("JWT_SECRET must contain at least 32 characters");

    expect(() =>
      validateProductionEnvironment({
        appId: "",
        cookieSecret: "a-secure-production-secret-with-32-plus-characters",
        databaseUrl: "",
        isProduction: true,
        supabaseUrl: "",
        supabasePublishableKey: "",
      })
    ).toThrow("Missing required production environment variables");
  });

  it("uses safer production session defaults", () => {
    expect(getSessionSameSite(true)).toBe("lax");
    expect(getSessionSameSite(false)).toBe("none");
  });

  it("assigns the administrator role only to the configured email", () => {
    expect(isTeamAdmin("leader@example.com", "leader@example.com")).toBe(true);
    expect(isTeamAdmin("member@example.com", "leader@example.com")).toBe(false);
  });

  it("recognizes the configured TEAMADMINEMAIL value after normalization", () => {
    const configuredAdmin = "mantisdarling@proton.me";
    expect(isTeamAdmin(" MANTISDARLING@PROTON.ME ", configuredAdmin)).toBe(
      true
    );
    expect(isTeamAdmin("member@example.com", configuredAdmin)).toBe(false);
  });

  it("resolves the verified administrator identity authoritatively", () => {
    const configuredAdmin = "mantisdarling@proton.me";
    expect(
      roleForSupabaseEmail(" MANTISDARLING@PROTON.ME ", configuredAdmin)
    ).toBe("admin");
    expect(roleForSupabaseEmail("member@example.com", configuredAdmin)).toBe(
      "user"
    );
    expect(
      roleForSupabaseEmail("leader@example.com", "leader@example.com")
    ).toBe("admin");
  });
});
