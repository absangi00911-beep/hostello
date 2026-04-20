import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { HostelGallery } from "@/components/features/hostels/hostel-gallery";
import { HostelInfo } from "@/components/features/hostels/hostel-info";
import { HostelAmenities } from "@/components/features/hostels/hostel-amenities";
import { ReviewList } from "@/components/features/hostels/review-list";
import { ReviewForm } from "@/components/features/hostels/review-form";
import { AvailabilityCalendar } from "@/components/features/hostels/availability-calendar";
import { HostelMap } from "@/components/features/hostels/hostel-map";

// Re-validate each hostel page every hour in the background
export const revalidate = 3600;

// Pre-render the top 50 most-viewed hostels at build time.
export async function generateStaticParams() {
  const hostels = await db.hostel.findMany({
    where: { status: "ACTIVE" },
    orderBy: { viewCount: "desc" },
    take: 50,
    select: { slug: true },
  });
  return hostels.map((h) => ({ slug: h.slug }));
}

import { BookingCard } from "@/components/features/booking/booking-card";
import { OwnerCard } from "@/components/features/hostels/owner-card";
import { SimilarHostels } from "@/components/features/hostels/similar-hostels";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getHostel(slug: string) {
  const hostel = await db.hostel.findUnique({
    where: { slug },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          avatar: true,
          phone: true,
          createdAt: true,
          _count: { select: { hostels: true } },
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      },
      rooms_rel: { orderBy: { pricePerMonth: "asc" } },
      _count: { select: { favorites: true } },
    },
  });

  if (!hostel || hostel.status !== "ACTIVE") return null;

  db.hostel
    .update({ where: { id: hostel.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  return hostel;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const hostel = await db.hostel.findUnique({
    where: { slug },
    select: { name: true, description: true, city: true, coverImage: true },
  });
  if (!hostel) return { title: "Hostel Not Found" };
  return {
    title: `${hostel.name} — ${hostel.city}`,
    description: hostel.description.slice(0, 160),
    openGraph: { images: hostel.coverImage ? [hostel.coverImage] : [] },
  };
}

export default async function HostelDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [hostel, session] = await Promise.all([getHostel(slug), auth()]);
  if (!hostel) notFound();

  const [initialIsSaved, hasCompletedStay, existingReview] = await Promise.all([
    session
      ? db.favorite
          .findUnique({
            where: { userId_hostelId: { userId: session.user.id, hostelId: hostel.id } },
            select: { id: true },
          })
          .then(Boolean)
      : Promise.resolve(false),
    session
      ? db.booking
          .findFirst({
            where: { hostelId: hostel.id, userId: session.user.id, status: "COMPLETED" },
            select: { id: true },
          })
          .then(Boolean)
      : Promise.resolve(false),
    session
      ? db.review.findUnique({
          where: { hostelId_userId: { hostelId: hostel.id, userId: session.user.id } },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  return (
    <div className="min-h-screen pt-16">
      <HostelGallery images={hostel.images} name={hostel.name} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 min-w-0 space-y-12">
            <HostelInfo
              hostel={hostel}
              favoritesCount={hostel._count.favorites}
              initialIsSaved={initialIsSaved}
            />
            <HostelAmenities amenities={hostel.amenities} rules={hostel.rules} />

            {/* Location map — shown whenever address is present */}
            <HostelMap
              name={hostel.name}
              address={hostel.address}
              latitude={hostel.latitude}
              longitude={hostel.longitude}
            />

            <AvailabilityCalendar hostelSlug={hostel.slug} />
            <ReviewList
              reviews={hostel.reviews}
              rating={hostel.rating}
              reviewCount={hostel.reviewCount}
              hostelId={hostel.id}
            />
            {hasCompletedStay && !existingReview && (
              <ReviewForm hostelId={hostel.id} hostelSlug={hostel.slug} />
            )}
          </div>

          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="lg:sticky lg:top-24 space-y-4">
              <BookingCard
                hostelId={hostel.id}
                hostelName={hostel.name}
                pricePerMonth={hostel.pricePerMonth}
                minStay={hostel.minStay}
                maxStay={hostel.maxStay ?? undefined}
                rating={hostel.rating}
                reviewCount={hostel.reviewCount}
              />
              <OwnerCard owner={hostel.owner} />
            </div>
          </div>
        </div>

        <div className="mt-16">
          <SimilarHostels
            currentSlug={hostel.slug}
            city={hostel.city}
            gender={hostel.gender}
          />
        </div>
      </div>
    </div>
  );
}