import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ListingForm from "@/components/features/dashboard/listing-form";

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Edit Listing - Owner Dashboard",
  description: "Edit your hostel listing",
};

export default async function EditListingPage({
  params,
}: EditListingPageProps) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "OWNER") {
    redirect("/login");
  }

  const { id } = await params;

  // Fetch the hostel
  const hostel = await db.hostel.findUnique({
    where: { id },
  });

  if (!hostel) {
    redirect("/dashboard/listings");
  }

  // Check ownership
  if (hostel.ownerId !== session.user.id) {
    redirect("/dashboard/listings");
  }

  return (
    <main>
      <ListingForm initialData={hostel} isEditing={true} />
    </main>
  );
}
