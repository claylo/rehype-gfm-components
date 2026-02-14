import { parseComment } from "./parse-comment.js";
import { getCommentValue } from "./comment-value.js";

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
  accordiongroup: "/accordiongroup",
};

/**
 * Try to parse a node as a comment with a recognized keyword.
 * Works with both HAST `comment` nodes and `raw` nodes containing HTML comments.
 *
 * @param {import('hast').Node} node
 * @returns {{ keyword: string, params: Record<string, string> } | null}
 */
export function parseNodeAsComment(node) {
  const value = getCommentValue(node);
  if (value === null) return null;
  return parseComment(value);
}

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
    const parsed = parseNodeAsComment(node);
    if (!parsed) continue;

    const { keyword, params } = parsed;

    // Skip closing comments (they're consumed by their opener)
    if (keyword.startsWith("/")) continue;

    const closer = CLOSERS[keyword];
    if (closer) {
      // Find matching closer
      for (let j = i + 1; j < children.length; j++) {
        const candidateParsed = parseNodeAsComment(children[j]);
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
  const paired = ranges.filter((r) => r.startIdx !== r.endIdx);
  return ranges.filter((r) => {
    if (r.startIdx !== r.endIdx) return true;
    return !paired.some(
      (p) => r.startIdx > p.startIdx && r.startIdx < p.endIdx
    );
  });
}
