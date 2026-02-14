import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { visit } from "unist-util-visit";
import { fromHtmlIsomorphic } from "hast-util-from-html-isomorphic";
import { collectRanges, parseNodeAsComment } from "./lib/collect-ranges.js";
import { getCommentValue } from "./lib/comment-value.js";
import { parseComment } from "./lib/parse-comment.js";
import { loadStarlightIcons } from "./lib/load-starlight-icons.js";
import { steps } from "./transforms/steps.js";
import { badge } from "./transforms/badge.js";
import { icon } from "./transforms/icon.js";
import { linkbutton } from "./transforms/linkbutton.js";
import { linkcard, linkcards } from "./transforms/linkcard.js";
import { card, cardgrid } from "./transforms/card.js";
import { tabs } from "./transforms/tabs.js";
import { filetree } from "./transforms/filetree.js";
import { accordiongroup } from "./transforms/accordiongroup.js";
import { processTooltips } from "./transforms/tooltip.js";

/**
 * @typedef {Object} GfmComponentsOptions
 * @property {string[]} [transforms] - Which transforms to enable (default: all)
 * @property {Record<string, string>} [icons] - Icon name → SVG path string map
 * @property {boolean} [tooltips] - Enable footnote→tooltip transform (default: true)
 */

/**
 * Try to find and load Starlight icons from the consuming project.
 * Returns empty object if Starlight isn't installed.
 */
function autoDetectIcons() {
  try {
    const require = createRequire(join(process.cwd(), "noop.js"));
    // Use the main entry point (always exported) and navigate up to package root.
    const starlightDir = dirname(require.resolve("@astrojs/starlight"));
    return loadStarlightIcons(starlightDir);
  } catch {
    return {};
  }
}

/** Transforms that consume a self-closing marker + next sibling. */
const SELF_CLOSING = new Set(["card"]);

/** Transforms that operate inline (within paragraph content). */
const INLINE = new Set(["badge", "icon"]);

/**
 * Rehype plugin that transforms GFM comment markers into rich components.
 *
 * Handles both parsed HAST `comment` nodes (when rehype-raw is in the
 * pipeline, e.g., standalone usage) and unparsed `raw` nodes (when used
 * inside Astro/Starlight's pipeline which doesn't use rehype-raw).
 *
 * @param {GfmComponentsOptions} [options]
 * @returns {import('unified').Transformer}
 */
export function rehypeGfmComponents(options = {}) {
  // Auto-detect Starlight icons if not explicitly provided
  if (!options.icons) {
    options = { ...options, icons: autoDetectIcons() };
  }

  const transforms = loadTransforms(options.transforms);

  return (tree) => {
    // Pre-pass: Split compound raw nodes so each HTML block/comment is separate.
    // Without rehype-raw (e.g., Astro), remark merges adjacent HTML blocks into
    // a single raw node. This makes individual comments/elements unreachable.
    splitCompoundRawNodes(tree);

    // Pass 1: Block-level transforms (paired and self-closing markers)
    processBlockTransforms(tree, transforms, options);

    // Pass 2: Inline transforms (badge, icon within paragraph content)
    processInlineTransforms(tree, transforms, options);

    // Pass 3: Hydrate data-gfm-icon placeholders with SVG content
    if (options.icons) {
      hydrateIcons(tree, options.icons);
    }

    // Pass 4: Transform GFM footnotes into inline tooltips
    if (options.tooltips !== false) {
      processTooltips(tree);
    }

    // Pass 5: Clean up any remaining recognized comment markers
    cleanupComments(tree);
  };
}

/**
 * Split compound raw nodes so each HTML block or comment is a separate node.
 *
 * Without rehype-raw (e.g., Astro's pipeline), remark-rehype merges adjacent
 * HTML blocks into single raw nodes like "</details>\n<!-- /tabs -->".
 * This prevents collectRanges from finding individual comment markers.
 *
 * Splits at ">\n<" boundaries (end of one HTML construct → start of another).
 */
function splitCompoundRawNodes(tree) {
  visit(tree, (node) => {
    if (!node.children) return;

    let changed = false;
    const newChildren = [];

    for (const child of node.children) {
      if (
        child.type === "raw" &&
        typeof child.value === "string" &&
        child.value.includes("\n")
      ) {
        const parts = child.value.split(/(?<=>)\n(?=<)/);
        if (parts.length > 1) {
          changed = true;
          for (const part of parts) {
            newChildren.push({ type: "raw", value: part });
          }
          continue;
        }
      }
      newChildren.push(child);
    }

    if (changed) node.children = newChildren;
  });
}

/**
 * Process block-level comment ranges in each parent that has comment children.
 */
