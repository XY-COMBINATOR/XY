# Vercel Deployment Checklist

The repository now contains a Vite static frontend and a Vercel catch-all API function. Import `XY-COMBINATOR/XY` into Vercel, keep the detected **Vite** framework preset, and use the configuration committed in `vercel.json`.

| Setting          | Value                            |
| ---------------- | -------------------------------- |
| Install command  | `pnpm install --frozen-lockfile` |
| Build command    | `pnpm build`                     |
| Output directory | `dist/public`                    |
| Node runtime     | 22.x                             |

## Required environment variables

Add the following values in **Vercel → Project Settings → Environment Variables** for both Preview and Production. Do not commit any secret values.

| Variable            | Purpose                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------- |
| `DATABASE_URL`      | Production MySQL or TiDB database connection string.                                    |
| `JWT_SECRET`        | High-entropy session-signing secret. Generate a new production value.                   |
| `VITE_APP_ID`       | OAuth application identifier.                                                           |
| `OAUTH_SERVER_URL`  | OAuth service base URL.                                                                 |
| `OWNER_OPEN_ID`     | Owner identity used for the initial administrator role.                                 |
| `VITE_ASSET_ORIGIN` | Optional preferred CDN origin. The public `gh-pages` artwork branch is used by default. |

## Before going live

Update the OAuth provider callback allowlist to include `https://YOUR-VERCEL-DOMAIN/api/oauth/callback`. The supplied artwork is hosted publicly on the repository `gh-pages` branch and loads through the raw GitHub asset origin by default. You may set `VITE_ASSET_ORIGIN` to a preferred CDN that preserves the same `/manus-storage/*` paths. A bundled geometric favicon provides a first-load fallback, then the supplied PNG logo replaces it at runtime. The contact route uses the database migration files under `drizzle/`; ensure the production database contains `contactRequests` and `contactRateWindows` before accepting enquiries.

> The static website can deploy without secrets, but the contact form and sign-in flow require the backend environment variables and OAuth callback configuration above.
