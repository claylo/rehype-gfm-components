/**
 * Regex to extract comment content from raw HTML comment strings.
 * Matches <!-- content --> including multiline.
 */
const COMMENT_RE = /^<!--\s*([\s\S]*?)\s*-->$/;

/**
 * Extract the comment text from a HAST node.
 * Handles both parsed `comment` nodes (from rehype-raw) and
 * unparsed `raw` nodes (from Astro's pipeline).
 *
 * @param {import('hast').Node} node
 * @returns {string | null} The comment text, or null if not a comment
 */
export function getCommentValue(node) {
  if (node.type === "comment") {
    return node.value;
  }
  if (node.type === "raw" && typeof node.value === "string") {
    const match = node.value.trim().match(COMMENT_RE);
    if (match) return match[1];
  }
  return null;
}

/**
 * Check if a node is a comment (either parsed or raw).
 * @param {import('hast').Node} node
 * @returns {boolean}
 */
export function isComment(node) {
  return getCommentValue(node) !== null;
}
