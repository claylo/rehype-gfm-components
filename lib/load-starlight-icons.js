import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Regex to extract icon entries from Starlight's TS source files.
 * Matches both quoted and unquoted keys:
 *   'icon-name': '<path .../>',
 *   iconName: '<path .../>',
 */
const ICON_RE = /(?:'([\w:-]+)'|(\w[\w-]*)):\s*\n?\s*'([^']+)'/g;

/**
 * Common documentation icons not in Starlight's built-in set.
 * These are used by card transforms (<!-- card icon:rocket -->).
 * SVG paths from Lucide (ISC license), 24x24 viewBox.
 */
const BUNDLED_ICONS = {
  rocket:
    '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09ZM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
  star:
    '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a.53.53 0 0 0 .399.29l5.164.753a.53.53 0 0 1 .294.904l-3.736 3.642a.53.53 0 0 0-.153.469l.882 5.14a.53.53 0 0 1-.77.56l-4.618-2.428a.53.53 0 0 0-.494 0L6.135 18.73a.53.53 0 0 1-.77-.56l.882-5.14a.53.53 0 0 0-.153-.47L2.358 8.922a.53.53 0 0 1 .294-.906l5.165-.752a.53.53 0 0 0 .398-.29z"/>',
  puzzle:
    '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M15.39 4.39a1 1 0 0 0 .61.92 2.5 2.5 0 0 1 0 4.38 1 1 0 0 0-.61.92V13a1 1 0 0 1-1 1h-2.39a1 1 0 0 0-.92.61 2.5 2.5 0 0 1-4.38 0A1 1 0 0 0 5.78 14H4a1 1 0 0 1-1-1v-2.39a1 1 0 0 0-.61-.92 2.5 2.5 0 0 1 0-4.38A1 1 0 0 0 3 4.39V3a1 1 0 0 1 1-1h2.39a1 1 0 0 0 .92-.61 2.5 2.5 0 0 1 4.38 0 1 1 0 0 0 .92.61H15a1 1 0 0 1 1 1v1.39ZM13 20v-1.39a1 1 0 0 1 .61-.92 2.5 2.5 0 0 0 0-4.38 1 1 0 0 1-.61-.92V11h2.39a1 1 0 0 0 .92-.61 2.5 2.5 0 0 1 4.38 0 1 1 0 0 0 .92.61H23a1 1 0 0 1 1 1v2.39a1 1 0 0 1-.61.92 2.5 2.5 0 0 0 0 4.38 1 1 0 0 1 .61.92V22a1 1 0 0 1-1 1h-2.39a1 1 0 0 0-.92.61 2.5 2.5 0 0 1-4.38 0 1 1 0 0 0-.92-.61H13z"/>',
  information:
    '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 16v-4M12 8h.01"/>',
  setting:
    '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/>',
  pencil:
    '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>',
};

/**
 * Load Starlight icon SVG data from a resolved Starlight directory.
 * Uses readFileSync because this runs during config:setup before Vite.
 *
 * @param {string} starlightDir - Resolved path to @astrojs/starlight package root
 * @returns {Record<string, string>} icon name → SVG inner HTML
 */
export function loadStarlightIcons(starlightDir) {
  // Start with bundled common icons
  const icons = { ...BUNDLED_ICONS };

  try {
    const iconsPath = join(starlightDir, "components", "Icons.ts");
    const source = readFileSync(iconsPath, "utf-8");

    let match;
    while ((match = ICON_RE.exec(source)) !== null) {
      const name = match[1] || match[2];
      icons[name] = match[3];
    }
    ICON_RE.lastIndex = 0;
  } catch {
    // Icons.ts not found — continue with bundled icons
  }

  // Also load file-tree icons (seti set) for FileTree component
  try {
    const ftPath = join(
      starlightDir,
      "user-components",
      "file-tree-icons.ts"
    );
    const ftSource = readFileSync(ftPath, "utf-8");
    // Start from FileIcons export to avoid matching extension mappings
    const exportIdx = ftSource.indexOf("export const FileIcons");
    if (exportIdx >= 0) {
      ICON_RE.lastIndex = exportIdx;
      let match;
      while ((match = ICON_RE.exec(ftSource)) !== null) {
        const name = match[1] || match[2];
        if (!icons[name]) {
          icons[name] = match[3];
        }
      }
      ICON_RE.lastIndex = 0;
    }
  } catch {
    // file-tree-icons may not exist in older Starlight versions
  }

  return icons;
}
