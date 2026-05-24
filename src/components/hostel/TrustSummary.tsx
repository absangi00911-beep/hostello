import {
  CalendarCheck,
  MapPin,
  ShieldCheck,
  Star,
  UserCheck,
} from "lucide-react";
import { TrustCueList } from "@/components/ui/shared";

interface TrustSummaryProps {
  verified: boolean;
  reviewCount: number;
  rating: number;
  safetyScore?: number | null;
  ownerName: string;
  ownerListingCount: number;
  availableRooms: number;
  hasLocation: boolean;
}

export function TrustSummary({
  verified,
  reviewCount,
  rating,
  safetyScore,
  ownerName,
  ownerListingCount,
  availableRooms,
  hasLocation,
}: TrustSummaryProps) {
  const reviewValue =
    reviewCount > 0
      ? `${rating.toFixed(1)} from ${reviewCount} review${reviewCount !== 1 ? "s" : ""}`
      : "No verified reviews yet";
  const safetyValue =
    safetyScore != null && safetyScore > 0
      ? `Safety ${safetyScore.toFixed(1)}`
      : "Safety score not rated yet";
  const roomValue =
    availableRooms > 0
      ? `${availableRooms} room${availableRooms !== 1 ? "s" : ""} available`
      : "Ask owner for availability";

  return (
    <TrustCueList
      ariaLabel="Hostel trust summary"
      cues={[
        {
          icon: ShieldCheck,
          label: verified ? "Verified listing" : "Verification pending",
          value: verified
            ? "Reviewed before booking"
            : "Review status is not complete",
          tone: verified ? "trust" : "warning",
        },
        {
          icon: Star,
          label: "Student reviews",
          value: reviewValue,
          tone: reviewCount > 0 ? "trust" : "neutral",
        },
        {
          icon: ShieldCheck,
          label: "Safety",
          value: safetyValue,
          tone: safetyScore != null && safetyScore > 0 ? "trust" : "neutral",
        },
        {
          icon: UserCheck,
          label: "Owner",
          value: `${ownerName} - ${ownerListingCount} listing${ownerListingCount !== 1 ? "s" : ""}`,
          tone: "neutral",
        },
        {
          icon: CalendarCheck,
          label: "Availability",
          value: roomValue,
          tone: availableRooms > 0 ? "trust" : "warning",
        },
        {
          icon: MapPin,
          label: "Location",
          value: hasLocation ? "Map location added" : "Address only",
          tone: hasLocation ? "trust" : "neutral",
        },
      ]}
    />
  );
}
