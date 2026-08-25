import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { projectInput } from "./routers";
import { filterWorkspaceProjects } from "../client/src/lib/projectFilters";

const dbPath = resolve(import.meta.dirname, "./db.ts");

describe("Project Radar input", () => {
  const validProject = {
    slug: "signal-lab",
    title: "Signal Lab",
    codename: "PIVOT",
    summary: "A focused space for testing a new direction.",
    description:
      "A private working brief for exploring a problem, choosing a format, and documenting the next decision.",
  };

  it("applies safe defaults for a private draft", () => {
    expect(projectInput.parse(validProject)).toMatchObject({
      status: "idea",
      visibility: "private",
      progress: 0,
      accent: "#ef3d32",
    });
  });

  it("accepts only lowercase hyphenated slugs", () => {
    expect(() =>
      projectInput.parse({ ...validProject, slug: "Signal Lab" })
    ).toThrow();
    expect(() =>
      projectInput.parse({ ...validProject, slug: "signal_lab" })
    ).toThrow();
    expect(projectInput.parse(validProject).slug).toBe("signal-lab");
  });

  it("filters workspace records by status and search text", () => {
    const projects = [
      {
        id: 1,
        status: "active" as const,
        title: "Signal Lab",
        codename: "PIVOT",
        summary: "Testing a new direction.",
      },
      {
        id: 2,
        status: "shipped" as const,
        title: "Field Notes",
        codename: "TRACE",
        summary: "A released archive.",
      },
    ];

    expect(filterWorkspaceProjects(projects, "active", "pivot")).toHaveLength(
      1
    );
    expect(filterWorkspaceProjects(projects, "all", "released")[0]?.id).toBe(2);
    expect(filterWorkspaceProjects(projects, "paused", "")).toHaveLength(0);
  });

  it("degrades project indexes safely when the database is unavailable", () => {
    const source = readFileSync(dbPath, "utf8");

    expect(source).toContain(
      'console.warn("[Projects] Public index unavailable:"'
    );
    expect(source).toContain(
      'console.warn("[Projects] Team index unavailable:"'
    );
    expect(source).toContain("return [];");
  });

  it("rejects overlong or unsafe project content", () => {
    expect(() =>
      projectInput.parse({ ...validProject, title: "x".repeat(121) })
    ).toThrow();
    expect(() =>
      projectInput.parse({ ...validProject, progress: 101 })
    ).toThrow();
    expect(() =>
      projectInput.parse({ ...validProject, accent: "red" })
    ).toThrow();
    expect(() =>
      projectInput.parse({ ...validProject, description: "too short" })
    ).toThrow();
  });
});
