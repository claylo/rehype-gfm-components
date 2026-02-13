import { describe, it, expect } from "vitest";
import { process } from "../helpers.js";

describe("linkcard transform", () => {
  it("converts single link + description to sl-link-card", async () => {
    const md = `<!-- linkcard -->\n[API Reference](/api) — Full documentation\n<!-- /linkcard -->`;
    const html = await process(md);
    expect(html).toContain('class="sl-link-card"');
    expect(html).toContain('href="/api"');
    expect(html).toContain("API Reference");
    expect(html).toContain("Full documentation");
  });

  it("supports spaced-hyphen separator", async () => {
    const md = `<!-- linkcard -->\n[Guide](/guide) - Getting started\n<!-- /linkcard -->`;
    const html = await process(md);
    expect(html).toContain("sl-link-card");
    expect(html).toContain("Getting started");
  });

  it("removes comment markers", async () => {
    const md = `<!-- linkcard -->\n[Link](/path) — desc\n<!-- /linkcard -->`;
    const html = await process(md);
    expect(html).not.toContain("<!--");
  });

  it("handles link without description", async () => {
    const md = `<!-- linkcard -->\n[Just a link](/path)\n<!-- /linkcard -->`;
    const html = await process(md);
    expect(html).toContain("sl-link-card");
    expect(html).toContain("Just a link");
  });
});

describe("linkcards transform", () => {
  it("converts list of links to link card set", async () => {
    const md = `<!-- linkcards -->\n- [API](/api) — API docs\n- [Guide](/guide) — Getting started\n<!-- /linkcards -->`;
    const html = await process(md);
    const cards = html.match(/sl-link-card/g);
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });

  it("extracts descriptions from list items", async () => {
    const md = `<!-- linkcards -->\n- [First](/a) — Description A\n- [Second](/b) — Description B\n<!-- /linkcards -->`;
    const html = await process(md);
    expect(html).toContain("Description A");
    expect(html).toContain("Description B");
  });
});
