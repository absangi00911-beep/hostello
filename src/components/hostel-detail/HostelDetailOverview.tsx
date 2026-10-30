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
    <section
      aria-label="Hostel overview"
      className="hostel-detail-summary grid min-w-0 gap-[14px]"
    >
      <section
        aria-labelledby="hostel-listing-type-title"
        className="hostel-detail-listing-summary min-w-0 border-t border-line pt-[14px]"
      >
        <h2 className="m-0 mb-1.5 text-lg leading-[1.3] font-semibold tracking-[-0.02em] [overflow-wrap:anywhere]" id="hostel-listing-type-title">
          {genderLabel} in {city}
        </h2>
        <p className="m-0 flex flex-wrap items-center gap-2 text-[0.8rem] text-muted">
          <span>
            Up to {capacity} {capacity === 1 ? "resident" : "residents"}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {rooms} {rooms === 1 ? "room" : "rooms"}
          </span>
        </p>
        {area && (
          <p className="hostel-detail-area mt-2 mb-0 flex items-center gap-[7px] text-[0.78rem] text-muted">
            <MapPin aria-hidden="true" className="shrink-0" size={16} />
            <span className="min-w-0 [overflow-wrap:anywhere]">{area}</span>
          </p>
        )}
      </section>

      <div
        aria-label="Listing rating and verification"
        className="hostel-detail-trust flex flex-wrap items-center gap-[18px]"
        role="group"
      >
        {reviewCount > 0 ? (
          <div className="flex items-center gap-2 text-[0.8rem] text-ink">
            <Star aria-hidden="true" className="text-brand" fill="currentColor" size={18} />
            <strong className="text-[0.88rem] font-bold tabular-nums">{rating.toFixed(1)}</strong>
            <span className="text-muted">
              {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
            </span>
          </div>
        ) : (
          <p className="m-0 text-[0.9rem] font-semibold">New listing</p>
        )}
        {verified && (
          <div className="flex items-center gap-2 text-[0.8rem] text-muted">
            <ShieldCheck aria-hidden="true" className="shrink-0 text-brand-dark" size={19} />
            <span>Verified hostel</span>
          </div>
        )}
      </div>

      <section
        aria-labelledby="hostel-about-title"
        className="border-t border-line pt-5"
      >
        <h2 className="m-0 mb-[14px] text-[1.3125rem] leading-[1.43] font-bold" id="hostel-about-title">
          About this hostel
        </h2>
        <p className="m-0 max-w-[68ch] text-[0.92rem] leading-[1.7] whitespace-pre-line text-muted">
          {descriptionText}
        </p>
      </section>
    </section>
  );
}
