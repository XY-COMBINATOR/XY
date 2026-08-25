import { describe, expect, it } from "vitest";
import { validateProductionEnvironment } from "./_core/env";

describe("production environment validation", () => {
  it("requires the Supabase URL and publishable key for serverless startup", () => {
    expect(() =>
      validateProductionEnvironment({
        appId: "app",
        cookieSecret: "a".repeat(32),
        databaseUrl: "mysql://configured",
        isProduction: true,
        supabaseUrl: "",
        supabasePublishableKey: "",
      })
    ).toThrow(
      "Missing required production environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY"
    );
  });

  it("accepts a configured Supabase-only production environment", () => {
    expect(() =>
      validateProductionEnvironment({
        appId: "app",
        cookieSecret: "unused-legacy-secret",
        databaseUrl: "mysql://configured",
        isProduction: true,
        supabaseUrl: "https://example.supabase.co",
        supabasePublishableKey: "sb_publishable_test",
      })
    ).not.toThrow();
  });

  it("still enforces the legacy cookie secret when that mode is enabled", () => {
    expect(() =>
      validateProductionEnvironment(
        {
          appId: "app",
          cookieSecret: "too-short",
          databaseUrl: "mysql://configured",
          isProduction: true,
          supabaseUrl: "https://example.supabase.co",
          supabasePublishableKey: "sb_publishable_test",
        },
        { requireLegacySessionSecret: true }
      )
    ).toThrow("JWT_SECRET must contain at least 32 characters in production.");
  });
});
