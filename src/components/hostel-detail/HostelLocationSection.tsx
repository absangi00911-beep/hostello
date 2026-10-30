import { MapPin } from "lucide-react";
import { getHostelMapEmbedUrl } from "@/lib/hostel-detail-presentation";

interface HostelLocationSectionProps {
  area: string | null;
  city: string;
  latitude: number | null;
  longitude: number | null;
}

export function HostelLocationSection({
  area,
  city,
  latitude,
  longitude,
}: HostelLocationSectionProps) {
  const mapEmbedUrl = getHostelMapEmbedUrl(latitude, longitude);
  const locationLabel = area ? `${area}, ${city}` : city;

  return (
    <section
      aria-labelledby="hostel-location-title"
      className="hostel-location-section mt-0 border-t border-line pt-5"
      role="region"
    >
      <h2 id="hostel-location-title" className="mb-1.5 text-[1.25rem] font-semibold tracking-[-0.02em] text-ink">
        Where you’ll be
      </h2>
      <p className="hostel-location-label mb-3 flex items-center gap-1.5 text-[0.9rem] text-muted">
        <MapPin aria-hidden="true" className="shrink-0" size={16} />
        {locationLabel}
      </p>
      {mapEmbedUrl ? (
        <iframe
          className="hostel-location-map block h-[320px] w-full rounded-[10px] border border-line bg-surface-muted text-slate-900"
          loading="lazy"
          referrerPolicy="no-referrer"
          src={mapEmbedUrl}
          title={`Approximate map location for ${locationLabel}`}
        />
      ) : (
        <div
          className="hostel-location-map-empty grid h-[320px] w-full place-items-center rounded-[10px] border border-line bg-surface-muted p-6 text-center text-[0.9rem] text-muted"
          role="status"
        >
          A map isn’t available for this listing yet.
        </div>
      )}
      <p className="hostel-location-privacy mt-2.5 text-[0.8rem] leading-[1.5] text-muted">
        The map shows an approximate area. The exact address is shared after
        booking.
      </p>
    </section>
  );
}
