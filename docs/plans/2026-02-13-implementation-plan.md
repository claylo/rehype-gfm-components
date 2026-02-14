# rehype-gfm-components Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a rehype plugin that transforms GFM conventions (HTML comment markers around standard Markdown constructs) into Starlight-compatible rich documentation components.

**Architecture:** Single rehype plugin with modular transforms per component. One HAST tree walk dispatches to transform modules based on comment keywords. A Starlight adapter wraps the rehype plugin as a Starlight plugin, handling icon loading and tab script injection.

**Tech Stack:** Node.js ESM, rehype/hast, unist-util-visit, vitest for testing. No TypeScript for v1 (plain JS with JSDoc).

**Design doc:** `docs/plans/2026-02-13-rehype-gfm-components-design.md`

---

## Phase 1: Foundation

### Task 1: Package scaffolding

**Files:**
- Create: `package.json`
- Create: `vitest.config.js`
- Create: `.gitignore`

**Step 1: Initialize git repo**

```bash
cd /Users/clay/source/claylo/rehype-gfm-components
git init
```

**Step 2: Create package.json**

```json
{
  "name": "rehype-gfm-components",
  "version": "0.0.1",
  "type": "module",
  "description": "Rehype plugin that transforms GFM conventions into rich documentation components",
  "license": "MIT",
  "exports": {
    ".": "./index.js",
    "./starlight": "./adapters/starlight.js"
  },
  "files": [
    "index.js",
    "transforms/",
    "adapters/",
    "scripts/",
    "icons.js"
  ],
  "keywords": ["rehype", "gfm", "starlight", "markdown", "documentation"],
  "peerDependencies": {
    "@astrojs/starlight": ">=0.30.0"
  },
  "peerDependenciesMeta": {
    "@astrojs/starlight": { "optional": true }
  },
  "dependencies": {
    "unist-util-visit": "^5.0.0",
    "hast-util-from-html-isomorphic": "^2.0.0"
  },
  "devDependencies": {
    "rehype": "^13.0.0",
    "rehype-stringify": "^10.0.0",
    "remark-parse": "^11.0.0",
    "remark-gfm": "^4.0.0",
    "remark-rehype": "^11.0.0",
    "unified": "^11.0.0",
    "vitest": "^3.0.0"
  }
}
```

**Step 3: Create vitest.config.js**

```js
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.js"],
  },
});
```

**Step 4: Create .gitignore**

```
node_modules/
coverage/
```

**Step 5: Install dependencies**

```bash
pnpm install
```

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: initial package scaffolding"
```

---

### Task 2: Comment parser utility

Parses HTML comment text into keyword and key:value params.
Input: `" tabs synckey:pkg "` → `{ keyword: "tabs", params: { synckey: "pkg" } }`
Input: `" /tabs "` → `{ keyword: "/tabs", params: {} }`
Input: `" card icon:rocket "` → `{ keyword: "card", params: { icon: "rocket" } }`
Input: `" icon:rocket "` → `{ keyword: "icon", params: { icon: "rocket" } }` (icon is special — the keyword IS a param)
Input: `" badge variant:tip size:medium "` → `{ keyword: "badge", params: { variant: "tip", size: "medium" } }`

**Files:**
- Create: `lib/parse-comment.js`
- Create: `test/parse-comment.test.js`

**Step 1: Write the failing tests**

```js
import { describe, it, expect } from "vitest";
import { parseComment } from "../lib/parse-comment.js";

