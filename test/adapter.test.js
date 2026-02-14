import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import starlightGfmComponents from "../adapters/starlight.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

describe("Starlight adapter", () => {
  it("returns an Astro integration with the correct name", () => {
    const integration = starlightGfmComponents();
    expect(integration.name).toBe("rehype-gfm-components");
    expect(integration.hooks).toBeDefined();
    expect(integration.hooks["astro:config:setup"]).toBeTypeOf("function");
  });

  it("injects CSS and tab script via astro:config:setup", () => {
    const integration = starlightGfmComponents();
    const injectScript = vi.fn();

    integration.hooks["astro:config:setup"]({ injectScript });

    expect(injectScript).toHaveBeenCalledTimes(2);

    // First call: page-ssr CSS import
    const [ssrContext, ssrPayload] = injectScript.mock.calls[0];
    expect(ssrContext).toBe("page-ssr");
    expect(ssrPayload).toContain("starlight.css");
    expect(ssrPayload).toMatch(/^import /);

    // Second call: page tab script
    const [pageContext, pagePayload] = injectScript.mock.calls[1];
    expect(pageContext).toBe("page");

    // Verify it's actually the tabs script content
    const expectedScript = readFileSync(
      join(rootDir, "scripts", "tabs.js"),
      "utf-8"
    );
    expect(pagePayload).toBe(expectedScript);
  });

  it("CSS path resolves to an existing file", () => {
    const integration = starlightGfmComponents();
    const injectScript = vi.fn();

    integration.hooks["astro:config:setup"]({ injectScript });

    const ssrPayload = injectScript.mock.calls[0][1];
    // Extract the path from: import "/absolute/path/to/starlight.css";
    const match = ssrPayload.match(/import "(.+)"/);
    expect(match).not.toBeNull();

    // Should not throw
    const css = readFileSync(match[1], "utf-8");
    expect(css.length).toBeGreaterThan(0);
  });
});
