import { describe, it, expect } from "vitest";
import { parseTreeText } from "../lib/parse-tree-text.js";

describe("parseTreeText", () => {
  it("parses indent-based tree", () => {
    const text = [
      "src/",
      "  components/",
      "    Header.astro",
      "  pages/",
      "package.json",
    ].join("\n");
    const tree = parseTreeText(text);
    expect(tree).toHaveLength(2);
    expect(tree[0].name).toBe("src/");
    expect(tree[0].isDirectory).toBe(true);
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0].name).toBe("components/");
    expect(tree[0].children[0].children).toHaveLength(1);
    expect(tree[0].children[0].children[0].name).toBe("Header.astro");
    expect(tree[0].children[1].name).toBe("pages/");
    expect(tree[1].name).toBe("package.json");
    expect(tree[1].isDirectory).toBe(false);
  });

  it("parses box-drawing tree", () => {
    const text = [
      "src/",
      "├── components/",
      "│   ├── Header.astro",
      "│   └── Footer.astro",
      "└── package.json",
    ].join("\n");
    const tree = parseTreeText(text);
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe("src/");
    expect(tree[0].isDirectory).toBe(true);
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0].name).toBe("components/");
    expect(tree[0].children[0].children).toHaveLength(2);
    expect(tree[0].children[1].name).toBe("package.json");
  });

  it("parses highlight markers", () => {
    const text = [
      "src/",
      "  Header.astro          # highlight",
      "  Footer.astro          # the footer",
    ].join("\n");
    const tree = parseTreeText(text);
    expect(tree[0].children[0].highlight).toBe(true);
    expect(tree[0].children[1].highlight).toBe(false);
    expect(tree[0].children[1].comment).toBe("the footer");
  });

  it("handles placeholders", () => {
    const text = ["src/", "  ...", "  index.js"].join("\n");
    const tree = parseTreeText(text);
    expect(tree[0].children[0].isPlaceholder).toBe(true);
    expect(tree[0].children[0].name).toBe("…");
  });

  it("handles empty directories (trailing slash, no children)", () => {
    const text = ["src/", "  empty-dir/", "  file.js"].join("\n");
    const tree = parseTreeText(text);
    expect(tree[0].children[0].name).toBe("empty-dir/");
    expect(tree[0].children[0].isDirectory).toBe(true);
    expect(tree[0].children[1].name).toBe("file.js");
  });

  it("handles #! highlight shorthand", () => {
    const text = ["src/", "  index.ts #!"].join("\n");
    const tree = parseTreeText(text);
    expect(tree[0].children[0].highlight).toBe(true);
    expect(tree[0].children[0].name).toBe("index.ts");
  });

  it("handles ellipsis character", () => {
    const text = ["src/", "  …"].join("\n");
    const tree = parseTreeText(text);
    expect(tree[0].children[0].isPlaceholder).toBe(true);
  });
});
