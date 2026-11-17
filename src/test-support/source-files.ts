import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Every non-test .tsx/.ts source file under src, as { file, text }. For policy tests. */
export function readSourceFiles(extensions: readonly string[] = [".tsx"]): { file: string; text: string }[] {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return walk(path);
      const isTest = /\.test\.(ts|tsx)$/.test(path) || path.includes("test-support");
      return extensions.some((ext) => path.endsWith(ext)) && !isTest ? [path] : [];
    });
  return walk("src").map((file) => ({ file: file.replaceAll("\\", "/"), text: readFileSync(file, "utf8") }));
}

/** The JSX opening tags of the given elements, with their position, for attribute checks. */
export function openingTags(text: string, elements: readonly string[]): { tag: string; index: number }[] {
  const tags: { tag: string; index: number }[] = [];
  const start = new RegExp(`<(${elements.join("|")})\\b`, "g");
  for (let match = start.exec(text); match; match = start.exec(text)) {
    // Prose in comments ("every page's <main> ...") is not JSX.
    const lineStart = text.lastIndexOf("\n", match.index) + 1;
    if (/^\s*(\/\/|\*|\/\*)/.test(text.slice(lineStart, match.index))) continue;

    let depth = 0;
    let end = match.index + match[0].length;
    while (end < text.length) {
      const char = text[end];
      if (char === "{") depth += 1;
      else if (char === "}") depth -= 1;
      else if (char === ">" && depth === 0) break;
      end += 1;
    }
    tags.push({ tag: text.slice(match.index, end + 1), index: match.index });
  }
  return tags;
}
