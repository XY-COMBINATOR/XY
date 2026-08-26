import {
  Activity,
  ArrowUpRight,
  BarChart3,
  LockKeyhole,
  RefreshCw,
} from "lucide-react";
import { useAuthBoundary } from "@/contexts/AuthBoundaryContext";
import { trpc } from "@/lib/trpc";

const statusLabels = {
  idea: "IDEAS",
  active: "IN MOTION",
  shipped: "SHIPPED",
  paused: "PAUSED",
} as const;

const statusOrder = ["idea", "active", "shipped", "paused"] as const;

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="analytics-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

export default function Analytics() {
  const { user } = useAuthBoundary();
  const isAdmin = user?.role === "admin";
  const analytics = trpc.analytics.overview.useQuery(undefined, {
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <main className="analytics-page" aria-labelledby="analytics-access-title">
        <div className="analytics-access-state" role="alert">
          <LockKeyhole size={20} aria-hidden="true" />
          <p className="dashboard-kicker">XY OS / RESTRICTED SIGNAL</p>
          <h1 id="analytics-access-title">ADMIN ACCESS REQUIRED.</h1>
          <p>Analytics are limited to verified administrators.</p>
        </div>
      </main>
    );
  }

  if (analytics.isLoading) {
    return (
      <main className="analytics-page" aria-busy="true">
        <div className="analytics-loading-state" role="status">
          <Activity size={20} aria-hidden="true" />
          <p>Reading the control-room signal…</p>
        </div>
      </main>
    );
  }

  if (analytics.isError || !analytics.data) {
    return (
      <main className="analytics-page" aria-labelledby="analytics-error-title">
        <div className="analytics-access-state" role="alert">
          <p className="dashboard-kicker">XY OS / SIGNAL INTERRUPTED</p>
          <h1 id="analytics-error-title">METRICS OUT OF RANGE.</h1>
          <p>The analytics signal could not be read right now.</p>
          <button
            className="analytics-retry-button"
            type="button"
            onClick={() => void analytics.refetch()}
          >
            <RefreshCw size={15} aria-hidden="true" /> Retry read
          </button>
        </div>
      </main>
    );
  }

  const data = analytics.data;
  const maximumStatusCount = Math.max(
    1,
    ...statusOrder.map(status => data.statusBreakdown[status])
  );

  return (
    <main className="analytics-page" aria-labelledby="analytics-heading">
      <header className="analytics-heading">
        <div>
          <p className="dashboard-kicker">XY OS / ADMIN ANALYTICS</p>
          <h1 id="analytics-heading">
            TRACK THE
            <br />
            <i>TRAJECTORY.</i>
          </h1>
          <p className="analytics-heading-summary">
            A quiet readout of the team’s recorded work: what exists, what is
            moving, and what is ready to ship.
          </p>
        </div>
        <div className="analytics-heading-note">
          <BarChart3 size={20} aria-hidden="true" />
          <span>
            Aggregate signals only. No private project brief is exposed here.
          </span>
          <nav
            className="analytics-route-links"
            aria-label="XY OS destinations"
          >
            <a href="/dashboard">Command center</a>
            <a href="/projects">Project radar</a>
          </nav>
        </div>
      </header>

      {!data.dataAvailable && (
        <div className="analytics-data-note" role="status">
          The index is connected, but no project metrics are recorded yet.
        </div>
      )}

      <section className="analytics-metric-grid" aria-label="Key metrics">
        <MetricCard
          label="TOTAL PROJECTS"
          value={String(data.totalProjects).padStart(2, "0")}
          detail="Bounded team index"
        />
        <MetricCard
          label="AVERAGE PROGRESS"
          value={`${data.averageProgress}%`}
          detail="Across recorded projects"
        />
        <MetricCard
          label="TEAM MEMBERS"
          value={String(data.teamMembers).padStart(2, "0")}
          detail="Verified user records"
        />
        <MetricCard
          label="PUBLIC SIGNALS"
          value={String(data.publicProjects).padStart(2, "0")}
          detail={`${data.privateProjects} private records remain internal`}
        />
      </section>

      <section className="analytics-split-grid">
        <article
          className="analytics-panel"
          aria-labelledby="status-breakdown-heading"
        >
          <div className="analytics-panel-topline">
            <span>STATUS DISTRIBUTION</span>
            <span>{data.totalProjects} RECORDS</span>
          </div>
          <h2 id="status-breakdown-heading">
            THE CURRENT <i>WEIGHT.</i>
          </h2>
          <div className="analytics-bars">
            {statusOrder.map(status => {
              const count = data.statusBreakdown[status];
              return (
                <div className="analytics-bar-row" key={status}>
                  <div className="analytics-bar-label">
                    <span>{statusLabels[status]}</span>
                    <strong>{count}</strong>
                  </div>
                  <div
                    className="analytics-bar-track"
                    role="meter"
                    aria-label={`${count} ${statusLabels[status].toLowerCase()} projects`}
                    aria-valuenow={count}
                    aria-valuemin={0}
                    aria-valuemax={maximumStatusCount}
                  >
                    <span
                      style={{
                        width: `${(count / maximumStatusCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article
          className="analytics-panel analytics-progress-panel"
          aria-labelledby="progress-heading"
        >
          <div className="analytics-panel-topline">
            <span>PROGRESS READOUT</span>
            <span>0—100</span>
          </div>
          <h2 id="progress-heading">
            AVERAGE <i>VELOCITY.</i>
          </h2>
          <div
            className="analytics-progress-ring"
            aria-label={`${data.averageProgress}% average project progress`}
          >
            <strong>{data.averageProgress}%</strong>
            <span>TEAM INDEX</span>
          </div>
          <p>One number, read as a direction—not a finish line.</p>
          <p className="analytics-refresh-note">
            Read from the current team index. Refresh the page to take a new
            snapshot.
          </p>
        </article>
      </section>

      <section
        className="analytics-recent-panel"
        aria-labelledby="recent-projects-heading"
      >
        <div className="analytics-panel-topline">
          <span>RECENT TRANSMISSIONS</span>
          <span>LAST 05</span>
        </div>
        <h2 id="recent-projects-heading">
          THE LAST <i>MOVES.</i>
        </h2>
        {data.recentProjects.length ? (
          <div className="analytics-recent-list">
            {data.recentProjects.map(project => (
              <div className="analytics-recent-row" key={project.id}>
                <div>
                  <span>{project.codename}</span>
                  <strong>{project.title}</strong>
                </div>
                <div className="analytics-recent-meta">
                  <span>{statusLabels[project.status]}</span>
                  <span>{project.progress}%</span>
                  <span>
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="analytics-empty-state">
            <p>No project movement has been recorded yet.</p>
            <a href="/dashboard">
              Open the command center{" "}
              <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          </div>
        )}
      </section>
    </main>
  );
}
