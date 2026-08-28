import type { QueryClient } from "@tanstack/react-query";
import { RotateCcw, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFailureMessage } from "@/lib/apiFailure";
import { UNAUTHED_ERR_MSG } from "@shared/const";

type ApiRecoveryNoticeProps = {
  queryClient: QueryClient;
};

/**
 * Surface failed serverless reads outside individual screens. Mutations retain
 * their own inline recovery controls because they can preserve form context.
 */
export function ApiRecoveryNotice({ queryClient }: ApiRecoveryNoticeProps) {
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    return queryClient.getQueryCache().subscribe(event => {
      if (event.type !== "updated" || event.action.type !== "error") return;

      const nextError = event.query.state.error;
      if (nextError instanceof Error && nextError.message === UNAUTHED_ERR_MSG)
        return;
      setError(nextError);
    });
  }, [queryClient]);

  if (!error) return null;

  async function handleRetry() {
    setError(null);
    await queryClient.resetQueries({ type: "active" });
  }

  return (
    <aside className="api-recovery-notice" role="status" aria-live="polite">
      <WifiOff size={16} aria-hidden="true" />
      <span>{apiFailureMessage(error)}</span>
      <button type="button" onClick={handleRetry}>
        <RotateCcw size={14} /> Retry
      </button>
    </aside>
  );
}
