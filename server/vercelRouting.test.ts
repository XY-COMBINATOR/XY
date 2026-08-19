import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

type VercelConfiguration = {
  rewrites: Array<{ destination: string; source: string }>;
};

const projectPath = path.resolve(import.meta.dirname, "..");

describe("Vercel deployment routing", () => {
  it("rewrites client routes to the application while excluding the API namespace", async () => {
    const configText = await readFile(path.join(projectPath, "vercel.json"), "utf8");
    const config = JSON.parse(configText) as VercelConfiguration;

    expect(config.rewrites).toContainEqual({
      destination: "/index.html",
      source: "/((?!api/).*)",
    });
  });

  it("ships a static favicon before the runtime CDN asset override", async () => {
    const indexHtml = await readFile(path.join(projectPath, "client/index.html"), "utf8");
    const favicon = await readFile(path.join(projectPath, "client/public/favicon.svg"), "utf8");

    expect(indexHtml).toContain('href="/favicon.svg"');
    expect(favicon).toContain("viewBox=");
  });
});
