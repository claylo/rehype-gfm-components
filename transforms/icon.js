import { fromHtmlIsomorphic } from "hast-util-from-html-isomorphic";

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
    const fragment = fromHtmlIsomorphic(
      `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">${svgContent}</svg>`,
      { fragment: true }
    );
    return fragment.children[0];
  }

  // Placeholder for adapter to hydrate
  return {
    type: "element",
    tagName: "span",
    properties: { "data-gfm-icon": name, ariaHidden: "true" },
    children: [],
  };
}
