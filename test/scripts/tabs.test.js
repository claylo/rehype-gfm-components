import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

describe("tabs script", () => {
  const script = readFileSync(
    new URL("../../scripts/tabs.js", import.meta.url),
    "utf-8"
  );

  it("is valid JavaScript", () => {
    // Will throw if syntax is invalid
    expect(() => new Function(script)).not.toThrow();
  });

  it("guards against double registration", () => {
    expect(script).toContain('customElements.get("starlight-tabs")');
    expect(script).toContain('customElements.get("starlight-tabs-restore")');
  });

  it("handles keyboard navigation", () => {
    expect(script).toContain("ArrowLeft");
    expect(script).toContain("ArrowRight");
    expect(script).toContain("Home");
    expect(script).toContain("End");
  });

  it("supports syncKey persistence", () => {
    expect(script).toContain("localStorage");
    expect(script).toContain("starlight-synced-tabs__");
  });
});
