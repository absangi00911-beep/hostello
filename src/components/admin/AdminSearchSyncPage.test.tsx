import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AdminSearchSyncContent } from "./AdminSearchSyncPage";

describe("AdminSearchSyncContent", () => {
  const markup = renderToStaticMarkup(
    <AdminSearchSyncContent onRun={vi.fn()} />,
  );

  it("offers all three actions with their limits", () => {
    expect(markup).toContain("Sync all listings");
    expect(markup).toContain("Sync this listing");
    expect(markup).toContain("Remove from search");
    expect(markup).toContain("twice an hour");
    expect(markup).toContain("60 times an hour");
  });

  it("is honest about what the API reports", () => {
    expect(markup).toContain("cannot show");
    expect(markup).toContain("nothing is indexed");
    expect(markup).toContain("never change a listing");
  });

  it("links back to the admin console and caps the id field", () => {
    expect(markup).toContain('href="/admin"');
    expect(markup).toContain('maxLength="64"');
  });

  it("does not show confirm steps until asked", () => {
    expect(markup).not.toContain("Yes, sync all");
    expect(markup).not.toContain("Yes, remove from search");
  });
});
