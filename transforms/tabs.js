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
 */
function extractTabs(content) {
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
