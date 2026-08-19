import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/** A public caller is enough to test that validation rejects bad data before persistence. */
function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { ip: "127.0.0.1", socket: { remoteAddress: "127.0.0.1" } } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("contact.submit", () => {
  it("rejects malformed contact data before it can reach the database", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(caller.contact.submit({ name: "A", email: "not-an-email", message: "too short" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("prevents non-admin callers from reading stored inquiries", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(caller.contact.list({ limit: 25 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
