import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { loadStarlightIcons } from "../lib/load-starlight-icons.js";
import { rehypeGfmComponents } from "../index.js";

/**
 * Starlight plugin wrapper for rehype-gfm-components.
 *
 * Loads icon SVG data from Starlight's source, registers the core rehype
 * plugin via an Astro integration, and injects the tab-switching client script.
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
        // Resolve Starlight's package dir via Node's module resolution
        // from cwd (the consuming project) so it works with linked packages too.
        const require = createRequire(join(process.cwd(), "noop.js"));
        let icons = {};
        try {
          const starlightDir = dirname(
            require.resolve("@astrojs/starlight/package.json")
          );
          icons = loadStarlightIcons(starlightDir);
        } catch {
          console.warn(
            "[rehype-gfm-components] Could not resolve @astrojs/starlight"
          );
        }

        const tabScript = readFileSync(
          join(
            dirname(new URL(import.meta.url).pathname),
            "..",
            "scripts",
            "tabs.js"
          ),
          "utf-8"
        );

        // Register the rehype plugin AND tab script via an Astro integration.
        // We use Astro's updateConfig (not Starlight's) to properly merge
        // the rehype plugin into Astro's markdown pipeline.
        addIntegration({
          name: "rehype-gfm-components",
          hooks: {
            "astro:config:setup": ({ injectScript, updateConfig: astroUpdateConfig }) => {
              astroUpdateConfig({
                markdown: {
                  rehypePlugins: [
                    [rehypeGfmComponents, { ...config, icons }],
                  ],
                },
              });
              injectScript("page", tabScript);
            },
          },
        });
      },
    },
  };
}
