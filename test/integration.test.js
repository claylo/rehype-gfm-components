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
    expect(html).toContain('role="list"');

    // Tabs
    expect(html).toContain("starlight-tabs");
    expect(html).toContain('role="tablist"');
    expect(html).toContain('data-sync-key="pkg"');

    // FileTree
    expect(html).toContain("starlight-file-tree");
    expect(html).toContain("not-content");

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
    expect(html).not.toMatch(
      /<!--\s*(steps|tabs|filetree|card|linkcard|linkbutton|badge|icon)/
    );
  });

  it("leaves non-component comments untouched", async () => {
    const md = `<!-- TODO: fix this later -->\n\nSome content.`;
    const html = await process(md);
    expect(html).toContain("TODO: fix this later");
  });

  it("respects transforms filter option", async () => {
    const md = `<!-- steps -->\n1. First\n<!-- /steps -->\n\n\`New\`<!-- badge variant:tip -->`;
    const html = await process(md, { transforms: ["steps"] });
    expect(html).toContain("sl-steps");
    // Badge should NOT be processed when filtered out
    expect(html).not.toContain("sl-badge");
  });

  it("handles standalone card outside cardgrid", async () => {
    const md = `<!-- card icon:star -->\n> **Title**\n>\n> Some body text.`;
    const html = await process(md);
    expect(html).toContain('class="card sl-flex"');
    expect(html).toContain("Title");
    expect(html).toContain("Some body text.");
  });

  it("handles single linkcard (not list form)", async () => {
    const md = `<!-- linkcard -->\n[Docs](/docs) — Complete documentation\n<!-- /linkcard -->`;
    const html = await process(md);
    expect(html).toContain("sl-link-card");
    expect(html).toContain("Docs");
    expect(html).toContain("Complete documentation");
  });

  it("passes bare details/summary through undisturbed", async () => {
    const md = [
      "<details>",
      "<summary>Click to expand</summary>",
      "",
      "Hidden content here.",
      "",
      "</details>",
    ].join("\n");

    const html = await process(md);
    expect(html).toContain("<details>");
    expect(html).toContain("<summary>");
    expect(html).toContain("Click to expand");
    expect(html).toContain("Hidden content here.");
    // Should NOT be converted to tabs
    expect(html).not.toContain("starlight-tabs");
  });

  it("disables tooltips when tooltips: false", async () => {
    const md = `Astro[^1] is great.\n\n[^1]: A web framework.`;
    const html = await process(md, { tooltips: false });
    // Footnote should remain as a standard GFM footnote link, not a tooltip
    expect(html).not.toContain("data-gfm-tooltip");
    expect(html).toContain("data-footnote-ref");
  });

  it("wraps accordiongroup details in a grouping div", async () => {
    const md = [
      "<!-- accordiongroup -->",
      "<details>",
      "<summary>Question 1</summary>",
      "",
      "Answer 1.",
      "",
      "</details>",
      "<details>",
      "<summary>Question 2</summary>",
      "",
      "Answer 2.",
      "",
      "</details>",
      "<!-- /accordiongroup -->",
    ].join("\n");

    const html = await process(md);
    expect(html).toContain('class="gfm-accordion-group"');
    expect(html).toContain("Question 1");
    expect(html).toContain("Question 2");
    expect(html).toContain("Answer 1.");
    expect(html).toContain("Answer 2.");
    expect(html).not.toContain("starlight-tabs");
  });
});
