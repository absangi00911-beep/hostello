// Path: src/app/hostels/[slug]/page.tsx
import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Star,
  BedDouble,
  CheckCircle2,
  XCircle,
  User,
  MapPin,
} from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ImageGallery } from "@/components/hostel/ImageGallery";
import { ReviewList, type ReviewData } from "@/components/hostel/ReviewList";
import { BookingPanel } from "@/components/hostel/BookingPanel";
import { HostelMap, NoMapAvailable } from "@/components/hostel/HostelMap";
import { StatusBadge, formatPKR } from "@/components/ui/shared";
import { ShareButton } from "@/components/hostel/ShareButton";
import { TrustSummary } from "@/components/hostel/TrustSummary";
import { db } from "@/lib/db";
import { hostelIdOrSlugWhere } from "@/lib/hostel-service";
import { auth } from "@/lib/auth/config";
import { getAppUrl } from "@/lib/app-url";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

/* ── Data fetch — direct Prisma, no self-HTTP ───────────── */
const getHostel = cache(async (slug: string) => {
  try {
    const hostel = await db.hostel.findFirst({
      where: { ...hostelIdOrSlugWhere(slug), status: "ACTIVE" },
      include: {
        owner: { 
          select: { 
            id: true, 
            name: true, 
            avatar: true, 
            phone: true,
            _count: { select: { hostels: true } }
          } 
        },
        reviews: {
          where:   { verified: true },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
        rooms_rel: {
          where:   { available: { gt: 0 } },
          orderBy: { pricePerMonth: "asc" },
        },
      },
    });
    return hostel;
  } catch {
    return null;
  }
});

/* ── Metadata ────────────────────────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hostel = await getHostel(slug);
  if (!hostel) return { title: "Hostel not found" };
  
  const description = hostel.description?.slice(0, 160);
  const url = `${getAppUrl()}/hostels/${hostel.slug}`;

  return {
    title: hostel.name,
    description,
    openGraph: {
      type: "website",
      url,
      siteName: "HostelLo",
      title: hostel.name,
      description,
      images: hostel.coverImage
        ? [{ url: hostel.coverImage, width: 1200, height: 630, alt: hostel.name }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: hostel.name,
      description,
      images: hostel.coverImage ? [hostel.coverImage] : [],
    },
  };
}

/* ── Amenity icon mapping (best-effort) ─────────────────── */
function AmenityIcon({ name: _name }: { name: string }) {
  return (
    <CheckCircle2
      size={16}
      strokeWidth={1.5}
      className="text-[color:var(--color-action)] shrink-0 mt-0.5"
      aria-hidden="true"
    />
  );
}

/* ── Shared tab-trigger styling — was identically repeated 5x ──── */
const TAB_TRIGGER_CLS =
  "shrink-0 h-11 px-4 rounded-none border-b-2 border-transparent " +
  "text-[length:var(--text-body-sm)] font-[400] text-[color:var(--color-text-muted)] " +
  "capitalize transition-all duration-[var(--transition-fast)] " +
  "data-[state=active]:border-[var(--color-primary)] " +
  "data-[state=active]:text-[color:var(--color-text-heading)] " +
  "data-[state=active]:font-[600] " +
  "hover:text-[color:var(--color-text-body)] " +
  "focus-visible:outline-none";

/* ── Page ─────────────────────────────────────────────────── */
export default async function HostelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const currentUserRole = session?.user.role ?? null;
  const canRequestBooking = !session || currentUserRole === "STUDENT";
  const hostel = await getHostel(slug);

  if (!hostel) notFound();

  const reviews: ReviewData[] = (hostel.reviews ?? []).map((review: any) => ({
    ...review,
    createdAt: review.createdAt instanceof Date ? review.createdAt.toISOString() : review.createdAt,
    repliedAt: review.repliedAt instanceof Date ? review.repliedAt.toISOString() : review.repliedAt,
  }));
  const rooms = hostel.rooms_rel ?? [];
  const hostelUrl = `${getAppUrl()}/hostels/${hostel.slug}`;
  const ratedReviews = reviews.filter((r) => r.safety > 0);
  const avgSafety =
    ratedReviews.length > 0
      ? ratedReviews.reduce((sum, r) => sum + r.safety, 0) / ratedReviews.length
      : null;

  return (
    <PublicLayout noFooter={false}>
      <div className="container-app hostel-detail-shell">
        <header className="hostel-detail-masthead">
          <div className="hostel-detail-topline">
            <p className="hostel-detail-kicker">A HOSTELLO FIELD NOTE</p>
            <p className="hostel-detail-edition">STAYS / {hostel.city.toUpperCase()}</p>
          </div>

          <div className="hostel-detail-title-row">
            <div className="min-w-0">
              <p className="hostel-detail-location">
                <MapPin size={14} strokeWidth={1.6} aria-hidden="true" />
                {hostel.city}{hostel.area ? ` · ${hostel.area}` : ""}
              </p>
              <h1 className="hostel-detail-title">{hostel.name}</h1>
              <div className="hostel-detail-badges">
                {hostel.verified && (
                  <span className="hostel-detail-verified">
                    <ShieldCheck size={14} strokeWidth={1.6} aria-hidden="true" />
                    Verified listing
                  </span>
                )}
                <StatusBadge
                  variant={hostel.gender.toLowerCase() as "male" | "female" | "mixed"}
                />
              </div>
            </div>

            <div className="hostel-detail-actions">
              {hostel.reviewCount > 0 && (
                <div className="hostel-detail-rating" aria-label={`${hostel.rating.toFixed(1)} out of 5, ${hostel.reviewCount} reviews`}>
                  <Star size={15} strokeWidth={1.5} aria-hidden="true" />
                  <span>{hostel.rating.toFixed(1)}</span>
                  <span className="hostel-detail-review-count">
                    {hostel.reviewCount} review{hostel.reviewCount !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
              <ShareButton
                url={hostelUrl}
                name={hostel.name}
                price={hostel.pricePerMonth}
                variant="detail"
              />
            </div>
          </div>

          <div className="hostel-detail-colophon" aria-hidden="true">
            <span>ROOM TO FIND YOUR RHYTHM</span>
            <span>HOSTELLO · PAKISTAN</span>
          </div>
        </header>

        <div className="hostel-detail-gallery-frame">
          <ImageGallery images={hostel.images ?? []} hostelName={hostel.name} />
        </div>
      </div>

      {/* ── Main layout: 8-col content + 4-col booking ─── */}
      <div className="container-app">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8 lg:gap-12 py-8 pb-32 lg:pb-12">

          {/* ── LEFT: content area ─────────────────────── */}
          <div className="hostel-detail-content min-w-0">

            {/* Owner info strip */}
            <div className="flex items-center gap-3 py-4 border-y border-[var(--color-border-subtle)] mb-6">
              <Avatar className="h-10 w-10 shrink-0 bg-[var(--color-primary-light)]">
                <AvatarImage src={hostel.owner.avatar ?? undefined} alt={hostel.owner.name} />
                <AvatarFallback className="bg-transparent">
                  <User size={18} strokeWidth={1.5} className="text-[color:var(--color-primary-deep)]" aria-hidden="true" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-[length:var(--text-body-sm)] font-[500] text-[color:var(--color-text-heading)]">
                  Listed by {hostel.owner.name}
                </p>
                <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
                  {hostel.owner._count?.hostels ?? 1} listing{hostel.owner._count?.hostels !== 1 ? "s" : ""} on HostelLo
                </p>
              </div>
            </div>

            <div className="mb-8">
              <TrustSummary
                verified={hostel.verified}
                reviewCount={hostel.reviewCount}
                rating={hostel.rating}
                safetyScore={avgSafety}
                ownerName={hostel.owner.name}
                ownerListingCount={hostel.owner._count?.hostels || 1}
                availableRooms={rooms.reduce(
                  (sum: number, room: any) => sum + room.available,
                  0,
                )}
                hasLocation={Boolean(hostel.latitude && hostel.longitude)}
              />
            </div>

            {/* Tabs: Details / Rooms / Reviews / Location */}
            <Tabs defaultValue="details">
              <TabsList className="flex w-max min-w-full max-w-full justify-start overflow-x-auto border-b border-[var(--color-border-subtle)] bg-transparent p-0 mb-6 gap-0 rounded-none h-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <TabsTrigger
                  value="details"
                  className={TAB_TRIGGER_CLS}
                >
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="rooms"
                  className={TAB_TRIGGER_CLS}
                >
                  Rooms
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className={TAB_TRIGGER_CLS}
                >
                  Reviews
                  {hostel.reviewCount > 0 && (
                    <span className="ml-1.5 text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
                      ({hostel.reviewCount})
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="location"
                  className={TAB_TRIGGER_CLS}
                >
                  Location
                </TabsTrigger>
              </TabsList>

              {/* ── Details tab ─────────────────────────── */}
              <TabsContent value="details" className="mt-0">
                {/* Description */}
                <p className="text-[length:var(--text-body)] text-[color:var(--color-text-body)] leading-relaxed mb-8 max-w-[68ch]">
                  {hostel.description}
                </p>

                {/* Amenities grid */}
                {hostel.amenities?.length > 0 && (
                  <div className="mb-8">
                    <h2
                      className="text-[length:var(--text-h5)] font-[600] text-[color:var(--color-text-heading)] mb-4"

                    >
                      Amenities
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {hostel.amenities.map((amenity: string) => (
                        <div key={amenity} className="flex items-start gap-2.5">
                          <AmenityIcon name={amenity} />
                          <span className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-body)]">
                            {amenity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* House rules */}
                {hostel.rules?.length > 0 && (
                  <div>
                    <h2
                      className="text-[length:var(--text-h5)] font-[600] text-[color:var(--color-text-heading)] mb-4"

                    >
                      House rules
                    </h2>
                    <ul className="space-y-2.5" role="list">
                      {hostel.rules.map((rule: string) => (
                        <li key={rule} className="flex items-start gap-2.5">
                          <XCircle
                            size={16}
                            strokeWidth={1.5}
                            className="text-[color:var(--color-text-muted)] shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-body)]">
                            {rule}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>

              {/* ── Rooms tab ───────────────────────────── */}
              <TabsContent value="rooms" className="mt-0">
                {rooms.length === 0 ? (
                  <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)] py-8">
                    No room details added yet.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2" aria-label="Room types and availability">
                    {rooms.map((room: any) => (
                      <article
                        key={room.id}
                        className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] transition-colors duration-[var(--transition-fast)] hover:border-[var(--color-border-default)]"
                      >
                        <div className="relative aspect-[16/8] bg-[var(--color-bg-sidebar)]">
                          {room.images?.[0] ? (
                            <Image
                              src={room.images[0]}
                              alt={`${room.name} at ${hostel.name}`}
                              fill
                              sizes="(min-width: 640px) 50vw, 100vw"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[color:var(--color-text-muted)]">
                              <BedDouble size={28} strokeWidth={1.4} aria-hidden="true" />
                              <span className="sr-only">No photo available</span>
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="text-[length:var(--text-body)] font-[600] text-[color:var(--color-text-heading)]">
                                {room.name}
                              </h3>
                              <p className="mt-1 text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
                                {room.capacity} occupant{room.capacity !== 1 ? "s" : ""}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-[length:var(--text-body)] font-[700] text-[color:var(--color-primary-deep)]">
                                {formatPKR(room.pricePerMonth)}
                              </p>
                              <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">per month</p>
                            </div>
                          </div>

                          {room.description && (
                            <p className="mt-3 text-[length:var(--text-body-sm)] leading-relaxed text-[color:var(--color-text-body)]">
                              {room.description}
                            </p>
                          )}

                          <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--color-border-subtle)] pt-3">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[length:var(--text-body-sm)] font-[500] ${
                                room.available > 0
                                  ? "text-[color:var(--color-success)]"
                                  : "text-[color:var(--color-error)]"
                              }`}
                            >
                              <CheckCircle2 size={14} strokeWidth={1.7} aria-hidden="true" />
                              {room.available > 0
                                ? `${room.available} spot${room.available !== 1 ? "s" : ""} available`
                                : "Currently full"}
                            </span>
                            {room.available > 0 && canRequestBooking && (
                              <Link
                                href={`/hostels/${hostel.slug}?room=${encodeURIComponent(room.id)}#booking-panel`}
                                className="inline-flex h-8 items-center rounded-[var(--radius-md)] bg-[var(--color-action)] px-3 text-[length:var(--text-caption)] font-[600] text-[color:var(--color-text-inverse)] no-underline transition-colors hover:bg-[var(--color-action-dark)] hover:no-underline"
                              >
                                Book this room
                              </Link>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ── Reviews tab ─────────────────────────── */}
              <TabsContent value="reviews" className="mt-0">
                <ReviewList
                  reviews={reviews}
                  overallRating={hostel.rating}
                  reviewCount={hostel.reviewCount}
                />
              </TabsContent>

              {/* ── Location tab ─────────────────────────── */}
              <TabsContent value="location" className="mt-0">
                {hostel.latitude && hostel.longitude ? (
                  <HostelMap
                    latitude={hostel.latitude}
                    longitude={hostel.longitude}
                    hostelName={hostel.name}
                    address={hostel.address}
                  />
                ) : (
                  <NoMapAvailable address={hostel.address} />
                )}
              </TabsContent>

            </Tabs>
          </div>

          {/* ── RIGHT: sticky booking panel ────────────── */}
          {currentUserRole !== "ADMIN" && (
            <BookingPanel
              hostelId={hostel.id}
              hostelSlug={hostel.slug}
              hostelName={hostel.name}
              ownerId={hostel.ownerId}
              basePricePerMonth={hostel.pricePerMonth}
              cancellationPolicy={hostel.cancellationPolicy}
              rooms={rooms}
            />
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
