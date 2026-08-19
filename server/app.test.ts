import { createServer } from "node:http";
import { describe, expect, it } from "vitest";
import { apiApp } from "./app";

async function getApplicationStatus(path: string) {
  const server = createServer(apiApp);

  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));

  try {
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Unable to determine the local test server address.");
    }

    const response = await fetch(`http://127.0.0.1:${address.port}${path}`);
    return response.status;
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
    await expect(getApplicationStatus("/api/not-a-route")).resolves.toBe(404);
  });
});
