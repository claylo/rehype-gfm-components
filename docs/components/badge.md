---
title: Badge
description: Inline labels and status indicators
---

Place a badge comment immediately after inline code to render it as a styled badge. On GitHub it's inline code. In Starlight it's a colored label.

## Basic usage

This feature is `New`<!-- badge variant:tip --> and ready for use.

<details>
<summary>View Markdown source</summary>

```markdown
This feature is `New`<!-- badge variant:tip --> and ready for use.
```

</details>

## Variants

- `Default`<!-- badge --> — Default style
- `Note`<!-- badge variant:note --> — Informational
- `Tip`<!-- badge variant:tip --> — Positive / new
- `Caution`<!-- badge variant:caution --> — Warning
- `Danger`<!-- badge variant:danger --> — Critical

<details>
<summary>View Markdown source</summary>

```markdown
- `Default`<!-- badge --> — Default style
- `Note`<!-- badge variant:note --> — Informational
- `Tip`<!-- badge variant:tip --> — Positive / new
- `Caution`<!-- badge variant:caution --> — Warning
- `Danger`<!-- badge variant:danger --> — Critical
```

</details>

## In headings

Badges work in headings too — useful for marking API status.

### Authentication `Beta`<!-- badge variant:caution -->

### Webhooks `Deprecated`<!-- badge variant:danger -->

<details>
<summary>View Markdown source</summary>

```markdown
### Authentication `Beta`<!-- badge variant:caution -->

### Webhooks `Deprecated`<!-- badge variant:danger -->
```

</details>

## Sizes

- `Small`<!-- badge variant:tip size:small --> — Default size
- `Medium`<!-- badge variant:tip size:medium --> — Medium
- `Large`<!-- badge variant:tip size:large --> — Large

<details>
<summary>View Markdown source</summary>

```markdown
- `Small`<!-- badge variant:tip size:small --> — Default size
- `Medium`<!-- badge variant:tip size:medium --> — Medium
- `Large`<!-- badge variant:tip size:large --> — Large
```

</details>

## How it renders

| Context | Rendering |
|---------|-----------|
| GitHub | Inline code (e.g. `New`, `Beta`) |
| Starlight | Styled badge with variant color |

## Parameters

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `variant` | `default`, `note`, `tip`, `caution`, `danger` | `default` | Badge color variant |
| `size` | `small`, `medium`, `large` | `small` | Badge size |

## HTML output

```html
<span class="sl-badge tip small">New</span>
```
