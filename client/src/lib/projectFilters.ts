export type WorkspaceStatus = "all" | "idea" | "active" | "shipped" | "paused";

export type WorkspaceProject = {
  status: Exclude<WorkspaceStatus, "all">;
  title: string;
  codename: string;
  summary: string;
};

export function filterWorkspaceProjects<T extends WorkspaceProject>(
  projects: T[],
  status: WorkspaceStatus,
  search: string
): T[] {
  const normalizedSearch = search.trim().toLowerCase();

  return projects.filter(project => {
    const matchesStatus = status === "all" || project.status === status;
    const matchesSearch =
      !normalizedSearch ||
      [project.title, project.codename, project.summary]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });
}
