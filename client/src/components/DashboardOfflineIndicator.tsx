import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { isNetworkOffline, watchNetworkStatus } from "@/lib/networkStatus";

function isOfflinePreviewEnabled() {
  return (
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).has("offlinePreview")
  );
}

/** Translate browser online and offline events into an immediate dashboard alert. */
export function DashboardOfflineIndicator() {
  const [isOffline, setIsOffline] = useState(
    () =>
      isOfflinePreviewEnabled() ||
      isNetworkOffline(typeof navigator === "undefined" ? undefined : navigator)
  );

  useEffect(() => {
    const showOffline = () => setIsOffline(true);
    const hideOffline = () => setIsOffline(false);

    return watchNetworkStatus(window, showOffline, hideOffline);
  }, []);

  if (!isOffline) return null;

  return (
    <aside
      className="dashboard-offline-indicator"
      role="alert"
      aria-live="assertive"
    >
      <WifiOff size={17} aria-hidden="true" />
      <div>
        <strong>YOU’RE OFFLINE</strong>
        <span>
          Changes that need the server will wait until your connection returns.
        </span>
      </div>
    </aside>
  );
}
