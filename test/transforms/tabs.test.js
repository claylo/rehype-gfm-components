import { describe, it, expect } from "vitest";
import { process, processWithoutRaw } from "../helpers.js";

describe("tabs transform", () => {
  it("converts details/summary groups to starlight-tabs", async () => {
    const md = [
      "<!-- tabs -->",
      "<details open>",
      "<summary>npm</summary>",
      "",
      "```bash",
      "npm install",
      "```",
      "",
      "</details>",
      "<details>",
      "<summary>pnpm</summary>",
      "",
      "```bash",
      "pnpm add",
      "```",
      "",
      "</details>",
      "<!-- /tabs -->",
    ].join("\n");

    const html = await process(md);
    expect(html).toContain("starlight-tabs");
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tab"');
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain("npm");
    expect(html).toContain("pnpm");
  });

  it("sets first tab as selected", async () => {
    const md = [
      "<!-- tabs -->",
      "<details open><summary>A</summary>",
      "",
      "Content A",
      "",
      "</details>",
      "<details><summary>B</summary>",
      "",
      "Content B",
      "",
      "</details>",
      "<!-- /tabs -->",
    ].join("\n");

    const html = await process(md);
    expect(html).toContain('aria-selected="true"');
  });

  it("passes synckey as data attribute", async () => {
    const md = [
      "<!-- tabs synckey:pkg -->",
      "<details open><summary>npm</summary>",
      "",
      "content",
      "",
      "</details>",
      "<!-- /tabs -->",
    ].join("\n");

    const html = await process(md);
    expect(html).toContain('data-sync-key="pkg"');
  });

  it("removes comment markers", async () => {
    const md = [
      "<!-- tabs -->",
      "<details open><summary>A</summary>",
      "",
      "text",
      "",
      "</details>",
      "<!-- /tabs -->",
    ].join("\n");

    const html = await process(md);
    expect(html).not.toContain("<!--");
  });

  it("works without rehype-raw (Astro pipeline)", async () => {
    const md = [
      "<!-- tabs synckey:pkg -->",
      "<details open>",
      "<summary>npm</summary>",
      "",
      "```bash",
      "npm install",
      "```",
      "",
      "</details>",
      "<details>",
      "<summary>pnpm</summary>",
      "",
      "```bash",
      "pnpm add",
      "```",
      "",
      "</details>",
      "<!-- /tabs -->",
    ].join("\n");

    const html = await processWithoutRaw(md);
    expect(html).toContain("starlight-tabs");
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tab"');
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain("npm");
    expect(html).toContain("pnpm");
    expect(html).toContain('data-sync-key="pkg"');
  });
});
