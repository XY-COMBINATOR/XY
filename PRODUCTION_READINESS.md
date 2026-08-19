# Production Readiness Review

## Release assessment

The application passed its production-candidate engineering checks on 19 August 2026. The review focused on dependency safety, authentication, request handling, API caching, browser isolation, Vercel routing, responsive user flows, and failure behavior. The deployed environment remains responsible for secrets, OAuth allowlists, database migration state, and operational monitoring.

| Review area      | Verified result                                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Dependencies     | `pnpm audit --prod --audit-level=moderate` reported no known production dependency vulnerabilities.                                    |
| Build quality    | TypeScript validation, changed-file formatting, and the production Vite/Express build completed successfully.                          |
| Regression suite | 27 tests passed across auth, request validation, throttling, security headers, resilience, Vercel routing, and contact access control. |
| Static delivery  | Vercel configuration applies security headers to static routes, protects SPA deep links, and marks API responses `no-store`.           |
| Responsive UX    | The home, contact, and authenticated dashboard routes were reviewed at desktop; the dashboard was also reviewed at a phone viewport.   |

## Remediated findings

| Area                      | Production control                                                                                                                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Environment configuration | Production startup rejects missing required variables and `JWT_SECRET` values shorter than 32 characters.                                                                              |
| Sessions                  | Cookies are `HttpOnly`, secure, host-only, `SameSite=Lax` in production, and expire after 30 days. Preview-only bearer-token fallback is disabled in production.                       |
| Browser boundary          | CSP, HSTS, anti-framing, referrer, capability, and origin-isolation controls apply at both the API and Vercel CDN layers.                                                              |
| Request handling          | JSON bodies are bounded; malformed and oversized requests receive safe `400` and `413` responses without an internal-error response.                                                   |
| Contact flow              | Input validation, honeypot checks, hashed distributed throttling, and admin-only inquiry reads remain in place. Public writes no longer select a concurrent request as their response. |
| Failure recovery          | Route skeletons, custom 404 and application recovery views, retryable API feedback, timeout handling, and dashboard offline awareness are covered by tests.                            |

## Operator launch controls

Before publishing the Vercel deployment, follow [`VERCEL_DEPLOYMENT.md`](./VERCEL_DEPLOYMENT.md). In particular, configure secrets in Vercel, apply the database migrations, register the exact production OAuth callback URL, deploy from `main`, and exercise sign-in, sign-out, deep links, and contact submission on the deployed domain. After launch, monitor Vercel function errors and latency together with database health; client-side safeguards complement but do not replace platform DDoS controls, secret rotation, backups, and routine dependency updates.
