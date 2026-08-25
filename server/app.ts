import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { registerStorageProxy } from "./_core/storageProxy";
import { validateProductionEnvironment } from "./_core/env";
import { applySecurityHeaders } from "./security";
import { registerAuthProxy } from "./authProxy";

function requestBodyError(error: unknown) {
  if (!error || typeof error !== "object") return null;

  const candidate = error as { status?: unknown; type?: unknown };
  if (candidate.type === "entity.too.large" || candidate.status === 413) {
    return { message: "Request body is too large", status: 413 };
  }

  if (error instanceof SyntaxError && candidate.status === 400) {
    return { message: "Request body contains invalid JSON", status: 400 };
  }

  return null;
}

/**
 * Build only the API portion of the service. Keeping this free of listeners and
 * static middleware allows both the Node server and Vercel Functions to reuse
 * the same validated routes, authentication, throttling, and error handling.
 */
export type ApiAppOptions = {
  requireDatabase?: boolean;
};

export function createApiApp(options: ApiAppOptions = {}) {
  validateProductionEnvironment(undefined, {
    requireDatabase: options.requireDatabase ?? true,
  });
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(applySecurityHeaders);
  app.use(express.json({ limit: "256kb", strict: true }));
  app.use(express.urlencoded({ limit: "32kb", extended: false }));
  registerStorageProxy(app);
  registerAuthProxy(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({ router: appRouter, createContext })
  );

  // Express does not automatically reset a serverless invocation after errors.
  // This final handler provides a concise response without leaking internals.
  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      _next: express.NextFunction
    ) => {
      const bodyError = requestBodyError(error);
      if (response.headersSent) return;

      if (bodyError) {
        response.status(bodyError.status).json({ error: bodyError.message });
        return;
      }

      console.error("[API] Unhandled request error", error);
      response.status(500).json({ error: "Internal server error" });
    }
  );

  return app;
}

