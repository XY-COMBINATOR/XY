import { createServer } from "node:http";
import { describe, expect, it } from "vitest";
import { createApiApp } from "./app";

const apiApp = createApiApp();

async function requestApplication(path: string, options?: RequestInit) {
  const server = createServer(apiApp);

  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));

  try {
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Unable to determine the local test server address.");
    }

    return await fetch(`http://127.0.0.1:${address.port}${path}`, options);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close(error => (error ? reject(error) : resolve()))
    );
  }
}

describe("apiApp", () => {
  it("creates a listener-free Express application suitable for serverless runtimes", () => {
    expect(typeof apiApp).toBe("function");
    expect(apiApp.get("trust proxy")).toBe(1);
    expect(apiApp.enabled("x-powered-by")).toBe(false);
  });

  it("returns a 404 for unmatched serverless API paths", async () => {
    const response = await requestApplication("/api/not-a-route");
    expect(response.status).toBe(404);
  });

  it("returns safe client errors for malformed and oversized request bodies", async () => {
    const malformedResponse = await requestApplication("/api/not-a-route", {
      body: "{",
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const oversizedResponse = await requestApplication("/api/not-a-route", {
      body: JSON.stringify({ payload: "x".repeat(300 * 1024) }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    expect(malformedResponse.status).toBe(400);
    expect(oversizedResponse.status).toBe(413);
  });
});
