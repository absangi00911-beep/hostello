import { describe, expect, it } from "vitest";
import { MAIN_CONTENT_ID } from "@/components/layout/SkipLink";
import { openingTags, readSourceFiles } from "./source-files";

const files = readSourceFiles();

describe("skip link target", () => {
  it(`every <main> has id="${MAIN_CONTENT_ID}", the target of the skip link`, () => {
    const missing = files.flatMap(({ file, text }) =>
      openingTags(text, ["main"])
        .filter(({ tag }) => !tag.includes(`id="${MAIN_CONTENT_ID}"`))
        .map(({ index }) => `${file}:${text.slice(0, index).split("\n").length}`),
    );
    expect(missing, `<main> without the skip-link id: ${missing.join(", ")}`).toEqual([]);
  });
});

describe("reduced motion", () => {
  it("scrolls through getScrollBehavior(), never a hard-coded smooth behaviour", () => {
    const offenders = files
      .filter(({ file }) => !file.endsWith("src/lib/scroll-behavior.ts"))
      .filter(({ text }) => /behavior:\s*["']smooth["']/.test(text))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it("only pulses skeletons for visitors who have not asked for reduced motion", () => {
    const offenders = files
      .filter(({ text }) => /(^|[\s"'`])animate-pulse\b/.test(text))
      .map(({ file }) => file);
    expect(offenders, "use motion-safe:animate-pulse").toEqual([]);
  });
});

describe("touch targets", () => {
  // Interactive elements with a fixed size under 44px. WCAG 2.2 AA asks for 24px; the
  // project's own standard is 44px, so anything smaller must be listed here on purpose.
  const SMALL =
    /\b(size-(?:5|6|7|8|9)|h-(?:5|6|7|8|9|10)|min-h-(?:5|6|7|8|9|10)|size-\[(?:1\d|2\d|3\d|40)px\]|h-\[(?:1\d|2\d|3\d|40)px\]|min-h-\[(?:1\d|2\d|3\d|40)px\])\b/;

  it("buttons and links are at least 44px, or give a small control a 44px hit area", () => {
    const offenders = files.flatMap(({ file, text }) =>
      openingTags(text, ["button", "a", "Link"])
        .filter(({ tag }) => SMALL.test(tag) && !/\b(before|after):-inset-/.test(tag))
        .map(({ index }) => `${file}:${text.slice(0, index).split("\n").length}`),
    );
    expect(offenders, `small touch targets: ${offenders.join(", ")}`).toEqual([]);
  });
});
