import { sanitizeUrl } from "../lib/sanitize-url.js";

/** Separator pattern: em dash or spaced hyphen */
const SEP_RE = /\s*—\s*|\s+- /;

function textContent(node) {
  if (node.type === "text") return node.value;
  if (node.children) return node.children.map(textContent).join("");
  return "";
}

/**
 * Extract link href, title text, and description from a set of sibling nodes.
 */
function extractLinkData(nodes) {
  let href = "";
  let title = "";
  let description = "";

  for (const node of nodes) {
    if (node.type === "element" && node.tagName === "a") {
      href = node.properties?.href || "";
      title = textContent(node);
    } else if (node.type === "text") {
      const text = node.value;
      const match = text.match(SEP_RE);
      if (match) {
        description = text.slice(match.index + match[0].length).trim();
      }
    }
  }

  return { href, title, description };
}

function makeLinkCard(href, title, description, options) {
  const stackChildren = [
    {
      type: "element",
      tagName: "a",
      properties: { href: sanitizeUrl(href) },
      children: [
        {
          type: "element",
          tagName: "span",
          properties: { className: ["title"] },
          children: [{ type: "text", value: title }],
        },
      ],
    },
  ];

  if (description) {
    stackChildren.push({
      type: "element",
      tagName: "span",
      properties: { className: ["description"] },
      children: [{ type: "text", value: description }],
    });
  }

  // Arrow icon
  const arrowIcon = {
    type: "element",
    tagName: "span",
    properties: { "data-gfm-icon": "right-arrow", className: ["icon"] },
    children: [],
  };

  return {
    type: "element",
    tagName: "div",
    properties: { className: ["sl-link-card"] },
    children: [
      {
        type: "element",
        tagName: "span",
        properties: { className: ["sl-flex", "stack"] },
        children: stackChildren,
      },
      arrowIcon,
    ],
  };
}

/**
 * Single linkcard: find the <p> containing an <a> and description text.
 *
 * @param {import('hast').Node[]} content
 * @param {Record<string, string>} _params
 * @returns {import('hast').Node[]}
 */
export function linkcard(content, _params) {
  for (const node of content) {
    if (node.type === "element" && node.tagName === "p") {
      const { href, title, description } = extractLinkData(node.children);
      if (href && title) {
        return [makeLinkCard(href, title, description, _params)];
      }
    }
  }
  return content;
}

/**
 * List of linkcards: each <li> contains a link + description.
 *
 * @param {import('hast').Node[]} content
 * @param {Record<string, string>} _params
 * @returns {import('hast').Node[]}
 */
export function linkcards(content, _params) {
  const cards = [];

  for (const node of content) {
    if (node.type === "element" && node.tagName === "ul") {
      for (const li of node.children || []) {
        if (li.type !== "element" || li.tagName !== "li") continue;
        // Each <li> may contain a <p> or direct children with <a>
        const searchNodes =
          li.children?.[0]?.tagName === "p"
            ? li.children[0].children
            : li.children;
        const { href, title, description } = extractLinkData(searchNodes || []);
        if (href && title) {
          cards.push(makeLinkCard(href, title, description, _params));
        }
      }
    }
  }

  return cards.length > 0 ? cards : content;
}
