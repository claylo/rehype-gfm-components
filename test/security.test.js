import { describe, it, expect } from "vitest";
import { process } from "./helpers.js";

describe("SVG icon XSS prevention", () => {
  it("strips <script> tags from icon SVG content", async () => {
    const icons = { rocket: '<script>alert(1)</script><path d="M1 1"/>' };
    const md = "See <!-- icon:rocket --> here.";
    const html = await process(md, { icons });
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(1)");
    expect(html).toContain("<svg");
    expect(html).toContain('d="M1 1"');
  });

  it("strips event handlers from icon SVG attributes", async () => {
    const icons = { star: '<path d="M2 2" onclick="alert(1)"/>' };
    const md = "A <!-- icon:star --> icon.";
    const html = await process(md, { icons });
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("alert");
    expect(html).toContain('d="M2 2"');
  });

  it("strips foreignObject from icon SVG content", async () => {
    const icons = {
      evil: '<foreignObject><body xmlns="http://www.w3.org/1999/xhtml"><script>alert(1)</script></body></foreignObject>',
    };
    const md = "See <!-- icon:evil --> here.";
    const html = await process(md, { icons });
    expect(html).not.toContain("foreignObject");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert");
  });

  it("strips style elements from icon SVG content", async () => {
    const icons = { styled: "<style>svg{background:url(evil)}</style>" };
    const md = "See <!-- icon:styled --> here.";
    const html = await process(md, { icons });
    expect(html).not.toContain("<style");
    expect(html).not.toContain("background");
  });

  it("strips javascript: hrefs from SVG use elements", async () => {
    const icons = { bad: '<use href="javascript:alert(1)"/>' };
    const md = "See <!-- icon:bad --> here.";
    const html = await process(md, { icons });
    expect(html).not.toContain("javascript:");
  });

  it("preserves safe SVG content through sanitizer", async () => {
    const icons = {
      safe: '<path d="M12 2L2 22h20L12 2z"/><circle cx="12" cy="16" r="1"/>',
    };
    const md = "A <!-- icon:safe --> icon.";
    const html = await process(md, { icons });
    expect(html).toContain("M12 2L2 22h20L12 2z");
    expect(html).toContain("<circle");
  });
});

describe("hydrateIcons XSS prevention", () => {
  it("sanitizes icons injected via data-gfm-icon hydration", async () => {
    const icons = { "right-arrow": '<script>alert(1)</script><path d="M5 12h14"/>' };
    const md = "<!-- linkcard -->\n[Link](/path) — desc\n<!-- /linkcard -->";
    const html = await process(md, { icons });
    expect(html).not.toContain("<script");
    expect(html).toContain('d="M5 12h14"');
  });
});

describe("linkbutton unsafe URL prevention", () => {
  it("neutralizes javascript: URLs", async () => {
    const md = `<!-- linkbutton -->\n[Click](javascript:alert(1))\n<!-- /linkbutton -->`;
    const html = await process(md);
    expect(html).not.toContain("javascript:");
  });

  it("neutralizes JavaScript: URLs (case insensitive)", async () => {
    const md = `<!-- linkbutton -->\n[Click](JavaScript:alert(1))\n<!-- /linkbutton -->`;
    const html = await process(md);
    expect(html).not.toContain("JavaScript:");
    expect(html).not.toContain("javascript:");
  });

  it("neutralizes vbscript: URLs", async () => {
    const md = `<!-- linkbutton -->\n[Click](vbscript:MsgBox)\n<!-- /linkbutton -->`;
    const html = await process(md);
    expect(html).not.toContain("vbscript:");
  });

  it("neutralizes data: URLs", async () => {
    const md = `<!-- linkbutton -->\n[Click](data:text/html,<script>alert(1)</script>)\n<!-- /linkbutton -->`;
    const html = await process(md);
    expect(html).not.toContain("data:text/html");
  });

  it("preserves safe URLs", async () => {
    const md = `<!-- linkbutton -->\n[Click](https://example.com)\n<!-- /linkbutton -->`;
    const html = await process(md);
    expect(html).toContain('href="https://example.com"');
  });

  it("preserves relative URLs", async () => {
    const md = `<!-- linkbutton -->\n[Click](/docs/guide)\n<!-- /linkbutton -->`;
    const html = await process(md);
    expect(html).toContain('href="/docs/guide"');
  });
});

describe("linkcard unsafe URL prevention", () => {
  it("neutralizes javascript: URLs in linkcard", async () => {
    const md = `<!-- linkcard -->\n[Evil](javascript:alert(1)) — description\n<!-- /linkcard -->`;
    const html = await process(md);
    expect(html).not.toContain("javascript:");
  });

  it("neutralizes javascript: URLs in linkcards list", async () => {
    const md = `<!-- linkcards -->\n- [Evil](javascript:alert(1)) — description\n- [Safe](https://safe.com) — safe link\n<!-- /linkcards -->`;
    const html = await process(md);
    expect(html).not.toContain("javascript:");
    expect(html).toContain("https://safe.com");
  });
});
