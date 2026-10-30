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
    <div className="hostel-detail-page min-h-dvh bg-white text-ink">
      <header className="border-b border-line bg-white">
        <div className="hostel-detail-header-inner mx-auto grid min-h-20 w-[min(1920px,calc(100%-var(--page-gutter-total)))] grid-cols-[minmax(0,1fr)_minmax(220px,320px)_minmax(0,1fr)] items-center gap-6 [@media(max-width:960px)]:min-h-0 [@media(max-width:960px)]:w-[min(calc(100%-var(--page-gutter-tablet)),1344px)] [@media(max-width:960px)]:grid-cols-[minmax(0,1fr)_auto] [@media(max-width:960px)]:gap-y-[10px] [@media(max-width:960px)]:py-3 [@media(max-width:720px)]:w-[min(calc(100%-var(--page-gutter-mobile)),600px)]! [@media(max-width:420px)]:w-[calc(100%-var(--page-gutter-mobile))] [&>.browse-account-actions]:justify-self-end [&_.browse-account-trigger]:px-2 [&_.browse-account-trigger]:py-1 [&_.browse-account-trigger]:pl-1 [&_.browse-sign-in]:size-[34px]">
          <Link
            className="inline-flex w-fit items-center text-xl font-[750] tracking-[-0.045em] text-brand [font-family:'Arial_Rounded_MT_Bold','Trebuchet_MS',var(--font-inter),sans-serif] [@media(max-width:960px)]:col-start-1 [@media(max-width:960px)]:row-start-1"
            href="/"
            aria-label="hostello home"
          >
            <span>hostello</span>
          </Link>
          <form
            action="/search"
            aria-label="Search for hostels by destination"
            className="hostel-detail-destination-search flex min-w-0 w-[min(100%,320px)] items-center justify-self-center gap-2 rounded-full border border-line bg-white py-1 pr-[5px] pl-[14px] focus-within:outline-2 focus-within:outline-brand focus-within:outline-offset-2 [@media(max-width:960px)]:col-span-full [@media(max-width:960px)]:row-start-2 [@media(max-width:960px)]:w-[min(100%,480px)]"
            method="get"
            role="search"
          >
            <input
              aria-label="Search by city"
              autoComplete="off"
              name="city"
              placeholder="Search destinations"
              required
              className="min-w-0 flex-1 border-0 bg-transparent py-2 text-inherit focus:outline-none"
              type="search"
            />
            <button
              aria-label="Search hostels"
              className="grid size-[34px] shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-brand text-white hover:bg-brand-dark"
              type="submit"
            >
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

      <main className="hostel-detail-main bg-white pt-[22px] pb-[72px] [@media(max-width:720px)]:pt-[18px]">
        <div className="hostel-detail-shell mx-auto w-[min(1120px,calc(100%-var(--page-gutter-total)))] [@media(max-width:960px)]:w-[min(calc(100%-var(--page-gutter-tablet)),1120px)] [@media(max-width:720px)]:w-[min(calc(100%-var(--page-gutter-mobile)),600px)]! [@media(max-width:420px)]:w-[calc(100%-var(--page-gutter-mobile))]">
          <HostelDetailGallery
            initiallySaved={isSaved}
            name={hostel.name}
            photos={photos}
            slug={hostel.slug}
          />

          <HostelDateSelectionProvider>
            <div className="hostel-detail-layout mt-[22px] grid min-w-0 grid-cols-[minmax(0,1.8fr)_minmax(320px,0.9fr)] grid-rows-[auto_1fr] items-start gap-y-[22px] [column-gap:clamp(24px,4vw,48px)] [@media(max-width:900px)]:grid-cols-1 [@media(max-width:900px)]:grid-rows-[auto_auto_1fr] [@media(max-width:900px)]:gap-7 [@media(max-width:720px)]:mt-6">
              <div className="hostel-detail-overview-column col-start-1 row-start-1 min-w-0">
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

              <div className="hostel-detail-primary-column col-start-1 row-start-2 grid min-w-0 content-start gap-6 [@media(max-width:900px)]:row-start-3">
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
