---
title: Tooltips
description: Inline tooltips from GFM footnotes
---

Standard GFM footnotes are automatically transformed into inline tooltips. No comment markers needed — write footnotes normally and they become hover tooltips in Starlight.

## Basic usage

Starlight uses Astro[^1] under the hood for static site generation. The plugin transforms GFM[^2] conventions into rich components.

[^1]: Astro is a web framework focused on content-driven websites with an islands architecture.
[^2]: GitHub Flavored Markdown — the Markdown dialect used on GitHub.

<details>
<summary>View Markdown source</summary>

```markdown
Starlight uses Astro[^1] under the hood for static site generation.
The plugin transforms GFM[^2] conventions into rich components.

[^1]: Astro is a web framework focused on content-driven websites
      with an islands architecture.
[^2]: GitHub Flavored Markdown — the Markdown dialect used on GitHub.
```

</details>

## How it renders

| Context | Rendering |
|---------|-----------|
| GitHub | Footnote reference with footnote section at bottom of page |
| Starlight | Dotted-underline trigger with inline tooltip popup on hover |

## Parameters

None. Tooltips are enabled by default. To disable and keep standard footnotes:

```js
rehypeGfmComponents({ tooltips: false })
```

## Styling

Tooltips use ~20 lines of CSS with Starlight's CSS custom properties for theme-consistent colors. The styles are included in the bundled `styles/starlight.css`.

## HTML output

Each footnote reference becomes:

```html
<span class="gfm-tooltip">
  <span class="gfm-tooltip-trigger" tabindex="0">Astro</span>
  <span class="gfm-tooltip-content" role="tooltip">
    Astro is a web framework focused on content-driven websites.
  </span>
</span>
```

The footnotes section at the bottom of the page is removed.
