---
title: Link Button
description: Styled button links with variant coloring
---

Wrap a link in linkbutton markers to render it as a styled button. On GitHub it's a plain link. In Starlight it's a button with variant coloring.

## Basic usage

<!-- linkbutton -->
[Get Started](/components/)
<!-- /linkbutton -->

<details>
<summary>View Markdown source</summary>

```markdown
<!-- linkbutton -->
[Get Started](/components/)
<!-- /linkbutton -->
```

</details>

## Variants

<!-- linkbutton variant:primary -->
[Primary](/components/)
<!-- /linkbutton -->

<!-- linkbutton variant:secondary -->
[Secondary](/components/)
<!-- /linkbutton -->

<!-- linkbutton variant:minimal -->
[Minimal](/components/)
<!-- /linkbutton -->

<details>
<summary>View Markdown source</summary>

```markdown
<!-- linkbutton variant:primary -->
[Primary](/components/)
<!-- /linkbutton -->

<!-- linkbutton variant:secondary -->
[Secondary](/components/)
<!-- /linkbutton -->

<!-- linkbutton variant:minimal -->
[Minimal](/components/)
<!-- /linkbutton -->
```

</details>

## With icon

<!-- linkbutton variant:primary icon:right-arrow -->
[Get Started](/components/)
<!-- /linkbutton -->

<!-- linkbutton variant:secondary icon:external icon-placement:start -->
[View on GitHub](https://github.com/claylo/rehype-gfm-components)
<!-- /linkbutton -->

<details>
<summary>View Markdown source</summary>

```markdown
<!-- linkbutton variant:primary icon:right-arrow -->
[Get Started](/components/)
<!-- /linkbutton -->

<!-- linkbutton variant:secondary icon:external icon-placement:start -->
[View on GitHub](https://github.com/claylo/rehype-gfm-components)
<!-- /linkbutton -->
```

</details>

## How it renders

| Context | Rendering |
|---------|-----------|
| GitHub | Plain link |
| Starlight | Styled button with variant coloring and optional icon |

## Parameters

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `variant` | `primary`, `secondary`, `minimal` | `primary` | Button style variant |
| `icon` | Starlight icon name | none | Icon to display alongside the label |
| `icon-placement` | `start`, `end` | `end` | Icon position relative to the label |

## HTML output

```html
<a href="/path" class="sl-link-button not-content primary">
  Get Started
</a>
```
