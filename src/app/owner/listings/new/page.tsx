// Path: src/app/owner/listings/new/page.tsx
import { ListingFormWizard } from "@/components/owner/ListingFormWizard";

export const metadata = { title: "Add new listing" };

export default function NewListingPage() {
  return (
    <div className="py-2">
      <div className="mb-8">
        <h1
          className="text-[var(--text-h3)] font-[700] text-[var(--color-text-heading)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Add new listing
        </h1>
        <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] mt-1">
          Complete all steps to submit your hostel for review.
        </p>
      </div>
      <ListingFormWizard mode="create" />
    </div>
  );
}
