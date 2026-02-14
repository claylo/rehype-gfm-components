---
title: Design Document
description: Architecture and GFM conventions for rehype-gfm-components
sidebar:
  order: 2
---

# rehype-gfm-components Design

Write GFM. View it on GitHub. Deploy it with Starlight. The same Markdown file works in both contexts: plain and readable on GitHub, rich and interactive in Starlight.

## Problem

Documentation frameworks like Starlight ship rich components (tabs, cards, steps, file trees) that require MDX imports: `<Tabs>`, `<Card>`, `<Steps>`. This locks content into a rendering pipeline. The Markdown is no longer portable. It's unreadable on GitHub, broken in any other viewer, and coupled to the framework.

GFM already renders well on GitHub. HTML comments are invisible there. We use comments as upgrade markers around standard GFM constructs, and a rehype plugin transforms the HTML output into framework-equivalent rich components.

## Architecture

```
rehype-gfm-components/
  index.js                    # Core rehype plugin (framework-agnostic)
  transforms/                 # One module per component
    steps.js
    filetree.js
    tabs.js
    card.js
    linkcard.js
    linkbutton.js
    badge.js
    icon.js
  adapters/
    starlight.js              # Starlight plugin: icon loading, tab script injection
  scripts/
    tabs.js                   # Lightweight tab-switching custom element
```

### Core rehype plugin (`index.js`)

Multi-pass over the HAST tree. Pass 1 handles block-level transforms (paired and self-closing comment ranges). Pass 2 handles inline transforms (badge, icon within paragraph content). Pass 3 hydrates icon placeholders with SVG content. Pass 4 converts GFM footnotes to inline tooltips. Pass 5 cleans up remaining comment markers. Each pass finds HTML comment nodes, matches against registered component keywords, and dispatches to the appropriate transform module. Framework-agnostic: the transform modules produce HTML structure, and the adapter configures class names and component-specific details.

### Starlight adapter (`adapters/starlight.js`)

A Starlight plugin that:
1. Loads Starlight icon SVG data via `readFileSync` at `config:setup` time
2. Pushes the core rehype plugin into `config.markdown.rehypePlugins`
3. Injects the tab-switching script via `injectScript`
4. Passes icon data and Starlight-specific class mappings to the rehype plugin

### Tab script (`scripts/tabs.js`)

Lightweight custom element (~50 lines) that handles:
- Tab switching (click handler)
- Keyboard navigation (Arrow keys, Home, End)
- syncKey persistence via localStorage

Defines `starlight-tabs` with a `customElements.get()` guard to avoid conflicts if Starlight's own Tabs component is also used.

## Usage

### As a Starlight plugin

```js
import starlightGfmComponents from "rehype-gfm-components/starlight";

export default defineConfig({
  integrations: [
    starlight({
      plugins: [starlightGfmComponents()],
    }),
  ],
});
```

### As a raw rehype plugin (any framework)

```js
import rehypeGfmComponents from "rehype-gfm-components";

export default {
  markdown: {
    rehypePlugins: [rehypeGfmComponents],
  },
};
```

### Optional configuration

```js
starlightGfmComponents({
  // Enable only specific transforms (default: all)
  transforms: ["steps", "tabs", "filetree"],
})
```

## GFM Conventions

All conventions use HTML comments as markers. Comments are invisible on GitHub, so the Markdown reads naturally. Parameters use `key:value` syntax, space-separated.

### Steps

Ordered list wrapped in step markers. Rehype adds `sl-steps` class and `role="list"` to the `<ol>`.

```markdown
<!-- steps -->
1. Install the package
   ```bash
   npm install my-thing
   ```
2. Add the configuration
3. Start the server
<!-- /steps -->
```

| Context | Rendering |
|---------|-----------|
| GitHub | Numbered list |
| Starlight | Styled steps with vertical guide lines |

### FileTree

Code block (preformatted text) wrapped in filetree markers. Supports both indentation-based and Unicode box-drawing (`tree` output) formats.

```markdown
<!-- filetree -->
```
src/
  components/
    Header.astro          # highlight
    Footer.astro          # the footer component
  pages/
    index.astro
package.json
tsconfig.json
```
<!-- /filetree -->
```

Or with `tree` output:

```markdown
<!-- filetree -->
```
src/
├── components/
│   ├── Header.astro      # highlight
│   └── Footer.astro
├── pages/
│   └── index.astro
├── package.json
└── tsconfig.json
```
<!-- /filetree -->
```

Conventions:
- Trailing `/` = directory
- `# highlight` or `#!` = highlighted entry
- `# text` (other than highlight) = comment annotation
- `...` = placeholder for more files
- Both indent-based and box-drawing formats accepted

| Context | Rendering |
|---------|-----------|
| GitHub | Preformatted text block |
| Starlight | Interactive file tree with folder/file icons, expand/collapse |

### Tabs

`<details>`/`<summary>` groups wrapped in tab markers. First `<details open>` becomes the initially selected tab.

