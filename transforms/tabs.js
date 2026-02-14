let tabCounter = 0;

function getIds() {
  const id = tabCounter++;
  return { panelId: "tab-panel-" + id, tabId: "tab-" + id };
}

function textContent(node) {
  if (node.type === "text") return node.value;
  if (node.children) return node.children.map(textContent).join("");
  return "";
}

/**
 * Find <details> elements in content and extract tab data.
 * Handles both parsed HAST elements (rehype-raw pipeline) and
 * raw nodes (Astro's pipeline where HTML stays unparsed).
 */
function extractTabs(content) {
  // Try parsed elements first (rehype-raw pipeline)
  const fromElements = extractTabsFromElements(content);
  if (fromElements.length > 0) return fromElements;

  // Fall back to raw nodes (Astro pipeline)
  return extractTabsFromRaw(content);
}

const DETAILS_OPEN_RE = /^<details[\s>]/i;
const SUMMARY_RE = /<summary>([\s\S]*?)<\/summary>/i;
const DETAILS_CLOSE_RE = /^<\/details\s*>/i;

/**
 * Extract tabs from parsed HAST element nodes.
 */
function extractTabsFromElements(content) {
  const tabs = [];

  for (const node of content) {
    if (node.type !== "element" || node.tagName !== "details") continue;

    const summary = node.children?.find(
      (c) => c.type === "element" && c.tagName === "summary"
    );
    const label = summary ? textContent(summary).trim() : "";
    const panelContent = (node.children || []).filter(
      (c) => !(c.type === "element" && c.tagName === "summary")
    );

    tabs.push({ label, content: panelContent });
  }

  return tabs;
}

/**
 * Extract tabs from raw nodes (Astro pipeline without rehype-raw).
 *
 * After splitCompoundRawNodes, HTML blocks are individual raw nodes:
 *   raw: "<details open>"
 *   raw: "<summary>npm</summary>"     (may be in same node as <details>)
 *   element: pre > code               (from code fence)
 *   raw: "</details>"
 */
function extractTabsFromRaw(content) {
  const tabs = [];
  let i = 0;

  while (i < content.length) {
    const node = content[i];

    if (node.type === "raw" && typeof node.value === "string") {
      const trimmed = node.value.trim();
      if (DETAILS_OPEN_RE.test(trimmed)) {
        // Summary may be in the same node or a separate one
        let label = "";
        const summaryMatch = trimmed.match(SUMMARY_RE);
        if (summaryMatch) {
          label = summaryMatch[1].trim();
        }

        // Collect content nodes until </details>
        const panelContent = [];
        i++;
        while (i < content.length) {
          const current = content[i];
          if (current.type === "raw" && typeof current.value === "string") {
            const ct = current.value.trim();
            if (DETAILS_CLOSE_RE.test(ct)) break;
            // Summary in a separate raw node
            if (!label && SUMMARY_RE.test(ct)) {
              const sm = ct.match(SUMMARY_RE);
              if (sm) label = sm[1].trim();
              i++;
              continue;
            }
          }
          // Skip whitespace-only text nodes between raw blocks
          if (current.type === "text" && !current.value.trim()) {
            i++;
            continue;
          }
          panelContent.push(current);
          i++;
        }

        tabs.push({ label, content: panelContent });
        i++; // skip </details>
        continue;
      }
    }

    i++;
  }

  return tabs;
}

/**
 * Tabs transform: converts <details>/<summary> groups into <starlight-tabs>.
 *
 * @param {import('hast').Node[]} content - Nodes between tabs markers
 * @param {Record<string, string>} params - { synckey? }
 * @returns {import('hast').Node[]}
 */
export function tabs(content, params) {
  const tabData = extractTabs(content);
  if (tabData.length === 0) return content;

  const tabIds = tabData.map(() => getIds());
  const syncKey = params.synckey;

  // Build tab list
  const tabListItems = tabData.map((tab, idx) => ({
    type: "element",
    tagName: "li",
    properties: { role: "presentation", className: ["tab"] },
    children: [
      {
        type: "element",
        tagName: "a",
        properties: {
          role: "tab",
          href: "#" + tabIds[idx].panelId,
          id: tabIds[idx].tabId,
          "aria-selected": idx === 0 ? "true" : "false",
          tabindex: idx === 0 ? 0 : -1,
        },
        children: [{ type: "text", value: tab.label }],
      },
    ],
  }));

  // Build tab panels
  const panels = tabData.map((tab, idx) => {
    const props = {
      role: "tabpanel",
      id: tabIds[idx].panelId,
      "aria-labelledby": tabIds[idx].tabId,
    };
    if (idx !== 0) props.hidden = true;
    return {
      type: "element",
      tagName: "div",
      properties: props,
      children: tab.content,
    };
  });

  // Assemble <starlight-tabs>
  const starlightTabsProps = {};
  if (syncKey) starlightTabsProps["data-sync-key"] = syncKey;

  const starlightTabs = {
    type: "element",
    tagName: "starlight-tabs",
    properties: starlightTabsProps,
    children: [
      {
        type: "element",
        tagName: "div",
        properties: { className: ["tablist-wrapper", "not-content"] },
        children: [
          {
            type: "element",
            tagName: "ul",
            properties: { role: "tablist" },
            children: tabListItems,
          },
        ],
      },
      ...panels,
      ...(syncKey
        ? [
            {
              type: "element",
              tagName: "starlight-tabs-restore",
              properties: {},
              children: [],
            },
          ]
        : []),
    ],
  };

  return [starlightTabs];
}

/** Reset counter between tests */
export function resetTabCounter() {
  tabCounter = 0;
}
