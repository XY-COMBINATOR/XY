import { describe, expect, it } from "vitest";
import { assetUrlFromOrigin } from "../client/src/lib/assets";

describe("assetUrlFromOrigin", () => {
  it("keeps the Manus-relative asset path when no external origin is configured", () => {
    expect(assetUrlFromOrigin("/manus-storage/brand.png", undefined)).toBe(
      "/manus-storage/brand.png"
    );
  });

  it("creates a stable CDN URL without duplicate path separators", () => {
    expect(
      assetUrlFromOrigin("/manus-storage/brand.png", "https://assets.example.com///")
    ).toBe("https://assets.example.com/manus-storage/brand.png");
  });
});
