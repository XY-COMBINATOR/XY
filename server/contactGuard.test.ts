import { describe, expect, it } from "vitest";
import { createInquiryGuard } from "./contactGuard";

describe("createInquiryGuard", () => {
  it("rejects repeated requests from the same source within the guard window", () => {
    const guard = createInquiryGuard({ limit: 2, windowMs: 60000 });

    guard("visitor-one");
    guard("visitor-one");

    expect(() => guard("visitor-one")).toThrow(expect.objectContaining({ code: "TOO_MANY_REQUESTS" }));
  });
});
