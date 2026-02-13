import { describe, it, expect } from "vitest";
import { process } from "../helpers.js";

describe("steps transform", () => {
  it("adds sl-steps class to ordered list", async () => {
    const md = `<!-- steps -->\n1. First step\n2. Second step\n<!-- /steps -->`;
    const html = await process(md);
    expect(html).toContain('class="sl-steps"');
    expect(html).toContain('role="list"');
  });

  it("preserves list content", async () => {
    const md = `<!-- steps -->\n1. Install\n2. Configure\n3. Run\n<!-- /steps -->`;
    const html = await process(md);
    expect(html).toContain("Install");
    expect(html).toContain("Configure");
    expect(html).toContain("Run");
  });

  it("does not affect unmarked ordered lists", async () => {
    const md = `1. Regular\n2. List`;
    const html = await process(md);
    expect(html).not.toContain("sl-steps");
  });

  it("removes comment markers", async () => {
    const md = `<!-- steps -->\n1. First\n<!-- /steps -->`;
    const html = await process(md);
    expect(html).not.toContain("<!--");
  });
});
