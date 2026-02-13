import { describe, it, expect } from "vitest";
import { process } from "../helpers.js";

describe("filetree transform", () => {
  it("converts code block to starlight-file-tree", async () => {
    const md = [
      "<!-- filetree -->",
      "```",
      "src/",
      "  components/",
      "    Header.astro",
      "  pages/",
      "package.json",
      "```",
      "<!-- /filetree -->",
    ].join("\n");

    const html = await process(md);
    expect(html).toContain("starlight-file-tree");
    expect(html).toContain("not-content");
    expect(html).toContain("directory");
    expect(html).toContain("file");
    expect(html).toContain("Header.astro");
  });

  it("supports highlight markers", async () => {
    const md = [
      "<!-- filetree -->",
      "```",
      "src/",
      "  index.ts          # highlight",
      "```",
      "<!-- /filetree -->",
    ].join("\n");

    const html = await process(md);
    expect(html).toContain("highlight");
  });

  it("supports placeholders", async () => {
    const md = [
      "<!-- filetree -->",
      "```",
      "src/",
      "  ...",
      "```",
      "<!-- /filetree -->",
    ].join("\n");

    const html = await process(md);
    expect(html).toContain("empty");
  });

  it("supports file comments", async () => {
    const md = [
      "<!-- filetree -->",
      "```",
      "src/",
      "  config.ts  # main config file",
      "```",
      "<!-- /filetree -->",
    ].join("\n");

    const html = await process(md);
    expect(html).toContain("main config file");
    expect(html).toContain("comment");
  });

  it("removes comment markers", async () => {
    const md = [
      "<!-- filetree -->",
      "```",
      "src/",
      "```",
      "<!-- /filetree -->",
    ].join("\n");

    const html = await process(md);
    expect(html).not.toContain("<!--");
  });

  it("generates directories with details/summary", async () => {
    const md = [
      "<!-- filetree -->",
      "```",
      "src/",
      "  index.ts",
      "```",
      "<!-- /filetree -->",
    ].join("\n");

    const html = await process(md);
    expect(html).toContain("<details");
    expect(html).toContain("<summary");
  });
});
