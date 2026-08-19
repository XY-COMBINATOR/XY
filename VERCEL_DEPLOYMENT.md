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

| Variable                        | Purpose                                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                  | Production MySQL or TiDB database connection string.                                          |
| `JWT_SECRET`                    | High-entropy session-signing secret with at least 32 characters. Generate a new value.        |
| `VITE_SUPABASE_URL`             | Public Supabase project URL used for invite-only team sign-in.                                |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public Supabase publishable key used by the browser sign-in client.                           |
| `TEAMADMINEMAIL`                | Optional designated administrator email; the matching invited member receives the admin role. |
| `VITE_ASSET_ORIGIN`             | Optional preferred CDN origin. The public `gh-pages` artwork branch is used by default.       |

## Before going live

In Supabase Authentication, set the Site URL and allowed Redirect URL to the exact Vercel production URL. Keep email sign-up disabled and invite members from the Supabase dashboard. The supplied artwork is hosted publicly on the repository `gh-pages` branch and loads through the raw GitHub asset origin by default. You may set `VITE_ASSET_ORIGIN` to a preferred CDN that preserves the same `/manus-storage/*` paths. A bundled geometric favicon provides a first-load fallback, then the supplied PNG logo replaces it at runtime. The contact route uses the database migration files under `drizzle/`; ensure the production database contains `contactRequests` and `contactRateWindows` before accepting enquiries.

> The static website can deploy without its backend configuration, but the contact form and invite-only team sign-in flow require the database, Supabase public values, and allowed redirect URL above.

## Production guardrails

| Control           | Production behavior                                                                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configuration     | The API fails closed at startup when required values are absent or `JWT_SECRET` has fewer than 32 characters.                                                   |
| Sessions          | Browser sessions use `HttpOnly`, `Secure`, host-only cookies with `SameSite=Lax` and a 30-day lifetime. Preview-only bearer fallback is disabled in production. |
| Response security | Vercel serves the static application with CSP, anti-framing, transport-security, and capability-restriction headers; the serverless API repeats these controls. |
| API caching       | `/api/*` responses are explicitly `no-store` at both the CDN and application layers.                                                                            |

## Final launch check

Confirm that the database migrations have been applied, Supabase permits the exact Vercel production URL, and all required environment variables are configured in the Production environment. Deploy from `main`, then verify the home page, a deep link such as `/people`, the contact form, team sign-in, and sign-out against the deployed domain. Review Vercel runtime logs after the first real submissions and keep dependency updates and vulnerability audits in the release process.
