import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Load Starlight icon SVG data from a resolved Starlight directory.
 * Uses readFileSync because this runs during config:setup before Vite.
 *
 * @param {string} starlightDir - Resolved path to @astrojs/starlight package root
 * @returns {Record<string, string>} icon name → SVG inner HTML
 */
export function loadStarlightIcons(starlightDir) {
  const icons = {};

  try {
    const iconsPath = join(starlightDir, "components", "Icons.ts");
    const source = readFileSync(iconsPath, "utf-8");

    // Extract icon entries: `iconName:\n  '<svg content>'`
    const iconRegex = /\b(\w[\w-]*):\s*\n?\s*'([^']+)'/g;
    let match;
    while ((match = iconRegex.exec(source)) !== null) {
      icons[match[1]] = match[2];
    }
  } catch (e) {
    console.warn(
      "[rehype-gfm-components] Could not load Starlight icons:",
      e.message
    );
  }

  // Also try file-tree-icons for seti icon set
  try {
    const ftPath = join(
      starlightDir,
      "user-components",
      "file-tree-icons.ts"
    );
    const ftSource = readFileSync(ftPath, "utf-8");
    const ftRegex = /\b(\w[\w-]*):\s*\n?\s*'([^']+)'/g;
    let ftMatch;
    while ((ftMatch = ftRegex.exec(ftSource)) !== null) {
      if (!icons[ftMatch[1]]) {
        icons[ftMatch[1]] = ftMatch[2];
      }
    }
  } catch {
    // file-tree-icons may not exist in older Starlight versions
  }

  return icons;
}
