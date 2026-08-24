import express from "express";
import { createServer, request as httpRequest } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ENV } from "./_core/env";
import { registerAuthProxy } from "./authProxy";

function requestProxy(
  app: express.Express,
  body: unknown
): Promise<{ status: number; json: () => Promise<unknown> }> {
  const server = createServer(app);
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Unable to determine test server address."));
        return;
      }
      const request = httpRequest(
        {
          hostname: "127.0.0.1",
          port: address.port,
          path: "/api/auth/magic-link",
          method: "POST",
          headers: { "content-type": "application/json" },
        },
        response => {
          const chunks: Buffer[] = [];
          response.on("data", chunk => chunks.push(Buffer.from(chunk)));
          response.on("end", () => {
            const text = Buffer.concat(chunks).toString("utf8");
            server.close(error => {
              if (error) reject(error);
              else {
                resolve({
                  status: response.statusCode ?? 0,
                  json: async () => JSON.parse(text),
                });
              }
            });
          });
        }
      );
      request.on("error", reject);
      request.end(JSON.stringify(body));
    });
  });
}

describe("same-origin Auth proxy", () => {
  const originalUrl = ENV.supabaseUrl;
  const originalKey = ENV.supabasePublishableKey;

  afterEach(() => {
    ENV.supabaseUrl = originalUrl;
    ENV.supabasePublishableKey = originalKey;
    vi.restoreAllMocks();
  });

  it("rejects invalid email input without contacting Supabase", async () => {
    const upstream = vi.spyOn(globalThis, "fetch");
    const app = express();
    app.use(express.json());
    registerAuthProxy(app);

    const result = await requestProxy(app, { email: "not-an-email" });

    expect(result.status).toBe(400);
    expect(await result.json()).toEqual({
      error: "Enter a valid email address.",
    });
    expect(upstream).not.toHaveBeenCalled();
  });

  it("forwards a valid invite-only request through the configured project", async () => {
    ENV.supabaseUrl = "https://project.supabase.co";
    ENV.supabasePublishableKey = "sb_publishable_test";
    const upstream = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("", { status: 200 }));
    const app = express();
    app.use(express.json());
    registerAuthProxy(app);

    const result = await requestProxy(app, { email: "Member@Example.com" });
    const [url, options] = upstream.mock.calls[0] ?? [];

    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ accepted: true });
    expect(String(url)).toContain(
      "https://project.supabase.co/auth/v1/otp?redirect_to="
    );
    expect(options?.method).toBe("POST");
    expect(options?.headers).toMatchObject({
      apikey: "sb_publishable_test",
      Authorization: "Bearer sb_publishable_test",
    });
    expect(String(options?.body)).toContain('"create_user":false');
    expect(String(options?.body)).toContain('"email":"member@example.com"');
  });

  it("returns a safe upstream Auth error without leaking response internals", async () => {
    ENV.supabaseUrl = "https://project.supabase.co";
    ENV.supabasePublishableKey = "sb_publishable_test";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "otp_disabled",
          msg: "Signups not allowed for otp",
        }),
        {
          status: 422,
          headers: { "content-type": "application/json" },
        }
      )
    );
    const app = express();
    app.use(express.json());
    registerAuthProxy(app);

    const result = await requestProxy(app, { email: "member@example.com" });

    expect(result.status).toBe(422);
    expect(await result.json()).toEqual({
      error: "Signups not allowed for otp",
    });
  });
});