describe("parseComment", () => {
  it("returns null for non-matching comments", () => {
    expect(parseComment("just a regular comment")).toBe(null);
    expect(parseComment("TODO: fix this")).toBe(null);
    expect(parseComment("")).toBe(null);
  });

  it("parses a bare keyword", () => {
    expect(parseComment(" steps ")).toEqual({
      keyword: "steps",
      params: {},
    });
  });

  it("parses a closing keyword", () => {
    expect(parseComment(" /steps ")).toEqual({
      keyword: "/steps",
      params: {},
    });
  });

  it("parses keyword with params", () => {
    expect(parseComment(" tabs synckey:pkg ")).toEqual({
      keyword: "tabs",
      params: { synckey: "pkg" },
    });
  });

  it("parses keyword with multiple params", () => {
    expect(parseComment(" linkbutton variant:primary icon:right-arrow ")).toEqual({
      keyword: "linkbutton",
      params: { variant: "primary", icon: "right-arrow" },
    });
  });

  it("parses badge with params", () => {
    expect(parseComment(" badge variant:tip size:medium ")).toEqual({
      keyword: "badge",
      params: { variant: "tip", size: "medium" },
    });
  });

  it("parses icon:name as keyword with icon param", () => {
    expect(parseComment(" icon:rocket ")).toEqual({
      keyword: "icon",
      params: { icon: "rocket" },
    });
  });

  it("parses card with icon param", () => {
    expect(parseComment(" card icon:rocket ")).toEqual({
      keyword: "card",
      params: { icon: "rocket" },
    });
  });

  it("trims whitespace", () => {
    expect(parseComment("  steps  ")).toEqual({
      keyword: "steps",
      params: {},
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
pnpm vitest run test/parse-comment.test.js
```

Expected: FAIL (module not found)

**Step 3: Implement**

```js
/**
 * Known component keywords that this plugin handles.
 * @type {Set<string>}
 */
const KEYWORDS = new Set([
  "steps", "/steps",
  "filetree", "/filetree",
  "tabs", "/tabs",
  "card", "cardgrid", "/cardgrid",
  "linkcard", "/linkcard", "linkcards", "/linkcards",
  "linkbutton", "/linkbutton",
  "badge",
  "icon",
]);

/**
 * Parse an HTML comment's text content into a keyword and params.
 * Returns null if the comment doesn't match a known keyword.
 *
 * @param {string} text - The comment text (without <!-- and -->)
 * @returns {{ keyword: string, params: Record<string, string> } | null}
 */
export function parseComment(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const tokens = trimmed.split(/\s+/);
  const first = tokens[0];

  // Check if first token is a known keyword
  if (KEYWORDS.has(first)) {
    const params = {};
    for (let i = 1; i < tokens.length; i++) {
      const colonIdx = tokens[i].indexOf(":");
      if (colonIdx > 0) {
        params[tokens[i].slice(0, colonIdx)] = tokens[i].slice(colonIdx + 1);
      }
    }
    return { keyword: first, params };
  }

  // Check for icon:name pattern (keyword is "icon", param is the name)
  if (first.startsWith("icon:")) {
    return {
      keyword: "icon",
      params: { icon: first.slice(5) },
    };
  }

  return null;
}
```

**Step 4: Run tests**

```bash
pnpm vitest run test/parse-comment.test.js
```

Expected: PASS

**Step 5: Commit**

```bash
git add lib/parse-comment.js test/parse-comment.test.js
git commit -m "feat: comment parser for GFM component markers"
```

---

### Task 3: Core rehype plugin skeleton

Single tree walk, finds comment nodes, dispatches to transforms. For now, just collects comment ranges (opening → closing) without transforming.

**Files:**
- Create: `index.js`
- Create: `lib/collect-ranges.js`
- Create: `test/collect-ranges.test.js`

**Step 1: Write failing test for range collection**

```js
import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { rehypeGfmComponents } from "../index.js";

/** Helper: markdown → HTML through our plugin */
async function process(md) {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeGfmComponents)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(md);
  return String(result);
}

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
    expect(html).not.toContain("steps");
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
pnpm vitest run test/collect-ranges.test.js
```

**Step 3: Implement core plugin**

`lib/collect-ranges.js`:

```js
import { parseComment } from "./parse-comment.js";

/**
 * Opening keywords that expect a closing counterpart.
 * @type {Record<string, string>}
 */
const CLOSERS = {
  steps: "/steps",
  filetree: "/filetree",
  tabs: "/tabs",
  cardgrid: "/cardgrid",
  linkcard: "/linkcard",
  linkcards: "/linkcards",
  linkbutton: "/linkbutton",
};

/**
 * Collect comment-delimited ranges from a parent's children.
 * Returns array of { keyword, params, startIdx, endIdx, children }
 * where startIdx/endIdx are indices in parent.children.
 *
 * For self-closing markers (card, badge, icon), endIdx === startIdx.
 *
 * @param {import('hast').Element | import('hast').Root} parent
 * @returns {Array<{ keyword: string, params: Record<string, string>, startIdx: number, endIdx: number }>}
 */
export function collectRanges(parent) {
  const ranges = [];
  const children = parent.children;
  if (!children) return ranges;

  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    if (node.type !== "comment") continue;

    const parsed = parseComment(node.value);
    if (!parsed) continue;

    const { keyword, params } = parsed;

    // Skip closing comments (they're consumed by their opener)
    if (keyword.startsWith("/")) continue;

    const closer = CLOSERS[keyword];
    if (closer) {
      // Find matching closer
      for (let j = i + 1; j < children.length; j++) {
        const candidate = children[j];
        if (candidate.type !== "comment") continue;
        const candidateParsed = parseComment(candidate.value);
        if (candidateParsed && candidateParsed.keyword === closer) {
          ranges.push({ keyword, params, startIdx: i, endIdx: j });
          break;
        }
      }
    } else {
      // Self-closing marker (card, badge, icon)
      ranges.push({ keyword, params, startIdx: i, endIdx: i });
    }
  }

  return ranges;
}
```

`index.js`:

```js
import { visit } from "unist-util-visit";
import { collectRanges } from "./lib/collect-ranges.js";
import { parseComment } from "./lib/parse-comment.js";

/**
 * @typedef {Object} GfmComponentsOptions
 * @property {string[]} [transforms] - Which transforms to enable (default: all)
 * @property {Record<string, string>} [icons] - Icon name → SVG path string map
 */

/**
 * Rehype plugin that transforms GFM comment markers into rich components.
 *
 * @param {GfmComponentsOptions} [options]
 * @returns {import('unified').Transformer}
 */
export function rehypeGfmComponents(options = {}) {
  const transforms = loadTransforms(options.transforms);

  return (tree) => {
    // Process block-level transforms (in parent contexts)
    visit(tree, (node, _index, parent) => {
      if (!parent || !parent.children) return;

      const ranges = collectRanges(parent);
      if (ranges.length === 0) return;

      // Process ranges in reverse order to preserve indices
      for (let i = ranges.length - 1; i >= 0; i--) {
        const range = ranges[i];
        const transform = transforms[range.keyword];
        if (!transform) continue;

        const { startIdx, endIdx } = range;
        const content = parent.children.slice(startIdx + 1, endIdx);
        const replacement = transform(content, range.params, options);

        if (replacement !== undefined) {
          const removeCount = endIdx - startIdx + 1;
          const replacementNodes = Array.isArray(replacement) ? replacement : [replacement];
          parent.children.splice(startIdx, removeCount, ...replacementNodes);
        }
      }
    });

    // Remove any remaining processed comments
    visit(tree, "comment", (node, index, parent) => {
      if (!parent || index === undefined) return;
      const parsed = parseComment(node.value);
      if (!parsed) return;
      parent.children.splice(index, 1);
      return index; // revisit this index
    });
  };
}

/**
 * Load transform modules based on config.
 * @param {string[]} [enabled]
 * @returns {Record<string, Function>}
 */
function loadTransforms(enabled) {
  // For now return empty — transforms added in subsequent tasks
  return {};
}

export default rehypeGfmComponents;
```

**Step 4: Run tests**

```bash
pnpm vitest run test/collect-ranges.test.js
```

Expected: PASS

**Step 5: Commit**

```bash
git add index.js lib/collect-ranges.js test/collect-ranges.test.js
git commit -m "feat: core rehype plugin skeleton with comment range collection"
```

---

## Phase 2: Simple Transforms

### Task 4: Steps transform

The simplest transform. Find `<ol>` between comment markers, add `sl-steps` class and `role="list"`.

**Files:**
- Create: `transforms/steps.js`
- Create: `test/transforms/steps.test.js`

**Step 1: Write failing test**

```js
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
});
```

Create `test/helpers.js`:

```js
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { rehypeGfmComponents } from "../index.js";

export async function process(md, options = {}) {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeGfmComponents, options)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(md);
  return String(result);
}
```

**Step 2: Run tests — expect failure**

```bash
pnpm vitest run test/transforms/steps.test.js
```

**Step 3: Implement**

`transforms/steps.js`:

```js
/**
 * Steps transform: adds sl-steps class and role="list" to the <ol> element
 * found between <!-- steps --> and <!-- /steps --> markers.
 *
 * @param {import('hast').Node[]} content - Nodes between opening/closing comments
 * @param {Record<string, string>} params - Comment parameters (unused for steps)
 * @returns {import('hast').Node[]}
 */
export function steps(content, params) {
  for (const node of content) {
    if (node.type === "element" && node.tagName === "ol") {
      node.properties = node.properties || {};
      node.properties.className = ["sl-steps"];
      node.properties.role = "list";
    }
  }
  return content;
}
```

Register in `index.js` by importing and adding to the transforms map:

```js
import { steps } from "./transforms/steps.js";

function loadTransforms(enabled) {
  const all = { steps };
  if (!enabled) return all;
  return Object.fromEntries(
    Object.entries(all).filter(([k]) => enabled.includes(k))
  );
}
```

**Step 4: Run tests**

```bash
pnpm vitest run test/transforms/steps.test.js
```

Expected: PASS

**Step 5: Commit**

```bash
git add transforms/steps.js test/transforms/steps.test.js test/helpers.js
git commit -m "feat: steps transform (ol → sl-steps)"
```

---

### Task 5: Badge transform

Inline transform: `<code>` immediately followed by `<!-- badge -->` comment → `<span class="sl-badge">`.

This is different from block transforms — it works on inline siblings within a `<p>` element.

**Files:**
- Create: `transforms/badge.js`
- Create: `test/transforms/badge.test.js`

**Step 1: Write failing test**

```js
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
```

**Step 2: Run tests — expect failure**

**Step 3: Implement**

`transforms/badge.js`:

```js
/**
 * Badge transform: converts <code> immediately followed by a badge comment
 * into a <span class="sl-badge {variant} {size}">.
 *
 * Called differently from block transforms — this operates on inline siblings.
 * The core plugin calls this for each "badge" comment found, passing the
 * preceding sibling.
 *
 * @param {import('hast').Element} codeNode - The preceding <code> element
 * @param {Record<string, string>} params - { variant?, size? }
 * @returns {import('hast').Element}
 */
export function badge(codeNode, params) {
  const variant = params.variant || "default";
  const size = params.size || "small";
  const text =
    codeNode.children?.[0]?.type === "text"
      ? codeNode.children[0].value
      : "";

  return {
    type: "element",
    tagName: "span",
    properties: { className: ["sl-badge", variant, size] },
    children: [{ type: "text", value: text }],
  };
}
```

**Note:** Badge requires special handling in the core plugin because it's an inline transform. The core plugin must scan within `<p>` elements for `<code>` + badge comment patterns. Update `index.js` to add an inline processing pass:

After the block-level transform pass, add:

```js
// Process inline transforms (badge, icon) within paragraph-level content
visit(tree, "element", (node) => {
  if (!node.children) return;
  for (let i = node.children.length - 1; i >= 0; i--) {
    const child = node.children[i];
    if (child.type !== "comment") continue;
    const parsed = parseComment(child.value);
    if (!parsed) continue;

    if (parsed.keyword === "badge" && i > 0) {
      const prev = node.children[i - 1];
      if (prev.type === "element" && prev.tagName === "code") {
        const replacement = transforms.badge?.(prev, parsed.params);
        if (replacement) {
          node.children.splice(i - 1, 2, replacement);
        }
      } else {
        // Remove orphaned badge comment
        node.children.splice(i, 1);
      }
    }
  }
});
```

**Step 4: Run tests**

```bash
pnpm vitest run test/transforms/badge.test.js
```

**Step 5: Commit**

```bash
git add transforms/badge.js test/transforms/badge.test.js index.js
git commit -m "feat: badge transform (inline code → sl-badge)"
```

---

### Task 6: Icon transform

Inline transform: `<!-- icon:name -->` → inline SVG. For now, produces a placeholder `<span>` since actual SVG data comes from the Starlight adapter. The core transform emits a marker element that the adapter can hydrate.

**Files:**
- Create: `transforms/icon.js`
- Create: `test/transforms/icon.test.js`

**Step 1: Write failing test**

```js
import { describe, it, expect } from "vitest";
import { process } from "../helpers.js";

describe("icon transform", () => {
  it("replaces icon comment with an SVG placeholder", async () => {
    const md = "See the <!-- icon:rocket --> launch guide.";
    const html = await process(md);
    expect(html).toContain("data-gfm-icon");
    expect(html).toContain("rocket");
    expect(html).not.toContain("<!--");
  });

  it("renders actual SVG when icon data is provided", async () => {
    const icons = { rocket: '<path d="M1 1"/>' };
    const md = "See the <!-- icon:rocket --> guide.";
    const html = await process(md, { icons });
    expect(html).toContain("<svg");
    expect(html).toContain('d="M1 1"');
  });
});
```

**Step 2: Run tests — expect failure**

**Step 3: Implement**

`transforms/icon.js`:

```js
import { fromHtml } from "hast-util-from-html-isomorphic";

/**
 * Icon transform: replaces <!-- icon:name --> with an inline SVG.
 * If icon SVG data is available in options.icons, renders the full SVG.
 * Otherwise, renders a data attribute placeholder for the adapter to hydrate.
 *
 * @param {Record<string, string>} params - { icon: "name" }
 * @param {Record<string, string>} [icons] - Icon name → SVG inner HTML map
 * @returns {import('hast').Element}
 */
export function icon(params, icons) {
  const name = params.icon;
  if (!name) return null;

  const svgContent = icons?.[name];
  if (svgContent) {
    const fragment = fromHtml(`<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">${svgContent}</svg>`, { fragment: true });
    return fragment.children[0];
  }

  // Placeholder for adapter to hydrate
  return {
    type: "element",
    tagName: "span",
    properties: { "data-gfm-icon": name, ariaHidden: "true" },
    children: [],
  };
}
```

Add inline handling in core plugin for icon comments (similar to badge handling).

**Step 4: Run tests**

```bash
pnpm vitest run test/transforms/icon.test.js
```

**Step 5: Commit**

```bash
git add transforms/icon.js test/transforms/icon.test.js index.js
git commit -m "feat: icon transform (comment → inline SVG)"
```

---

### Task 7: LinkButton transform

Block transform: `<!-- linkbutton variant:X -->` + link + `<!-- /linkbutton -->` → `<a class="sl-link-button">`.

**Files:**
- Create: `transforms/linkbutton.js`
- Create: `test/transforms/linkbutton.test.js`

**Step 1: Write failing test**

```js
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
});
```

**Step 2: Run tests — expect failure**

**Step 3: Implement**

`transforms/linkbutton.js`:

```js
import { visit } from "unist-util-visit";

