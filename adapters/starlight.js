import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadStarlightIcons } from "../lib/load-starlight-icons.js";
import { rehypeGfmComponents } from "../index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Starlight plugin wrapper for rehype-gfm-components.
 *
 * Loads icon SVG data from Starlight's source, registers the core rehype
 * plugin, and injects the tab-switching client script.
 *
 * @param {Object} [config]
 * @param {string[]} [config.transforms] - Which transforms to enable (default: all)
 * @returns {Object} Starlight plugin
 */
export default function starlightGfmComponents(config = {}) {
  return {
    name: "rehype-gfm-components",
    hooks: {
      "config:setup"({ addIntegration }) {
        const icons = loadStarlightIcons(
          new URL("../", import.meta.url)
        );

        const tabScript = readFileSync(
          join(__dirname, "..", "scripts", "tabs.js"),
          "utf-8"
        );

        addIntegration({
          name: "rehype-gfm-components",
          hooks: {
            "astro:config:setup": ({ command, config: astroConfig, injectScript }) => {
              if (command !== "dev" && command !== "build") return;

              astroConfig.markdown.rehypePlugins.push([
                rehypeGfmComponents,
                { ...config, icons },
              ]);

              injectScript("page", tabScript);
            },
          },
        });
      },
    },
  };
}
