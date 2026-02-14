---
title: Steps
description: Display sequential instructions with numbered visual guide lines
---

Wrap an ordered list in step markers to render it as a styled step-by-step guide with vertical connector lines.

## Basic usage

<!-- steps -->
1. Install the package
   ```bash
   pnpm add rehype-gfm-components
   ```
2. Add the plugin to your config
3. Start writing GFM
<!-- /steps -->

<details>
<summary>View Markdown source</summary>

````markdown
<!-- steps -->
1. Install the package
   ```bash
   pnpm add rehype-gfm-components
   ```
2. Add the plugin to your config
3. Start writing GFM
<!-- /steps -->
````

</details>

## Rich content in steps

Steps can contain any Markdown content — code blocks, lists, links, images, or other components.

<!-- steps -->
1. **Clone the repository**

   ```bash
   git clone https://github.com/claylo/rehype-gfm-components.git
   cd rehype-gfm-components
   ```

2. **Install dependencies**

   Make sure you have [pnpm](https://pnpm.io) installed, then run:

   ```bash
   pnpm install
   ```

3. **Run the test suite**

   ```bash
   pnpm vitest run
   ```

   All 89 tests should pass.
<!-- /steps -->

<details>
<summary>View Markdown source</summary>

````markdown
<!-- steps -->
1. **Clone the repository**

   ```bash
   git clone https://github.com/claylo/rehype-gfm-components.git
   cd rehype-gfm-components
   ```

2. **Install dependencies**

   Make sure you have [pnpm](https://pnpm.io) installed, then run:

   ```bash
   pnpm install
   ```

3. **Run the test suite**

   ```bash
   pnpm vitest run
   ```

   All 89 tests should pass.
<!-- /steps -->
````

</details>

## How it renders

| Context | Rendering |
|---------|-----------|
| GitHub | Standard numbered list |
| Starlight | Styled steps with vertical guide lines and step numbers |

## Parameters

None. The `<!-- steps -->` marker takes no parameters.

## HTML output

```html
<ol class="sl-steps" role="list">
  <li>...</li>
  <li>...</li>
</ol>
```
