import Link from "next/link";
import { Search } from "lucide-react";
import { notFound } from "next/navigation";
import { HostelAmenitiesSection } from "@/components/hostel-detail/HostelAmenitiesSection";
import { BrowseAccountActions } from "@/components/auth/BrowseAccountActions";
import { HostelBookingCard } from "@/components/hostel-detail/HostelBookingCard";
import { HostelDetailGallery } from "@/components/hostel-detail/HostelDetailGallery";
import { HostelDetailOverview } from "@/components/hostel-detail/HostelDetailOverview";
import { HostelDateCalendar } from "@/components/hostel-detail/HostelDateCalendar";
import { HostelDateSelectionProvider } from "@/components/hostel-detail/HostelDateSelectionProvider";
import { HostelHostSection } from "@/components/hostel-detail/HostelHostSection";
import { HostelLocationSection } from "@/components/hostel-detail/HostelLocationSection";
import { HostelReviewsSection } from "@/components/hostel-detail/HostelReviewsSection";
import { HostelRoomSection } from "@/components/hostel-detail/HostelRoomSection";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { getPublicHostelDetail } from "@/lib/hostel-detail";
import { getHostelGalleryPhotos } from "@/lib/hostel-gallery";

function genderLabel(gender: string): string {
  switch (gender) {
    case "MALE":
      return "Men’s hostel";
    case "FEMALE":
      return "Women’s hostel";
    default:
      return "All genders";
  }
}

export default async function HostelDetailPage({
  params,
}: {
  params: Promise<{ param: string }>;
}) {
  const { param } = await params;
  const hostel = await getPublicHostelDetail(param);
  if (!hostel) notFound();

  const session = await auth();
  const isSaved =
    session?.user.role === "STUDENT"
      ? Boolean(
          await db.favorite.findUnique({
            where: {
              userId_hostelId: {
                userId: session.user.id,
                hostelId: hostel.id,
              },
            },
            select: { id: true },
          }),
        )
      : false;

  const photos = getHostelGalleryPhotos(
    hostel.name,
    hostel.coverImage,
    hostel.images,
    hostel.rooms_rel,
  );

  return (
    <div className="browse-home hostel-detail-page">
      <header className="browse-header hostel-detail-header">
        <div className="browse-shell hostel-detail-header-inner">
          <Link className="browse-brand" href="/" aria-label="hostello home">
            <span>hostello</span>
          </Link>
          <form
            action="/search"
            aria-label="Search for hostels by destination"
            className="hostel-detail-destination-search"
            method="get"
            role="search"
          >
            <input
              aria-label="Search by city"
              autoComplete="off"
              name="city"
              placeholder="Search destinations"
              required
              type="search"
            />
            <button aria-label="Search hostels" type="submit">
              <Search aria-hidden="true" size={18} />
            </button>
          </form>
          <BrowseAccountActions
            user={
              session?.user
                ? {
                    name: session.user.name,
                    email: session.user.email,
                    role: session.user.role,
                  }
                : null
            }
          />
        </div>
      </header>

      <main className="hostel-detail-main">
        <div className="browse-shell hostel-detail-shell">
          <HostelDetailGallery
            initiallySaved={isSaved}
            name={hostel.name}
            photos={photos}
            slug={hostel.slug}
          />

          <HostelDateSelectionProvider>
            <div className="hostel-detail-layout">
              <div className="hostel-detail-overview-column">
                <HostelDetailOverview
                  area={hostel.area}
                  capacity={hostel.capacity}
                  city={hostel.city}
                  description={hostel.description}
                  genderLabel={genderLabel(hostel.gender)}
                  rating={hostel.rating}
                  reviewCount={hostel.reviewCount}
                  rooms={hostel.rooms}
                  verified={hostel.verified}
                />
              </div>

              <HostelBookingCard
                hasCancellationPolicy={hostel.cancellationPolicy !== null}
                hostelId={hostel.id}
                maxStay={hostel.maxStay}
                minStay={hostel.minStay}
                rooms={hostel.rooms_rel}
              />

              <div className="hostel-detail-primary-column">
                <HostelRoomSection rooms={hostel.rooms_rel} />
                <HostelAmenitiesSection amenities={hostel.amenities} />
                {hostel.rooms_rel.length > 0 && (
                  <HostelDateCalendar
                    maxStay={hostel.maxStay}
                    minStay={hostel.minStay}
                  />
                )}
                <HostelReviewsSection
                  rating={hostel.rating}
                  reviewCount={hostel.reviewCount}
                  reviews={hostel.reviews}
                  reviewCategoryRatings={hostel.reviewCategoryRatings}
                />
              </div>
            </div>
          </HostelDateSelectionProvider>
          <HostelLocationSection
            area={hostel.area}
            city={hostel.city}
            latitude={hostel.latitude}
            longitude={hostel.longitude}
          />
          <HostelHostSection
            host={{
              name: hostel.owner.name,
              avatar: hostel.owner.avatar,
              bio: hostel.owner.bio,
              city: hostel.owner.city,
              createdAt: hostel.owner.createdAt,
              responseSummary: hostel.owner.hostResponseSummary,
            }}
            hostelId={hostel.id}
            hostelName={hostel.name}
            rating={hostel.rating}
            reviewCount={hostel.reviewCount}
            isOwner={session?.user.id === hostel.owner.id}
            viewerRole={session?.user.role ?? null}
          />
        </div>
      </main>
    </div>
  );
}
