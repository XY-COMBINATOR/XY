# XY OS implementation plan

## Planning baseline

This plan defines the first release boundary before expanding beyond the authentication repair. The recommended first release is intentionally smaller than the complete XY OS vision: a public Project Radar and an authenticated private Project Workspace. Team Presence, Experiment Lab, and Live Release Mode are follow-on releases, not hidden scope in this milestone.

## Effort estimate

| Scope              |     New application code | Expected implementation effort | Delivery boundary                                                                          |
| ------------------ | -----------------------: | -----------------------------: | ------------------------------------------------------------------------------------------ |
| Release 1 MVP      |        1,500–3,000 lines |           4–8 focused workdays | Radar, project detail states, private draft creation, protected listing, responsive UI     |
| Full XY OS         |        4,000–8,000 lines |                      2–4 weeks | MVP plus presence, experiment records, release history, richer permissions                 |
| Award-level polish | 6,000–10,000 lines total |                      3–6 weeks | Motion refinement, media workflows, activity history, accessibility and performance passes |

These are planning ranges rather than guarantees. The first release should not begin the next layer until its current tests, preview, and production checks pass.

## Dependencies

Release 1 uses the existing React 19 and Vite client, wouter routing, the existing `DashboardLayout`, the existing tRPC transport, Supabase bearer-token authentication, Drizzle ORM, and the existing MySQL/TiDB database. It requires no new external service, secret, media asset, or runtime dependency. The database migration is additive and creates only `projects` plus its indexes.

## Concrete risks and controls

| Risk                                             | Control                                                                                                                                         |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Private drafts appear publicly                   | The public query filters `visibility = public`; private visibility is the default and non-admin writes are forced private.                      |
| A member edits another member’s project          | The server checks `leadOpenId` for non-admin updates; browser controls are not trusted.                                                         |
| Invalid or oversized content enters the database | Zod bounds slugs, titles, descriptions, progress, status, visibility, and accent values before the mutation runs.                               |
| A migration damages existing data                | The migration creates a new table only; it does not alter, drop, or backfill existing tables.                                                   |
| The new feature harms existing auth or routes    | Existing auth files and routes remain in place; the XY OS route is additive and separately flaggable.                                           |
| A large UI bundle harms mobile performance       | The new public page is lazy-loaded through the existing route splitter, and verification includes desktop and phone builds.                     |
| A release must be withdrawn                      | Set `VITE_XY_OS_ENABLED=false` for the deployment and redeploy; existing homepage, dashboard authentication, and other routes remain available. |

## Security and data boundaries

All project writes use protected tRPC procedures. Non-admin members can create private drafts and update only their own drafts. Administrators are determined on the server from the normalized authenticated email and `TEAMADMINEMAIL`; no administrator email or browser-supplied role flag is exposed to the client. Public procedures return only explicitly public records and are bounded to 48 rows. Team listing is bounded to 100 rows.

## Staged rollout

The release is isolated behind the `/projects` route, the Project Radar navigation entries, and the private workspace section inside `/dashboard`. The `xyOsEnabled` flag defaults to enabled for normal deployments and supports an emergency off switch with `VITE_XY_OS_ENABLED=false`. The database table may remain empty without affecting existing pages; the public Radar displays a truthful empty state instead of fabricated work.

## Checkpoints and rollback boundaries

Checkpoint A is the schema and API milestone: schema generated, migration reviewed and applied, procedures added, and server tests passing. Checkpoint B is the UI milestone: public Radar, dashboard workspace, feature flag, and responsive screenshots passing. Checkpoint C is the delivery milestone: full tests, TypeScript, formatting, production build, dependency audit, GitHub checks, and Vercel preview passing before merge.

Rollback never uses a destructive database rollback. If the UI is unsuitable, disable the feature flag or restore the previous application checkpoint. If the code release must be withdrawn, revert the feature branch through GitHub and keep the additive `projects` table unused. Existing authentication is not removed as part of rollback.

## Production completion criteria

Release 1 is production-complete only when the public Radar loads on desktop and mobile, its empty state is truthful, an authenticated team member can create a private draft, an unauthorized caller cannot write, Supabase sign-in still reaches the dashboard, and the exact designated administrator account displays `CONTROL ROOM / ADMIN VIEW` after the latest deployment. The last criterion remains an operator-owned verification because the production secret value and email-link session are not accessible to repository automation.
