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
import { BookingCard } from "@/components/features/booking/booking-card";
import { OwnerCard } from "@/components/features/hostels/owner-card";
import { SimilarHostels } from "@/components/features/hostels/similar-hostels";
import { ContactOwnerButton } from "@/components/features/hostels/contact-owner-button";
import { HostelJsonLd } from "@/components/features/hostels/hostel-json-ld";
import { PriceAlertForm } from "@/components/features/hostels/price-alert-form";

// SECURITY: This page is not statically generated because it depends on user authentication state.
// Showing cached HTML to all visitors could leak sensitive info.
// Using revalidate 60 for modest caching of public content, but personalized sections are always fresh.
export const revalidate = 60;

export async function generateStaticParams() {
  const hostels = await db.hostel.findMany({
    where: { status: "ACTIVE" },
    orderBy: { viewCount: "desc" },
    take: 50,
    select: { slug: true },
  });
  return hostels.map((h) => ({ slug: h.slug }));
}

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
          createdAt: true,
          _count: { select: { hostels: true } },
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
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

  const isLoggedIn = !!session;
  // Don't show the contact button if the session user IS the owner
  const isOwner = session?.user?.id === hostel.owner.id;

  const [
    initialIsSaved,
    hasCompletedStay,
    hasConfirmedBooking,
    existingReview,
    priceAlert,
  ] = await Promise.all([
    session
      ? db.favorite
          .findUnique({
            where: {
              userId_hostelId: { userId: session.user.id, hostelId: hostel.id },
            },
            select: { id: true },
          })
          .then(Boolean)
      : Promise.resolve(false),
    session
      ? db.booking
          .findFirst({
            where: {
              hostelId: hostel.id,
              userId: session.user.id,
              status: "COMPLETED",
            },
            select: { id: true },
          })
          .then(Boolean)
      : Promise.resolve(false),
    session
      ? db.booking
          .findFirst({
            where: {
              hostelId: hostel.id,
              userId: session.user.id,
              status: "CONFIRMED",
            },
            select: { id: true },
          })
          .then(Boolean)
      : Promise.resolve(false),
    session
      ? db.review.findUnique({
          where: {
            hostelId_userId: { hostelId: hostel.id, userId: session.user.id },
          },
          select: { id: true },
        })
      : Promise.resolve(null),
    session
      ? db.priceAlert.findUnique({
          where: {
            userId_hostelId: { userId: session.user.id, hostelId: hostel.id },
          },
          select: { id: true, targetPrice: true, active: true },
        })
      : Promise.resolve(null),
  ]);

  // SECURITY: Only fetch and expose owner phone after confirming the user has a valid booking
  // and is not the owner themselves. This prevents leaking contact info to unauthorized visitors.
  const ownerPhone =
    session && hasConfirmedBooking && !isOwner
      ? await db.user
          .findUnique({
            where: { id: hostel.owner.id },
            select: { phone: true },
          })
          .then((u) => u?.phone ?? null)
      : null;

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
            <HostelAmenities
              amenities={hostel.amenities}
              rules={hostel.rules}
            />

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

          {/* ── Sidebar ── */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="lg:sticky lg:top-24 space-y-4">
              <BookingCard
                hostelId={hostel.id}
                hostelSlug={hostel.slug}
                hostelName={hostel.name}
                pricePerMonth={hostel.pricePerMonth}
                minStay={hostel.minStay}
                maxStay={hostel.maxStay ?? undefined}
                rating={hostel.rating}
                reviewCount={hostel.reviewCount}
              />

              {/* Contact owner button — visible to logged-in non-owners */}
              {isLoggedIn && !isOwner && (
                <ContactOwnerButton
                  hostelId={hostel.id}
                  hostelName={hostel.name}
                />
              )}

              {/* Prompt unauthenticated visitors to sign in to contact */}
              {!isLoggedIn && (
                <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 text-center">
                  <p className="text-sm text-[var(--color-muted)] mb-3">
                    Have questions before booking?
                  </p>
                  <a
                    href="/login"
                    className="block w-full py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-ground)] transition-colors"
                  >
                    Sign in to message owner
                  </a>
                </div>
              )}

              {/* Price alert form — visible to logged-in users */}
              {isLoggedIn && !isOwner && (
                <PriceAlertForm
                  hostelId={hostel.id}
                  hostelName={hostel.name}
                  currentPrice={hostel.pricePerMonth}
                  existingAlert={priceAlert ?? undefined}
                />
              )}

              <OwnerCard
                owner={{ ...hostel.owner, phone: ownerPhone }}
                hasConfirmedBooking={hasConfirmedBooking && !isOwner}
              />
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

      {/* JSON-LD structured data for SEO */}
      <HostelJsonLd
        hostel={{
          id: hostel.id,
          name: hostel.name,
          description: hostel.description,
          address: hostel.address,
          city: hostel.city,
          latitude: hostel.latitude,
          longitude: hostel.longitude,
          pricePerMonth: hostel.pricePerMonth,
          rating: hostel.rating,
          reviewCount: hostel.reviewCount,
          coverImage: hostel.coverImage,
        }}
        reviews={hostel.reviews}
        url={`https://hostello.pk/hostels/${hostel.slug}`}
      />
    </div>
  );
}