/**
 * LinkButton transform: finds the <a> inside the content nodes
 * and replaces it with a styled link button.
 *
 * @param {import('hast').Node[]} content
 * @param {Record<string, string>} params - { variant?, icon?, "icon-placement"? }
 * @returns {import('hast').Node[]}
 */
export function linkbutton(content, params) {
  const variant = params.variant || "primary";

  // Find the <a> element in the content (may be inside a <p>)
  let link = null;
  for (const node of content) {
    if (node.type === "element" && node.tagName === "a") {
      link = node;
      break;
    }
    if (node.type === "element" && node.tagName === "p") {
      for (const child of node.children || []) {
        if (child.type === "element" && child.tagName === "a") {
          link = child;
          break;
        }
      }
      if (link) break;
    }
  }

  if (!link) return content;

  link.properties = link.properties || {};
  link.properties.className = ["sl-link-button", "not-content", variant];

  return [link];
}
```

**Step 4: Run tests**

**Step 5: Commit**

```bash
git add transforms/linkbutton.js test/transforms/linkbutton.test.js
git commit -m "feat: linkbutton transform"
```

---

## Phase 3: Medium Transforms

### Task 8: LinkCard and LinkCards transforms

**Files:**
- Create: `transforms/linkcard.js`
- Create: `test/transforms/linkcard.test.js`

**Step 1: Write failing test**

```js
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
});

describe("linkcards transform", () => {
  it("converts list of links to link card grid", async () => {
    const md = `<!-- linkcards -->\n- [API](/api) — API docs\n- [Guide](/guide) — Getting started\n<!-- /linkcards -->`;
    const html = await process(md);
    const cards = html.match(/sl-link-card/g);
    expect(cards).toHaveLength(2);
  });
});
```

**Step 2: Run tests — expect failure**

**Step 3: Implement linkcard transform**

`transforms/linkcard.js`:

```js
/**
 * LinkCard transform: converts a link with em-dash description into
 * a Starlight-style link card.
 *
 * Handles both single (<!-- linkcard -->) and list (<!-- linkcards -->) forms.
 *
 * @param {import('hast').Node[]} content
 * @param {Record<string, string>} params
 * @param {string} keyword - "linkcard" or "linkcards"
 * @returns {import('hast').Node[]}
 */

/** Separator pattern: em dash or spaced hyphen */
const SEP_RE = /\s*[—]\s*|\s+- /;

/**
 * Extract link href, title text, and description from a link element's context.
 */
function extractLinkData(nodes) {
  let href = "";
  let title = "";
  let description = "";

  for (const node of nodes) {
    if (node.type === "element" && node.tagName === "a") {
      href = node.properties?.href || "";
      title = textContent(node);
    } else if (node.type === "text") {
      // Text after the link — contains the separator and description
      const text = node.value;
      const match = text.match(SEP_RE);
      if (match) {
        description = text.slice(match.index + match[0].length).trim();
      }
    }
  }

  return { href, title, description };
}

function textContent(node) {
  if (node.type === "text") return node.value;
  if (node.children) return node.children.map(textContent).join("");
  return "";
}

