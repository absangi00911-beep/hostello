import { MapPin, ShieldCheck, Star } from "lucide-react";

interface HostelDetailOverviewProps {
  area: string | null;
  capacity: number;
  city: string;
  description: string;
  genderLabel: string;
  rating: number;
  reviewCount: number;
  rooms: number;
  verified: boolean;
}
export function HostelDetailOverview({
  area,
  capacity,
  city,
  description,
  genderLabel,
  rating,
  reviewCount,
  rooms,
  verified,
}: HostelDetailOverviewProps) {
  const descriptionText =
    description.trim() || "The host has not added a description yet.";

  return (
    <section className="hostel-detail-summary" aria-label="Hostel overview">
      <section
        aria-labelledby="hostel-listing-type-title"
        className="hostel-detail-listing-summary"
      >
        <h2 id="hostel-listing-type-title">
          {genderLabel} in {city}
        </h2>
        <p className="hostel-detail-facts-line">
          <span>
            Up to {capacity} {capacity === 1 ? "resident" : "residents"}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {rooms} {rooms === 1 ? "room" : "rooms"}
          </span>
        </p>
        {area && (
          <p className="hostel-detail-area">
            <MapPin aria-hidden="true" size={16} />
            <span>{area}</span>
          </p>
        )}
      </section>

      <div
        aria-label="Listing rating and verification"
        className="hostel-detail-trust"
        role="group"
      >
        {reviewCount > 0 ? (
          <div className="hostel-detail-rating">
            <Star aria-hidden="true" fill="currentColor" size={18} />
            <strong>{rating.toFixed(1)}</strong>
            <span>
              {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
            </span>
          </div>
        ) : (
          <p className="hostel-detail-new-listing">New listing</p>
        )}
        {verified && (
          <div className="hostel-detail-verified-summary">
            <ShieldCheck aria-hidden="true" size={19} />
            <span>Verified hostel</span>
          </div>
        )}
      </div>

      <section
        aria-labelledby="hostel-about-title"
        className="hostel-detail-overview-section"
      >
        <h2 id="hostel-about-title">About this hostel</h2>
        <p>{descriptionText}</p>
      </section>
    </section>
  );
}
