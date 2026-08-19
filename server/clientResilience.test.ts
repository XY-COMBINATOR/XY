import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { apiFailureMessage, isApiTimeout } from "../client/src/lib/apiFailure";

const projectPath = path.resolve(import.meta.dirname, "..");

describe("client API recovery messaging", () => {
  it("identifies aborted and timed-out requests without leaking technical details", () => {
    expect(isApiTimeout(new DOMException("The request timed out", "TimeoutError"))).toBe(true);
    expect(apiFailureMessage(new DOMException("The request timed out", "TimeoutError"))).toContain(
      "taking longer than expected"
    );
  });

  it("offers a connection recovery message for other request failures", () => {
    expect(apiFailureMessage(new Error("Internal Server Error"))).toContain("Check your connection");
  });
});

describe("client resilience views", () => {
  it("uses an editorial skeleton as the lazy-route fallback", async () => {
    const appSource = await readFile(path.join(projectPath, "client/src/App.tsx"), "utf8");
    const skeletonSource = await readFile(
      path.join(projectPath, "client/src/components/RouteLoadingSkeleton.tsx"),
      "utf8"
    );

    expect(appSource).toContain("fallback={<RouteLoadingSkeleton />}");
    expect(skeletonSource).toContain('aria-busy="true"');
  });

  it("ships recovery actions for API failures, render errors, and unmatched routes", async () => {
    const contactSource = await readFile(path.join(projectPath, "client/src/pages/Contact.tsx"), "utf8");
    const boundarySource = await readFile(
      path.join(projectPath, "client/src/components/ErrorBoundary.tsx"),
      "utf8"
    );
    const notFoundSource = await readFile(
      path.join(projectPath, "client/src/pages/NotFound.tsx"),
      "utf8"
    );
    const dashboardSource = await readFile(
      path.join(projectPath, "client/src/pages/Dashboard.tsx"),
      "utf8"
    );
    const apiNoticeSource = await readFile(
      path.join(projectPath, "client/src/components/ApiRecoveryNotice.tsx"),
      "utf8"
    );

    expect(contactSource).toContain("handleRetry");
    expect(boundarySource).toContain("Try again");
    expect(notFoundSource).toContain("COORDINATE NOT FOUND");
    expect(dashboardSource).toContain("DashboardLayout");
    expect(apiNoticeSource).toContain("resetQueries");
  });
});