function makeLinkCard(href, title, description) {
  const children = [
    {
      type: "element",
      tagName: "span",
      properties: { className: ["sl-flex", "stack"] },
      children: [
        {
          type: "element",
          tagName: "a",
          properties: { href },
          children: [
            {
              type: "element",
              tagName: "span",
              properties: { className: ["title"] },
              children: [{ type: "text", value: title }],
            },
          ],
        },
        ...(description
          ? [
              {
                type: "element",
                tagName: "span",
                properties: { className: ["description"] },
                children: [{ type: "text", value: description }],
              },
            ]
          : []),
      ],
    },
  ];

  return {
    type: "element",
    tagName: "div",
    properties: { className: ["sl-link-card"] },
    children,
  };
}

export function linkcard(content, params) {
  // Single linkcard: find the <p> containing an <a> and description text
  for (const node of content) {
    if (node.type === "element" && node.tagName === "p") {
      const { href, title, description } = extractLinkData(node.children);
      if (href && title) {
        return [makeLinkCard(href, title, description)];
      }
    }
  }
  return content;
}

export function linkcards(content, params) {
  const cards = [];

  for (const node of content) {
    if (node.type === "element" && node.tagName === "ul") {
      for (const li of node.children || []) {
        if (li.type !== "element" || li.tagName !== "li") continue;
        // Each <li> may contain a <p> or direct children with <a>
        const searchNodes = li.children?.[0]?.tagName === "p"
          ? li.children[0].children
          : li.children;
        const { href, title, description } = extractLinkData(searchNodes || []);
        if (href && title) {
          cards.push(makeLinkCard(href, title, description));
        }
      }
    }
  }

  return cards.length > 0 ? cards : content;
}
```

**Step 4: Run tests**

**Step 5: Commit**

```bash
git add transforms/linkcard.js test/transforms/linkcard.test.js
git commit -m "feat: linkcard and linkcards transforms"
```

---

### Task 9: Card and CardGrid transforms

**Files:**
- Create: `transforms/card.js`
- Create: `test/transforms/card.test.js`

**Step 1: Write failing test**

```js
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
});

describe("cardgrid transform", () => {
  it("wraps multiple cards in card-grid", async () => {
    const md = `<!-- cardgrid -->\n<!-- card -->\n> **First**\n>\n> Content 1\n\n<!-- card -->\n> **Second**\n>\n> Content 2\n<!-- /cardgrid -->`;
    const html = await process(md);
    expect(html).toContain('class="card-grid"');
    const cards = html.match(/class="card sl-flex"/g);
    expect(cards).toHaveLength(2);
  });
});
```

**Step 2: Run tests — expect failure**

**Step 3: Implement**

`transforms/card.js`:

```js
import { parseComment } from "../lib/parse-comment.js";

function textContent(node) {
  if (node.type === "text") return node.value;
  if (node.children) return node.children.map(textContent).join("");
  return "";
}

/**
 * Build a card element from a blockquote.
 * Extracts bold title from first <p>, rest becomes body.
 */
function makeCard(blockquote, params, options) {
  const bqChildren = (blockquote.children || []).filter(
    (n) => n.type === "element"
  );

  let title = "";
  let bodyChildren = [];

  if (bqChildren.length > 0) {
    const firstP = bqChildren[0];
    // Look for <strong> in first paragraph for title
    if (firstP.tagName === "p") {
      const strong = firstP.children?.find(
        (c) => c.type === "element" && c.tagName === "strong"
      );
      if (strong) {
        title = textContent(strong);
        bodyChildren = bqChildren.slice(1);
      } else {
        bodyChildren = bqChildren;
      }
    } else {
      bodyChildren = bqChildren;
    }
  }

  const titleChildren = [];
  // Icon placeholder (adapter provides actual SVG)
  if (params.icon) {
    titleChildren.push({
      type: "element",
      tagName: "span",
      properties: { "data-gfm-icon": params.icon, className: ["icon"] },
      children: [],
    });
  }
  titleChildren.push({
    type: "element",
    tagName: "span",
    children: [{ type: "text", value: title }],
  });

  return {
    type: "element",
    tagName: "article",
    properties: { className: ["card", "sl-flex"] },
    children: [
      {
        type: "element",
        tagName: "p",
        properties: { className: ["title", "sl-flex"] },
        children: titleChildren,
      },
      {
        type: "element",
        tagName: "div",
        properties: { className: ["body"] },
        children: bodyChildren,
      },
    ],
  };
}

/**
 * Card transform: converts a single <!-- card --> marker + blockquote into a card.
 */
export function card(content, params, options) {
  // content is the nodes after the card comment (self-closing marker)
  // We need the next blockquote sibling
  const blockquote = content.find(
    (n) => n.type === "element" && n.tagName === "blockquote"
  );
  if (!blockquote) return content;

  return [makeCard(blockquote, params, options)];
}

/**
 * CardGrid transform: wraps content between <!-- cardgrid --> markers in a card-grid div.
 * Processes inner <!-- card --> markers.
 */
export function cardgrid(content, params, options) {
  const cards = [];
  let currentParams = {};

  for (let i = 0; i < content.length; i++) {
    const node = content[i];

    // Check for card comment markers
    if (node.type === "comment") {
      const parsed = parseComment(node.value);
      if (parsed && parsed.keyword === "card") {
        currentParams = parsed.params;
        continue;
      }
    }

    // Blockquote after a card marker
    if (node.type === "element" && node.tagName === "blockquote") {
      cards.push(makeCard(node, currentParams, options));
      currentParams = {};
    }
  }

  return [
    {
      type: "element",
      tagName: "div",
      properties: { className: ["card-grid"] },
      children: cards,
    },
  ];
}
```

**Step 4: Run tests**

**Step 5: Commit**

```bash
git add transforms/card.js test/transforms/card.test.js
git commit -m "feat: card and cardgrid transforms"
```

---

## Phase 4: Complex Transforms

### Task 10: Tabs transform

Converts `<details>`/`<summary>` groups between `<!-- tabs -->` markers into `<starlight-tabs>`.

**Files:**
- Create: `transforms/tabs.js`
- Create: `test/transforms/tabs.test.js`

**Step 1: Write failing test**

```js
import { describe, it, expect } from "vitest";
import { process } from "../helpers.js";

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
    expect(html).toMatch(/aria-selected="true"[^>]*>[\s]*A/);
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
});
```

**Step 2: Run tests — expect failure**

**Step 3: Implement**

`transforms/tabs.js`:

```js
let tabCounter = 0;

function getIds() {
  const id = tabCounter++;
  return { panelId: "tab-panel-" + id, tabId: "tab-" + id };
}

function textContent(node) {
  if (node.type === "text") return node.value;
  if (node.children) return node.children.map(textContent).join("");
  return "";
}

/**
 * Find <details> elements in content and extract tabs.
 */
function extractTabs(content) {
  const tabs = [];

  for (const node of content) {
    if (node.type !== "element" || node.tagName !== "details") continue;

    const summary = node.children?.find(
      (c) => c.type === "element" && c.tagName === "summary"
    );
    const label = summary ? textContent(summary).trim() : "";
    const panelContent = (node.children || []).filter(
      (c) => !(c.type === "element" && c.tagName === "summary")
    );

    tabs.push({ label, content: panelContent });
  }

  return tabs;
}

/**
 * Tabs transform: converts <details>/<summary> groups into <starlight-tabs>.
 *
 * @param {import('hast').Node[]} content
 * @param {Record<string, string>} params - { synckey? }
 * @returns {import('hast').Node[]}
 */
