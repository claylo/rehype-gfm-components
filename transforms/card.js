import { parseComment } from "../lib/parse-comment.js";

function textContent(node) {
  if (node.type === "text") return node.value;
  if (node.children) return node.children.map(textContent).join("");
  return "";
}

/**
 * Build a card element from a blockquote.
 * Extracts bold title from first <p>, rest becomes body.
 */
function makeCard(blockquote, params) {
  const bqChildren = (blockquote.children || []).filter(
    (n) => n.type === "element"
  );

  let title = "";
  let bodyChildren = [];

  if (bqChildren.length > 0) {
    const firstP = bqChildren[0];
    if (firstP.tagName === "p") {
      const strong = firstP.children?.find(
        (c) => c.type === "element" && c.tagName === "strong"
      );
      if (strong) {
        title = textContent(strong);
        bodyChildren = bqChildren.slice(1);
      } else {
        bodyChildren = bqChildren;
      }
    } else {
      bodyChildren = bqChildren;
    }
  }

  const titleChildren = [];
  if (params.icon) {
    titleChildren.push({
      type: "element",
      tagName: "span",
      properties: { "data-gfm-icon": params.icon, className: ["icon"] },
      children: [],
    });
  }
  titleChildren.push({
    type: "element",
    tagName: "span",
    properties: {},
    children: [{ type: "text", value: title }],
  });

  return {
    type: "element",
    tagName: "article",
    properties: { className: ["card", "sl-flex"] },
    children: [
      {
        type: "element",
        tagName: "p",
        properties: { className: ["title", "sl-flex"] },
        children: titleChildren,
      },
      {
        type: "element",
        tagName: "div",
        properties: { className: ["body"] },
        children: bodyChildren,
      },
    ],
  };
}

/**
 * Card transform: converts a single <!-- card --> marker + next blockquote.
 * Self-closing marker — content is the nodes consumed after the comment.
 *
 * @param {import('hast').Node[]} content - Nodes after the card comment
 * @param {Record<string, string>} params - { icon? }
 * @returns {import('hast').Node[]}
 */
export function card(content, params) {
  const blockquote = content.find(
    (n) => n.type === "element" && n.tagName === "blockquote"
  );
  if (!blockquote) return content;

  return [makeCard(blockquote, params)];
}

/**
 * CardGrid transform: wraps content between <!-- cardgrid --> markers.
 * Processes inner <!-- card --> markers and groups into a card-grid div.
 *
 * @param {import('hast').Node[]} content - Nodes between cardgrid markers
 * @param {Record<string, string>} _params
 * @returns {import('hast').Node[]}
 */
export function cardgrid(content, _params) {
  const cards = [];
  let currentParams = {};

  for (const node of content) {
    if (node.type === "comment") {
      const parsed = parseComment(node.value);
      if (parsed && parsed.keyword === "card") {
        currentParams = parsed.params;
        continue;
      }
    }

    if (node.type === "element" && node.tagName === "blockquote") {
      cards.push(makeCard(node, currentParams));
      currentParams = {};
    }
  }

  return [
    {
      type: "element",
      tagName: "div",
      properties: { className: ["card-grid"] },
      children: cards,
    },
  ];
}
