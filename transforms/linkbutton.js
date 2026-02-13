/**
 * LinkButton transform: finds the <a> inside the content nodes
 * and replaces it with a styled link button.
 *
 * @param {import('hast').Node[]} content
 * @param {Record<string, string>} params - { variant?, icon?, "icon-placement"? }
 * @returns {import('hast').Node[]}
 */
export function linkbutton(content, params) {
  const variant = params.variant || "primary";

  // Find the <a> element in the content (may be inside a <p>)
  let link = null;
  for (const node of content) {
    if (node.type === "element" && node.tagName === "a") {
      link = node;
      break;
    }
    if (node.type === "element" && node.tagName === "p") {
      for (const child of node.children || []) {
        if (child.type === "element" && child.tagName === "a") {
          link = child;
          break;
        }
      }
      if (link) break;
    }
  }

  if (!link) return content;

  link.properties = link.properties || {};
  link.properties.className = ["sl-link-button", "not-content", variant];

  return [link];
}