export function tabs(content, params) {
  const tabData = extractTabs(content);
  if (tabData.length === 0) return content;

  const tabIds = tabData.map(() => getIds());
  const syncKey = params.synckey;

  // Build tab list
  const tabListItems = tabData.map((tab, idx) => ({
    type: "element",
    tagName: "li",
    properties: { role: "presentation", className: ["tab"] },
    children: [
      {
        type: "element",
        tagName: "a",
        properties: {
          role: "tab",
          href: "#" + tabIds[idx].panelId,
          id: tabIds[idx].tabId,
          "aria-selected": idx === 0 ? "true" : "false",
          tabindex: idx === 0 ? 0 : -1,
        },
        children: [{ type: "text", value: tab.label }],
      },
    ],
  }));

  // Build tab panels
  const panels = tabData.map((tab, idx) => {
    const props = {
      role: "tabpanel",
      id: tabIds[idx].panelId,
      "aria-labelledby": tabIds[idx].tabId,
    };
    if (idx !== 0) props.hidden = true;
    return {
      type: "element",
      tagName: "div",
      properties: props,
      children: tab.content,
    };
  });

  // Assemble <starlight-tabs>
  const starlightTabsProps = {};
  if (syncKey) starlightTabsProps["data-sync-key"] = syncKey;

  const starlightTabs = {
    type: "element",
    tagName: "starlight-tabs",
    properties: starlightTabsProps,
    children: [
      {
        type: "element",
        tagName: "div",
        properties: { className: ["tablist-wrapper", "not-content"] },
        children: [
          {
            type: "element",
            tagName: "ul",
            properties: { role: "tablist" },
            children: tabListItems,
          },
        ],
      },
      ...panels,
      // Add restore element if synced
      ...(syncKey
        ? [
            {
              type: "element",
              tagName: "starlight-tabs-restore",
              properties: {},
              children: [],
            },
          ]
        : []),
    ],
  };

  return [starlightTabs];
}

/** Reset counter between tests */
export function resetTabCounter() {
  tabCounter = 0;
}
```

**Step 4: Run tests**

**Step 5: Commit**

```bash
git add transforms/tabs.js test/transforms/tabs.test.js
git commit -m "feat: tabs transform (details/summary → starlight-tabs)"
```

---

### Task 11: FileTree transform

The most complex transform. Parses a code block's text content into a tree structure, then builds Starlight's `<starlight-file-tree>` HAST output.

**Files:**
- Create: `transforms/filetree.js`
- Create: `lib/parse-tree-text.js`
- Create: `lib/file-tree-icons.js` (bundled Seti icon data — extracted from Starlight)
- Create: `test/transforms/filetree.test.js`
- Create: `test/parse-tree-text.test.js`

**Step 1: Write failing tests for tree text parser**

`test/parse-tree-text.test.js`:

```js
import { describe, it, expect } from "vitest";
import { parseTreeText } from "../lib/parse-tree-text.js";

describe("parseTreeText", () => {
  it("parses indent-based tree", () => {
    const text = `src/
  components/
    Header.astro
  pages/
package.json`;
    const tree = parseTreeText(text);
    expect(tree).toHaveLength(2);
    expect(tree[0].name).toBe("src/");
    expect(tree[0].isDirectory).toBe(true);
    expect(tree[0].children).toHaveLength(2);
    expect(tree[1].name).toBe("package.json");
    expect(tree[1].isDirectory).toBe(false);
  });

  it("parses box-drawing tree", () => {
    const text = `src/
├── components/
│   ├── Header.astro
│   └── Footer.astro
└── package.json`;
    const tree = parseTreeText(text);
    expect(tree).toHaveLength(2);
    expect(tree[0].name).toBe("src/");
    expect(tree[0].children).toHaveLength(2);
  });

  it("parses highlight markers", () => {
    const text = `src/
  Header.astro          # highlight
  Footer.astro          # the footer`;
    const tree = parseTreeText(text);
    expect(tree[0].children[0].highlight).toBe(true);
    expect(tree[0].children[1].highlight).toBe(false);
    expect(tree[0].children[1].comment).toBe("the footer");
  });

  it("handles placeholders", () => {
    const text = `src/
  ...
  index.js`;
    const tree = parseTreeText(text);
    expect(tree[0].children[0].isPlaceholder).toBe(true);
  });
});
```

**Step 2: Run tests — expect failure**

**Step 3: Implement tree text parser**

`lib/parse-tree-text.js`:

```js
/**
 * @typedef {Object} TreeEntry
 * @property {string} name
 * @property {boolean} isDirectory
 * @property {boolean} isPlaceholder
 * @property {boolean} highlight
 * @property {string} comment
 * @property {TreeEntry[]} children
 */

// Box-drawing characters used by `tree` command
const BOX_CHARS = /[│├└─┬┤┌┐┘┴┼╞╡╟╢╤╧╪║═╠╣╩╦╔╗╚╝╬]/g;
const BOX_PREFIX = /^[│├└─┬\s]*/;

/**
 * Parse a text tree representation into a structured tree.
 * Supports both indent-based and box-drawing formats.
 *
 * @param {string} text
 * @returns {TreeEntry[]}
 */
export function parseTreeText(text) {
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];

  // Detect format: box-drawing or indent-based
  const hasBoxChars = lines.some((l) => BOX_CHARS.test(l));

  const entries = lines.map((line) => {
    let cleanLine;
    let depth;

    if (hasBoxChars) {
      // Remove box-drawing characters, calculate depth from original prefix
      const prefix = line.match(BOX_PREFIX)?.[0] || "";
      // Each level is roughly 4 chars of box-drawing prefix
      depth = Math.floor(prefix.replace(/\s+$/, "").length / 4);
      cleanLine = line.replace(BOX_CHARS, "").replace(/^\s+/, "").trim();
    } else {
      // Indent-based: 2 spaces per level
      const stripped = line.replace(/^\s*/, "");
      const indent = line.length - stripped.length;
      depth = Math.floor(indent / 2);
      cleanLine = stripped.trim();
    }

    // Parse the clean line
    const isPlaceholder = /^(\.{3}|…)(\s|$)/.test(cleanLine);
    if (isPlaceholder) {
      return { name: "…", isDirectory: false, isPlaceholder: true, highlight: false, comment: "", children: [], depth };
    }

    // Check for # comments
    let name = cleanLine;
    let comment = "";
    let highlight = false;
    const hashIdx = cleanLine.indexOf("  #");
    if (hashIdx >= 0) {
      name = cleanLine.slice(0, hashIdx).trim();
      const commentText = cleanLine.slice(hashIdx + 3).trim();
      if (commentText === "highlight" || commentText === "!") {
        highlight = true;
      } else {
        comment = commentText;
      }
    }

    // Also support #! at end
    if (name.endsWith(" #!")) {
      name = name.slice(0, -3).trim();
      highlight = true;
    }

    const isDirectory = name.endsWith("/") || false;

    return { name, isDirectory, isPlaceholder: false, highlight, comment, children: [], depth };
  });

  // Build tree from flat list with depth info
  return buildTree(entries);
}

