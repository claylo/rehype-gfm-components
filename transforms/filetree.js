import { parseTreeText } from "../lib/parse-tree-text.js";

function textContent(node) {
  if (node.type === "text") return node.value;
  if (node.children) return node.children.map(textContent).join("");
  return "";
}

/**
 * Simple file icon name resolver based on extension.
 * Returns a string like "seti:typescript" for the adapter to resolve.
 */
function getFileIconName(filename) {
  const ext = filename.includes(".")
    ? filename.slice(filename.lastIndexOf("."))
    : "";
  const extMap = {
    ".js": "seti:javascript",
    ".mjs": "seti:javascript",
    ".cjs": "seti:javascript",
    ".ts": "seti:typescript",
    ".tsx": "seti:typescript",
    ".json": "seti:json",
    ".md": "seti:markdown",
    ".mdx": "seti:markdown",
    ".astro": "seti:astro",
    ".css": "seti:css",
    ".html": "seti:html",
    ".yml": "seti:yml",
    ".yaml": "seti:yml",
    ".toml": "seti:config",
    ".rs": "seti:rust",
    ".py": "seti:python",
    ".sh": "seti:shell",
    ".bash": "seti:shell",
  };
  return extMap[ext] || "seti:default";
}

/**
 * Build a <li> for a file entry.
 */
function makeFileEntry(entry) {
  const classes = ["file"];
  if (entry.isPlaceholder) classes.push("empty");

  const innerSpanChildren = [];

  if (entry.isPlaceholder) {
    innerSpanChildren.push({ type: "text", value: "…" });
  } else {
    // Icon placeholder (adapter hydrates with actual SVG)
    innerSpanChildren.push({
      type: "element",
      tagName: "span",
      properties: {
        "data-gfm-icon": getFileIconName(entry.name),
        className: ["tree-icon"],
      },
      children: [],
    });
    innerSpanChildren.push({ type: "text", value: entry.name });
  }

  const entryChildren = [
    {
      type: "element",
      tagName: "span",
      properties: { className: entry.highlight ? ["highlight"] : [] },
      children: innerSpanChildren,
    },
  ];

  // Add comment if present
  if (entry.comment) {
    entryChildren.push({ type: "text", value: " " });
    entryChildren.push({
      type: "element",
      tagName: "span",
      properties: { className: ["comment"] },
      children: [{ type: "text", value: entry.comment }],
    });
  }

  return {
    type: "element",
    tagName: "li",
    properties: { className: classes },
    children: [
      {
        type: "element",
        tagName: "span",
        properties: { className: ["tree-entry"] },
        children: entryChildren,
      },
    ],
  };
}

/**
 * Build a <li> for a directory entry with collapsible details/summary.
 */
function makeDirEntry(entry) {
  const hasChildren = entry.children && entry.children.length > 0;

  const innerSpanChildren = [
    {
      type: "element",
      tagName: "span",
      properties: {
        "data-gfm-icon": "seti:folder",
        className: ["tree-icon"],
      },
      children: [],
    },
    { type: "text", value: entry.name },
  ];

  const summaryNode = {
    type: "element",
    tagName: "summary",
    properties: {},
    children: [
      {
        type: "element",
        tagName: "span",
        properties: { className: ["tree-entry"] },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: { className: entry.highlight ? ["highlight"] : [] },
            children: innerSpanChildren,
          },
        ],
      },
    ],
  };

  const childList = {
    type: "element",
    tagName: "ul",
    properties: {},
    children: hasChildren
      ? entry.children.map((child) => makeEntry(child))
      : [
          {
            type: "element",
            tagName: "li",
            properties: { className: ["file", "empty"] },
            children: [
              {
                type: "element",
                tagName: "span",
                properties: { className: ["tree-entry"] },
                children: [
                  {
                    type: "element",
                    tagName: "span",
                    properties: {},
                    children: [{ type: "text", value: "…" }],
                  },
                ],
              },
            ],
          },
        ],
  };

  return {
    type: "element",
    tagName: "li",
    properties: { className: ["directory"] },
    children: [
      {
        type: "element",
        tagName: "details",
        properties: { open: hasChildren },
        children: [summaryNode, childList],
      },
    ],
  };
}

function makeEntry(entry) {
  if (entry.isDirectory) return makeDirEntry(entry);
  return makeFileEntry(entry);
}

/**
 * FileTree transform: converts a code block (preformatted text) into
 * a Starlight-compatible <starlight-file-tree> structure.
 *
 * @param {import('hast').Node[]} content - Nodes between filetree markers
 * @param {Record<string, string>} _params
 * @returns {import('hast').Node[]}
 */
export function filetree(content, _params) {
  // Find the <pre><code> block
  let codeText = "";
  for (const node of content) {
    if (node.type === "element" && node.tagName === "pre") {
      const code = node.children?.find(
        (c) => c.type === "element" && c.tagName === "code"
      );
      if (code) {
        codeText = textContent(code);
        break;
      }
    }
  }

  if (!codeText) return content;

  const tree = parseTreeText(codeText);
  if (tree.length === 0) return content;

  const rootList = {
    type: "element",
    tagName: "ul",
    properties: {},
    children: tree.map((entry) => makeEntry(entry)),
  };

  return [
    {
      type: "element",
      tagName: "starlight-file-tree",
      properties: { className: ["not-content"], "data-pagefind-ignore": "" },
      children: [rootList],
    },
  ];
}
