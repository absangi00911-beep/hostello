// Path: src/app/owner/listings/[id]/edit/not-found.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function EditListingNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p
        className="text-[length:var(--text-h4)] font-[600] text-[color:var(--color-text-heading)] mb-2"

      >
        Listing not found
      </p>
      <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)] mb-6">
        This listing doesn't exist or you don't have permission to edit it.
      </p>
      <Button asChild variant="outline">
        <Link href="/owner/listings">← Back to listings</Link>
      </Button>
    </div>
  );
}