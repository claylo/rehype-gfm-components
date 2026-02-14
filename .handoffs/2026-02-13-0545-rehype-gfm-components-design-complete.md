# Handoff: rehype-gfm-components — Design Complete, Ready for Implementation

## Current State

A new standalone npm package `rehype-gfm-components` has been designed. The package is a rehype plugin that transforms GFM (GitHub Flavored Markdown) conventions — HTML comment markers around standard Markdown constructs — into rich documentation components compatible with Starlight's HTML/CSS output. The core idea: write Markdown that looks great on GitHub, and it automatically upgrades to Starlight's rich component UI when deployed.

### What's Done

- **Design doc**: `docs/plans/2026-02-13-rehype-gfm-components-design.md` — complete conventions for all 11 components, architecture, Starlight HTML output reference, dependency list, Mintlify component cross-reference
- **Implementation plan**: `docs/plans/2026-02-13-implementation-plan.md` — 16 tasks across 6 phases, TDD structure, full code sketches for every transform
- **Directory created**: `claylo/rehype-gfm-components/` — empty except for docs/plans/

### What's In Progress

Nothing actively in progress. Design and planning phases are complete. Implementation has not started.

### What's NOT Done

- No code written yet — no package.json, no source files, no tests
- Implementation plan needs two additional tasks for Tooltip and Accordion transforms (added to design doc but not yet in implementation plan)
- The implementation plan has detailed code sketches that should be treated as starting points, not copy-paste — the agent implementing should use TDD and verify each transform works

## Next Steps

1. **Initialize the package** — git init, package.json, vitest config, install deps
2. **Execute the implementation plan** — use `superpowers:executing-plans` or `superpowers:subagent-driven-development` to work through the 16 tasks in `docs/plans/2026-02-13-implementation-plan.md`
3. **Add Tooltip transform** (not yet in implementation plan) — transforms GFM footnotes (`[^1]` / `[^1]: definition`) into inline tooltips. Needs ~20 lines of custom CSS. Default on, disable with `tooltips: false`.
4. **Add Accordion transform** (not yet in implementation plan) — auto-styles bare `<details><summary>` elements (not inside `<!-- tabs -->`) with theme-consistent CSS. No comment markers needed.
5. **Wire into claylo-starlight for live testing** — link the package, add to astro.config.mjs, create test page
6. **Consider v2 components** — Columns, Frames, Code Group, Fields (see design doc "Open Questions" section)

## Key Files

| File | Purpose |
|------|---------|
| `docs/plans/2026-02-13-rehype-gfm-components-design.md` | **READ FIRST** — complete design doc with all conventions, architecture, HTML output reference, and Mintlify analysis |
| `docs/plans/2026-02-13-implementation-plan.md` | Detailed implementation plan with 16 TDD tasks, code sketches, and test expectations |

### Related files in the local `claylo-starlight-test` project

| File | Purpose |
|------|---------|
| `../claylo-starlight-test/site/src/integrations/github-alerts/rehype.js` | **Reference implementation** — existing rehype plugin that transforms `> [!NOTE]` blockquotes into Starlight asides. Same pattern this project uses. |
| `../claylo-starlight-test/site/src/integrations/github-alerts/index.js` | **Reference** — Starlight plugin wrapper that loads icons via readFileSync and injects rehype plugin. Same adapter pattern. |
| `../claylo-starlight-test/site/astro.config.mjs` | Current site config — shows how plugins are registered |
| `../../reference/starlight/` | Full Starlight source checkout for reference |

## Gotchas

### HTML comments in HAST require allowDangerousHtml
HTML comments in Markdown become `comment` nodes in HAST only when `allowDangerousHtml: true` is passed to remark-rehype. Astro/Starlight sets this by default, but the test helper must set it too. The implementation plan's test helper already includes this.

### details/summary in GFM needs allowDangerousHtml too
The `<details><summary>` elements used for Tabs pass through the Markdown→HTML pipeline only with dangerous HTML allowed. Same flag.

### Tabs need client-side JS injection
`<starlight-tabs>` is a custom element with keyboard navigation and syncKey persistence. Starlight only loads the JS when the `Tabs.astro` component is imported (Astro's bundler is component-import-driven). Since we bypass Astro components, the Starlight adapter must inject the tab script via `injectScript`. The implementation plan includes a bundled `scripts/tabs.js` with `customElements.get()` guard against double-registration.

### FileTree has NO client-side JS
Unlike Tabs, `<starlight-file-tree>` is purely CSS. The `<details>` expand/collapse is native browser behavior. No script injection needed.

### FileTree input is a code block, not a list
Starlight's MDX FileTree takes an unordered list. Our GFM convention uses a code block (preformatted text from `tree` output or hand-typed). The transform must parse text into a tree structure — the most algorithmic piece of the project. Both indent-based and box-drawing formats are supported.

### Tooltip is the first component needing custom CSS
All other components piggyback on Starlight's existing component styles. Tooltip needs ~20 lines of CSS for positioning and hover behavior. The Starlight adapter should inject this CSS.

### Card is a self-closing marker
`<!-- card -->` doesn't have a matching `<!-- /card -->`. It consumes the next blockquote sibling. Inside `<!-- cardgrid -->`, multiple cards are delimited by successive `<!-- card -->` comments. The core plugin's dispatch logic must handle this differently from paired markers.

### Badge is an inline transform
Unlike all other transforms which operate on block-level siblings, Badge operates inside paragraph content: `<code>` immediately followed by `<!-- badge -->` comment. The core plugin needs a separate inline processing pass.

### Icon data loading
Starlight's icon SVGs aren't exported from the package. They must be read from disk at build time via `readFileSync` + regex extraction from `Icons.ts` and `file-tree-icons.ts`. This is the same pattern the existing github-alerts plugin uses.

## What Worked / Didn't Work

| Approach | Result |
|----------|--------|
| HTML comments as invisible markers | Works perfectly — invisible on GitHub, parseable in HAST |
| `<details><summary>` for Tabs | Works — functional accordion on GitHub, converts to tabs in Starlight |
| GFM footnotes for Tooltips | Designed (not yet implemented) — zero authoring overhead, standard GFM |
| Bare `<details>` for Accordion | Designed (not yet implemented) — no markers needed, auto-detected |
| Code block for FileTree (vs list) | User's preference — `tree | pbcopy` workflow. Requires text parser. |
| Pandoc `{.class}` attribute syntax | NOT GFM — renders as literal text on GitHub. Don't use. |
| `:::directive` syntax (remark-directive) | NOT GFM — renders as literal text on GitHub. Don't use. |
| MDX component imports | The whole thing we're replacing. Don't use. |
| Rehype (not remark) for transforms | Correct approach — operates on HTML AST, avoids Astro path-gating issues |
| Single plugin with modular transforms | Chosen architecture — single tree walk, per-component modules, clean |

## Commands

```bash
cd claylo/rehype-gfm-components

# Nothing to run yet — package not initialized
# First step: follow Task 1 in implementation plan (package scaffolding)

# After scaffolding:
pnpm install
pnpm vitest run          # run all tests
pnpm vitest              # watch mode

# For live testing in claylo-starlight-test:
cd ../claylo-starlight-test/site
pnpm dev                 # dev server at localhost:4321
```
