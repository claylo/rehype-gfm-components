/**
 * Badge transform: converts <code> immediately followed by a badge comment
 * into a <span class="sl-badge {variant} {size}">.
 *
 * Called from the inline processing pass — receives the preceding <code>
 * element and comment params.
 *
 * @param {import('hast').Element} codeNode - The preceding <code> element
 * @param {Record<string, string>} params - { variant?, size? }
 * @returns {import('hast').Element}
 */
export function badge(codeNode, params) {
  const variant = params.variant || "default";
  const size = params.size || "small";
  const text =
    codeNode.children?.[0]?.type === "text"
      ? codeNode.children[0].value
      : "";

  return {
    type: "element",
    tagName: "span",
    properties: { className: ["sl-badge", variant, size] },
    children: [{ type: "text", value: text }],
  };
}
