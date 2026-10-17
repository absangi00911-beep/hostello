import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, MapPin, Users } from "lucide-react";
import { BookingPanel } from "@/components/hostel/BookingPanel";
import { ImageGallery } from "@/components/hostel/ImageGallery";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { formatPKR } from "@/components/ui/shared";
import { getAppUrl } from "@/lib/app-url";
import { db } from "@/lib/db";
import { isBoundedRouteParam, MAX_HOSTEL_ROUTE_PARAM_LENGTH } from "@/lib/route-params";

const getRoom = cache(async (slug: string, roomId: string) =>
  db.room.findFirst({
    where: {
      id: roomId,
      hostel: { is: { slug, status: "ACTIVE" } },
    },
    include: {
      hostel: {
        select: {
          id: true,
          slug: true,
          name: true,
          ownerId: true,
          city: true,
          area: true,
          cancellationPolicy: true,
        },
      },
    },
  }),
);

type RoomPageProps = {
  params: Promise<{ slug: string; roomId: string }>;
};

export async function generateMetadata({ params }: RoomPageProps): Promise<Metadata> {
  const { slug, roomId } = await params;
  if (
    !isBoundedRouteParam(slug, MAX_HOSTEL_ROUTE_PARAM_LENGTH) ||
    !isBoundedRouteParam(roomId)
  ) {
    return { title: "Room not found" };
  }

  const room = await getRoom(slug, roomId);
  if (!room) return { title: "Room not found" };

  const description =
    room.description || `${room.name} at ${room.hostel.name} in ${room.hostel.city}.`;
  const url = `${getAppUrl()}/hostels/${room.hostel.slug}/rooms/${encodeURIComponent(room.id)}`;

  return {
    title: `${room.name} | ${room.hostel.name}`,
    description: description.slice(0, 160),
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: "HostelLo",
      title: `${room.name} | ${room.hostel.name}`,
      description: description.slice(0, 160),
      images: room.images[0]
        ? [{ url: room.images[0], alt: `${room.name} at ${room.hostel.name}` }]
        : [],
    },
  };
}

export default async function RoomDetailsPage({ params }: RoomPageProps) {
  const { slug, roomId } = await params;
  if (
    !isBoundedRouteParam(slug, MAX_HOSTEL_ROUTE_PARAM_LENGTH) ||
    !isBoundedRouteParam(roomId)
  ) {
    notFound();
  }

  const room = await getRoom(slug, roomId);
  if (!room) notFound();

  const hostel = room.hostel;

  return (
    <PublicLayout>
      <div className="container-app hostel-detail-shell hostel-detail-shell--hero">
        <header className="hostel-detail-masthead">
          <Link
            href={`/hostels/${hostel.slug}`}
            className="hostel-detail-topline inline-flex w-fit items-center gap-2 no-underline hover:no-underline"
          >
            <ArrowLeft size={15} strokeWidth={1.7} aria-hidden="true" />
            Back to {hostel.name}
          </Link>
          <div className="hostel-detail-title-row">
            <div className="min-w-0">
              <p className="hostel-detail-location">
                <MapPin size={14} strokeWidth={1.6} aria-hidden="true" />
                {hostel.city}{hostel.area ? ` · ${hostel.area}` : ""}
              </p>
              <p className="hostel-detail-kicker">ROOM DETAILS</p>
              <h1 className="hostel-detail-title">{room.name}</h1>
            </div>
            <div className="text-right">
              <p className="text-[length:var(--text-h4)] font-[700] text-white">
                {formatPKR(room.pricePerMonth)}
              </p>
              <p className="text-[length:var(--text-body-sm)] text-white/80">per month</p>
            </div>
          </div>
        </header>
      </div>

      <div className="container-app py-8 pb-20">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-8">
            <section aria-label={`${room.name} photos`}>
              <div className="hostel-detail-gallery-frame">
                <ImageGallery
                  images={room.images ?? []}
                  hostelName={`${room.name} at ${hostel.name}`}
                />
              </div>
            </section>

            <section aria-labelledby="room-description-heading">
              <h2
                id="room-description-heading"
                className="text-[length:var(--text-h4)] font-[600] text-[color:var(--color-text-heading)]"
              >
                About this room
              </h2>
              <p className="mt-3 whitespace-pre-line text-[length:var(--text-body)] leading-relaxed text-[color:var(--color-text-body)]">
                {room.description || "Room details have not been added yet."}
              </p>
            </section>

            <section aria-labelledby="room-facilities-heading">
              <h2
                id="room-facilities-heading"
                className="text-[length:var(--text-h4)] font-[600] text-[color:var(--color-text-heading)]"
              >
                Room facilities
              </h2>
              {room.facilities.length > 0 ? (
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {room.facilities.map((facility) => (
                    <li
                      key={facility}
                      className="flex items-start gap-2 text-[length:var(--text-body-sm)] text-[color:var(--color-text-body)]"
                    >
                      <CheckCircle2
                        size={16}
                        strokeWidth={1.6}
                        className="mt-0.5 shrink-0 text-[color:var(--color-action)]"
                        aria-hidden="true"
                      />
                      {facility}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
                  No room-specific facilities have been listed.
                </p>
              )}
            </section>

            <section
              aria-label="Room capacity and availability"
              className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5 sm:grid-cols-2"
            >
              <div className="flex items-center gap-3">
                <Users size={19} className="text-[color:var(--color-primary)]" aria-hidden="true" />
                <div>
                  <p className="text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-text-heading)]">
                    Capacity
                  </p>
                  <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
                    Up to {room.capacity} occupant{room.capacity !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-text-heading)]">
                  Availability
                </p>
                <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
                  {room.available > 0
                    ? `${room.available} spot${room.available !== 1 ? "s" : ""} available`
                    : "Currently full"}
                </p>
              </div>
            </section>
          </div>

          <aside className="min-w-0">
            {room.available > 0 ? (
              <BookingPanel
                hostelId={hostel.id}
                hostelSlug={hostel.slug}
                hostelName={`${hostel.name} · ${room.name}`}
                ownerId={hostel.ownerId}
                basePricePerMonth={room.pricePerMonth}
                rooms={[room]}
                cancellationPolicy={hostel.cancellationPolicy}
              />
            ) : (
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-6">
                <p className="font-[600] text-[color:var(--color-text-heading)]">
                  This room is currently full
                </p>
                <p className="mt-2 text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
                  Check the hostel page for other rooms that may be available.
                </p>
                <Link
                  href={`/hostels/${hostel.slug}`}
                  className="mt-4 inline-flex min-h-11 items-center text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-primary-deep)]"
                >
                  View other rooms
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </PublicLayout>
  );
}
