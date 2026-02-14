/**
 * Protocols that must never appear in user-facing link hrefs.
 * Case-insensitive, tolerates leading whitespace.
 */
const UNSAFE_PROTOCOL_RE = /^\s*(?:javascript|vbscript|data):/i;

/**
 * Return the URL unchanged if its protocol is safe, or empty string if not.
 *
 * @param {string} url
 * @returns {string}
 */
export function sanitizeUrl(url) {
  if (typeof url !== "string") return "";
  if (UNSAFE_PROTOCOL_RE.test(url)) return "";
  return url;
}
