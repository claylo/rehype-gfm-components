import { describe, it, expect } from "vitest";
import { process } from "../helpers.js";

describe("card transform", () => {
  it("converts blockquote with bold title to card", async () => {
    const md = `<!-- card -->\n> **Getting Started**\n>\n> Set up your project.`;
    const html = await process(md);
    expect(html).toContain('class="card sl-flex"');
    expect(html).toContain("Getting Started");
    expect(html).toContain("Set up your project.");
  });

  it("includes icon placeholder when icon param provided", async () => {
    const md = `<!-- card icon:rocket -->\n> **Title**\n>\n> Body text.`;
    const html = await process(md);
    expect(html).toContain('data-gfm-icon="rocket"');
  });

  it("removes comment markers", async () => {
    const md = `<!-- card -->\n> **Title**\n>\n> Body.`;
    const html = await process(md);
    expect(html).not.toContain("<!--");
  });
});

describe("cardgrid transform", () => {
  it("wraps multiple cards in card-grid", async () => {
    const md = `<!-- cardgrid -->\n<!-- card -->\n> **First**\n>\n> Content 1\n\n<!-- card -->\n> **Second**\n>\n> Content 2\n<!-- /cardgrid -->`;
    const html = await process(md);
    expect(html).toContain('class="card-grid"');
    const cards = html.match(/class="card sl-flex"/g);
    expect(cards).toHaveLength(2);
  });

  it("passes icon params to individual cards", async () => {
    const md = `<!-- cardgrid -->\n<!-- card icon:rocket -->\n> **A**\n>\n> body\n\n<!-- card icon:puzzle -->\n> **B**\n>\n> body\n<!-- /cardgrid -->`;
    const html = await process(md);
    expect(html).toContain('data-gfm-icon="rocket"');
    expect(html).toContain('data-gfm-icon="puzzle"');
  });

  it("removes all comment markers", async () => {
    const md = `<!-- cardgrid -->\n<!-- card -->\n> **A**\n>\n> body\n<!-- /cardgrid -->`;
    const html = await process(md);
    expect(html).not.toContain("<!--");
  });
});
