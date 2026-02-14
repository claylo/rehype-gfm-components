// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightContextualMenu from "./src/integrations/contextual-menu/index.js";
import githubAlerts from "./src/integrations/github-alerts/index.js";
import rehypeGithubEmoji from 'rehype-github-emoji';
import { rehypeGfmComponents } from "rehype-gfm-components";
import starlightGfmComponents from "rehype-gfm-components/starlight";

// https://astro.build/config
export default defineConfig({
  site: "https://claylo.github.io",
  base: "/rehype-gfm-components",
  prefetch: {
    defaultStrategy: 'viewport'
  },
  markdown: {
    rehypePlugins: [rehypeGithubEmoji, rehypeGfmComponents],
  },
  integrations: [
    starlight({
      title: "rehype-gfm-components",
      customCss: [
        "./src/styles/custom.css",
        "rehype-gfm-components/styles/starlight.css",
      ],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/claylo/rehype-gfm-components",
        },
        {
          icon: "document",
          label: "LLMs.txt",
          href: "/rehype-gfm-components/llms.txt"
        }
      ],
      markdown: {
        processedDirs: ["../docs"],
      },
      plugins: [
        starlightContextualMenu({ actions: ["copy", "view", "chatgpt", "claude"] }),
        githubAlerts(),
      ],
      sidebar: [
        {
          label: "Guides",
          autogenerate: { directory: "../docs/guides" },
        },
        {
          label: "Components",
          autogenerate: { directory: "../docs/components" },
        },
        {
          label: "Under the Hood",
          autogenerate: { directory: "../docs/plans" },
        },
      ],
    }),
    starlightGfmComponents(),
  ],
});