function buildTree(entries) {
  const root = [];
  const stack = [{ children: root, depth: -1 }];

  for (const entry of entries) {
    // Pop stack until we find the parent
    while (stack.length > 1 && stack[stack.length - 1].depth >= entry.depth) {
      stack.pop();
    }

    const parent = stack[stack.length - 1];

    // Items inside a directory at depth N are at depth N+1
    // If the previous item was a directory AND this item is deeper, it's a child
    const node = { ...entry };
    delete node.depth;

    parent.children.push(node);

    // If this is a directory, push it as a potential parent
    if (entry.isDirectory || entry.depth < (entries[entries.indexOf(entry) + 1]?.depth ?? 0)) {
      node.isDirectory = true;
      stack.push({ children: node.children, depth: entry.depth });
    }
  }

  return root;
}
```

**Step 4: Run tree parser tests**

```bash
pnpm vitest run test/parse-tree-text.test.js
```

**Step 5: Write failing test for filetree transform**

```js
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
});
```

**Step 6: Implement filetree transform**

`transforms/filetree.js`:

```js
import { parseTreeText } from "../lib/parse-tree-text.js";

function textContent(node) {
  if (node.type === "text") return node.value;
  if (node.children) return node.children.map(textContent).join("");
  return "";
}

/**
 * Build a <li> for a file entry.
 */
function makeFileEntry(entry) {
  const classes = ["file"];
  if (entry.isPlaceholder) classes.push("empty");

  const innerSpanChildren = [];

  if (entry.isPlaceholder) {
    innerSpanChildren.push({ type: "text", value: "…" });
  } else {
    // Icon placeholder (adapter hydrates with actual SVG)
    innerSpanChildren.push({
      type: "element",
      tagName: "span",
      properties: { "data-gfm-icon": getFileIconName(entry.name), className: ["tree-icon"] },
      children: [],
    });
    innerSpanChildren.push({ type: "text", value: entry.name });
  }

  const entryChildren = [
    {
      type: "element",
      tagName: "span",
      properties: { className: entry.highlight ? ["highlight"] : [] },
      children: innerSpanChildren,
    },
  ];

  // Add comment if present
  if (entry.comment) {
    entryChildren.push({ type: "text", value: " " });
    entryChildren.push({
      type: "element",
      tagName: "span",
      properties: { className: ["comment"] },
      children: [{ type: "text", value: entry.comment }],
    });
  }

  return {
    type: "element",
    tagName: "li",
    properties: { className: classes },
    children: [
      {
        type: "element",
        tagName: "span",
        properties: { className: ["tree-entry"] },
        children: entryChildren,
      },
    ],
  };
}

/**
 * Build a <li> for a directory entry.
 */
function makeDirEntry(entry, dirLabel) {
  const hasChildren = entry.children && entry.children.length > 0;

  const innerSpanChildren = [
    {
      type: "element",
      tagName: "span",
      properties: { "data-gfm-icon": "seti:folder", className: ["tree-icon"] },
      children: [
        {
          type: "element",
          tagName: "span",
          properties: { className: ["sr-only"] },
          children: [{ type: "text", value: dirLabel || "Directory" }],
        },
      ],
    },
    { type: "text", value: entry.name },
  ];

  const summaryNode = {
    type: "element",
    tagName: "summary",
    children: [
      {
        type: "element",
        tagName: "span",
        properties: { className: ["tree-entry"] },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: { className: entry.highlight ? ["highlight"] : [] },
            children: innerSpanChildren,
          },
        ],
      },
    ],
  };

  const childList = {
    type: "element",
    tagName: "ul",
    properties: {},
    children: hasChildren
      ? entry.children.map((child) => makeEntry(child, dirLabel))
      : [
          {
            type: "element",
            tagName: "li",
            properties: { className: ["file", "empty"] },
            children: [
              {
                type: "element",
                tagName: "span",
                properties: { className: ["tree-entry"] },
                children: [
                  {
                    type: "element",
                    tagName: "span",
                    properties: {},
                    children: [{ type: "text", value: "…" }],
                  },
                ],
              },
            ],
          },
        ],
  };

  return {
    type: "element",
    tagName: "li",
    properties: { className: ["directory"] },
    children: [
      {
        type: "element",
        tagName: "details",
        properties: { open: hasChildren },
        children: [summaryNode, childList],
      },
    ],
  };
}

function makeEntry(entry, dirLabel) {
  if (entry.isDirectory) return makeDirEntry(entry, dirLabel);
  return makeFileEntry(entry);
}

/**
 * Simple file icon name resolver based on extension.
 * Returns a string like "seti:typescript" for the adapter to resolve.
 */
function getFileIconName(filename) {
  const ext = filename.includes(".") ? filename.slice(filename.lastIndexOf(".")) : "";
  // Basic mapping — the adapter can override with full Seti icon set
  const extMap = {
    ".js": "seti:javascript",
    ".mjs": "seti:javascript",
    ".ts": "seti:typescript",
    ".tsx": "seti:typescript",
    ".json": "seti:json",
    ".md": "seti:markdown",
    ".mdx": "seti:markdown",
    ".astro": "astro",
    ".css": "seti:css",
    ".html": "seti:html",
    ".yml": "seti:yml",
    ".yaml": "seti:yml",
    ".toml": "seti:config",
    ".rs": "seti:rust",
    ".py": "seti:python",
    ".sh": "seti:shell",
    ".bash": "seti:shell",
  };
  return extMap[ext] || "seti:default";
}

/**
 * FileTree transform: converts a code block (preformatted text) into
 * a Starlight-compatible <starlight-file-tree> structure.
 *
 * @param {import('hast').Node[]} content - Nodes between filetree markers
 * @param {Record<string, string>} params
 * @returns {import('hast').Node[]}
 */
export function filetree(content, params) {
  // Find the <pre><code> block
  let codeText = "";
  for (const node of content) {
    if (node.type === "element" && node.tagName === "pre") {
      const code = node.children?.find(
        (c) => c.type === "element" && c.tagName === "code"
      );
      if (code) {
        codeText = textContent(code);
        break;
      }
    }
  }

  if (!codeText) return content;

  const tree = parseTreeText(codeText);
  if (tree.length === 0) return content;

  const rootList = {
    type: "element",
    tagName: "ul",
    properties: {},
    children: tree.map((entry) => makeEntry(entry)),
  };

  return [
    {
      type: "element",
      tagName: "starlight-file-tree",
      properties: { className: ["not-content"], "data-pagefind-ignore": "" },
      children: [rootList],
    },
  ];
}
```

**Step 7: Run all filetree tests**

```bash
pnpm vitest run test/transforms/filetree.test.js test/parse-tree-text.test.js
```

**Step 8: Commit**

```bash
git add transforms/filetree.js lib/parse-tree-text.js test/transforms/filetree.test.js test/parse-tree-text.test.js
git commit -m "feat: filetree transform (code block → starlight-file-tree)"
```

---

## Phase 5: Starlight Adapter

### Task 12: Tab switching script

Client-side custom element for tab behavior. This is a standalone JS file that gets injected into pages.

**Files:**
- Create: `scripts/tabs.js`
- Create: `test/scripts/tabs.test.js` (basic syntax/structural tests)

**Step 1: Write the script**

`scripts/tabs.js`:

```js
// Tab switching custom element for rehype-gfm-components.
// Compatible with Starlight's <starlight-tabs> structure.
// Guarded against double-registration if Starlight's own Tabs component is also used.

