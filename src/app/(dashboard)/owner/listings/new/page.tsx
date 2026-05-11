import { ListingForm } from '@/components/dashboard/owner/listing-form';

export default function CreateListingPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Add New Listing</h1>
      <ListingForm />
    </div>
  );
}
