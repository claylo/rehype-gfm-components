import { visit, SKIP } from "unist-util-visit";
import { collectRanges } from "./lib/collect-ranges.js";
import { parseComment } from "./lib/parse-comment.js";
import { steps } from "./transforms/steps.js";
import { badge } from "./transforms/badge.js";
import { icon } from "./transforms/icon.js";
import { linkbutton } from "./transforms/linkbutton.js";
import { linkcard, linkcards } from "./transforms/linkcard.js";
import { card, cardgrid } from "./transforms/card.js";
import { tabs } from "./transforms/tabs.js";
import { filetree } from "./transforms/filetree.js";

/**
 * @typedef {Object} GfmComponentsOptions
 * @property {string[]} [transforms] - Which transforms to enable (default: all)
 * @property {Record<string, string>} [icons] - Icon name → SVG path string map
 */

/** Transforms that consume a self-closing marker + next sibling. */
const SELF_CLOSING = new Set(["card"]);

/** Transforms that operate inline (within paragraph content). */
const INLINE = new Set(["badge", "icon"]);

/**
 * Rehype plugin that transforms GFM comment markers into rich components.
 *
 * @param {GfmComponentsOptions} [options]
 * @returns {import('unified').Transformer}
 */
export function rehypeGfmComponents(options = {}) {
  const transforms = loadTransforms(options.transforms);

  return (tree) => {
    // Pass 1: Block-level transforms (paired and self-closing markers)
    processBlockTransforms(tree, transforms, options);

    // Pass 2: Inline transforms (badge, icon within paragraph content)
    processInlineTransforms(tree, transforms, options);

    // Pass 3: Clean up any remaining recognized comment markers
    cleanupComments(tree);
  };
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
          // Stop at next recognized comment
          if (child.type === "comment") {
            const parsed = parseComment(child.value);
            if (parsed) break;
          }
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
 */
function processInlineTransforms(tree, transforms, options) {
  visit(tree, "element", (node) => {
    if (!node.children) return;

    for (let i = node.children.length - 1; i >= 0; i--) {
      const child = node.children[i];
      if (child.type !== "comment") continue;

      const parsed = parseComment(child.value);
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
 * Remove any remaining recognized comment nodes.
 */
function cleanupComments(tree) {
  visit(tree, "comment", (node, index, parent) => {
    if (!parent || index === undefined) return;
    const parsed = parseComment(node.value);
    if (!parsed) return;
    parent.children.splice(index, 1);
    return index; // revisit this index
  });
}

/**
 * Load transform modules based on config.
 * @param {string[]} [enabled]
 * @returns {Record<string, Function>}
 */
function loadTransforms(enabled) {
  const all = { steps, badge, icon, linkbutton, linkcard, linkcards, card, cardgrid, tabs, filetree };
  if (!enabled) return all;
  return Object.fromEntries(
    Object.entries(all).filter(([k]) => enabled.includes(k))
  );
}

export default rehypeGfmComponents;
