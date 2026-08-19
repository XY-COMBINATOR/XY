import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { appRouter, contactInput } from "./routers";
import type { TrpcContext } from "./_core/context";

const projectPath = path.resolve(import.meta.dirname, "..");

/** A public caller is enough to test that validation rejects bad data before persistence. */
function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("contact.submit", () => {
  it("rejects malformed contact data before it can reach the database", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(
      caller.contact.submit({
        name: "A",
        email: "not-an-email",
        message: "too short",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects contact forms that fill the hidden anti-bot field", () => {
    const result = contactInput.safeParse({
      name: "Mantis",
      email: "hello@example.com",
      message: "A legitimate project message that is long enough.",
      website: "bot.example",
    });

    expect(result.success).toBe(false);
  });

  it("prevents non-admin callers from reading stored inquiries", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(caller.contact.list({ limit: 25 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("does not select an unrelated latest record after public contact writes", async () => {
    const databaseSource = await readFile(
      path.join(projectPath, "server/db.ts"),
      "utf8"
    );

    expect(databaseSource).not.toContain("orderBy(desc(contactRequests.id))");
  });
});
