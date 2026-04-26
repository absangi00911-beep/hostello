import { db } from "@/lib/db";
import { HostelCard } from "./hostel-card";

interface SimilarHostelsProps {
  currentSlug: string;
  city: string;
  gender: string;
}

export async function SimilarHostels({ currentSlug, city, gender }: SimilarHostelsProps) {
  const hostels = await db.hostel.findMany({
    where: {
      status: "ACTIVE",
      city,
      gender: gender as "MALE" | "FEMALE" | "MIXED",
      slug: { not: currentSlug },
    },
    take: 3,
    orderBy: { rating: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      area: true,
      pricePerMonth: true,
      gender: true,
      amenities: true,
      coverImage: true,
      images: true,
      verified: true,
      rating: true,
      reviewCount: true,
      createdAt: true,
      owner: { select: { id: true, name: true, avatar: true } },
    },
  });

  if (hostels.length === 0) return null;

  return (
    <section>
      <h2
        className="text-2xl font-bold text-[var(--color-text)] mb-6"
        style={{ fontFamily: "var(--font-display)" }}
      >
        More hostels in {city}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {hostels.map((hostel) => (
          <HostelCard key={hostel.id} hostel={hostel} />
        ))}
      </div>
    </section>
  );
}
