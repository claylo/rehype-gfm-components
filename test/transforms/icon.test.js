import { describe, it, expect } from "vitest";
import { process } from "../helpers.js";

describe("icon transform", () => {
  it("replaces icon comment with a placeholder span", async () => {
    const md = "See the <!-- icon:rocket --> launch guide.";
    const html = await process(md);
    expect(html).toContain('data-gfm-icon="rocket"');
    expect(html).not.toContain("<!--");
  });

  it("renders actual SVG when icon data is provided", async () => {
    const icons = { rocket: '<path d="M1 1"/>' };
    const md = "See the <!-- icon:rocket --> guide.";
    const html = await process(md, { icons });
    expect(html).toContain("<svg");
    expect(html).toContain('d="M1 1"');
  });

  it("handles icon with no matching data gracefully", async () => {
    const icons = { star: '<path d="M2 2"/>' };
    const md = "A <!-- icon:rocket --> icon.";
    const html = await process(md, { icons });
    expect(html).toContain('data-gfm-icon="rocket"');
    expect(html).not.toContain("<svg");
  });
});
