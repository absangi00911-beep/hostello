// Path: src/app/owner/listings/[id]/edit/not-found.tsx
import Link from "next/link";

export default function EditListingNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p
        className="text-[var(--text-h4)] font-[600] text-[var(--color-text-heading)] mb-2"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Listing not found
      </p>
      <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] mb-6">
        This listing doesn't exist or you don't have permission to edit it.
      </p>
      <Link
        href="/owner/listings"
        className="inline-flex items-center h-9 px-4 rounded-[var(--radius-md)] border border-[var(--color-border-default)] text-[var(--text-body-sm)] font-[500] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-overlay)] transition-colors duration-[var(--transition-fast)]"
      >
        ← Back to listings
      </Link>
    </div>
  );
}