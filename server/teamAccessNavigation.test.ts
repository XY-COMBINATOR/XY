import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(projectRoot, relativePath), "utf8");
}

describe("team access navigation", () => {
  it("exposes the secure dashboard entry from the homepage navigation", () => {
    const home = readProjectFile("client/src/pages/Home.tsx");

    expect(home).toContain('<Link href="/dashboard">Team access</Link>');
    expect(home).toContain('["Team access", "/dashboard"]');
  });

  it("keeps team access available on routed public pages", () => {
    const publicFrame = readProjectFile(
      "client/src/components/PublicFrame.tsx"
    );

    expect(publicFrame).toContain('["Team access", "/dashboard"]');
  });
});
