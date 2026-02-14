---
title: Cards
description: Styled containers with icons from blockquotes
---

A blockquote with a bold title, preceded by a `card` comment marker. On GitHub it's a blockquote. In Starlight it's a styled card with an optional icon.

## Basic card

<!-- card -->
> **Getting Started**
>
> Set up your project in just a few minutes with our quickstart guide.

<details>
<summary>View Markdown source</summary>

```markdown
<!-- card -->
> **Getting Started**
>
> Set up your project in just a few minutes with our quickstart guide.
```

</details>

## Card with icon

<!-- card icon:rocket -->
> **Launch Your Project**
>
> Everything you need to go from zero to production.

<details>
<summary>View Markdown source</summary>

```markdown
<!-- card icon:rocket -->
> **Launch Your Project**
>
> Everything you need to go from zero to production.
```

</details>

## Card grid

Wrap multiple cards in `<!-- cardgrid -->` markers for a responsive 2-column layout.

<!-- cardgrid -->
<!-- card icon:rocket -->
> **Getting Started**
>
> Set up your project in just a few minutes.

<!-- card icon:puzzle -->
> **Integrations**
>
> Connect with your favorite tools and services.

<!-- card icon:setting -->
> **Configuration**
>
> Fine-tune every aspect of your setup.

<!-- card icon:document -->
> **API Reference**
>
> Complete documentation for all endpoints.
<!-- /cardgrid -->

<details>
<summary>View Markdown source</summary>

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

<!-- card icon:setting -->
> **Configuration**
>
> Fine-tune every aspect of your setup.

<!-- card icon:document -->
> **API Reference**
>
> Complete documentation for all endpoints.
<!-- /cardgrid -->
```

</details>

## How it renders

| Context | Rendering |
|---------|-----------|
| GitHub | Blockquote(s) with bold titles |
| Starlight | Styled card(s) with icon, accent color, and optional grid layout |

## Parameters

### Card

| Parameter | Description |
|-----------|-------------|
| `icon:name` | Starlight icon name. Optional. |

### Card Grid

No parameters. The `<!-- cardgrid -->` marker wraps cards in a responsive 2-column grid with cycling accent colors.

## HTML output

```html
<article class="card sl-flex">
  <p class="title" aria-hidden="true">
    <span class="icon">...</span>
    Getting Started
  </p>
  <div class="body">
    <p>Set up your project in just a few minutes.</p>
  </div>
</article>
```

Grid wrapper:

```html
<div class="card-grid">
  <article class="card sl-flex">...</article>
  <article class="card sl-flex">...</article>
</div>
```