function processBlockTransforms(tree, transforms, options) {
  visit(tree, (node) => {
    if (!node.children) return;

    const ranges = collectRanges(node);
    if (ranges.length === 0) return;

    // Process ranges in reverse order to preserve indices
    for (let i = ranges.length - 1; i >= 0; i--) {
      const range = ranges[i];
      const { keyword, params, startIdx, endIdx } = range;

      if (SELF_CLOSING.has(keyword)) {
        // Self-closing: transform consumes marker + next sibling
        const transform = transforms[keyword];
        if (!transform) continue;

        // Content for self-closing card = nodes after the comment until a
        // recognizable boundary (next comment marker or end of parent)
        const nextNodes = [];
        for (let j = startIdx + 1; j < node.children.length; j++) {
          const child = node.children[j];
          // Stop at next recognized comment (either type)
          if (parseNodeAsComment(child)) break;

          nextNodes.push(child);
          // For card, stop after first blockquote
          if (
            keyword === "card" &&
            child.type === "element" &&
            child.tagName === "blockquote"
          ) {
            break;
          }
        }

        const replacement = transform(nextNodes, params, options);
        if (replacement !== undefined) {
          const removeCount = 1 + nextNodes.length; // comment + consumed nodes
          const replacementNodes = Array.isArray(replacement)
            ? replacement
            : [replacement];
          node.children.splice(startIdx, removeCount, ...replacementNodes);
        }
      } else if (!INLINE.has(keyword)) {
        // Paired range: content is between start and end markers
        const transform = transforms[keyword];
        if (!transform) continue;

        const content = node.children.slice(startIdx + 1, endIdx);
        const replacement = transform(content, params, options);

        if (replacement !== undefined) {
          const removeCount = endIdx - startIdx + 1;
          const replacementNodes = Array.isArray(replacement)
            ? replacement
            : [replacement];
          node.children.splice(startIdx, removeCount, ...replacementNodes);
        }
      }
    }
  });
}

/**
 * Process inline transforms (badge, icon) within element children.
 * Handles both `comment` and `raw` node types.
 */
function processInlineTransforms(tree, transforms, options) {
  visit(tree, "element", (node) => {
    if (!node.children) return;

    for (let i = node.children.length - 1; i >= 0; i--) {
      const child = node.children[i];
      const commentText = getCommentValue(child);
      if (commentText === null) continue;

      const parsed = parseComment(commentText);
      if (!parsed) continue;

      if (parsed.keyword === "badge" && i > 0) {
        const prev = node.children[i - 1];
        if (prev.type === "element" && prev.tagName === "code") {
          const transform = transforms.badge;
          if (transform) {
            const replacement = transform(prev, parsed.params, options);
            if (replacement) {
              node.children.splice(i - 1, 2, replacement);
              i--; // adjust index since we removed an extra node
              continue;
            }
          }
        }
        // Remove orphaned badge comment
        node.children.splice(i, 1);
      } else if (parsed.keyword === "icon") {
        const transform = transforms.icon;
        if (transform) {
          const replacement = transform(parsed.params, options);
          if (replacement) {
            node.children.splice(i, 1, replacement);
            continue;
          }
        }
        node.children.splice(i, 1);
      }
    }
  });
}

/**
 * Remove any remaining recognized comment nodes (both `comment` and `raw` types).
 */
function cleanupComments(tree) {
  visit(tree, (node, index, parent) => {
    if (!parent || index === undefined) return;
    if (node.type !== "comment" && node.type !== "raw") return;

    const commentText = getCommentValue(node);
    if (commentText === null) return;

    const parsed = parseComment(commentText);
    if (!parsed) return;

    parent.children.splice(index, 1);
    return index; // revisit this index
  });
}

/**
 * Replace data-gfm-icon placeholder spans with actual SVG elements.
 * Transforms like filetree and card emit <span data-gfm-icon="name">;
 * this pass resolves those to inline SVGs using the icons map.
 */
function hydrateIcons(tree, icons) {
  visit(tree, "element", (node, index, parent) => {
    if (!parent || index === undefined) return;
    const iconName = node.properties?.["data-gfm-icon"] || node.properties?.dataGfmIcon;
    if (!iconName) return;

    const svgContent = icons[iconName];
    if (!svgContent) return;

    const svg = fromHtmlIsomorphic(
      `<svg aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" class="${(node.properties.className || []).join(" ")}">${svgContent}</svg>`,
      { fragment: true }
    ).children[0];

    if (svg) {
      parent.children[index] = svg;
    }
  });
}

/**
 * Load transform modules based on config.
 * @param {string[]} [enabled]
 * @returns {Record<string, Function>}
 */
function loadTransforms(enabled) {
  const all = { steps, badge, icon, linkbutton, linkcard, linkcards, card, cardgrid, tabs, filetree, accordiongroup };
  if (!enabled) return all;
  return Object.fromEntries(
    Object.entries(all).filter(([k]) => enabled.includes(k))
  );
}

export default rehypeGfmComponents;
