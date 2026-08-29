import { describe, expect, it } from "vitest";
import { assetUrl, assetUrlFromOrigin } from "../client/src/lib/assets";

describe("assetUrlFromOrigin", () => {
  it("keeps the Manus-relative asset path when no external origin is configured", () => {
    expect(assetUrlFromOrigin("/manus-storage/brand.png", undefined)).toBe(
      "/manus-storage/brand.png"
    );
  });

  it("creates a stable CDN URL without duplicate path separators", () => {
    expect(
      assetUrlFromOrigin(
        "/manus-storage/brand.png",
        "https://assets.example.com///"
      )
    ).toBe("https://assets.example.com/manus-storage/brand.png");
  });

  it("uses the published GitHub artwork branch when no deployment override exists", () => {
    expect(assetUrl("/manus-storage/brand.png")).toBe(
      "https://raw.githubusercontent.com/XY-COMBINATOR/XY/gh-pages/manus-storage/brand.png"
    );
  });

  it("resolves local vector assets for known brand paths", () => {
    expect(
      assetUrl("/manus-storage/xy-combinator-brand-mark_8b6de4c4.png")
    ).toBe("/assets/brand-mark.svg");
    expect(assetUrl("/manus-storage/xy-signal-ribbon_df13d9c0.png")).toBe(
      "/assets/signal-ribbon.svg"
    );
  });
});
