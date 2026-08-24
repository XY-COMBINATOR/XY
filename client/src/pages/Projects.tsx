import { ArrowUpRight, CircleDot, Radar, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { PublicFrame } from "@/components/PublicFrame";
import {
  filterWorkspaceProjects,
  type WorkspaceStatus,
} from "@/lib/projectFilters";
import { trpc } from "@/lib/trpc";

type ProjectStatus = "all" | "idea" | "active" | "shipped" | "paused";

const filters: Array<{ value: ProjectStatus; label: string }> = [
  { value: "all", label: "All signals" },
  { value: "idea", label: "Ideas" },
  { value: "active", label: "In motion" },
  { value: "shipped", label: "Shipped" },
  { value: "paused", label: "Paused" },
];

const statusLabels = {
  idea: "Signal forming",
  active: "In motion",
  shipped: "Released",
  paused: "On pause",
} as const;

export default function Projects() {
  const [filter, setFilter] = useState<ProjectStatus>("all");
  const [search, setSearch] = useState("");
  const {
    data: projects,
    isLoading,
    isError,
  } = trpc.projects.publicList.useQuery();
  const visibleProjects = useMemo(
    () =>
      filterWorkspaceProjects(
        projects ?? [],
        filter as WorkspaceStatus,
        search
      ),
    [filter, projects, search]
  );
  const statusCounts = useMemo(() => {
    const counts = {
      all: projects?.length ?? 0,
      idea: 0,
      active: 0,
      shipped: 0,
      paused: 0,
    };
    for (const project of projects ?? []) counts[project.status] += 1;
    return counts;
  }, [projects]);

  return (
    <PublicFrame label="04 / PROJECT RADAR">
      <main className="route-main ink-page projects-page">
        <header className="projects-heading">
          <div>
            <p className="route-kicker light">THE LIVING INDEX</p>
            <h1>
              WORK IN
              <br />
              <i>ORBIT.</i>
            </h1>
          </div>
          <div className="projects-heading-note">
            <Radar aria-hidden="true" size={30} />
            <p>
              A public signal map for the things XY COMBINATOR is making,
              testing, and releasing.
            </p>
          </div>
        </header>

        <div className="project-radar-shell">
          <div className="project-radar-visual" aria-hidden="true">
            <span className="radar-ring radar-ring-one" />
            <span className="radar-ring radar-ring-two" />
            <span className="radar-ring radar-ring-three" />
            <span className="radar-sweep" />
            <span className="radar-core">
              <Sparkles size={18} />
            </span>
            <span className="radar-label radar-label-top">LIVE SIGNALS</span>
            <span className="radar-label radar-label-bottom">X / Y AXIS</span>
          </div>
          <div className="project-radar-copy">
            <span className="project-radar-index">PROJECT RADAR / 01</span>
            <h2>Every idea leaves a trace.</h2>
            <p>
              Explore the visible work. Private drafts stay inside the team
              control room until someone decides they are ready to transmit.
            </p>
            <Link className="text-link" href="/dashboard">
              Open team control room <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>

        <section
          className="public-project-index"
          aria-labelledby="public-projects-heading"
        >
          <div className="public-project-index-topline">
            <div>
              <p className="route-kicker light">PUBLIC TRANSMISSIONS</p>
              <h2 id="public-projects-heading">THE INDEX.</h2>
            </div>
            <div className="public-project-discovery">
              <label className="public-project-search">
                <span>Find a signal</span>
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  type="search"
                  placeholder="Search the index"
                  aria-label="Search public projects"
                />
              </label>
              <div
                className="project-filter-list"
                role="group"
                aria-label="Filter projects by status"
              >
                {filters.map(option => (
                  <button
                    key={option.value}
                    className={filter === option.value ? "is-active" : ""}
                    type="button"
                    aria-pressed={filter === option.value}
                    onClick={() => setFilter(option.value)}
                  >
                    {option.label} <small>{statusCounts[option.value]}</small>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="project-index-empty" role="status">
              <CircleDot className="project-empty-pulse" size={20} />
              <p>Scanning the project field...</p>
            </div>
          )}

          {isError && (
            <div className="project-index-empty" role="alert">
              <p>
                Project signals are temporarily unavailable. Try again shortly.
              </p>
            </div>
          )}

          {!isLoading && !isError && visibleProjects.length === 0 && (
            <div className="project-index-empty">
              <CircleDot className="project-empty-pulse" size={20} />
              <h3>No public signals yet.</h3>
              <p>
                The radar is ready. A team member can publish the first verified
                project from the private control room.
              </p>
              <Link className="text-link" href="/dashboard">
                Enter control room <ArrowUpRight size={16} />
              </Link>
            </div>
          )}

          {visibleProjects.length > 0 && (
            <div className="public-project-grid">
              {visibleProjects.map(project => (
                <article className="public-project-card" key={project.id}>
                  <div className="public-project-card-topline">
                    <span>/{project.codename}</span>
                    <span style={{ color: project.accent }}>
                      {statusLabels[project.status]}
                    </span>
                  </div>
                  <h3>{project.title}</h3>
                  <p>{project.summary}</p>
                  <div
                    className="public-project-progress"
                    aria-label={`${project.progress}% complete`}
                  >
                    <span
                      style={{
                        width: `${project.progress}%`,
                        backgroundColor: project.accent,
                      }}
                    />
                  </div>
                  <small>
                    {project.progress}% / {project.status}
                  </small>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </PublicFrame>
  );
}
