import { describe, it, expect } from "vitest";
import { process } from "./helpers.js";

describe("rehypeGfmComponents", () => {
  it("passes through content with no markers", async () => {
    const html = await process("# Hello\n\nSome text.");
    expect(html).toContain("<h1>Hello</h1>");
    expect(html).toContain("<p>Some text.</p>");
  });

  it("removes processed comment markers", async () => {
    const md = `<!-- steps -->\n1. First\n2. Second\n<!-- /steps -->`;
    const html = await process(md);
    expect(html).not.toContain("<!--");
  });
});
