import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * A small authenticated landing route proves the dashboard shell's loading
 * skeleton during the auth.me serverless query and provides a stable base for
 * future member-only tools.
 */
function DashboardContent() {
  const { user } = useAuth();

  return (
    <section className="dashboard-overview">
      <p>CONTROL ROOM / MEMBER VIEW</p>
      <h1>WELCOME BACK,<br /><i>{user?.name || "COLLECTIVE"}.</i></h1>
      <div className="dashboard-overview-grid">
        <article><span>STATUS</span><strong>CONNECTED</strong><p>Your serverless session is active and ready for future team tools.</p></article>
        <article><span>NEXT BUILD</span><strong>PROJECT INDEX</strong><p>Add member-only project drafts, notes, and release signals here when needed.</p></article>
      </div>
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
