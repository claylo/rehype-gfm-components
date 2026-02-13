import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Load Starlight icon SVG data from the installed package.
 * Uses readFileSync because this runs during config:setup before Vite.
 *
 * @param {URL} baseUrl - import.meta.url of the calling module for path resolution
 * @returns {Record<string, string>} icon name → SVG inner HTML
 */
export function loadStarlightIcons(baseUrl) {
  const icons = {};

  try {
    // Resolve path relative to the consuming project's node_modules
    const iconsPath = fileURLToPath(
      new URL("../node_modules/@astrojs/starlight/components/Icons.ts", baseUrl)
    );
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
    const ftPath = fileURLToPath(
      new URL(
        "../node_modules/@astrojs/starlight/user-components/file-tree-icons.ts",
        baseUrl
      )
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