if (!customElements.get("starlight-tabs")) {
  class StarlightTabs extends HTMLElement {
    static #syncedTabs = new Map();

    constructor() {
      super();
      const tablist = this.querySelector('[role="tablist"]');
      if (!tablist) return;

      this.tabs = [...tablist.querySelectorAll('[role="tab"]')];
      this.panels = [...this.querySelectorAll(':scope > [role="tabpanel"]')];
      this._syncKey = this.dataset.syncKey;

      if (this._syncKey) {
        const synced = StarlightTabs.#syncedTabs.get(this._syncKey) || [];
        synced.push(this);
        StarlightTabs.#syncedTabs.set(this._syncKey, synced);
      }

      this.tabs.forEach((tab, i) => {
        tab.addEventListener("click", (e) => {
          e.preventDefault();
          const current = tablist.querySelector('[aria-selected="true"]');
          if (e.currentTarget !== current) this.switchTab(e.currentTarget, i);
        });

        tab.addEventListener("keydown", (e) => {
          const idx = this.tabs.indexOf(e.currentTarget);
          const next =
            e.key === "ArrowLeft" ? idx - 1
            : e.key === "ArrowRight" ? idx + 1
            : e.key === "Home" ? 0
            : e.key === "End" ? this.tabs.length - 1
            : null;
          if (next === null || !this.tabs[next]) return;
          e.preventDefault();
          this.switchTab(this.tabs[next], next);
        });
      });
    }

    switchTab(newTab, index, shouldSync = true) {
      if (!newTab) return;
      const offset = shouldSync ? this.getBoundingClientRect().top : 0;

      this.tabs.forEach((t) => {
        t.setAttribute("aria-selected", "false");
        t.setAttribute("tabindex", "-1");
      });
      this.panels.forEach((p) => { p.hidden = true; });

      const panel = this.panels[index];
      if (panel) panel.hidden = false;
      newTab.removeAttribute("tabindex");
      newTab.setAttribute("aria-selected", "true");

      if (shouldSync) {
        newTab.focus();
        StarlightTabs.#syncTabs(this, newTab);
        window.scrollTo({
          top: window.scrollY + (this.getBoundingClientRect().top - offset),
          behavior: "instant",
        });
      }
    }

    static #syncTabs(emitter, newTab) {
      const key = emitter._syncKey;
      const label = newTab.textContent?.trim();
      if (!key || !label) return;

      const synced = StarlightTabs.#syncedTabs.get(key);
      if (synced) {
        for (const receiver of synced) {
          if (receiver === emitter) continue;
          const idx = receiver.tabs.findIndex((t) => t.textContent?.trim() === label);
          if (idx >= 0) receiver.switchTab(receiver.tabs[idx], idx, false);
        }
      }

      try {
        localStorage.setItem("starlight-synced-tabs__" + key, label);
      } catch {}
    }
  }

  customElements.define("starlight-tabs", StarlightTabs);
}

if (!customElements.get("starlight-tabs-restore")) {
  class StarlightTabsRestore extends HTMLElement {
    connectedCallback() {
      const parent = this.closest("starlight-tabs");
      if (!parent || typeof localStorage === "undefined") return;
      const key = parent.dataset.syncKey;
      if (!key) return;

      let label;
      try {
        label = localStorage.getItem("starlight-synced-tabs__" + key);
      } catch { return; }
      if (!label) return;

      const tabs = [...parent.querySelectorAll('[role="tab"]')];
      const idx = tabs.findIndex((t) => t.textContent?.trim() === label);
      const panels = parent.querySelectorAll(':scope > [role="tabpanel"]');
      const newTab = tabs[idx];
      const newPanel = panels[idx];

      if (idx < 1 || !newTab || !newPanel) return;
      tabs[0]?.setAttribute("aria-selected", "false");
      tabs[0]?.setAttribute("tabindex", "-1");
      panels[0]?.setAttribute("hidden", "true");
      newTab.removeAttribute("tabindex");
      newTab.setAttribute("aria-selected", "true");
      newPanel.removeAttribute("hidden");
    }
  }

  customElements.define("starlight-tabs-restore", StarlightTabsRestore);
}
```

**Step 2: Write basic test (syntax/structure check)**

```js
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

describe("tabs script", () => {
  const script = readFileSync(
    new URL("../../scripts/tabs.js", import.meta.url),
    "utf-8"
  );

  it("is valid JavaScript", () => {
    // Will throw if syntax is invalid
    expect(() => new Function(script)).not.toThrow();
  });

  it("guards against double registration", () => {
    expect(script).toContain('customElements.get("starlight-tabs")');
    expect(script).toContain('customElements.get("starlight-tabs-restore")');
  });

  it("handles keyboard navigation", () => {
    expect(script).toContain("ArrowLeft");
    expect(script).toContain("ArrowRight");
    expect(script).toContain("Home");
    expect(script).toContain("End");
  });
});
```

**Step 3: Run tests**

```bash
pnpm vitest run test/scripts/tabs.test.js
```

**Step 4: Commit**

```bash
git add scripts/tabs.js test/scripts/tabs.test.js
git commit -m "feat: tab-switching custom element script"
```

---

### Task 13: Starlight adapter

Wraps the core rehype plugin as a Starlight plugin. Loads icon data and injects tab script.

**Files:**
- Create: `adapters/starlight.js`
- Create: `lib/load-starlight-icons.js`

**Step 1: Implement icon loader**

`lib/load-starlight-icons.js`:

```js
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Load Starlight icon SVG data from the installed package.
 * Uses readFileSync because this runs during config:setup before Vite is available.
 *
 * @returns {Record<string, string>} icon name → SVG inner HTML
 */
export function loadStarlightIcons() {
  try {
    const starlightPath = dirname(
      import.meta.resolve
        ? import.meta.resolve("@astrojs/starlight")
        : require.resolve("@astrojs/starlight")
    );
    const iconsPath = join(starlightPath, "components", "Icons.ts");
    const iconsSource = readFileSync(iconsPath, "utf-8");

    const icons = {};
    const regex = /['"]([^'"]+)['"]\s*:\s*['"](<[^'"]+)['"]/g;
    let match;
    while ((match = regex.exec(iconsSource)) !== null) {
      icons[match[1]] = match[2];
    }

    // Also try to load file-tree-icons
    try {
      const fileTreeIconsPath = join(
        starlightPath,
        "user-components",
        "file-tree-icons.ts"
      );
      const ftSource = readFileSync(fileTreeIconsPath, "utf-8");
      const ftRegex = /['"]([^'"]+)['"]\s*:\s*['"](<[^'"]+)['"]/g;
      let ftMatch;
      while ((ftMatch = ftRegex.exec(ftSource)) !== null) {
        if (!icons[ftMatch[1]]) {
          icons[ftMatch[1]] = ftMatch[2];
        }
      }
    } catch {
      // file-tree-icons may not exist in older Starlight versions
    }

    return icons;
  } catch (e) {
    console.warn("rehype-gfm-components: Could not load Starlight icons:", e.message);
    return {};
  }
}
```

**Step 2: Implement Starlight adapter**

`adapters/starlight.js`:

```js
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadStarlightIcons } from "../lib/load-starlight-icons.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Starlight plugin wrapper for rehype-gfm-components.
 *
 * @param {Object} [config]
 * @param {string[]} [config.transforms] - Which transforms to enable (default: all)
 * @returns {Object} Starlight plugin
 */
