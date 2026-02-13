/**
 * @typedef {Object} TreeEntry
 * @property {string} name
 * @property {boolean} isDirectory
 * @property {boolean} isPlaceholder
 * @property {boolean} highlight
 * @property {string} comment
 * @property {TreeEntry[]} children
 */

// Box-drawing characters used by `tree` command
const BOX_CHARS = /[│├└─┬┤┌┐┘┴┼]/g;
const HAS_BOX_CHARS = /[│├└─┬┤┌┐┘┴┼]/;

/**
 * Parse a text tree representation into a structured tree.
 * Supports both indent-based and box-drawing formats.
 *
 * @param {string} text
 * @returns {TreeEntry[]}
 */
export function parseTreeText(text) {
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];

  const hasBoxChars = lines.some((l) => HAS_BOX_CHARS.test(l));

  const entries = lines.map((line) => {
    let cleanLine;
    let depth;

    if (hasBoxChars) {
      // Box-drawing format: calculate depth from leading structure chars
      // Each level is 4 chars: "├── " or "│   " or "└── "
      const stripped = line.replace(BOX_CHARS, " ");
      const leadingSpaces = stripped.match(/^(\s*)/)[1].length;
      // First line (root) has no box chars, depth 0
      // "├── file" → strip box chars → "    file" → 4 leading spaces → depth 1
      depth = Math.floor(leadingSpaces / 4);
      cleanLine = stripped.trim();
    } else {
      // Indent-based: 2 spaces per level
      const stripped = line.replace(/^\s*/, "");
      const indent = line.length - stripped.length;
      depth = Math.floor(indent / 2);
      cleanLine = stripped.trim();
    }

    return { ...parseLine(cleanLine), depth };
  });

  return buildTree(entries);
}

/**
 * Parse a single cleaned line into entry properties.
 */
function parseLine(cleanLine) {
  // Placeholder check
  const isPlaceholder = /^(\.{3}|…)(\s|$)/.test(cleanLine);
  if (isPlaceholder) {
    return {
      name: "…",
      isDirectory: false,
      isPlaceholder: true,
      highlight: false,
      comment: "",
      children: [],
    };
  }

  let name = cleanLine;
  let comment = "";
  let highlight = false;

  // Check for #! at end (highlight shorthand)
  if (name.endsWith(" #!")) {
    name = name.slice(0, -3).trim();
    highlight = true;
  }

  // Check for # comments (double-space before #)
  const hashIdx = name.indexOf("  #");
  if (hashIdx >= 0) {
    const commentText = name.slice(hashIdx + 3).trim();
    name = name.slice(0, hashIdx).trim();
    if (commentText === "highlight" || commentText === "!") {
      highlight = true;
    } else {
      comment = commentText;
    }
  }

  const isDirectory = name.endsWith("/");

  return {
    name,
    isDirectory,
    isPlaceholder: false,
    highlight,
    comment,
    children: [],
  };
}

/**
 * Build a tree from a flat list of entries with depth info.
 */
function buildTree(entries) {
  const root = [];
  const stack = [{ children: root, depth: -1 }];

  for (const entry of entries) {
    // Pop stack until we find the parent (whose depth is less than ours)
    while (stack.length > 1 && stack[stack.length - 1].depth >= entry.depth) {
      stack.pop();
    }

    const parent = stack[stack.length - 1];
    const node = {
      name: entry.name,
      isDirectory: entry.isDirectory,
      isPlaceholder: entry.isPlaceholder,
      highlight: entry.highlight,
      comment: entry.comment,
      children: [],
    };

    parent.children.push(node);

    // If this is a directory, push it as a potential parent for deeper entries
    if (entry.isDirectory) {
      stack.push({ children: node.children, depth: entry.depth });
    }
  }

  return root;
}
