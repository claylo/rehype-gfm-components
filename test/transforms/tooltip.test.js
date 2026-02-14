import { describe, it, expect } from "vitest";
import { process, processWithoutRaw } from "../helpers.js";

describe("tooltip transform", () => {
  it("converts a footnote ref into a gfm-tooltip", async () => {
    const md = [
      "Starlight uses Astro[^1] for building.",
      "",
      "[^1]: Astro is a web framework.",
    ].join("\n");

    const html = await process(md);
    expect(html).toContain('class="gfm-tooltip"');
    expect(html).toContain('class="gfm-tooltip-trigger"');
    expect(html).toContain('class="gfm-tooltip-content"');
    expect(html).toContain('role="tooltip"');
    expect(html).toContain("Astro is a web framework.");
  });

  it("maps multiple footnotes to correct content", async () => {
    const md = [
      "Use Astro[^1] with Starlight[^2] for docs.",
      "",
      "[^1]: Astro is a web framework.",
      "[^2]: Starlight is a docs theme.",
    ].join("\n");

    const html = await process(md);
    expect(html).toContain("Astro is a web framework.");
    expect(html).toContain("Starlight is a docs theme.");
    // Both should become tooltips
    const matches = html.match(/gfm-tooltip-trigger/g);
    expect(matches).toHaveLength(2);
  });

  it("extracts preceding word as trigger text", async () => {
    const md = [
      "Starlight uses Astro[^1] for building.",
      "",
      "[^1]: Astro is a web framework.",
    ].join("\n");

    const html = await process(md);
    // "Astro" should be the trigger word
    expect(html).toMatch(
      /gfm-tooltip-trigger[^>]*>Astro<\/span>/
    );
    // Remaining text "Starlight uses " should be preserved
    expect(html).toContain("Starlight uses ");
  });

  it("strips backref from tooltip content", async () => {
    const md = [
      "Use Astro[^1] today.",
      "",
      "[^1]: A modern web framework.",
    ].join("\n");

    const html = await process(md);
    expect(html).not.toContain("↩");
    expect(html).toContain("A modern web framework.");
  });

  it("preserves footnotes when tooltips option is false", async () => {
    const md = [
      "Use Astro[^1] today.",
      "",
      "[^1]: A web framework.",
    ].join("\n");

    const html = await process(md, { tooltips: false });
    expect(html).not.toContain("gfm-tooltip");
    // Original footnote section should remain
    expect(html).toContain("footnotes");
    expect(html).toContain("user-content-fn-1");
  });

  it("leaves document unchanged when no footnotes exist", async () => {
    const md = "Just a normal paragraph with no footnotes.";
    const html = await process(md);
    expect(html).not.toContain("gfm-tooltip");
    expect(html).toContain("Just a normal paragraph");
  });

  it("works without rehype-raw (Astro pipeline)", async () => {
    const md = [
      "Starlight uses Astro[^1] for building.",
      "",
      "[^1]: Astro is a web framework.",
    ].join("\n");

    const html = await processWithoutRaw(md);
    expect(html).toContain('class="gfm-tooltip"');
    expect(html).toContain("Astro is a web framework.");
    expect(html).not.toContain("footnotes");
  });
});
