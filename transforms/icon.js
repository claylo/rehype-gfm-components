import { sanitizeSvgContent } from "../lib/sanitize-svg.js";

/**
 * Icon transform: replaces <!-- icon:name --> with an inline SVG.
 * If icon SVG data is available in options.icons, renders the full SVG.
 * Otherwise, renders a data attribute placeholder for the adapter to hydrate.
 *
 * Called from the inline processing pass — receives params and full options.
 *
 * @param {Record<string, string>} params - { icon: "name" }
 * @param {{ icons?: Record<string, string> }} options - Plugin options
 * @returns {import('hast').Element | null}
 */
export function icon(params, options) {
  const name = params.icon;
  if (!name) return null;

  const svgContent = options?.icons?.[name];
  if (svgContent) {
    return {
      type: "element",
      tagName: "svg",
      properties: {
        ariaHidden: "true",
        width: "16",
        height: "16",
        viewBox: "0 0 24 24",
        fill: "currentColor",
      },
      children: sanitizeSvgContent(svgContent),
    };
  }

  // Placeholder for adapter to hydrate
  return {
    type: "element",
    tagName: "span",
    properties: { "data-gfm-icon": name, ariaHidden: "true" },
    children: [],
  };
}
