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

  it("allows Supabase-only production startup without the legacy cookie secret", () => {
    expect(() =>
      validateProductionEnvironment({
        appId: "app",
        cookieSecret: "too-short",
        databaseUrl: "mysql://configured",
        isProduction: true,
        supabaseUrl: "https://example.supabase.co",
        supabasePublishableKey: "publishable-key",
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
          supabasePublishableKey: "publishable-key",
        },
        { requireLegacySessionSecret: true }
      )
    ).toThrow("JWT_SECRET must contain at least 32 characters in production.");
  });

  it("accepts the configured publishable key at the Supabase Auth settings endpoint", async () => {
    const projectUrl = process.env.SUPABASE_URL;
    const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    expect(projectUrl).toMatch(/^https:\/\/[a-z0-9]+\.supabase\.co$/);
    expect(publishableKey).toBeTruthy();

    const response = await fetch(`${projectUrl}/auth/v1/settings`, {
      headers: {
        apikey: publishableKey ?? "",
        Authorization: `Bearer ${publishableKey ?? ""}`,
      },
      signal: AbortSignal.timeout(10_000),
    });

    expect(response.status).toBe(200);
  }, 15_000);
});