```markdown
<!-- tabs synckey:pkg -->
<details open>
<summary>npm</summary>

```bash
npm install my-thing
```

</details>
<details>
<summary>pnpm</summary>

```bash
pnpm add my-thing
```

</details>
<details>
<summary>bun</summary>

```bash
bun add my-thing
```

</details>
<!-- /tabs -->
```

Parameters:
- `synckey:name` - syncs tab selection across the page via localStorage

| Context | Rendering |
|---------|-----------|
| GitHub | Accordion (first section expanded, others collapsed) |
| Starlight | Tab bar with keyboard navigation and sync |

### Card

Blockquote with bold title, wrapped in card marker with optional icon parameter.

```markdown
<!-- card icon:rocket -->
> **Getting Started**
>
> Set up your project in just a few minutes.
```

Parameters:
- `icon:name` - Starlight icon name (optional)

| Context | Rendering |
|---------|-----------|
| GitHub | Blockquote with bold title |
| Starlight | Styled card with icon |

### CardGrid

Multiple cards wrapped in cardgrid markers. Renders as a responsive 2-column grid.

```markdown
<!-- cardgrid -->
<!-- card icon:rocket -->
> **Getting Started**
>
> Set up your project in just a few minutes.

<!-- card icon:puzzle -->
> **Integrations**
>
> Connect with your favorite tools and services.
<!-- /cardgrid -->
```

| Context | Rendering |
|---------|-----------|
| GitHub | Series of blockquotes |
| Starlight | 2-column card grid with cycling accent colors |

### LinkCard

Link with em-dash-separated description. Single or list form.

```markdown
<!-- linkcard -->
[API Reference](/reference/api) — Complete API documentation for all endpoints
<!-- /linkcard -->
```

List form:

```markdown
<!-- linkcards -->
- [API Reference](/reference/api) — Complete API documentation
- [Getting Started](/guides/start) — Set up your first project
- [Configuration](/reference/config) — All configuration options
<!-- /linkcards -->
```

Separator: em dash (`—`) or spaced hyphen (` - `) between title and description.

| Context | Rendering |
|---------|-----------|
| GitHub | Link(s) with description text |
| Starlight | Clickable card(s) with title, description, arrow icon |

### LinkButton

Link wrapped in button markers with variant and icon parameters.

```markdown
<!-- linkbutton variant:primary icon:right-arrow -->
[Get Started](/guides/start)
<!-- /linkbutton -->
```

Parameters:
- `variant:primary|secondary|minimal` (default: `primary`)
- `icon:name` (optional)
- `icon-placement:start|end` (default: `end`)

| Context | Rendering |
|---------|-----------|
| GitHub | Plain link |
| Starlight | Styled button with variant coloring and optional icon |

### Badge

Inline code immediately followed by badge comment. The backtick text becomes the badge label.

```markdown
This feature is `New`<!-- badge variant:tip --> and ready for production.

## Authentication `Beta`<!-- badge variant:caution -->
```

Parameters:
- `variant:default|note|tip|caution|danger|success` (default: `default`)
- `size:small|medium|large` (default: `small`)

| Context | Rendering |
|---------|-----------|
| GitHub | Inline code (`New`, `Beta`) |
| Starlight | Styled badge with variant color |

### Icon

Standalone inline icon via comment. For decorative use where the icon adds visual interest but no critical meaning.

```markdown
See the <!-- icon:rocket --> launch guide for details.
```

For icons that carry meaning (visible on GitHub too):

```markdown
:rocket:<!-- icon:rocket --> Launch your project
```

Parameters:
- `icon:name` - Starlight icon name (required, part of comment keyword)

| Context | Rendering |
|---------|-----------|
| GitHub | Invisible (or emoji if prefixed) |
| Starlight | Inline SVG icon from Starlight's icon set |

### Tooltip (via GFM Footnotes)

Standard GFM footnotes, transformed into inline tooltips. Enabled by default (`tooltips: false` to disable and keep standard footnotes).

```markdown
Starlight uses Astro[^1] under the hood for static site generation.

[^1]: Astro is a web framework focused on content-driven websites.
```

| Context | Rendering |
|---------|-----------|
| GitHub | Footnote reference with footnote section at bottom of page |
| Starlight | Dotted-underline trigger with inline tooltip popup on hover |

Rehype logic: find the `<section class="footnotes">` produced by remark-gfm, build a map of footnote IDs to content, replace each `<sup><a>` reference with a `<span class="gfm-tooltip">` wrapper containing the trigger and a `<span class="gfm-tooltip-content" role="tooltip">`, remove the footnotes section.

This is the one component that requires its own CSS (~20 lines) since Starlight has no built-in tooltip. Uses Starlight's CSS custom properties for colors to match the theme.

### Accordion

Bare `<details><summary>` elements (not inside `<!-- tabs -->`). No comment markers needed — the GFM construct is the convention.

```markdown
<details>
<summary>What is Starlight?</summary>

Starlight is a documentation theme for Astro that provides
components and conventions for building docs sites.

</details>
```

| Context | Rendering |
|---------|-----------|
| GitHub | Native expandable/collapsible section |
| Starlight | Styled accordion with theme-consistent borders, background, padding |

