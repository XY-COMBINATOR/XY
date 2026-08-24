export type DashboardRole = "admin" | "user";
export type DashboardRoleLabel = "ADMIN" | "MEMBER" | "SYNCING" | "UNAVAILABLE";

/** Keep the dashboard honest while the server role query is synchronizing or unavailable. */
export function dashboardRoleLabel(
  role: DashboardRole | null | undefined,
  isLoading: boolean,
  isError = false
): DashboardRoleLabel {
  if (isLoading) return "SYNCING";
  if (isError || role === null || role === undefined) return "UNAVAILABLE";
  return role === "admin" ? "ADMIN" : "MEMBER";
}
