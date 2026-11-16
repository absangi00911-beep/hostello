import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * `unoptimized` serves an image exactly as stored. That is right for avatars (small, from
 * several hosts, and their URL can stay the same when the picture changes) and for admin
 * review screens (reviewers need the original), and wrong for listing photos, where it
 * sends multi-megabyte originals to a 144px thumbnail. This keeps the list of exceptions
 * deliberate: adding a file here is a decision, not an accident.
 */
const ALLOWED_UNOPTIMIZED = new Set([
  // Avatars
  "src/components/auth/BrowseAccountMenu.tsx",
  "src/components/hostel-detail/HostelHostSection.tsx",
  "src/components/hostel-detail/HostelReviewsSection.tsx",
  "src/components/messages/ConversationList.tsx",
  "src/components/student/ProfilePage.tsx",
  // Admin review: moderators need the original photos and verification documents
  "src/components/admin/AdminListingsPage.tsx",
  "src/components/admin/AdminVerificationsPage.tsx",
]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith(".tsx") && !path.endsWith(".test.tsx") ? [path] : [];
  });
}

describe("image optimization policy", () => {
  it("only avatars and admin review screens skip the image optimizer", () => {
    const using = sourceFiles("src")
      .filter((file) => /<Image\b[\s\S]*?\bunoptimized\b/.test(readFileSync(file, "utf8")))
      .map((file) => file.replaceAll("\\", "/"))
      .sort();

    const unexpected = using.filter((file) => !ALLOWED_UNOPTIMIZED.has(file));
    expect(unexpected, `unexpected unoptimized images: ${unexpected.join(", ")}`).toEqual([]);
  });

  it("keeps the exception list current: every listed file still needs it", () => {
    const stale = [...ALLOWED_UNOPTIMIZED].filter(
      (file) => !/<Image\b[\s\S]*?\bunoptimized\b/.test(readFileSync(file, "utf8")),
    );
    expect(stale).toEqual([]);
  });
});