Rehype logic: find `<details>` elements not inside a `<!-- tabs -->` context, add theme-consistent classes. Pure CSS enhancement.

## Starlight HTML Output Reference

Each transform produces the exact HTML structure that Starlight's own Astro components render, so all existing Starlight CSS applies without additional stylesheets.

| Component | Key classes/elements |
|-----------|---------------------|
| Steps | `<ol class="sl-steps" role="list">` |
| FileTree | `<starlight-file-tree class="not-content">` with `<details>` dirs, `.tree-icon` SVGs |
| Tabs | `<starlight-tabs>` with `role="tablist"`, `role="tab"`, `role="tabpanel"`, ARIA |
| Card | `<article class="card sl-flex">` with `.title`, `.body`, `.icon` |
| CardGrid | `<div class="card-grid">` |
| LinkCard | `<div class="sl-link-card">` with `.title`, `.description`, arrow icon |
| LinkButton | `<a class="sl-link-button not-content {variant}">` |
| Badge | `<span class="sl-badge {variant} {size}">` |
| Icon | `<svg viewBox="0 0 24 24" fill="currentColor">` |
| Tooltip | `<span class="gfm-tooltip">` with `.gfm-tooltip-content[role="tooltip"]` |
| Accordion | `<details>` with theme-consistent styling classes |

## Dependencies

### Runtime (peer)

- `@astrojs/starlight` (for Starlight adapter only)

### Direct

- `unist-util-visit` - HAST tree traversal
- `hast-util-from-html-isomorphic` or similar - for constructing HAST nodes

### Minimal additional CSS

Starlight's existing component styles cover all components except Tooltip and Accordion, which need ~30 lines of CSS total (using Starlight's CSS custom properties for colors).

## What Ships for v1

- Core rehype plugin with all 10 transforms (+ tooltip + accordion)
- Starlight adapter (plugin wrapper, icon loader, tab script injection)
- Bundled tab-switching custom element script
- Documentation written in the GFM conventions it defines (dogfooded)

## Open Questions / Future Consideration

### Mintlify Component Analysis

Cross-reference of Mintlify's component set against ours. Components already covered are in v1. The rest are candidates for future versions.

| Mintlify Component | Our Status | Notes |
|---|---|---|
| Tabs | **v1** | `<!-- tabs -->` + details/summary |
| Code groups | **Consider** | Tabs shorthand for adjacent code blocks — auto-labels from language. Less typing than full tabs for the common "npm vs pnpm vs bun" pattern. |
| Steps | **v1** | `<!-- steps -->` + ordered list |
| Columns | **Consider** | Side-by-side layout. `<!-- columns -->` / `<!-- col -->` markers. Clean GFM convention — content just flows vertically on GitHub. |
| Panel | **Skip for now** | Sidebar supplementary content. Niche layout concern. |
| Callouts | **v1** (via github-alerts) | `> [!NOTE]` etc. → Starlight asides. Already implemented separately. |
| Banner | **Skip** | Dismissable page-level announcement. More about site chrome than content components. |
| Badge | **v1** | Inline code + `<!-- badge -->` comment |
| Update | **Skip** | "New/Updated" markers. Variant of Badge — can be done with `<!-- badge variant:tip -->` already. |
| Frames | **Consider** | Image + blockquote caption wrapped in comments. Similar to Typst's `figure`. Convention: `<!-- figure -->` + `![alt](src)` + `> caption` + `<!-- /figure -->`. On GitHub: image with blockquote caption below. In Starlight: styled figure with border and caption. |
| Tooltips | **v1** | GFM footnotes → inline tooltips. No markers needed. |
| Prompt | **Consider** | Copyable AI prompt display. Could be a code block convention like `<!-- prompt -->` + fenced block. Niche but increasingly relevant for AI-adjacent docs. |
| Accordions | **v1** | Bare `<details><summary>` auto-styled. No markers needed. |
| Expandables | **Skip** | Essentially same as Accordion. |
| View | **Skip** | Conditional content based on context. Build-time concern, not a GFM convention. |
| Fields | **Consider** | API parameter definitions. Could map from a GFM table with column conventions (Name, Type, Description). On GitHub: readable table. In Starlight: styled parameter list. |
| Responses | **Consider** | API response documentation. Related to Fields — could be a table or definition-list convention. |
| Examples | **Consider** | Request/response side-by-side. Subset of Columns with API-specific semantics. |
| Cards/Tiles | **v1** | Card, CardGrid, LinkCard |
| Icons | **v1** | `<!-- icon:name -->` + icon params on other components |
| Mermaid diagrams | **Separate concern** | Existing remark-mermaid plugins handle this. Not in scope. |
| Color | **Skip** | Color swatches with hex values. Very niche. |

### Priority candidates for v2

1. **Columns** — highest utility, clean convention, broad use case
2. **Frames** — image captioning is a common docs need
3. **Code Group** — ergonomic shorthand for multi-language code examples
4. **Fields** — useful for API documentation sites

## Future

- Adapters for other documentation frameworks (Docusaurus, VitePress)
- Generic adapter with its own CSS for non-framework use
- Possible remark plugin variant for frameworks with no rehype access
