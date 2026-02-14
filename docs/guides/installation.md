---
title: Installation
description: How to install and configure rehype-gfm-components
---

## Install

<!-- tabs synckey:pkg -->
<details open>
<summary>pnpm</summary>

```bash
pnpm add rehype-gfm-components
```

</details>
<details>
<summary>npm</summary>

```bash
npm install rehype-gfm-components
```

</details>
<details>
<summary>bun</summary>

```bash
bun add rehype-gfm-components
```

</details>
<!-- /tabs -->

## Setup

There are two ways to use the plugin — as a **Starlight plugin** (recommended if you're using Starlight) or as a **raw rehype plugin** for any framework with rehype access.

### Starlight plugin

The Starlight adapter handles everything for you: icon loading, tab script injection, and CSS registration.

<!-- steps -->
1. **Add the plugin to your Starlight config**

   ```js
   // astro.config.mjs
   import { defineConfig } from "astro/config";
   import starlight from "@astrojs/starlight";
   import starlightGfmComponents from "rehype-gfm-components/starlight";

   export default defineConfig({
     integrations: [
       starlight({
         title: "My Docs",
         plugins: [starlightGfmComponents()],
       }),
     ],
   });
   ```

   That's it. The adapter registers the rehype plugin, loads Starlight's icon SVGs, injects the tab-switching script, and adds the bundled CSS.

2. **Write GFM Markdown**

   Start using HTML comment markers in your `.md` files. No imports, no MDX, no file renaming.

3. **Run your dev server**

   ```bash
   pnpm dev
   ```

   Your content renders as rich components in Starlight and stays readable on GitHub.
<!-- /steps -->

### Raw rehype plugin

For any framework that exposes rehype — Astro without Starlight, Next.js, or a custom unified pipeline.

<!-- steps -->
1. **Add the plugin to your markdown config**

   ```js
   // astro.config.mjs (without Starlight)
   import { rehypeGfmComponents } from "rehype-gfm-components";

   export default defineConfig({
     markdown: {
       rehypePlugins: [rehypeGfmComponents],
     },
   });
   ```

   Or in a unified pipeline:

   ```js
   import { unified } from "unified";
   import remarkParse from "remark-parse";
   import remarkGfm from "remark-gfm";
   import remarkRehype from "remark-rehype";
   import rehypeRaw from "rehype-raw";
   import { rehypeGfmComponents } from "rehype-gfm-components";
   import rehypeStringify from "rehype-stringify";

   const result = await unified()
     .use(remarkParse)
     .use(remarkGfm)
     .use(remarkRehype, { allowDangerousHtml: true })
     .use(rehypeRaw)
     .use(rehypeGfmComponents)
     .use(rehypeStringify)
     .process(markdown);
   ```

2. **Add the CSS** (if targeting Starlight's component styles)

   ```js
   // astro.config.mjs
   export default defineConfig({
     integrations: [
       starlight({
         customCss: ["rehype-gfm-components/styles/starlight.css"],
       }),
     ],
   });
   ```

3. **Provide icons** (optional)

   Without the Starlight adapter, icons aren't auto-detected. You can provide them manually:

   ```js
   rehypeGfmComponents({
     icons: {
       rocket: '<path d="M4.5 16.5c-1.5 ..."/>',
     },
   })
   ```

   Or skip icons entirely — components that use `icon` parameters will render `data-gfm-icon` placeholder spans that you can hydrate with your own client-side logic.
<!-- /steps -->

## Configuration options

```js
rehypeGfmComponents({
  // Enable only specific transforms (default: all)
  transforms: ["steps", "tabs", "filetree", "card", "cardgrid",
               "linkcard", "linkcards", "linkbutton", "badge", "icon"],

  // Icon SVG data — auto-detected from Starlight when using the adapter
  icons: { rocket: '<path d="M1 1"/>' },

  // Footnote-to-tooltip transform (default: true)
  tooltips: false,
})
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `transforms` | `string[]` | all | Which transforms to enable |
| `icons` | `Record<string, string>` | auto-detect | Icon name to SVG path string map |
| `tooltips` | `boolean` | `true` | Convert GFM footnotes to inline tooltips |

## Requirements

- Node.js 20+ (LTS)
- `@astrojs/starlight` >= 0.30.0 (for the Starlight adapter, optional)

> [!NOTE]
> When using the raw rehype plugin outside of Astro, you'll need `rehype-raw` in your pipeline for HTML comments to be parsed into HAST `comment` nodes. Astro's built-in pipeline handles this differently — it preserves comments as `raw` nodes, which the plugin also supports.
