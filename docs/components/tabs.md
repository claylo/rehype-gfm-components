---
title: Tabs
description: Organize related content into switchable tabbed views
---

Wrap a group of `<details>`/`<summary>` elements in tab markers. On GitHub, readers see a native accordion. In Starlight, they get a tab bar with keyboard navigation.

## Basic usage

<!-- tabs -->
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

<details>
<summary>View Markdown source</summary>

````markdown
<!-- tabs -->
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
````

</details>

## Synced tabs

Use `synckey` to synchronize tab selection across the page. When a reader picks "pnpm" in one tab group, all tab groups with the same `synckey` switch to "pnpm" too. The selection persists in `localStorage`.

<!-- tabs synckey:pkg -->
<details open>
<summary>npm</summary>

```bash
npm install my-first-package
```

</details>
<details>
<summary>pnpm</summary>

```bash
pnpm add my-first-package
```

</details>
<!-- /tabs -->

And later on the same page:

<!-- tabs synckey:pkg -->
<details open>
<summary>npm</summary>

```bash
npm run build
```

</details>
<details>
<summary>pnpm</summary>

```bash
pnpm build
```

</details>
<!-- /tabs -->

<details>
<summary>View Markdown source</summary>

````markdown
<!-- tabs synckey:pkg -->
<details open>
<summary>npm</summary>

```bash
npm install my-first-package
```

</details>
<details>
<summary>pnpm</summary>

```bash
pnpm add my-first-package
```

</details>
<!-- /tabs -->

And later on the same page:

<!-- tabs synckey:pkg -->
<details open>
<summary>npm</summary>

```bash
npm run build
```

</details>
<details>
<summary>pnpm</summary>

```bash
pnpm build
```

</details>
<!-- /tabs -->
````

</details>

## How it renders

| Context | Rendering |
|---------|-----------|
| GitHub | Accordion — first section expanded, others collapsed |
| Starlight | Tab bar with keyboard navigation (Arrow keys, Home, End) and optional sync |

## Parameters

| Parameter | Description |
|-----------|-------------|
| `synckey:name` | Sync tab selection across tab groups with the same key. Persists in `localStorage`. |

## Keyboard navigation

When a tab is focused:

- **Left/Right arrows** — move between tabs
- **Home** — jump to first tab
- **End** — jump to last tab

## HTML output

```html
<starlight-tabs>
  <div class="tablist-wrapper not-content">
    <ul role="tablist">
      <li role="presentation">
        <a role="tab" aria-selected="true" tabindex="0">npm</a>
      </li>
      <li role="presentation">
        <a role="tab" tabindex="-1">pnpm</a>
      </li>
    </ul>
  </div>
  <div role="tabpanel">...</div>
  <div role="tabpanel" hidden>...</div>
</starlight-tabs>
```
