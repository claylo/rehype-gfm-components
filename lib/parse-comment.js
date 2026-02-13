/**
 * Known component keywords that this plugin handles.
 * @type {Set<string>}
 */
const KEYWORDS = new Set([
  "steps",
  "/steps",
  "filetree",
  "/filetree",
  "tabs",
  "/tabs",
  "card",
  "cardgrid",
  "/cardgrid",
  "linkcard",
  "/linkcard",
  "linkcards",
  "/linkcards",
  "linkbutton",
  "/linkbutton",
  "badge",
  "icon",
]);

/**
 * Parse an HTML comment's text content into a keyword and params.
 * Returns null if the comment doesn't match a known keyword.
 *
 * @param {string} text - The comment text (without <!-- and -->)
 * @returns {{ keyword: string, params: Record<string, string> } | null}
 */
export function parseComment(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const tokens = trimmed.split(/\s+/);
  const first = tokens[0];

  // Check if first token is a known keyword
  if (KEYWORDS.has(first)) {
    const params = {};
    for (let i = 1; i < tokens.length; i++) {
      const colonIdx = tokens[i].indexOf(":");
      if (colonIdx > 0) {
        params[tokens[i].slice(0, colonIdx)] = tokens[i].slice(colonIdx + 1);
      }
    }
    return { keyword: first, params };
  }

  // Check for icon:name pattern (keyword is "icon", param is the name)
  if (first.startsWith("icon:")) {
    return {
      keyword: "icon",
      params: { icon: first.slice(5) },
    };
  }

  return null;
}
