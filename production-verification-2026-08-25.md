# Production verification — 2026-08-25

The native tRPC adapter change was merged into `main` as commit `35d603e7e3330ec72b4ff4171c9c80fbb53d772c`. GitHub reported successful protected checks and a completed Vercel deployment.

At 15:23 UTC, `https://xy-combinator.vercel.app/api/trpc/system.health?batch=1&input=...` still returned HTTP 500 with `x-vercel-error: FUNCTION_INVOCATION_FAILED`. The exact `/api/trpc` route returned the same failure. The independent `/api/auth/magic-link` route returned HTTP 400 with the expected JSON validation error for an invalid email, proving the failure is isolated to the tRPC function path rather than all Vercel functions.

The Vercel deployment dashboard is not accessible in the sandbox session because it redirects to Vercel login. No sign-in email was sent and no production secrets were changed during this verification.
