import { describe, expect, it } from "vitest";
import { dashboardRoleLabel } from "../shared/dashboardRole";

describe("dashboardRoleLabel", () => {
  it("does not present a missing role as MEMBER while auth.me is loading", () => {
    expect(dashboardRoleLabel(undefined, true)).toBe("SYNCING");
  });

  it("shows ADMIN only after the server returns the administrator role", () => {
    expect(dashboardRoleLabel("admin", false)).toBe("ADMIN");
    expect(dashboardRoleLabel("user", false)).toBe("MEMBER");
    expect(dashboardRoleLabel(undefined, false)).toBe("MEMBER");
  });
});
