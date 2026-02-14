---
title: All-the-Things Demo
description: Testing all rehype-gfm-components transforms
---

This page tests every GFM convention. On GitHub this renders as plain,
readable Markdown. In Starlight it upgrades to rich interactive components.

## Steps

<!-- steps -->
1. Install the package
   ```bash
   pnpm add rehype-gfm-components
   ```
2. Add the Starlight plugin to your config
3. Write Markdown using GFM conventions
4. Deploy — components render automatically
<!-- /steps -->

## Package Managers

<!-- tabs synckey:pkg -->
<details open>
<summary>npm</summary>

```bash
npm install rehype-gfm-components
```

</details>
<details>
<summary>pnpm</summary>

```bash
pnpm add rehype-gfm-components
```

</details>
<details>
<summary>bun</summary>

```bash
bun add rehype-gfm-components
```

</details>
<!-- /tabs -->

## Project Structure

<!-- filetree -->
```
rehype-gfm-components/
  index.js              # highlight
  transforms/
    steps.js
    badge.js
    icon.js
    tabs.js
    filetree.js
    card.js
    linkcard.js
    linkbutton.js
  adapters/
    starlight.js        # Starlight plugin wrapper
  scripts/
    tabs.js             # client-side tab switching
  lib/
    parse-comment.js
    parse-tree-text.js
    collect-ranges.js
  test/
    ...
  package.json
```
<!-- /filetree -->

## Feature Cards

<!-- cardgrid -->
<!-- card icon:rocket -->
> **Zero MDX Required**
>
> Write standard GFM Markdown. No imports, no components,
> no framework lock-in.

<!-- card icon:puzzle -->
> **GitHub Compatible**
>
> Every page renders cleanly on GitHub. HTML comments are
> invisible, details/summary is native.

<!-- card icon:star -->
> **Full Starlight Integration**
>
> Tabs, cards, steps, file trees — all using Starlight's
> own CSS. No extra stylesheets needed.
<!-- /cardgrid -->

## Standalone Card

<!-- card icon:information -->
> **How It Works**
>
> HTML comments (`<!-- steps -->`) act as invisible markers around
> standard GFM constructs. A rehype plugin transforms the HTML output
> into Starlight-compatible rich components during the build.

## Quick Links

<!-- linkcards -->
- [API Reference](/reference/api) — Complete API documentation
- [Getting Started](/guides/installation) — Set up your first project
<!-- /linkcards -->

## Single Link Card

<!-- linkcard -->
[Configuration Reference](/reference/config) — All configuration options explained
<!-- /linkcard -->

## Badges

This feature is `New`<!-- badge variant:tip --> and ready for production.

The API is `Stable`<!-- badge variant:note --> with full backwards compatibility.

Authentication is `Beta`<!-- badge variant:caution --> — expect changes.

## Link Button

<!-- linkbutton variant:primary -->
[Get Started](/guides/installation)
<!-- /linkbutton -->

<!-- linkbutton variant:secondary -->
[View on GitHub](https://github.com/claylo/rehype-gfm-components)
<!-- /linkbutton -->

## Tooltips

GFM footnotes become inline hover tooltips. Hover or focus the
underlined word to see the definition.

This plugin is built on Astro[^1] and integrates with Starlight[^2]
for documentation sites. It uses rehype[^3] under the hood.

[^1]: Astro is a modern web framework for content-driven sites.
[^2]: Starlight is Astro's official documentation theme.
[^3]: rehype is an HTML processor powered by plugins, part of the unified ecosystem.

## Accordion Group

Group related `<details>` with `<!-- accordiongroup -->` for a unified
card with dividers.

<!-- accordiongroup -->
<details>
<summary>What formats are supported?</summary>

Markdown, MDX, and plain HTML all work. The plugin operates at the
rehype (HTML) level, so any input that produces valid HAST is supported.

</details>

<details>
<summary>Do I need to install extra CSS?</summary>

No. The Starlight adapter injects all necessary styles automatically.
Standalone users can import `rehype-gfm-components/styles/starlight.css`.

</details>

<details>
<summary>Is this compatible with GitHub rendering?</summary>

Yes. Footnotes render as standard GFM footnotes on GitHub, and
`<details>` / `<summary>` is natively supported in GitHub Markdown.

</details>
<!-- /accordiongroup -->

## Standalone Accordion

A single unwrapped `<details>` still gets basic styling.

<details>
<summary>Click to expand</summary>

This is a standalone accordion without the group wrapper.

</details>
