import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

type VercelConfiguration = {
  headers: Array<{
    headers: Array<{ key: string; value: string }>;
    source: string;
  }>;
  rewrites: Array<{ destination: string; source: string }>;
};

const projectPath = path.resolve(import.meta.dirname, "..");

describe("Vercel deployment routing", () => {
  it("rewrites client routes to the application while excluding the API namespace", async () => {
    const configText = await readFile(
      path.join(projectPath, "vercel.json"),
      "utf8"
    );
    const config = JSON.parse(configText) as VercelConfiguration;

    expect(config.rewrites).toContainEqual({
      destination: "/index.html",
      source: "/((?!api/).*)",
    });
  });

  it("ships a static favicon before the runtime CDN asset override", async () => {
    const indexHtml = await readFile(
      path.join(projectPath, "client/index.html"),
      "utf8"
    );
    const favicon = await readFile(
      path.join(projectPath, "client/public/favicon.svg"),
      "utf8"
    );

    expect(indexHtml).toContain('href="/favicon.svg"');
    expect(favicon).toContain("viewBox=");
  });

  it("applies the browser security baseline to static CDN responses", async () => {
    const configText = await readFile(
      path.join(projectPath, "vercel.json"),
      "utf8"
    );
    const config = JSON.parse(configText) as VercelConfiguration;
    const globalHeaders =
      config.headers.find(header => header.source === "/(.*)")?.headers ?? [];

    expect(globalHeaders).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "Content-Security-Policy" }),
        expect.objectContaining({ key: "Strict-Transport-Security" }),
        expect.objectContaining({ key: "X-Frame-Options", value: "DENY" }),
      ])
    );

    const contentPolicy = globalHeaders.find(
      header => header.key === "Content-Security-Policy"
    )?.value;
    expect(contentPolicy).toContain(
      "connect-src 'self' https://ofkqvwkjcbfvwbirexzw.supabase.co"
    );
  });

  it("ships an explicit same-origin magic-link function route", async () => {
    const route = await readFile(
      path.join(projectPath, "api/auth/magic-link.ts"),
      "utf8"
    );

    expect(route).toContain(
      'import { registerAuthProxy } from "../../server/authProxy"'
    );
    expect(route).toContain(
      'import { applySecurityHeaders } from "../../server/security"'
    );
    expect(route).toContain("registerAuthProxy(app)");
    expect(route).toContain("export default function handler");
    expect(route).toContain("return app(request, response)");
  });

  it("prevents CDN caching of dynamic API responses", async () => {
    const configText = await readFile(
      path.join(projectPath, "vercel.json"),
      "utf8"
    );
    const config = JSON.parse(configText) as VercelConfiguration;
    const apiHeaders =
      config.headers.find(header => header.source === "/api/(.*)")?.headers ??
      [];

    expect(apiHeaders).toContainEqual({
      key: "Cache-Control",
      value: "no-store",
    });
  });
});
