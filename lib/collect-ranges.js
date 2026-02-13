import { parseComment } from "./parse-comment.js";

/**
 * Opening keywords that expect a closing counterpart.
 * @type {Record<string, string>}
 */
const CLOSERS = {
  steps: "/steps",
  filetree: "/filetree",
  tabs: "/tabs",
  cardgrid: "/cardgrid",
  linkcard: "/linkcard",
  linkcards: "/linkcards",
  linkbutton: "/linkbutton",
};

/**
 * Collect comment-delimited ranges from a parent's children.
 * Returns array of { keyword, params, startIdx, endIdx }
 * where startIdx/endIdx are indices in parent.children.
 *
 * For self-closing markers (card, badge, icon), endIdx === startIdx.
 *
 * @param {import('hast').Element | import('hast').Root} parent
 * @returns {Array<{ keyword: string, params: Record<string, string>, startIdx: number, endIdx: number }>}
 */
export function collectRanges(parent) {
  const ranges = [];
  const children = parent.children;
  if (!children) return ranges;

  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    if (node.type !== "comment") continue;

    const parsed = parseComment(node.value);
    if (!parsed) continue;

    const { keyword, params } = parsed;

    // Skip closing comments (they're consumed by their opener)
    if (keyword.startsWith("/")) continue;

    const closer = CLOSERS[keyword];
    if (closer) {
      // Find matching closer
      for (let j = i + 1; j < children.length; j++) {
        const candidate = children[j];
        if (candidate.type !== "comment") continue;
        const candidateParsed = parseComment(candidate.value);
        if (candidateParsed && candidateParsed.keyword === closer) {
          ranges.push({ keyword, params, startIdx: i, endIdx: j });
          break;
        }
      }
    } else {
      // Self-closing marker (card, badge, icon)
      ranges.push({ keyword, params, startIdx: i, endIdx: i });
    }
  }

  // Filter out self-closing markers that fall inside a paired range.
  // E.g., <!-- card --> inside <!-- cardgrid --> should be handled by
  // the cardgrid transform, not as a standalone card.
  const paired = ranges.filter((r) => r.startIdx !== r.endIdx);
  return ranges.filter((r) => {
    if (r.startIdx !== r.endIdx) return true; // keep paired ranges
    return !paired.some(
      (p) => r.startIdx > p.startIdx && r.startIdx < p.endIdx
    );
  });
}
