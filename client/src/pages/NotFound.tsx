import { ArrowLeft, ArrowUpRight, CircleDashed } from "lucide-react";
import { Link } from "wouter";
import { useLocation } from "wouter";

export default function NotFound() {
  const [location] = useLocation();

  function handleGoBack() {
    if (window.history.length > 1) {
      window.history.back();
    }
  }

  return (
    <div className="not-found-page">
      <div className="not-found-grid" aria-hidden="true" />
      <header className="not-found-header">
        <Link
          href="/"
          className="brand-lockup"
          aria-label="Return to XY COMBINATOR home"
        >
          <span className="not-found-mark">XY</span>
          <span className="brand-wordmark">
            <b>XY</b>
            <b>COMBINATOR</b>
          </span>
        </Link>
        <span>ERROR / 404</span>
      </header>
      <main className="not-found-main">
        <CircleDashed className="not-found-symbol" aria-hidden="true" />
        <p className="not-found-kicker">COORDINATE NOT FOUND</p>
        <h1>
          THIS SIGNAL
          <br />
          <i>WENT QUIET.</i>
        </h1>
        <p className="not-found-copy">
          There is no route at <code>{location}</code>. It may have moved, or
          the address may be incomplete.
        </p>
        <div className="not-found-actions">
          <Link href="/" className="not-found-primary">
            Return to the collective <ArrowUpRight size={18} />
          </Link>
          <button
            type="button"
            onClick={handleGoBack}
            disabled={window.history.length < 2}
          >
            <ArrowLeft size={17} /> Go back
          </button>
        </div>
      </main>
    </div>
  );
}
