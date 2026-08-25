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

    expect(route).not.toContain('from "../../server/app"');
    expect(route).not.toContain('from "../../server/authProxy"');
    expect(route).toContain("setRouteHeaders(response, projectUrl)");
    expect(route).toContain("export default async function handler");
    expect(route).toContain('if (request.method !== "POST")');
    expect(route).toContain("sendMagicLink(request.body)");
  });

  it("ships root and catch-all tRPC function routes for dashboard procedures", async () => {
    const rootRoute = await readFile(
      path.join(projectPath, "api/trpc.ts"),
      "utf8"
    );
    const catchAllRoute = await readFile(
      path.join(projectPath, "api/trpc/[...path].ts"),
      "utf8"
    );
    const apiFallbackRoute = await readFile(
      path.join(projectPath, "api/[...path].ts"),
      "utf8"
    );

    expect(rootRoute).toContain('from "../server/vercelTrpc.js"');
    expect(rootRoute).not.toContain('from "../server/vercelTrpc";');
    expect(rootRoute).toContain("export default vercelTrpcHandler");
    expect(rootRoute).not.toContain("vercelApiApp");
    expect(catchAllRoute).toContain('from "../../server/vercelTrpc.js"');
    expect(catchAllRoute).not.toContain('from "../../server/vercelTrpc";');
    expect(catchAllRoute).toContain("export default vercelTrpcHandler");
    expect(catchAllRoute).not.toContain("vercelApiApp");
    expect(apiFallbackRoute).toContain('from "../server/vercelTrpc.js"');
    expect(apiFallbackRoute).not.toContain('from "../server/vercelTrpc";');
    expect(apiFallbackRoute).toContain("export default vercelTrpcHandler");
    expect(apiFallbackRoute).not.toContain("vercelApiApp");
  });

  it("keeps the Vercel tRPC runtime graph free of unresolved aliases", async () => {
    const runtimeFiles = ["server/routers.ts", "server/_core/trpc.ts"];
    const contents = await Promise.all(
      runtimeFiles.map(file => readFile(path.join(projectPath, file), "utf8"))
    );

    contents.forEach(content => {
      expect(content).not.toContain('from "@shared/');
      expect(content).not.toContain("from '@shared/");
    });
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
