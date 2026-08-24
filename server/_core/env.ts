export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  supabaseUrl: process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "",
  supabasePublishableKey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
  teamAdminEmail: process.env.TEAMADMINEMAIL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

type ProductionEnvironment = Pick<
  typeof ENV,
  | "appId"
  | "cookieSecret"
  | "databaseUrl"
  | "isProduction"
  | "supabaseUrl"
  | "supabasePublishableKey"
>;

/** Refuse to start an internet-facing API with placeholder production credentials. */
export function validateProductionEnvironment(
  environment: ProductionEnvironment = ENV
) {
  if (!environment.isProduction) return;

  const requiredValues = [
    ["DATABASE_URL", environment.databaseUrl],
    ["JWT_SECRET", environment.cookieSecret],
    ["VITE_SUPABASE_URL", environment.supabaseUrl],
    ["VITE_SUPABASE_PUBLISHABLE_KEY", environment.supabasePublishableKey],
  ] as const;
  const missing = requiredValues
    .filter(([, value]) => !value.trim())
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(", ")}`
    );
  }

  if (environment.cookieSecret.length < 32) {
    throw new Error(
      "JWT_SECRET must contain at least 32 characters in production."
    );
  }
}
