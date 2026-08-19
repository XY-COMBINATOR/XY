import { describe, expect, it } from "vitest";
import { applySecurityHeaders } from "./security";

function createResponse() {
  const values = new Map<string, string>();
  return {
    values,
    response: { setHeader: (name: string, value: string) => values.set(name, value) },
  };
}

describe("applySecurityHeaders", () => {
  it("sets anti-framing, anti-sniffing, and API no-store protections", () => {
    const { values, response } = createResponse();
    let continued = false;

    applySecurityHeaders({ path: "/api/trpc" } as never, response as never, () => { continued = true; });

    expect(values.get("X-Content-Type-Options")).toBe("nosniff");
    expect(values.get("X-Frame-Options")).toBe("DENY");
    expect(values.get("Cache-Control")).toBe("no-store");
    expect(continued).toBe(true);
  });
});
