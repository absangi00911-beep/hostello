import {
  BookOpen,
  Camera,
  CircleCheck,
  Droplets,
  ShieldCheck,
  Utensils,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { formatHostelAmenity } from "@/lib/hostel-detail-presentation";

interface HostelAmenitiesSectionProps {
  amenities: string[];
}

function getAmenityIcon(amenity: string): LucideIcon {
  const normalized = amenity.toLowerCase();

  if (/wi-?fi|internet/.test(normalized)) return Wifi;
  if (/meal|kitchen|dining/.test(normalized)) return Utensils;
  if (/study|library|desk/.test(normalized)) return BookOpen;
  if (/generator|power|electric/.test(normalized)) return Zap;
  if (/water|cooler|drinking/.test(normalized)) return Droplets;
  if (/camera|cctv/.test(normalized)) return Camera;
  if (/security/.test(normalized)) return ShieldCheck;

  return CircleCheck;
}

export function HostelAmenitiesSection({
  amenities,
}: HostelAmenitiesSectionProps) {
  const amenityLabels = [
    ...new Set(
      amenities
        .map(formatHostelAmenity)
        .filter((amenity) => amenity.length > 0),
    ),
  ];

  if (amenityLabels.length === 0) return null;

  return (
    <section
      aria-labelledby="hostel-amenities-title"
      className="hostel-amenities-section border-t border-line pt-5"
      role="region"
    >
      <h2
        className="m-0 mb-3 text-xl leading-[1.35] font-semibold tracking-[-0.02em]"
        id="hostel-amenities-title"
      >
        What this place offers
      </h2>
      <ul className="hostel-amenities-list grid grid-cols-2 gap-x-6 m-0 list-none p-0 [@media(max-width:720px)]:grid-cols-1">
        {amenityLabels.map((amenity) => {
          const Icon = getAmenityIcon(amenity);

          return (
            <li
              className="flex min-w-0 items-center gap-3 border-b border-line py-2.5 text-[0.94rem] text-ink [&:nth-last-child(-n+2)]:border-b-0"
              key={amenity}
            >
              <Icon
                aria-hidden="true"
                className="shrink-0 text-brand-dark"
                size={20}
                strokeWidth={1.75}
              />
              <span>{amenity}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
