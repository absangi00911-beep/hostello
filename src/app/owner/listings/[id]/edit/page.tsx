// Path: src/app/owner/listings/[id]/edit/page.tsx
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { ListingFormWizard } from "@/components/owner/ListingFormWizard";

async function getHostel(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/hostels/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch { return null; }
}

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id }  = await params;
  const hostel  = await getHostel(id);

  if (!hostel) notFound();

  // Only the owner (or admin) can edit
  if (hostel.ownerId !== session?.user?.id && session?.user?.role !== "ADMIN") {
    notFound();
  }

  const initialData = {
    name:          hostel.name,
    description:   hostel.description,
    city:          hostel.city,
    area:          hostel.area ?? "",
    address:       hostel.address,
    gender:        hostel.gender,
    pricePerMonth: hostel.pricePerMonth,
    rooms:         hostel.rooms,
    capacity:      hostel.capacity,
    minStay:       hostel.minStay ?? 1,
    maxStay:       hostel.maxStay ?? "",
    latitude:      hostel.latitude ?? "",
    longitude:     hostel.longitude ?? "",
    amenities:     hostel.amenities ?? [],
    images:        hostel.images ?? [],
    coverImage:    hostel.coverImage ?? "",
    rules:         hostel.rules ?? [],
  };

  return (
    <div className="py-2">
      <div className="mb-8">
        <h1
          className="text-[var(--text-h3)] font-[700] text-[var(--color-text-heading)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Edit listing
        </h1>
        <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] mt-1">
          {hostel.name}
        </p>
      </div>
      <ListingFormWizard mode="edit" hostelId={id} initialData={initialData} />
    </div>
  );
}