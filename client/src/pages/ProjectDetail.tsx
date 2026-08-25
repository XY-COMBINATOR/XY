import { ArrowLeft, ArrowUpRight, CircleDot, ShieldCheck } from "lucide-react";
import { Link, useRoute } from "wouter";
import { PublicFrame } from "@/components/PublicFrame";
import { trpc } from "@/lib/trpc";

const statusLabels = {
  idea: "Signal forming",
  active: "In motion",
  shipped: "Released",
  paused: "On pause",
} as const;

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:slug");
  const {
    data: projects,
    isLoading,
    isError,
  } = trpc.projects.publicList.useQuery();
  const project = projects?.find(candidate => candidate.slug === params?.slug);

  return (
    <PublicFrame label="04 / PROJECT RADAR">
      <main className="route-main ink-page project-detail-page">
        <Link className="text-link project-detail-back" href="/projects">
          <ArrowLeft size={16} /> Back to the radar
        </Link>

        {isLoading && (
          <div className="project-index-empty" role="status">
            <CircleDot className="project-empty-pulse" size={20} />
            <p>Locating the signal...</p>
          </div>
        )}

        {isError && (
          <div className="project-index-empty" role="alert">
            <h1>Signal lost.</h1>
            <p>This public brief is temporarily unavailable.</p>
            <Link className="text-link" href="/projects">
              Return to the radar <ArrowUpRight size={16} />
            </Link>
          </div>
        )}

        {!isLoading && !isError && !project && (
          <div className="project-index-empty" role="status">
            <h1>Signal not found.</h1>
            <p>That brief may still be private or has not been transmitted.</p>
            <Link className="text-link" href="/projects">
              Scan public signals <ArrowUpRight size={16} />
            </Link>
          </div>
        )}

        {!isLoading && !isError && project && (
          <article className="project-detail-card">
            <header className="project-detail-heading">
              <div>
                <p className="route-kicker light">
                  PUBLIC TRANSMISSION / {project.codename}
                </p>
                <h1>
                  {project.title}
                  <br />
                  <i>{statusLabels[project.status]}.</i>
                </h1>
              </div>
              <div
                className="project-detail-signal"
                style={{ borderColor: project.accent }}
              >
                <span>PROGRESS</span>
                <strong>{project.progress}%</strong>
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
              </div>
            </header>
            <div className="project-detail-body">
              <div>
                <p className="project-detail-label">ONE-LINE AMBITION</p>
                <p className="project-detail-summary">{project.summary}</p>
              </div>
              <div>
                <p className="project-detail-label">WORKING BRIEF</p>
                <p className="project-detail-description">
                  {project.description}
                </p>
              </div>
            </div>
            <footer className="project-detail-footer">
              <span>
                <ShieldCheck size={15} /> Verified public record
              </span>
              <span>
                Updated {new Date(project.updatedAt).toLocaleDateString()}
              </span>
            </footer>
          </article>
        )}
      </main>
    </PublicFrame>
  );
}
