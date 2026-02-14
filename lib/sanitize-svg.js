import { fromHtmlIsomorphic } from "hast-util-from-html-isomorphic";

/**
 * SVG elements safe to include inside an <svg> wrapper.
 * Everything not on this list is stripped.
 */
const ALLOWED_ELEMENTS = new Set([
  "circle",
  "clippath",
  "defs",
  "desc",
  "ellipse",
  "g",
  "line",
  "lineargradient",
  "mask",
  "path",
  "polygon",
  "polyline",
  "radialgradient",
  "rect",
  "stop",
  "symbol",
  "text",
  "title",
  "tspan",
  "use",
]);

/**
 * Attribute prefixes / names that are never safe.
 */
const DANGEROUS_PROTOCOL_RE = /^\s*javascript:/i;

/**
 * Sanitize a single HAST node (and its children) for safe SVG embedding.
 * Returns an array: either [sanitizedNode] or [] if the node was stripped.
 */
function sanitizeNode(node) {
  // Text nodes are always safe
  if (node.type === "text") return [node];

  // Only element nodes can pass; drop comments, raw, etc.
  if (node.type !== "element") return [];

  const tag = node.tagName.toLowerCase();

  // Must be an allowed SVG element
  if (!ALLOWED_ELEMENTS.has(tag)) return [];

  // Scrub properties
  if (node.properties) {
    const clean = {};
    for (const [key, value] of Object.entries(node.properties)) {
      // Strip event handlers (onClick, onLoad, etc.)
      if (/^on/i.test(key)) continue;

      // Strip href / xlink:href with dangerous schemes
      if (
        (key === "href" || key === "xlinkHref") &&
        typeof value === "string" &&
        DANGEROUS_PROTOCOL_RE.test(value)
      ) {
        continue;
      }

      clean[key] = value;
    }
    node.properties = clean;
  }

  // Recurse into children
  if (node.children) {
    node.children = node.children.flatMap(sanitizeNode);
  }

  return [node];
}

/**
 * Parse an SVG inner-content string and return sanitized HAST children.
 *
 * @param {string} svgContent - Raw SVG inner markup (e.g. '<path d="M1 1"/>')
 * @returns {import('hast').Node[]}
 */
export function sanitizeSvgContent(svgContent) {
  const fragment = fromHtmlIsomorphic(svgContent, { fragment: true });
  return fragment.children.flatMap(sanitizeNode);
}
