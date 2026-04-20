"use client";

import { useState } from "react";
import { MapPin, ExternalLink } from "lucide-react";

interface HostelMapProps {
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

export function HostelMap({ name, address, latitude, longitude }: HostelMapProps) {
  const [loaded, setLoaded] = useState(false);

  const hasCoords = latitude !== null && longitude !== null;

  // Build the OpenStreetMap embed URL
  // bbox format: west,south,east,north (lng-pad, lat-pad, lng+pad, lat+pad)
  const pad = 0.006;
  const embedUrl = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${longitude! - pad},${latitude! - pad},${longitude! + pad},${latitude! + pad}&layer=mapnik&marker=${latitude},${longitude}`
    : null;

  const directionsUrl = hasCoords
    ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`
    : `https://www.google.com/maps/search/${encodeURIComponent(address + ", Pakistan")}`;

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2
          className="text-xl font-extrabold text-[var(--color-ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Location
        </h2>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-brand-700)] hover:underline"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open in maps
        </a>
      </div>

      {/* Address pill */}
      <div className="flex items-start gap-2.5 mb-4 text-sm text-[var(--color-ink-soft)]">
        <MapPin className="w-4 h-4 flex-shrink-0 text-[var(--color-muted)] mt-0.5" />
        <span>{address}</span>
      </div>

      {/* Map */}
      {embedUrl ? (
        <div className="relative w-full rounded-2xl overflow-hidden border border-[var(--color-border)]" style={{ height: 320 }}>
          {/* Skeleton shown until iframe loads */}
          {!loaded && (
            <div className="absolute inset-0 skeleton" />
          )}
          <iframe
            title={`Map showing ${name}`}
            src={embedUrl}
            width="100%"
            height="320"
            style={{ border: 0, display: "block" }}
            loading="lazy"
            onLoad={() => setLoaded(true)}
          />
        </div>
      ) : (
        /* Fallback when no coordinates are stored yet */
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-ground)]" style={{ height: 200 }}>
          <MapPin className="w-8 h-8 text-[var(--color-muted)]" />
          <p className="text-sm text-[var(--color-muted)]">Exact map coming soon</p>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[var(--color-brand-700)] hover:underline flex items-center gap-1"
          >
            Search on Google Maps <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      <p className="mt-2 text-xs text-[var(--color-muted)] text-right">
        © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="hover:underline">OpenStreetMap</a> contributors
      </p>
    </section>
  );
}