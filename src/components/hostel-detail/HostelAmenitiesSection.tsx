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
      className="hostel-amenities-section"
      role="region"
    >
      <h2 id="hostel-amenities-title">What this place offers</h2>
      <ul className="hostel-amenities-list">
        {amenityLabels.map((amenity) => {
          const Icon = getAmenityIcon(amenity);

          return (
            <li key={amenity}>
              <Icon aria-hidden="true" size={20} strokeWidth={1.75} />
              <span>{amenity}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
