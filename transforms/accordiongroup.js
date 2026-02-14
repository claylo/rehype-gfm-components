/**
 * AccordionGroup transform: wraps <details> elements in a grouping container.
 *
 * @param {import('hast').Node[]} content - Nodes between accordiongroup markers
 * @returns {import('hast').Element}
 */
export function accordiongroup(content) {
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["gfm-accordion-group"] },
    children: content.filter(
      (node) => !(node.type === "text" && !node.value.trim())
    ),
  };
}
