/**
 * Explicit Vercel filesystem route for same-origin team magic-link requests.
 *
 * This function intentionally initializes only the Auth proxy. The full API app
 * also validates database configuration at startup, which is unnecessary for
 * this bounded authentication endpoint and can turn a valid request into a
 * serverless invocation failure.
 */
import express from "express";
import { applySecurityHeaders } from "../../server/security";
import { registerAuthProxy } from "../../server/authProxy";

const app = express();
app.disable("x-powered-by");
app.use(applySecurityHeaders);
app.use(express.json({ limit: "32kb", strict: true }));
registerAuthProxy(app);

export default app;
