import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { rehypeGfmComponents } from "../index.js";

/** Process with rehype-raw (standalone usage). */
export async function process(md, options = {}) {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeGfmComponents, options)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(md);
  return String(result);
}

/** Process WITHOUT rehype-raw (simulates Astro's pipeline). */
export async function processWithoutRaw(md, options = {}) {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeGfmComponents, options)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(md);
  return String(result);
}
