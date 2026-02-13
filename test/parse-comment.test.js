import { describe, it, expect } from "vitest";
import { parseComment } from "../lib/parse-comment.js";

describe("parseComment", () => {
  it("returns null for non-matching comments", () => {
    expect(parseComment("just a regular comment")).toBe(null);
    expect(parseComment("TODO: fix this")).toBe(null);
    expect(parseComment("")).toBe(null);
  });

  it("parses a bare keyword", () => {
    expect(parseComment(" steps ")).toEqual({
      keyword: "steps",
      params: {},
    });
  });

  it("parses a closing keyword", () => {
    expect(parseComment(" /steps ")).toEqual({
      keyword: "/steps",
      params: {},
    });
  });

  it("parses keyword with params", () => {
    expect(parseComment(" tabs synckey:pkg ")).toEqual({
      keyword: "tabs",
      params: { synckey: "pkg" },
    });
  });

  it("parses keyword with multiple params", () => {
    expect(
      parseComment(" linkbutton variant:primary icon:right-arrow ")
    ).toEqual({
      keyword: "linkbutton",
      params: { variant: "primary", icon: "right-arrow" },
    });
  });

  it("parses badge with params", () => {
    expect(parseComment(" badge variant:tip size:medium ")).toEqual({
      keyword: "badge",
      params: { variant: "tip", size: "medium" },
    });
  });

  it("parses icon:name as keyword with icon param", () => {
    expect(parseComment(" icon:rocket ")).toEqual({
      keyword: "icon",
      params: { icon: "rocket" },
    });
  });

  it("parses card with icon param", () => {
    expect(parseComment(" card icon:rocket ")).toEqual({
      keyword: "card",
      params: { icon: "rocket" },
    });
  });

  it("trims whitespace", () => {
    expect(parseComment("  steps  ")).toEqual({
      keyword: "steps",
      params: {},
    });
  });
});
