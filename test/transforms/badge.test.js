import { describe, it, expect } from "vitest";
import { process } from "../helpers.js";

describe("badge transform", () => {
  it("converts inline code + badge comment to sl-badge", async () => {
    const md = "This is `New`<!-- badge variant:tip --> feature.";
    const html = await process(md);
    expect(html).toContain('<span class="sl-badge tip small">New</span>');
    expect(html).not.toContain("<code>");
  });

  it("uses default variant and size", async () => {
    const md = "Status: `Active`<!-- badge -->";
    const html = await process(md);
    expect(html).toContain('<span class="sl-badge default small">Active</span>');
  });

  it("supports size parameter", async () => {
    const md = "`Important`<!-- badge variant:danger size:large -->";
    const html = await process(md);
    expect(html).toContain("sl-badge danger large");
  });

  it("does not affect unmarked inline code", async () => {
    const md = "Use `npm install` to install.";
    const html = await process(md);
    expect(html).toContain("<code>npm install</code>");
  });
});
