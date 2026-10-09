// Path: src/app/owner/listings/new/page.tsx
import { ListingFormWizard } from "@/components/owner/ListingFormWizard";

export const metadata = { title: "Add new listing" };

export default function NewListingPage() {
  return (
    <div className="owner-listing-form-page py-2">
      <div className="owner-form-intro mb-5">
        <p>Six short steps take your property from first details to a review-ready listing.</p>
      </div>
      <ListingFormWizard mode="create" />
    </div>
  );
}
