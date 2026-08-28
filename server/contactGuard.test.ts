import { describe, expect, it } from "vitest";
import { createInquiryGuard, hashInquirySource } from "./contactGuard";

describe("createInquiryGuard", () => {
  it("rejects repeated requests from the same source within the guard window", () => {
    const guard = createInquiryGuard({ limit: 2, windowMs: 60000 });

    guard("visitor-one");
    guard("visitor-one");

    expect(() => guard("visitor-one")).toThrow(
      expect.objectContaining({ code: "TOO_MANY_REQUESTS" })
    );
  });

  it("derives a stable hash without retaining the raw source value", () => {
    const source = "203.0.113.24";
    const hash = hashInquirySource(source);

    expect(hash).toHaveLength(64);
    expect(hash).not.toContain(source);
    expect(hashInquirySource(source)).toBe(hash);
  });
});
