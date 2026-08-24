import { describe, expect, it } from "vitest";
import { projectInput } from "./routers";

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
