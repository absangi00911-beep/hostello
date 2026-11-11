import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { MobileTabNavigation } from "@/components/layout/MobileTabNavigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { auth } from "@/lib/auth/config";
import {
  buildCityIntro,
  buildCityMetadata,
  buildCityNotFoundMetadata,
  getCityCanonicalPath,
  getCityPage,
} from "@/lib/city-pages";
import { formatPkr, getStartingPrice } from "@/lib/hostel-metadata";

// One lookup per request, shared by generateMetadata and the page itself.
const getCity = cache(getCityPage);

const linkClassName =
  "inline-flex min-h-11 items-center rounded-full border border-line bg-white px-4 text-base font-semibold text-ink no-underline hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2";

function genderLabel(gender: string): string {
  if (gender === "MALE") return "Men\u2019s hostel";
  if (gender === "FEMALE") return "Women\u2019s hostel";
  return "Mixed hostel";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: param } = await params;
  const city = await getCity(param);
  return city ? buildCityMetadata(city.name, city.slug, city.facts) : buildCityNotFoundMetadata();
}

export default async function CityHostelsPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: param } = await params;
  const city = await getCity(param);
  if (!city) notFound();
  // "/hostels-in/Lahore" and "/hostels-in/lahore " collapse onto one indexable URL.
  if (param !== city.slug) permanentRedirect(getCityCanonicalPath(city.slug));

  const session = await auth();
  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        avatar: session.user.image,
        role: session.user.role,
      }
    : null;

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto w-[min(960px,calc(100%-2.5rem))] py-8 text-ink">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
          <Link className="hover:underline" href="/">
            Home
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Hostels in {city.name}</span>
        </nav>

        <h1 className="m-0 text-3xl font-bold tracking-tight">Student hostels in {city.name}</h1>
        <div className="mt-3 grid gap-2 text-base text-muted">
          {buildCityIntro(city.name, city.facts).map((paragraph) => (
            <p className="m-0" key={paragraph}>
              {paragraph}
            </p>
          ))}
        </div>

        <ul className="m-0 mt-6 grid list-none gap-3 p-0">
          {city.hostels.map((hostel) => {
            const price = getStartingPrice(hostel);
            const hasRating = hostel.reviewCount > 0 && hostel.rating > 0;
            return (
              <li key={hostel.id}>
                <Link
                  className="block rounded-2xl border border-line bg-white p-4 text-ink no-underline hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
                  href={`/hostels/${encodeURIComponent(hostel.slug)}`}
                >
                  <span className="block text-lg font-semibold">{hostel.name}</span>
                  <span className="block text-sm text-muted">
                    {[hostel.area?.trim(), genderLabel(hostel.gender)].filter(Boolean).join(" \u00b7 ")}
                  </span>
                  <span className="mt-1 block text-sm">
                    {price > 0 ? `From ${formatPkr(price)}/month` : "Price on request"}
                    {hasRating ? ` \u00b7 ${hostel.rating.toFixed(1)}/5 (${hostel.reviewCount})` : ""}
                    {hostel.verified ? " \u00b7 Verified" : ""}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mt-6">
          <Link className={linkClassName} href={`/search?city=${encodeURIComponent(city.name)}`}>
            Filter {city.name} hostels by price, gender and facilities
          </Link>
        </p>

        {city.relatedCities.length > 0 ? (
          <nav aria-label="Other cities" className="mt-8">
            <h2 className="m-0 text-lg font-semibold">Hostels in other cities</h2>
            <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">
              {city.relatedCities.map((related) => (
                <li key={related.slug}>
                  <Link className={linkClassName} href={getCityCanonicalPath(related.slug)}>
                    {related.name} ({related.hostelCount})
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </main>
      <MobileTabNavigation activeTab="explore" role={user?.role ?? null} />
    </>
  );
}
