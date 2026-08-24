export type DashboardRole = "admin" | "user";

/** Keep the dashboard honest while the server role query is still synchronizing. */
export function dashboardRoleLabel(
  role: DashboardRole | undefined,
  isLoading: boolean
) {
  if (isLoading) return "SYNCING" as const;
  return role === "admin" ? ("ADMIN" as const) : ("MEMBER" as const);
}
