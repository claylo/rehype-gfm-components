---
title: File Tree
description: Interactive file tree with folder icons from a code block
---

Wrap a code block in filetree markers to render it as an interactive file tree with folder/file icons, expand/collapse behavior, and optional highlighting.

## Basic usage

<!-- filetree -->
```
src/
  components/
    Header.astro
    Footer.astro
  pages/
    index.astro
package.json
tsconfig.json
```
<!-- /filetree -->

<details>
<summary>View Markdown source</summary>

````markdown
<!-- filetree -->
```
src/
  components/
    Header.astro
    Footer.astro
  pages/
    index.astro
package.json
tsconfig.json
```
<!-- /filetree -->
````

</details>

## With tree command output

If you prefer `tree`-style box-drawing characters, those work too.

<!-- filetree -->
```
src/
├── components/
│   ├── Header.astro
│   └── Footer.astro
├── pages/
│   └── index.astro
├── package.json
└── tsconfig.json
```
<!-- /filetree -->

<details>
<summary>View Markdown source</summary>

````markdown
<!-- filetree -->
```
src/
├── components/
│   ├── Header.astro
│   └── Footer.astro
├── pages/
│   └── index.astro
├── package.json
└── tsconfig.json
```
<!-- /filetree -->
````

</details>

## Highlighted entries and comments

Use `# highlight` (or `#!`) to highlight an entry, and `# any text` to add an annotation comment.

<!-- filetree -->
```
src/
  components/
    Header.astro          # highlight
    Footer.astro          # the footer component
  pages/
    index.astro           # highlight
  utils/
    ...
package.json
```
<!-- /filetree -->

<details>
<summary>View Markdown source</summary>

````markdown
<!-- filetree -->
```
src/
  components/
    Header.astro          # highlight
    Footer.astro          # the footer component
  pages/
    index.astro           # highlight
  utils/
    ...
package.json
```
<!-- /filetree -->
````

</details>

## Conventions

| Pattern | Meaning |
|---------|---------|
| Trailing `/` | Directory (rendered with folder icon) |
| `# highlight` or `#!` | Highlighted entry |
| `# text` | Annotation comment |
| `...` | Placeholder for additional files |

## How it renders

| Context | Rendering |
|---------|-----------|
| GitHub | Preformatted text block |
| Starlight | Interactive file tree with folder/file icons and expand/collapse |

## Parameters

None. The `<!-- filetree -->` marker takes no parameters.

## HTML output

```html
<starlight-file-tree class="not-content">
  <ul>
    <li class="directory">
      <details open>
        <summary>
          <span class="tree-icon">...</span>
          src
        </summary>
        <ul>...</ul>
      </details>
    </li>
    <li class="file">
      <span class="tree-icon">...</span>
      package.json
    </li>
  </ul>
</starlight-file-tree>
```
