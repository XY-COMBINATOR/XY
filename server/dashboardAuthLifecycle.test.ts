import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dashboardPath = resolve(
  import.meta.dirname,
  "../client/src/pages/Dashboard.tsx"
);

describe("dashboard auth lifecycle", () => {
  it("uses the dashboard layout auth boundary instead of a second useAuth hook", () => {
    const source = readFileSync(dashboardPath, "utf8");

    expect(source).not.toContain('from "@/_core/hooks/useAuth"');
    expect(source).not.toContain("enabled: !authLoading");
    expect(source).toContain("trpc.auth.me.useQuery");
    expect(source).toContain("useAuthBoundary");
    expect(source).toContain("enabled: Boolean(sessionUser)");
    expect(source).toContain("trpc.auth.persistedRole.useQuery");
    expect(source).toContain('enabled: serverUser?.role === "admin"');
    expect(source).toContain("PERSISTED ADMIN");
  });
});
