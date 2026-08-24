import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase) {
      setUser(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error: sessionError } = await supabase.auth.getSession();
    setUser(data.session?.user ?? null);
    setError(sessionError);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) {
      void refresh();
      return;
    }

    void refresh();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setError(null);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, [refresh]);

  const logout = useCallback(async () => {
    if (!supabase) return;
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw signOutError;
    setUser(null);
  }, []);

  const sendMagicLink = useCallback(async (email: string) => {
    if (!supabase) {
      throw new Error("Team sign-in is not configured yet.");
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const { error: linkError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: window.location.origin,
        },
      });
      if (linkError) throw linkError;
      return;
    } catch (linkError) {
      // Some browsers or networks block direct cross-origin Supabase requests.
      // Retry through our same-origin server route only for a real fetch failure;
      // Supabase AuthApiError responses must remain visible to the user.
      if (
        !(linkError instanceof TypeError) ||
        !/fetch/i.test(linkError.message)
      ) {
        throw linkError;
      }
    }

    const fallback = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email: normalizedEmail }),
    });
    const payload = (await fallback.json().catch(() => null)) as {
      error?: unknown;
    } | null;
    if (!fallback.ok) {
      const message =
        typeof payload?.error === "string"
          ? payload.error
          : "Unable to send a sign-in link.";
      throw new Error(message);
    }
  }, []);

  const state = useMemo(() => {
    return {
      user,
      loading,
      error,
      isAuthenticated: Boolean(user),
    };
  }, [error, loading, user]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (loading) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;

    if (redirectPath) {
      window.location.href = redirectPath;
    }
  }, [loading, redirectOnUnauthenticated, redirectPath, state.user]);

  return {
    ...state,
    isConfigured: isSupabaseConfigured(),
    refresh,
    logout,
    sendMagicLink,
  };
}
