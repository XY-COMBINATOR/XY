/**
 * A route-level skeleton keeps the editorial frame visible while lazy pages or
 * server-backed dashboard data are still resolving after an SPA navigation.
 */
export function RouteLoadingSkeleton() {
  return (
    <main className="route-skeleton" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading the next coordinate</span>
      <div className="route-skeleton-header">
        <span className="route-skeleton-mark" />
        <span className="route-skeleton-line route-skeleton-nav" />
        <span className="route-skeleton-line route-skeleton-utility" />
      </div>
      <section className="route-skeleton-main">
        <span className="route-skeleton-line route-skeleton-kicker" />
        <span className="route-skeleton-line route-skeleton-title first" />
        <span className="route-skeleton-line route-skeleton-title second" />
        <span className="route-skeleton-line route-skeleton-copy" />
        <span className="route-skeleton-line route-skeleton-copy short" />
        <div className="route-skeleton-grid">
          <span />
          <span />
          <span />
        </div>
      </section>
    </main>
  );
}
