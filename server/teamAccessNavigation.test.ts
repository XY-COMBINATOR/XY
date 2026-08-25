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

  it("replaces dashboard placeholder destinations with XY OS routes", () => {
    const dashboardLayout = readProjectFile(
      "client/src/components/DashboardLayout.tsx"
    );

    expect(dashboardLayout).toContain('label: "Command center"');
    expect(dashboardLayout).toContain('path: "/dashboard"');
    expect(dashboardLayout).toContain('label: "Project radar"');
    expect(dashboardLayout).toContain('path: "/projects"');
    expect(dashboardLayout).not.toContain('label: "Page 1"');
    expect(dashboardLayout).not.toContain('path: "/some-path"');
  });

  it("wires public project detail routes and card links", () => {
    const app = readProjectFile("client/src/App.tsx");
    const projects = readProjectFile("client/src/pages/Projects.tsx");
    const detail = readProjectFile("client/src/pages/ProjectDetail.tsx");

    expect(app).toContain('path="/projects/:slug"');
    expect(projects).toContain("href={`/projects/${project.slug}`}");
    expect(detail).toContain("trpc.projects.publicList.useQuery");
    expect(detail).toContain("Signal not found.");
  });

  it("keeps team access available on routed public pages", () => {
    const publicFrame = readProjectFile(
      "client/src/components/PublicFrame.tsx"
    );

    expect(publicFrame).toContain('["Team access", "/dashboard"]');
  });
});
