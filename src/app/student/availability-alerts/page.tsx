import { notFound, redirect } from "next/navigation";
import { AvailabilityAlertsPage } from "@/components/student/AvailabilityAlertsPage";
import { DesktopAccountHeader } from "@/components/layout/DesktopAccountHeader";
import { MobileTabNavigation } from "@/components/layout/MobileTabNavigation";
import { auth } from "@/lib/auth/config";
import {
  buildAvailabilityAlertDestination,
  parseAvailabilityAlertPrefill,
} from "@/lib/availability-alert-prefill";

type SearchParams = Record<string, string | string[] | undefined>;

const PREFILL_KEYS = [
  "type",
  "hostelId",
  "checkIn",
  "checkOut",
  "guests",
  "q",
  "city",
  "gender",
  "minPrice",
  "maxPrice",
  "amenities",
  "verified",
  "latitude",
  "longitude",
] as const;

function toPrefillParams(searchParams: SearchParams) {
  const params = new URLSearchParams();
  for (const key of PREFILL_KEYS) {
    const value = searchParams[key];
    if (typeof value === "string") {
      params.set(key, value);
    } else if (Array.isArray(value)) {
      const values = key === "amenities" ? value.slice(0, 30) : value.slice(0, 1);
      for (const item of values) params.append(key, item);
    }
  }
  return params;
}

export default async function AvailabilityAlertsRoute({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = toPrefillParams(await searchParams);
  const initial = parseAvailabilityAlertPrefill(params);
  const destination = buildAvailabilityAlertDestination(initial);
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(destination)}`);
  }
  if (session.user.role !== "STUDENT") notFound();

  return (
    <>
      <DesktopAccountHeader
        user={{
          name: session.user.name,
          email: session.user.email,
          avatar: session.user.image,
          role: session.user.role,
        }}
      />
      <AvailabilityAlertsPage initial={initial ?? undefined} />
      <MobileTabNavigation activeTab="profile" role="STUDENT" />
    </>
  );
}
