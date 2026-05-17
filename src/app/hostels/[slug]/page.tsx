// Path: src/app/hostels/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  ShieldCheck,
  Star,
  Users,
  Wifi,
  CheckCircle2,
  XCircle,
  User,
} from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ImageGallery } from "@/components/hostel/ImageGallery";
import { ReviewList, type ReviewData } from "@/components/hostel/ReviewList";
import { BookingPanel } from "@/components/hostel/BookingPanel";
import { HostelMap, NoMapAvailable } from "@/components/hostel/HostelMap";
import { StatusBadge, formatPKR } from "@/components/ui/shared";
import { db } from "@/lib/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* ── Data fetch — direct Prisma, no self-HTTP ───────────── */
async function getHostel(slug: string) {
  try {
    const hostel = await db.hostel.findFirst({
      where: { OR: [{ slug }, { id: slug }], status: "ACTIVE" },
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
}

/* ── Metadata ────────────────────────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hostel = await getHostel(slug);
  if (!hostel) return { title: "Hostel not found" };
  return {
    title: hostel.name,
    description: hostel.description?.slice(0, 160),
    openGraph: {
      title: hostel.name,
      description: hostel.description?.slice(0, 160),
      images: hostel.coverImage ? [hostel.coverImage] : [],
    },
  };
}

/* ── Amenity icon mapping (best-effort) ─────────────────── */
function AmenityIcon({ name }: { name: string }) {
  return (
    <CheckCircle2
      size={16}
      strokeWidth={1.5}
      className="text-[var(--color-action)] shrink-0 mt-0.5"
      aria-hidden="true"
    />
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default async function HostelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hostel = await getHostel(slug);

  if (!hostel) notFound();

  const reviews: ReviewData[] = (hostel.reviews ?? []).map((review: any) => ({
    ...review,
    createdAt: review.createdAt instanceof Date ? review.createdAt.toISOString() : review.createdAt,
    repliedAt: review.repliedAt instanceof Date ? review.repliedAt.toISOString() : review.repliedAt,
  }));
  const rooms = hostel.rooms_rel ?? [];

  return (
    <PublicLayout noFooter={false}>
      {/* ── Image gallery — full width, no sidebar ──────── */}
      <ImageGallery
        images={hostel.images ?? []}
        hostelName={hostel.name}
      />

      {/* ── Main layout: 8-col content + 4-col booking ─── */}
      <div className="container-app">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 py-8 pb-32 lg:pb-12">

          {/* ── LEFT: content area ─────────────────────── */}
          <div className="min-w-0">
            {/* Header */}
            <div className="mb-6">
              {/* City + status chips */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[var(--text-caption)] font-[500] text-[var(--color-text-muted)] bg-[var(--color-bg-sidebar)] border border-[var(--color-border-subtle)] px-2.5 py-0.5 rounded-full">
                  {hostel.city}{hostel.area ? `, ${hostel.area}` : ""}
                </span>
                {hostel.verified && (
                  <span className="flex items-center gap-1 text-[var(--text-caption)] font-[600] text-[var(--color-primary-deep)] bg-[var(--color-primary-faint)] px-2.5 py-0.5 rounded-full">
                    <ShieldCheck size={11} strokeWidth={1.5} aria-hidden="true" />
                    Verified
                  </span>
                )}
                <StatusBadge
                  variant={hostel.gender.toLowerCase() as "male" | "female" | "mixed"}
                />
              </div>

              {/* Hostel name — H2 */}
              <h1
                className="text-[var(--text-h2)] font-[700] text-[var(--color-text-heading)] leading-tight tracking-[-0.02em] mb-2"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {hostel.name}
              </h1>

              {/* Rating + review count */}
              {hostel.reviewCount > 0 && (
                <div className="flex items-center gap-2">
                  <Star
                    size={15}
                    strokeWidth={1.5}
                    className="text-[var(--color-primary)] fill-[var(--color-primary)]"
                    aria-hidden="true"
                  />
                  <span className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-body)]">
                    {hostel.rating.toFixed(1)}
                  </span>
                  <span className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
                    ({hostel.reviewCount} review{hostel.reviewCount !== 1 ? "s" : ""})
                  </span>
                </div>
              )}
            </div>

            {/* Owner info strip */}
            <div className="flex items-center gap-3 py-4 border-y border-[var(--color-border-subtle)] mb-6">
              <div className="h-10 w-10 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center overflow-hidden shrink-0">
                {hostel.owner.avatar ? (
                  <Image
                    src={hostel.owner.avatar}
                    alt={hostel.owner.name}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                ) : (
                  <User size={18} strokeWidth={1.5} className="text-[var(--color-primary-deep)]" aria-hidden="true" />
                )}
              </div>
              <div>
                <p className="text-[var(--text-body-sm)] font-[500] text-[var(--color-text-heading)]">
                  Listed by {hostel.owner.name}
                </p>
                <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
                  {hostel.owner._count?.hostels ?? 1} listing{hostel.owner._count?.hostels !== 1 ? "s" : ""} on HostelLo
                </p>
              </div>
            </div>

            {/* Tabs: Details / Rooms / Reviews / Location */}
            <Tabs defaultValue="details">
              <TabsList className="flex w-full border-b border-[var(--color-border-subtle)] bg-transparent p-0 mb-6 gap-0 rounded-none h-auto">
                {["details", "rooms", "reviews", "location"].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="
                      flex-1 sm:flex-none h-11 px-4 rounded-none border-b-2 border-transparent
                      text-[var(--text-body-sm)] font-[400] text-[var(--color-text-muted)]
                      capitalize transition-all duration-[var(--transition-fast)]
                      data-[state=active]:border-[var(--color-primary)]
                      data-[state=active]:text-[var(--color-text-heading)]
                      data-[state=active]:font-[600]
                      hover:text-[var(--color-text-body)]
                      focus-visible:outline-none
                    "
                  >
                    {tab}
                    {tab === "reviews" && hostel.reviewCount > 0 && (
                      <span className="ml-1.5 text-[var(--text-caption)] text-[var(--color-text-muted)]">
                        ({hostel.reviewCount})
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* ── Details tab ─────────────────────────── */}
              <TabsContent value="details" className="mt-0">
                {/* Description */}
                <p className="text-[var(--text-body)] text-[var(--color-text-body)] leading-relaxed mb-8 max-w-[68ch]">
                  {hostel.description}
                </p>

                {/* Amenities grid */}
                {hostel.amenities?.length > 0 && (
                  <div className="mb-8">
                    <h2
                      className="text-[var(--text-h5)] font-[600] text-[var(--color-text-heading)] mb-4"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      Amenities
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {hostel.amenities.map((amenity: string) => (
                        <div key={amenity} className="flex items-start gap-2.5">
                          <AmenityIcon name={amenity} />
                          <span className="text-[var(--text-body-sm)] text-[var(--color-text-body)]">
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
                      className="text-[var(--text-h5)] font-[600] text-[var(--color-text-heading)] mb-4"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      House rules
                    </h2>
                    <ul className="space-y-2.5" role="list">
                      {hostel.rules.map((rule: string) => (
                        <li key={rule} className="flex items-start gap-2.5">
                          <XCircle
                            size={16}
                            strokeWidth={1.5}
                            className="text-[var(--color-text-muted)] shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span className="text-[var(--text-body-sm)] text-[var(--color-text-body)]">
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
                  <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] py-8">
                    No room details added yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto -mx-4 px-4">
                    <table
                      className="w-full min-w-[480px] border-collapse"
                      aria-label="Room types and availability"
                    >
                      <thead>
                        <tr className="border-b border-[var(--color-border-default)]">
                          {["Room type", "Capacity", "Price / month", "Available", ""].map((h) => (
                            <th
                              key={h}
                              className="py-3 pr-4 text-left text-[var(--text-label)] font-[600] text-[var(--color-text-muted)] whitespace-nowrap"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rooms.map((room: any) => (
                          <tr
                            key={room.id}
                            className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-overlay)] transition-colors duration-[var(--transition-fast)]"
                          >
                            <td className="py-4 pr-4">
                              <p className="text-[var(--text-body-sm)] font-[500] text-[var(--color-text-heading)]">
                                {room.name}
                              </p>
                              {room.description && (
                                <p className="text-[var(--text-caption)] text-[var(--color-text-muted)] mt-0.5">
                                  {room.description}
                                </p>
                              )}
                            </td>
                            <td className="py-4 pr-4">
                              <div className="flex items-center gap-1.5 text-[var(--text-body-sm)] text-[var(--color-text-body)]">
                                <Users size={14} strokeWidth={1.5} aria-hidden="true" />
                                {room.capacity}
                              </div>
                            </td>
                            <td className="py-4 pr-4 text-[var(--text-body-sm)] font-[600] text-[var(--color-primary-deep)] whitespace-nowrap">
                              {formatPKR(room.pricePerMonth)}
                            </td>
                            <td className="py-4 pr-4">
                              <span
                                className={`text-[var(--text-body-sm)] font-[500] ${
                                  room.available > 0
                                    ? "text-[var(--color-success)]"
                                    : "text-[var(--color-error)]"
                                }`}
                              >
                                {room.available > 0
                                  ? `${room.available} spot${room.available !== 1 ? "s" : ""}`
                                  : "Full"}
                              </span>
                            </td>
                            <td className="py-4">
                              {room.available > 0 && (
                                <span className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
                                  ↑ Use booking panel
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
          <BookingPanel
            hostelId={hostel.id}
            hostelSlug={hostel.slug}
            hostelName={hostel.name}
            ownerId={hostel.ownerId}
            basePricePerMonth={hostel.pricePerMonth}
            rooms={rooms}
          />
        </div>
      </div>
    </PublicLayout>
  );
}