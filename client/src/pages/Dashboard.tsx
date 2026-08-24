import { ArrowUpRight, LoaderCircle, Plus, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardOfflineIndicator } from "@/components/DashboardOfflineIndicator";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  filterWorkspaceProjects,
  type WorkspaceStatus,
} from "@/lib/projectFilters";
import { trpc } from "@/lib/trpc";
import { dashboardRoleLabel } from "@shared/dashboardRole";

const workspaceFilters: Array<{ value: WorkspaceStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "idea", label: "Ideas" },
  { value: "active", label: "In motion" },
  { value: "shipped", label: "Shipped" },
  { value: "paused", label: "Paused" },
];

const statusLabels = {
  idea: "IDEA",
  active: "IN MOTION",
  shipped: "SHIPPED",
  paused: "PAUSED",
} as const;

const emptyDraft = {
  slug: "",
  title: "",
  codename: "",
  summary: "",
  description: "",
};

function ProjectWorkspace({ enabled }: { enabled: boolean }) {
  const {
    data: projects,
    isLoading,
    isError,
  } = trpc.projects.teamList.useQuery(undefined, { enabled });
  const [workspaceFilter, setWorkspaceFilter] =
    useState<WorkspaceStatus>("all");
  const [workspaceSearch, setWorkspaceSearch] = useState("");
  const utils = trpc.useUtils();
  const visibleProjects = useMemo(
    () =>
      filterWorkspaceProjects(projects ?? [], workspaceFilter, workspaceSearch),
    [projects, workspaceFilter, workspaceSearch]
  );
  const createProject = trpc.projects.create.useMutation({
    onSuccess: async () => {
      setDraft(emptyDraft);
      setFormMessage("Project saved to the private workspace.");
      await utils.projects.teamList.invalidate();
    },
    onError: error =>
      setFormMessage(error.message || "Project could not be saved."),
  });
  const [draft, setDraft] = useState(emptyDraft);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const canSubmit = useMemo(
    () =>
      draft.slug.trim().length >= 2 &&
      draft.title.trim().length >= 2 &&
      draft.codename.trim().length >= 2 &&
      draft.summary.trim().length >= 8 &&
      draft.description.trim().length >= 20,
    [draft]
  );

  const updateDraft = (field: keyof typeof emptyDraft, value: string) => {
    setDraft(current => ({ ...current, [field]: value }));
    setFormMessage(null);
  };

  return (
    <section className="project-workspace" aria-labelledby="workspace-heading">
      <div className="workspace-heading">
        <div>
          <p className="dashboard-kicker">PROJECT WORKSPACE / PRIVATE</p>
          <h2 id="workspace-heading">
            MAKE THE
            <br />
            <i>TRACE.</i>
          </h2>
        </div>
        <div className="workspace-security-note">
          <ShieldCheck size={20} aria-hidden="true" />
          <span>Private by default. Publish only when the team is ready.</span>
        </div>
      </div>

      <div className="workspace-grid">
        <form
          className="project-draft-form"
          onSubmit={event => {
            event.preventDefault();
            if (!canSubmit || createProject.isPending) return;
            createProject.mutate({
              ...draft,
              status: "idea",
              visibility: "private",
              progress: 0,
              accent: "#ef3d32",
            });
          }}
        >
          <div className="workspace-form-topline">
            <span>NEW TRANSMISSION</span>
            <Plus size={17} aria-hidden="true" />
          </div>
          <label>
            Slug
            <input
              value={draft.slug}
              onChange={event =>
                updateDraft("slug", event.target.value.toLowerCase())
              }
              placeholder="signal-lab"
              maxLength={96}
              required
            />
          </label>
          <label>
            Title
            <input
              value={draft.title}
              onChange={event => updateDraft("title", event.target.value)}
              placeholder="Project title"
              maxLength={120}
              required
            />
          </label>
          <label>
            Codename
            <input
              value={draft.codename}
              onChange={event =>
                updateDraft("codename", event.target.value.toUpperCase())
              }
              placeholder="PIVOT"
              maxLength={48}
              required
            />
          </label>
          <label>
            One-line ambition
            <input
              value={draft.summary}
              onChange={event => updateDraft("summary", event.target.value)}
              placeholder="What is this becoming?"
              maxLength={280}
              required
            />
          </label>
          <label>
            Working brief
            <textarea
              value={draft.description}
              onChange={event => updateDraft("description", event.target.value)}
              placeholder="What problem, format, or tension is the team exploring?"
              maxLength={4000}
              required
              rows={5}
            />
          </label>
          <button
            className="workspace-submit"
            type="submit"
            disabled={!canSubmit || createProject.isPending}
          >
            {createProject.isPending ? (
              <LoaderCircle className="spin" size={16} />
            ) : (
              <ArrowUpRight size={16} />
            )}
            {createProject.isPending ? "Saving" : "Save private draft"}
          </button>
          {formMessage && (
            <p className="workspace-form-message" role="status">
              {formMessage}
            </p>
          )}
        </form>

        <div className="workspace-project-list">
          <div className="workspace-list-topline">
            <span>TEAM INDEX</span>
            <span>
              {visibleProjects.length} / {projects?.length ?? 0} RECORDS
            </span>
          </div>
          <div
            className="workspace-controls"
            aria-label="Filter private project records"
          >
            <label className="workspace-search">
              <span>Scan records</span>
              <input
                value={workspaceSearch}
                onChange={event => setWorkspaceSearch(event.target.value)}
                placeholder="Search title or codename"
                type="search"
                aria-label="Search private projects"
              />
            </label>
            <div
              className="workspace-filter-list"
              role="group"
              aria-label="Filter private projects by status"
            >
              {workspaceFilters.map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={
                    workspaceFilter === option.value ? "is-active" : ""
                  }
                  aria-pressed={workspaceFilter === option.value}
                  onClick={() => setWorkspaceFilter(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {isLoading && (
            <p className="workspace-empty" role="status">
              Loading the team index...
            </p>
          )}
          {isError && (
            <p className="workspace-empty" role="alert">
              The team index is unavailable. Try again shortly.
            </p>
          )}
          {!isLoading && !isError && projects?.length === 0 && (
            <div className="workspace-empty">
              <span className="workspace-empty-mark">01</span>
              <p>No project records yet.</p>
              <small>
                Write the first private brief. It will stay inside the control
                room.
              </small>
            </div>
          )}
          {!isLoading &&
            !isError &&
            projects &&
            projects.length > 0 &&
            visibleProjects.length === 0 && (
              <div className="workspace-empty workspace-empty-filtered">
                <span className="workspace-empty-mark">00</span>
                <p>No matching signals.</p>
                <small>Try another status or clear the search field.</small>
              </div>
            )}
          {visibleProjects.map(project => (
            <article className="workspace-project-row" key={project.id}>
              <div>
                <span style={{ color: project.accent }}>
                  {project.codename}
                </span>
                <h3>{project.title}</h3>
                <p>{project.summary}</p>
              </div>
              <div className="workspace-project-meta">
                <strong>{statusLabels[project.status]}</strong>
                <small>
                  {project.visibility} / {project.progress}%
                </small>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const serverRoleQuery = trpc.auth.me.useQuery(undefined, {
    enabled: !authLoading && Boolean(user),
    staleTime: 0,
  });
  const serverUser = serverRoleQuery.data;
  const roleLabel = dashboardRoleLabel(
    serverUser?.role,
    serverRoleQuery.isLoading
  );

  return (
    <section className="dashboard-overview">
      <DashboardOfflineIndicator />
      <p>CONTROL ROOM / {roleLabel} VIEW</p>
      <h1>
        WELCOME BACK,
        <br />
        <i>
          {user?.user_metadata?.full_name ??
            user?.user_metadata?.name ??
            user?.email?.split("@")[0] ??
            "COLLECTIVE"}
          .
        </i>
      </h1>
      <div className="dashboard-overview-grid">
        <article>
          <span>STATUS</span>
          <strong>CONNECTED</strong>
          <p>
            Your serverless session is active and ready for future team tools.
          </p>
        </article>
        <article>
          <span>NEXT BUILD</span>
          <strong>PROJECT INDEX</strong>
          <p>
            Capture a private brief below, then decide when the work is ready to
            transmit.
          </p>
        </article>
      </div>
      <ProjectWorkspace enabled={!authLoading && Boolean(user)} />
    </section>
  );
}

export default function Dashboard() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
