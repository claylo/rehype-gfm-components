# Handoff: Tooltip & Accordion Transforms Complete

**Branch:** `feat/mdx-no-thank-you`
**Date:** 2026-02-13
**Status:** Implementation complete, all 74 tests passing, visually verified in Starlight dev server

## Current State

### Done
- **Tooltip transform** (`transforms/tooltip.js`): Converts GFM footnotes (`[^1]`) into inline hover tooltips. Extracts the preceding word as trigger text, builds a `<span class="gfm-tooltip">` with trigger + content spans. Removes the footnotes section entirely.
- **Accordion group transform** (`transforms/accordiongroup.js`): Wraps `<!-- accordiongroup -->` ... `<!-- /accordiongroup -->` paired `<details>` elements in a `<div class="gfm-accordion-group">` for unified card styling with dividers.
- **CSS for both** in `styles/starlight.css`: tooltip hover/focus popups, accordion group with unified border + dividers, standalone accordion individual card styling.
- **7 tooltip tests** in `test/transforms/tooltip.test.js`
- **2 new integration tests** in `test/integration.test.js` (bare details passthrough, accordiongroup wrapping)
- **Starlight site samples** at `../claylo-starlight-test/docs/guides/gfm-components-test.md` — tooltip, accordion group, and standalone accordion sections added and visually verified.

### Not Yet Committed
All tooltip + accordion work is uncommitted. The previous commit is `a3bf1f6`. There are also uncommitted changes from earlier work on the branch (adapter, tabs, etc.) — check `git diff --stat` for the full picture.

### What's Left for v1
All 12 planned transforms are now implemented:
1. steps, badge, icon, linkbutton, linkcard, linkcards, card, cardgrid, tabs, filetree, tooltip, accordiongroup

**Remaining work:**
- documentation
- Publish to npm

## Key Files

| File | Purpose |
|------|---------|
| `transforms/tooltip.js` | **New** — `processTooltips(tree)` standalone pass |
| `transforms/accordiongroup.js` | **New** — paired range transform wrapping details |
| `index.js` | Modified — imports, typedef (`tooltips` option), Pass 4 tooltip, `loadTransforms` includes accordiongroup |
| `lib/parse-comment.js` | Modified — added `accordiongroup` / `/accordiongroup` to KEYWORDS |
| `lib/collect-ranges.js` | Modified — added `accordiongroup: "/accordiongroup"` to CLOSERS |
| `styles/starlight.css` | Modified — tooltip CSS, accordion group CSS, standalone accordion CSS, outside-layer overrides |
| `test/transforms/tooltip.test.js` | **New** — 7 tests |
| `test/integration.test.js` | Modified — 2 new tests (bare details, accordiongroup) |

## Gotchas

### Three-place registration for paired transforms
Adding a new paired comment transform (like `accordiongroup`) requires changes in THREE files:
1. `lib/parse-comment.js` — add keyword + closing keyword to `KEYWORDS` set
2. `lib/collect-ranges.js` — add to `CLOSERS` map
3. `index.js` — add to `loadTransforms()` object

Missing any one causes subtle bugs (comments not recognized, treated as self-closing, or empty wrappers).

### Starlight CSS layer precedence
Starlight's own styles are **unlayered**, which beats anything inside `@layer starlight.components`. Accordion/details overrides for margin and padding on summary/details MUST go **outside** the `@layer` block. See the bottom of `styles/starlight.css`.

### HAST footnote property detection
`dataFootnoteRef`, `dataFootnotes`, `dataFootnoteBackref` are empty strings `""` with rehype-raw but boolean `true` without it. Use `"prop" in node.properties` (not truthiness checks) to handle both pipelines.

### Astro dev server caching
When styles or transforms look wrong in the browser, **stop the dev server and `rm -rf .astro`** before debugging further. This is the default first move.

### Multiple footnote refs per parent
`replaceFootnoteRefs` iterates right-to-left using splice + in-place text node mutation. A naive left-to-right approach with array rebuilding breaks because indices shift after each replacement.

## What Worked / Didn't Work

### Worked
- Tooltip as a standalone tree pass (not keyword-dispatched) — clean separation since it detects HAST structure, not comment markers
- `overflow: hidden` on `.gfm-accordion-group` for clean border-radius clipping
- Outside-`@layer` overrides to beat Starlight's unlayered CSS
- `padding-bottom: 1rem` on open details for balanced whitespace (matches Mintlify reference)

### Didn't Work
- CSS-only accordion (no wrapper) — couldn't reliably target only "accordion" details vs tabs/filetree details without a grouping container
- Adjacent sibling negative margins for tight accordion grouping — Starlight's unlayered margin rules won
- Left-to-right iteration for multiple footnote refs — splice invalidated indices; had to switch to right-to-left

## Commands

```bash
# Run tests
npx vitest run

# Start Starlight dev server (from site dir)
cd ../claylo-starlight-test/site
npx astro dev

# Clear Astro cache if rendering looks wrong
rm -rf ../claylo-starlight-test/site/.astro

# See all uncommitted changes
git diff --stat
git ls-files --others --exclude-standard
```
