---
title: Link Cards
description: Clickable cards with title, description, and arrow icon
---

A link with an em-dash-separated description, wrapped in linkcard markers. On GitHub it's a link with text. In Starlight it's a clickable card.

## Single link card

<!-- linkcard -->
[API Reference](/components/) — Complete documentation for all components
<!-- /linkcard -->

<details>
<summary>View Markdown source</summary>

```markdown
<!-- linkcard -->
[API Reference](/components/) — Complete documentation for all components
<!-- /linkcard -->
```

</details>

## Multiple link cards

Use `<!-- linkcards -->` (plural) with a Markdown list for a set of link cards.

<!-- linkcards -->
- [Steps](/components/steps/) — Numbered instructions with guide lines
- [Tabs](/components/tabs/) — Switchable tabbed views
- [File Tree](/components/filetree/) — Interactive file tree from code blocks
<!-- /linkcards -->

<details>
<summary>View Markdown source</summary>

```markdown
<!-- linkcards -->
- [Steps](/components/steps/) — Numbered instructions with guide lines
- [Tabs](/components/tabs/) — Switchable tabbed views
- [File Tree](/components/filetree/) — Interactive file tree from code blocks
<!-- /linkcards -->
```

</details>

## Separator formats

Both em dash and spaced hyphen work as separators between title and description.

```markdown
[Title](/path) — Description with em dash
[Title](/path) - Description with spaced hyphen
```

## How it renders

| Context | Rendering |
|---------|-----------|
| GitHub | Plain link(s) with description text |
| Starlight | Clickable card(s) with title, description, and arrow icon |

## Parameters

None. The `<!-- linkcard -->` and `<!-- linkcards -->` markers take no parameters.

## HTML output

```html
<div class="sl-link-card">
  <span class="sl-flex stack">
    <a href="/path">
      <span class="title">API Reference</span>
    </a>
    <span class="description">Complete documentation</span>
  </span>
  <svg class="icon">...</svg>
</div>
```
