import { describe, it, expect } from "vitest";
import { process } from "../helpers.js";

describe("linkbutton transform", () => {
  it("wraps link in sl-link-button", async () => {
    const md = `<!-- linkbutton variant:primary -->\n[Get Started](/docs)\n<!-- /linkbutton -->`;
    const html = await process(md);
    expect(html).toContain('class="sl-link-button not-content primary"');
    expect(html).toContain('href="/docs"');
    expect(html).toContain("Get Started");
  });

  it("defaults to primary variant", async () => {
    const md = `<!-- linkbutton -->\n[Click Here](/path)\n<!-- /linkbutton -->`;
    const html = await process(md);
    expect(html).toContain("primary");
  });

  it("supports secondary variant", async () => {
    const md = `<!-- linkbutton variant:secondary -->\n[GitHub](https://github.com)\n<!-- /linkbutton -->`;
    const html = await process(md);
    expect(html).toContain("secondary");
  });

  it("removes comment markers", async () => {
    const md = `<!-- linkbutton -->\n[Link](/path)\n<!-- /linkbutton -->`;
    const html = await process(md);
    expect(html).not.toContain("<!--");
  });
});