export default function starlightGfmComponents(config = {}) {
  return {
    name: "rehype-gfm-components",
    hooks: {
      "config:setup"({ addIntegration, config: starlightConfig }) {
        const icons = loadStarlightIcons();

        // Load tab script
        const tabScript = readFileSync(
          join(__dirname, "..", "scripts", "tabs.js"),
          "utf-8"
        );

        addIntegration({
          name: "rehype-gfm-components-integration",
          hooks: {
            "astro:config:setup"({ updateConfig, injectScript }) {
              // Import the rehype plugin dynamically to avoid top-level import issues
              import("../index.js").then(({ rehypeGfmComponents }) => {
                updateConfig({
                  markdown: {
                    rehypePlugins: [
                      [rehypeGfmComponents, { ...config, icons }],
                    ],
                  },
                });
              });

              // Inject tab script globally
              injectScript("page", tabScript);
            },
          },
        });
      },
    },
  };
}
```

**Note:** The `updateConfig` approach with async import may need adjustment — test during integration. A synchronous approach might be needed:

```js
"astro:config:setup"({ updateConfig, injectScript }) {
  // rehypeGfmComponents is imported at the top of the adapter
  updateConfig({
    markdown: {
      rehypePlugins: [
        [rehypeGfmComponents, { ...config, icons }],
      ],
    },
  });
  injectScript("page", tabScript);
},
```

**Step 3: Commit**

```bash
git add adapters/starlight.js lib/load-starlight-icons.js
git commit -m "feat: Starlight adapter with icon loading and tab script injection"
```

---

## Phase 6: Integration

### Task 14: Wire all transforms into core plugin

Update `index.js` to import and register all transforms.

**Files:**
- Modify: `index.js`

**Step 1: Update loadTransforms**

```js
import { steps } from "./transforms/steps.js";
import { badge } from "./transforms/badge.js";
import { icon } from "./transforms/icon.js";
import { linkbutton } from "./transforms/linkbutton.js";
import { linkcard, linkcards } from "./transforms/linkcard.js";
import { card, cardgrid } from "./transforms/card.js";
import { tabs } from "./transforms/tabs.js";
import { filetree } from "./transforms/filetree.js";

function loadTransforms(enabled) {
  const all = {
    steps,
    badge,
    icon,
    linkbutton,
    linkcard,
    linkcards,
    card,
    cardgrid,
    tabs,
    filetree,
  };
  if (!enabled) return all;
  return Object.fromEntries(
    Object.entries(all).filter(([k]) => enabled.includes(k))
  );
}
```

**Step 2: Ensure the dispatch logic handles all transform types correctly**

Block transforms (steps, filetree, tabs, cardgrid, linkcard, linkcards, linkbutton): receive `(content, params, options)`.

Self-closing block transforms (card): receive content that follows until next marker.

Inline transforms (badge, icon): handled in the inline processing pass.

**Step 3: Run all tests**

```bash
pnpm vitest run
```

**Step 4: Commit**

```bash
git add index.js
git commit -m "feat: wire all transforms into core plugin"
```

---

### Task 15: Full integration test

End-to-end test: full Markdown document with multiple component types → expected HTML output.

**Files:**
- Create: `test/integration.test.js`

**Step 1: Write integration test**

```js
import { describe, it, expect } from "vitest";
import { process } from "./helpers.js";

describe("integration: full document", () => {
  it("processes a document with multiple component types", async () => {
    const md = `# Getting Started

<!-- steps -->
1. Install the package
2. Configure your project
3. Start developing
<!-- /steps -->

## Package Managers

<!-- tabs synckey:pkg -->
<details open>
<summary>npm</summary>

\`\`\`bash
npm install my-thing
\`\`\`

</details>
<details>
<summary>pnpm</summary>

\`\`\`bash
pnpm add my-thing
\`\`\`

</details>
<!-- /tabs -->

## Project Structure

<!-- filetree -->
\`\`\`
src/
  index.ts          # highlight
  config.ts         # main config
package.json
\`\`\`
<!-- /filetree -->

## Features

<!-- cardgrid -->
<!-- card icon:rocket -->
> **Fast**
>
> Lightning fast builds.

<!-- card icon:puzzle -->
> **Extensible**
>
> Plugin everything.
<!-- /cardgrid -->

## Links

<!-- linkcards -->
- [API Reference](/api) — Full API docs
- [Examples](/examples) — Code examples
<!-- /linkcards -->

## Status

This feature is \`New\`<!-- badge variant:tip --> and ready.

<!-- linkbutton variant:primary -->
[Get Started](/start)
<!-- /linkbutton -->
`;

    const html = await process(md);

    // Steps
    expect(html).toContain('class="sl-steps"');

    // Tabs
    expect(html).toContain("starlight-tabs");
    expect(html).toContain('role="tablist"');
    expect(html).toContain('data-sync-key="pkg"');

    // FileTree
    expect(html).toContain("starlight-file-tree");

    // Cards
    expect(html).toContain("card-grid");
    expect(html).toContain('class="card sl-flex"');

    // LinkCards
    expect(html).toContain("sl-link-card");

    // Badge
    expect(html).toContain("sl-badge");
    expect(html).toContain("tip");

    // LinkButton
    expect(html).toContain("sl-link-button");

    // No leftover comment markers
    expect(html).not.toMatch(/<!--\s*(steps|tabs|filetree|card|linkcard|linkbutton|badge|icon)/);
  });
});
```

**Step 2: Run integration test**

```bash
pnpm vitest run test/integration.test.js
```

**Step 3: Fix any issues found during integration**

**Step 4: Run full test suite**

```bash
pnpm vitest run
```

**Step 5: Commit**

```bash
git add test/integration.test.js
git commit -m "test: full integration test with all component types"
```

---

### Task 16: Wire into claylo-starlight for live testing

Test the plugin in the actual Starlight site.

**Step 1: Link the package**

```bash
cd /Users/clay/source/claylo/rehype-gfm-components
pnpm link --global

cd /Users/clay/source/claylo/claylo-starlight/site
pnpm link --global rehype-gfm-components
```

**Step 2: Update astro.config.mjs to use the adapter**

Replace any direct rehype plugin config with the Starlight plugin:

```js
import starlightGfmComponents from "rehype-gfm-components/starlight";

// In starlight plugins:
plugins: [
  starlightGfmComponents(),
  // existing plugins...
],
```

**Step 3: Create a test page using all conventions**

Create `docs/guides/gfm-components-test.md` with examples of every component type.

**Step 4: Run dev server and verify**

```bash
cd /Users/clay/source/claylo/claylo-starlight/site
pnpm dev
```

**Step 5: Verify on GitHub**

Push the test markdown to a branch and verify it renders cleanly on GitHub.

**Step 6: Commit both repos**

---

## Implementation Notes

### Known Complexities

1. **Card self-closing markers**: The `<!-- card -->` comment doesn't have a closing tag. The transform must consume the next blockquote sibling. Inside a `<!-- cardgrid -->`, multiple cards are delimited by successive `<!-- card -->` comments.

2. **FileTree text parsing**: The most algorithmic piece. Box-drawing characters have variable widths and the depth calculation from prefix length needs careful handling.

3. **Tabs and allowDangerousHtml**: The `<details>/<summary>` GFM construct passes through remark-rehype only with `allowDangerousHtml: true`. Verify this is set in the Astro pipeline (it should be by default in Starlight).

4. **Comment node availability**: HTML comments in Markdown become `comment` nodes in HAST only when `allowDangerousHtml: true` is passed to remark-rehype. If this isn't set, comments are stripped. Need to verify Starlight/Astro's default behavior.

5. **Inline badge proximity**: The `<code>` and badge comment must be adjacent siblings in the same parent element. Markdown rendering may insert whitespace text nodes between them.

### Test Strategy

- Unit tests per transform (pure HAST in → HAST out)
- Parser tests for tree text and comment parsing
- Integration test through full unified pipeline (markdown → HTML)
- Manual testing in Starlight dev server
- Visual verification on GitHub
