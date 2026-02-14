import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const GET: APIRoute = async ({ site }) => {
  const docs = await getCollection("docs");
  const siteBase = (site?.href.replace(/\/$/, "") ?? "") + import.meta.env.BASE_URL.replace(/\/$/, "");

  const lines = [
    "# rehype-gfm-components\n",
    "> Write GFM. View it on GitHub. Deploy it with Starlight. The same Markdown file works in both places.\n",
  ];

  const entries = docs
    .map((doc) => {
      const slug = doc.id === "index" ? "" : doc.id;
      const url = slug ? `${siteBase}/${slug}/` : `${siteBase}/`;
      const title = doc.data.title ?? doc.id;
      const desc = doc.data.description ?? "";
      return { url, title, desc, slug };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map(({ url, title, desc }) =>
      desc ? `- [${title}](${url}): ${desc}` : `- [${title}](${url})`
    );

  lines.push(entries.join("\n"), "");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
