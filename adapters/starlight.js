import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Astro integration for rehype-gfm-components in Starlight sites.
 *
 * Injects component CSS and the tab-switching client script.
 * The rehype plugin itself must be added to the static markdown config
 * because Astro's updateConfig does not merge rehypePlugins for content
 * collection processing.
 *
 * Usage in astro.config.mjs:
 *   import { rehypeGfmComponents } from "rehype-gfm-components";
 *   import starlightGfmComponents from "rehype-gfm-components/starlight";
 *   export default defineConfig({
 *     markdown: { rehypePlugins: [rehypeGfmComponents] },
 *     integrations: [starlight({...}), starlightGfmComponents()],
 *   });
 *
 * @returns {import('astro').AstroIntegration}
 */
export default function starlightGfmComponents() {
  return {
    name: "rehype-gfm-components",
    hooks: {
      "astro:config:setup"({ injectScript }) {
        const tabScript = readFileSync(
          join(__dirname, "..", "scripts", "tabs.js"),
          "utf-8"
        );

        // Resolve the absolute path to our CSS file for Vite to process.
        const cssPath = join(__dirname, "..", "styles", "starlight.css");

        // Import component CSS so Vite bundles it with the page.
        injectScript("page-ssr", `import ${JSON.stringify(cssPath)};`);
        injectScript("page", tabScript);
      },
    },
  };
}
