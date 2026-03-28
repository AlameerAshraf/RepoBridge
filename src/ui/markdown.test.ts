import stripAnsi from "strip-ansi";
import { describe, expect, it } from "vitest";
import { formatMarkdown } from "./markdown.js";

describe("formatMarkdown", () => {
  it("renders headings without throwing", () => {
    const raw = "# Title\n\n## Sub\n\n### Deep";
    const out = stripAnsi(formatMarkdown(raw));
    expect(out).toContain("Title");
    expect(out).toContain("Sub");
    expect(out).toContain("Deep");
  });

  it("wraps bullet lines", () => {
    const raw = "- First item\n- Second item";
    const out = stripAnsi(formatMarkdown(raw));
    expect(out).toContain("First item");
    expect(out).toContain("Second item");
  });

  it("toggles code fences", () => {
    const raw = "```\nconst x = 1;\n```";
    const out = stripAnsi(formatMarkdown(raw));
    expect(out).toContain("const x = 1");
    expect(out).toMatch(/┌─|│/);
  });

  it("formats repo citations in inline text", () => {
    const raw = "See [backend:src/api.ts] for details.";
    const out = stripAnsi(formatMarkdown(raw));
    expect(out).toContain("backend");
    expect(out).toContain("src/api.ts");
  });
});
