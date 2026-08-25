import type { User } from "@supabase/supabase-js";
import { createContext, useContext } from "react";

type AuthBoundaryValue = {
  user: User;
};

const AuthBoundaryContext = createContext<AuthBoundaryValue | null>(null);

export function AuthBoundaryProvider({
  value,
  children,
}: {
  value: AuthBoundaryValue;
  children: React.ReactNode;
}) {
  return (
    <AuthBoundaryContext.Provider value={value}>
      {children}
    </AuthBoundaryContext.Provider>
  );
}

export function useAuthBoundary() {
  const value = useContext(AuthBoundaryContext);
  if (!value) {
    throw new Error("useAuthBoundary must be used inside AuthBoundaryProvider");
  }
  return value;
}
