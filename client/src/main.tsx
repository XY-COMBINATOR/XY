import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";
import { assetUrl } from "./lib/assets";
import { apiTimeoutMs } from "./lib/apiFailure";
import { ApiRecoveryNotice } from "./components/ApiRecoveryNotice";
import { supabase } from "./lib/supabase";

const queryClient = new QueryClient();

// Vercel can route artwork through its serverless storage proxy while local
// and Manus previews keep the existing storage path without configuration.
const favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
if (favicon) {
  favicon.type = "image/png";
  favicon.href = assetUrl("/manus-storage/xy-logo-mark_228db636.png");
}

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      async headers() {
        const { data } = (await supabase?.auth.getSession()) ?? { data: null };
        const token = data?.session?.access_token;
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
      fetch(input, init) {
        // Abort slow serverless calls rather than leaving a pending UI forever.
        const timeoutSignal = AbortSignal.timeout(apiTimeoutMs);
        const signal = init?.signal
          ? AbortSignal.any([init.signal, timeoutSignal])
          : timeoutSignal;

        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
          signal,
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
      <ApiRecoveryNotice queryClient={queryClient} />
    </QueryClientProvider>
  </trpc.Provider>
);
