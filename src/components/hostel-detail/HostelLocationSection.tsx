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
      className="hostel-location-section"
      role="region"
    >
      <h2 id="hostel-location-title">Where you’ll be</h2>
      <p className="hostel-location-label">
        <MapPin aria-hidden="true" size={16} />
        {locationLabel}
      </p>
      {mapEmbedUrl ? (
        <iframe
          className="hostel-location-map"
          loading="lazy"
          referrerPolicy="no-referrer"
          src={mapEmbedUrl}
          title={`Approximate map location for ${locationLabel}`}
        />
      ) : (
        <div className="hostel-location-map-empty" role="status">
          A map isn’t available for this listing yet.
        </div>
      )}
      <p className="hostel-location-privacy">
        The map shows an approximate area. The exact address is shared after
        booking.
      </p>
    </section>
  );
}
