import { describe, expect, it } from "vitest";
import { dashboardRoleLabel } from "../shared/dashboardRole";

describe("dashboardRoleLabel", () => {
  it("does not present a missing role as MEMBER while auth.me is loading", () => {
    expect(dashboardRoleLabel(undefined, true)).toBe("SYNCING");
  });

  it("does not present a failed or anonymous server response as MEMBER", () => {
    expect(dashboardRoleLabel(null, false)).toBe("UNAVAILABLE");
    expect(dashboardRoleLabel(undefined, false, true)).toBe("UNAVAILABLE");
  });

  it("shows ADMIN or MEMBER only after the server returns that role", () => {
    expect(dashboardRoleLabel("admin", false)).toBe("ADMIN");
    expect(dashboardRoleLabel("user", false)).toBe("MEMBER");
  });
});
