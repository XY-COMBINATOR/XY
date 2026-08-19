import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";
import { applySecurityHeaders } from "./security";

/**
 * Build only the API portion of the service. Keeping this free of listeners and
 * static middleware allows both the Node server and Vercel Functions to reuse
 * the same validated routes, authentication, throttling, and error handling.
 */
export function createApiApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(applySecurityHeaders);
  app.use(express.json({ limit: "256kb", strict: true }));
  app.use(express.urlencoded({ limit: "32kb", extended: false }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

  // Express does not automatically reset a serverless invocation after errors.
  // This final handler provides a concise response without leaking internals.
  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    console.error("[API] Unhandled request error", error);
    if (response.headersSent) return;
    response.status(500).json({ error: "Internal server error" });
  });

  return app;
}

export const apiApp = createApiApp();
