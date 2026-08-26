import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(projectRoot, relativePath), "utf8");
}

describe("admin analytics", () => {
  it("uses an admin-only router procedure and bounded existing data", () => {
    const routers = readProjectFile("server/routers.ts");
    const database = readProjectFile("server/db.ts");

    expect(routers).toContain("analytics: router({");
    expect(routers).toContain(
      "overview: adminProcedure.query(() => getProjectAnalytics())"
    );
    expect(database).toContain("limit(100)");
    expect(database).toContain("dataAvailable: false");
    expect(database).toContain(
      "teamMembers: Number(memberCount[0]?.value ?? 0)"
    );
  });

  it("keeps the analytics page behind the authenticated dashboard shell", () => {
    const app = readProjectFile("client/src/App.tsx");
    const layout = readProjectFile("client/src/components/DashboardLayout.tsx");
    const analytics = readProjectFile("client/src/pages/Analytics.tsx");

    expect(app).toContain('path="/dashboard/analytics"');
    expect(app).toContain("<DashboardLayout>");
    expect(layout).toContain('label: "Admin analytics"');
    expect(layout).toContain('path: "/dashboard/analytics"');
    expect(analytics).toContain("enabled: isAdmin");
    expect(analytics).toContain("ADMIN ACCESS REQUIRED.");
  });

  it("renders truthful loading, error, empty, and recent-project states", () => {
    const analytics = readProjectFile("client/src/pages/Analytics.tsx");

    expect(analytics).toContain('aria-busy="true"');
    expect(analytics).toContain("METRICS OUT OF RANGE.");
    expect(analytics).toContain("no project metrics are recorded yet");
    expect(analytics).toContain("data.recentProjects.map");
    expect(analytics).not.toContain("Math.random");
  });
});
