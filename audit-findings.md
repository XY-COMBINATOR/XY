# Authentication Audit Findings

The live Vercel client bundle uses `https://ofkqvwkjcbfvwbirexzw.supabase.co`. The live Vercel HTML currently serves a CSP with the same Supabase host in `connect-src`; the previous stale host was `https://ofkqvwkjcbfwwbirexzw.supabase.co` and was corrected in `vercel.json`.

A direct Supabase Auth settings request with the deployed publishable key returned HTTP 200, and a browser-origin preflight to `/auth/v1/otp` returned HTTP 200 with the required CORS headers. A direct OTP request for a non-existent test address returned HTTP 422 with `otp_disabled` and `Signups not allowed for otp`, confirming that the invite-only behavior is deliberate and that an email must exist in Supabase Auth.

The Supabase dashboard user list cannot be inspected in the current browser session because it redirects to the Supabase account sign-in page. No user credentials are stored or requested in this file.
The first browser console probes were run while the browser was on the Supabase dashboard login page, not the Vercel site; their results are not evidence about the app origin. The browser has since been returned to `https://xy-combinator.vercel.app/dashboard`, which renders the intended sign-in screen.
The browser session briefly reset to `about:blank`, then the production dashboard was reopened successfully at `https://xy-combinator.vercel.app/dashboard`. The page renders the sign-in form. No sign-in request has been submitted by the audit browser.
On the actual `xy-combinator.vercel.app/dashboard` page, a browser-side fetch probe using the live bundle’s Supabase settings request threw `TypeError: Failed to fetch`. This is a genuine browser-context reproduction, unlike the earlier probe run on the Supabase dashboard. The next audit step is to isolate whether the failing browser fetch is the bundle fetch or the cross-origin Supabase fetch and inspect the page’s effective CSP in that context.
On the correct production origin, same-origin `/dashboard` and `/assets/index-DldXuuFV.js` both return HTTP 200 and the live bundle contains a publishable key. However, both `mode: cors` and `mode: no-cors` browser fetches to `https://ofkqvwkjcbfvwbirexzw.supabase.co/auth/v1/settings` throw `TypeError: Failed to fetch`, even though curl from the sandbox receives the endpoint. This rules out the app bundle being absent and points to a browser-environment/network-level block or an effective policy not visible in the page DOM; the real sign-in request remains unsubmitted.

## Administrator-role verification runbook

After the role-confirmation release is deployed, sign in with the exact email configured as `TEAMADMINEMAIL`. The protected dashboard should display `CONTROL ROOM / ADMIN VIEW`; any other authenticated team member should display `CONTROL ROOM / MEMBER VIEW`. The label is derived from the server-side role returned by the authenticated `auth.me` procedure, so the administrator email itself is never exposed to the browser. If the designated account shows MEMBER, verify that its email matches `TEAMADMINEMAIL` after normalization and sign out and in again to refresh the server-side user record.

## XY OS production verification

After PR #7 merged, production `/projects` loads the new Project Radar with `WORK IN ORBIT`, live signal filters, and the public project index. Production `/dashboard` loads the current invite-only sign-in screen without a route or server error. The sandbox browser is signed out, so administrator role verification remains operator-owned and must use the invited production email after the email cooldown.

## Repository-wide re-audit — 24 August 2026

The authentication and role path was reviewed end to end. The browser uses one same-origin magic-link request and persists the Supabase session through the official client. The Vercel filesystem route is explicit, dependency-light, validates method and email input, applies no-store and security headers, forwards only to the configured Supabase project, uses invite-only `create_user: false`, and returns bounded safe errors. The server verifies Supabase JWTs against the project JWKS and issuer, normalizes the email claim and `TEAMADMINEMAIL`, persists `admin` only on an exact normalized match, and the tRPC admin gate checks the persisted role. The dashboard renders the role returned by `auth.me`; it does not trust browser input.

The repository-wide checks completed successfully: 38 Vitest tests passed, TypeScript passed, Prettier and the changed-file formatting gate passed, the production build passed, the production dashboard returned HTTP 200, and the live magic-link route returned safe HTTP 400 validation output for an invalid body. The production dependency audit reported zero known info, low, moderate, high, or critical vulnerabilities across 241 production dependencies. Scans found no committed private-key or credential literals and no use of unsafe HTML injection, dynamic code execution, child-process execution, or token storage patterns in the reviewed application sources.

The remaining discrepancy is not a code defect demonstrated by this audit. The supplied authenticated screenshot showed `MEMBER VIEW`, which means the production session was created or refreshed while the deployed `TEAMADMINEMAIL` value did not match the email claim, or the role had not yet been refreshed by a new sign-in. After the cooldown, one fresh sign-in with `mantisdarling@proton.me` is required to confirm the visible `ADMIN VIEW` label.

## New production evidence

A read-only query against the connected project database found zero persisted `users` rows for `mantisdarling@proton.me` (`matchingUsers: 0`, `persistedRole: NULL`). This is important: the role-mapping code itself is exact and tested, but the server cannot return `admin` for an email that has not been upserted. A fresh production sign-in should cause `authenticateSupabaseRequest` to verify the Supabase access token and upsert the user with `role: admin` when the production `TEAMADMINEMAIL` matches. If the row remains absent after one fresh sign-in, the next diagnosis target is the production JWT verification or database environment, not the dashboard label.
