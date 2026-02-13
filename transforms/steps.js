/**
 * Steps transform: adds sl-steps class and role="list" to the <ol> element
 * found between <!-- steps --> and <!-- /steps --> markers.
 *
 * @param {import('hast').Node[]} content - Nodes between opening/closing comments
 * @param {Record<string, string>} _params - Comment parameters (unused for steps)
 * @returns {import('hast').Node[]}
 */
export function steps(content, _params) {
  for (const node of content) {
    if (node.type === "element" && node.tagName === "ol") {
      node.properties = node.properties || {};
      node.properties.className = ["sl-steps"];
      node.properties.role = "list";
    }
  }
  return content;
}
