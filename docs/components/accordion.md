---
title: Accordion
description: Styled expandable sections from details/summary
---

Standard `<details>`/`<summary>` elements are automatically styled to match your Starlight theme. No comment markers needed — the GFM construct _is_ the convention.

## Basic usage

<details>
<summary>What is rehype-gfm-components?</summary>

A rehype plugin that transforms standard GFM Markdown into rich documentation components. Write once, render beautifully everywhere.

</details>

<details>
<summary>View Markdown source</summary>

```markdown
<details>
<summary>What is rehype-gfm-components?</summary>

A rehype plugin that transforms standard GFM Markdown
into rich documentation components. Write once, render
beautifully everywhere.

</details>
```

</details>

## Multiple accordions

Stack multiple `<details>` elements for an FAQ-style section.

<details>
<summary>Do I need MDX?</summary>

No. The entire point of this plugin is that you don't. Standard GFM Markdown with HTML comments gives you the same components that MDX imports provide, without coupling your content to a rendering pipeline.

</details>

<details>
<summary>Does it work on GitHub?</summary>

Yes. HTML comments are invisible on GitHub, so your Markdown reads naturally. `<details>`/`<summary>` elements render as native expandable sections.

</details>

<details>
<summary>What about other frameworks?</summary>

The core rehype plugin is framework-agnostic. The Starlight adapter adds icon loading and tab script injection. Adapters for other frameworks are planned.

</details>

<details>
<summary>View Markdown source</summary>

```markdown
<details>
<summary>Do I need MDX?</summary>

No. The entire point of this plugin is that you don't.

</details>

<details>
<summary>Does it work on GitHub?</summary>

Yes. HTML comments are invisible on GitHub.

</details>

<details>
<summary>What about other frameworks?</summary>

The core rehype plugin is framework-agnostic.

</details>
```

</details>

## How it renders

| Context | Rendering |
|---------|-----------|
| GitHub | Native expandable/collapsible section |
| Starlight | Styled accordion with theme-consistent borders, background, and padding |

## Parameters

None. No comment markers are needed. Any `<details>`/`<summary>` element that is _not_ inside a `<!-- tabs -->` block is automatically styled as an accordion.

## HTML output

The HTML structure is unchanged — the plugin adds theme-consistent styling classes:

```html
<details>
  <summary>Question text</summary>
  <p>Answer content</p>
</details>
```
