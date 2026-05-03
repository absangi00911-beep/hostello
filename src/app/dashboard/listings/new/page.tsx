import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import ListingForm from "@/components/features/dashboard/listing-form";

export const metadata = {
  title: "Create Listing - Owner Dashboard",
  description: "Create a new hostel listing",
};

export default async function NewListingPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "OWNER") {
    redirect("/login");
  }

  return (
    <main>
      <ListingForm />
    </main>
  );
}
