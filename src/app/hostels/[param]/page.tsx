import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { CityLinks } from "@/components/city/CityLinks";
import { HostelBreadcrumb } from "@/components/city/HostelBreadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { HostelloBrand } from "@/components/brand/HostelloBrand";
import { ScrollAwareSurface } from "@/components/layout/ScrollAwareSurface";
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
import {
  getPublicHostelDetail,
  projectPublicHostelDetail,
} from "@/lib/hostel-detail";
import { getHostelGalleryPhotos } from "@/lib/hostel-gallery";
import { getCityLinks } from "@/lib/city-links";
import { slugifyCity } from "@/lib/city-pages";
import { buildHostelJsonLd } from "@/lib/hostel-jsonld";
import { buildHostelMetadata, buildHostelNotFoundMetadata } from "@/lib/hostel-metadata";
import { getSiteUrl } from "@/lib/site-metadata";

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

// One lookup per request, shared by generateMetadata and the page itself.
const getHostel = cache(getPublicHostelDetail);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ param: string }>;
}): Promise<Metadata> {
  const { param } = await params;
  const hostel = await getHostel(param);
  return hostel ? buildHostelMetadata(hostel) : buildHostelNotFoundMetadata();
}

export default async function HostelDetailPage({
  params,
}: {
  params: Promise<{ param: string }>;
}) {
  const { param } = await params;
  const hostel = await getHostel(param);
  if (!hostel) notFound();
  const publicHostel = projectPublicHostelDetail(hostel);

  const [session, cityLinks] = await Promise.all([
    auth(),
    getCityLinks({ prioritySlug: slugifyCity(hostel.city) }),
  ]);
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

  const jsonLd = buildHostelJsonLd(publicHostel, getSiteUrl());

  return (
    <div className="hostel-detail-page min-h-dvh bg-white text-ink">
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      <ScrollAwareSurface
        as="header"
        className="sticky top-0 z-30 bg-white [@media(max-width:720px)]:hidden"
        scrolledClassName="shadow-[0_4px_12px_rgb(0_0_0_/_8%)]"
      >
        <div className="hostel-detail-header-inner mx-auto grid min-h-20 w-[min(1920px,calc(100%-var(--page-gutter-total)))] grid-cols-[minmax(0,1fr)_auto] items-center gap-6 [@media(max-width:960px)]:min-h-0 [@media(max-width:960px)]:w-[min(calc(100%-var(--page-gutter-tablet)),1344px)] [@media(max-width:960px)]:py-3 [@media(max-width:720px)]:w-[min(calc(100%-var(--page-gutter-mobile)),600px)]! [@media(max-width:420px)]:w-[calc(100%-var(--page-gutter-mobile))] [&_.browse-account-trigger]:px-2 [&_.browse-account-trigger]:py-1 [&_.browse-account-trigger]:pl-1 [&_.browse-sign-in]:size-[34px]">
          <HostelloBrand
            className="inline-flex w-fit items-center text-xl font-[750] tracking-[-0.045em] text-brand [font-family:'Arial_Rounded_MT_Bold','Trebuchet_MS',var(--font-inter),sans-serif]"
          />
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
      </ScrollAwareSurface>

      <main className="hostel-detail-main bg-white pt-[22px] pb-[72px] [@media(max-width:720px)]:pt-0 [@media(max-width:720px)]:pb-[calc(96px+env(safe-area-inset-bottom))]">
        <div className="hostel-detail-shell mx-auto w-[min(1120px,calc(100%-var(--page-gutter-total)))] [@media(max-width:960px)]:w-[min(calc(100%-var(--page-gutter-tablet)),1120px)] [@media(max-width:720px)]:w-full!">
          <HostelBreadcrumb city={hostel.city} name={hostel.name} />
          <HostelDetailGallery
            initiallySaved={isSaved}
            name={hostel.name}
            photos={photos}
            slug={hostel.slug}
          />

          <HostelDateSelectionProvider>
            <div className="hostel-detail-layout mt-[22px] grid min-w-0 grid-cols-[minmax(0,1.8fr)_minmax(320px,0.9fr)] grid-rows-[auto_1fr] items-start gap-y-[22px] [column-gap:clamp(24px,4vw,48px)] [@media(max-width:900px)]:grid-cols-1 [@media(max-width:900px)]:grid-rows-[auto_auto_1fr] [@media(max-width:900px)]:gap-7 [@media(max-width:720px)]:mt-0 [@media(max-width:720px)]:grid-rows-none [@media(max-width:720px)]:gap-0">
              <div className="hostel-detail-overview-column col-start-1 row-start-1 min-w-0 [@media(max-width:720px)]:[grid-column:auto] [@media(max-width:720px)]:[grid-row:auto] [@media(max-width:720px)]:px-5 [@media(max-width:720px)]:py-5">
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

              <div className="hostel-detail-host-column col-span-full row-start-1 min-w-0 [@media(min-width:901px)]:row-start-4 [@media(min-width:721px)_and_(max-width:900px)]:row-start-2 [@media(max-width:720px)]:row-start-5 [@media(max-width:720px)]:px-5">
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

              <div className="hostel-detail-primary-column col-start-1 row-start-2 grid min-w-0 content-start gap-6 [@media(max-width:900px)]:row-start-3 [@media(max-width:720px)]:px-5">
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
                {session?.user.role === "STUDENT" ? (
                  <Link
                    className="inline-flex min-h-11 items-center justify-self-start rounded-full border border-line bg-white px-4 text-base font-semibold text-ink no-underline hover:bg-surface-muted btn-secondary"
                    href={`/hostels/${encodeURIComponent(hostel.slug)}/roommates`}
                  >
                    Find a roommate for this hostel
                  </Link>
                ) : null}
              </div>

              <div className="hostel-detail-location-column col-span-full row-start-1 [@media(min-width:901px)]:row-start-3 [@media(min-width:721px)_and_(max-width:900px)]:row-start-5 [@media(max-width:720px)]:row-start-4 [@media(max-width:720px)]:px-5">
                <HostelLocationSection
                  area={hostel.area}
                  city={hostel.city}
                  latitude={publicHostel.latitude}
                  longitude={publicHostel.longitude}
                />
              </div>
            </div>
          </HostelDateSelectionProvider>
          <CityLinks cities={cityLinks} heading="Explore more student hostels" />
        </div>
      </main>
    </div>
  );
}
