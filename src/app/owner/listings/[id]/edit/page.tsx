// Path: src/app/owner/listings/[id]/edit/page.tsx
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { ListingFormWizard } from "@/components/owner/ListingFormWizard";
import type { Metadata } from "next";

async function getHostel(id: string) {
  return db.hostel.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    select: {
      id: true,
      name: true,
      slug: true,
      ownerId: true,
      description: true,
      city: true,
      area: true,
      address: true,
      gender: true,
      pricePerMonth: true,
      rooms: true,
      capacity: true,
      minStay: true,
      maxStay: true,
      latitude: true,
      longitude: true,
      amenities: true,
      images: true,
      coverImage: true,
      rules: true,
      status: true,
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const hostel = await getHostel(id);
  return { title: hostel ? `Edit — ${hostel.name}` : "Edit listing" };
}

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const hostel = await getHostel(id);

  if (!hostel) notFound();

  // Only the owner (or admin) can edit
  if (hostel.ownerId !== session?.user?.id && session?.user?.role !== "ADMIN") {
    notFound();
  }

  const initialData = {
    name: hostel.name,
    description: hostel.description,
    city: hostel.city,
    area: hostel.area ?? "",
    address: hostel.address,
    gender: hostel.gender as "MALE" | "FEMALE" | "MIXED",
    pricePerMonth: hostel.pricePerMonth,
    rooms: hostel.rooms,
    capacity: hostel.capacity,
    minStay: hostel.minStay ?? 1,
    maxStay: (hostel.maxStay ?? "") as number | "",
    latitude: (hostel.latitude ?? "") as number | "",
    longitude: (hostel.longitude ?? "") as number | "",
    amenities: (hostel.amenities as string[]) ?? [],
    images: (hostel.images as string[]) ?? [],
    coverImage: hostel.coverImage ?? "",
    rules: (hostel.rules as string[]) ?? [],
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
          {hostel.status === "ACTIVE" && (
            <span
              className="ml-2 inline-flex items-center h-5 px-2 rounded-full text-[10px] font-[600]"
              style={{
                background: "var(--color-success-bg)",
                color: "var(--color-success-text)",
              }}
            >
              Live
            </span>
          )}
          {hostel.status === "PENDING_REVIEW" && (
            <span
              className="ml-2 inline-flex items-center h-5 px-2 rounded-full text-[10px] font-[600]"
              style={{
                background: "var(--color-warning-bg)",
                color: "var(--color-warning-text)",
              }}
            >
              Under review
            </span>
          )}
        </p>
      </div>
      <ListingFormWizard
        mode="edit"
        hostelId={hostel.id}
        initialData={initialData}
      />
    </div>
  );
}
