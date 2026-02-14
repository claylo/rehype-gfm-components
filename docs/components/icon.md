---
title: Icon
description: Inline SVG icons from Starlight's icon set
---

An inline comment renders a Starlight icon as an SVG. On GitHub the comment is invisible. In Starlight it's an inline icon.

## Basic usage

See the <!-- icon:rocket --> launch guide for details.

<details>
<summary>View Markdown source</summary>

```markdown
See the <!-- icon:rocket --> launch guide for details.
```

</details>

## With emoji fallback

For icons that should be visible on GitHub too, prefix with an emoji. The comment replaces the emoji in Starlight.

:rocket:<!-- icon:rocket --> Launch your project

:star:<!-- icon:star --> Featured content

<details>
<summary>View Markdown source</summary>

```markdown
:rocket:<!-- icon:rocket --> Launch your project

:star:<!-- icon:star --> Featured content
```

</details>

## How it renders

| Context | Rendering |
|---------|-----------|
| GitHub | Invisible (or emoji if prefixed) |
| Starlight | Inline SVG icon matching the surrounding text size |

## Parameters

The icon name is part of the comment keyword itself:

```markdown
<!-- icon:name -->
```

Any icon from [Starlight's icon set](https://starlight.astro.build/reference/icons/) is available.

## HTML output

```html
<svg aria-hidden="true" width="16" height="16"
     viewBox="0 0 24 24" fill="currentColor">
  <path d="..."/>
</svg>
```
