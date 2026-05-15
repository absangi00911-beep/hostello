// Path: src/components/hostel/HostelMap.tsx
"use client";

import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

interface HostelMapProps {
  latitude: number;
  longitude: number;
  hostelName: string;
  address: string;
}

export function HostelMap({ latitude, longitude, hostelName, address }: HostelMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamically import Leaflet to avoid SSR issues
    async function initMap() {
      try {
        const L = (await import("leaflet")).default;

        // Fix default icon paths broken by webpack
        // @ts-ignore
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        const map = L.map(mapRef.current!, {
          center: [latitude, longitude],
          zoom: 15,
          scrollWheelZoom: false,
          zoomControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        // Amber-styled marker using a custom div icon
        const amberIcon = L.divIcon({
          html: `
            <div style="
              width: 28px; height: 28px;
              background: oklch(0.62 0.17 65);
              border: 3px solid white;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            "></div>
          `,
          className: "",
          iconSize: [28, 28],
          iconAnchor: [14, 28],
          popupAnchor: [0, -32],
        });

        L.marker([latitude, longitude], { icon: amberIcon })
          .addTo(map)
          .bindPopup(
            `<strong style="font-family:sans-serif;font-size:13px">${hostelName}</strong><br/><span style="font-size:12px;color:#666">${address}</span>`,
            { maxWidth: 220 }
          )
          .openPopup();

        mapInstanceRef.current = map;
      } catch (err) {
        console.warn("[HostelMap] Leaflet failed to load:", err);
      }
    }

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, hostelName, address]);

  // Import Leaflet CSS
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  return (
    <div className="space-y-4">
      {/* Map container */}
      <div
        ref={mapRef}
        className="w-full rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border-subtle)]"
        style={{ height: 380 }}
        role="application"
        aria-label={`Map showing location of ${hostelName}`}
      />

      {/* Address below map */}
      <div className="flex items-start gap-2.5">
        <MapPin
          size={16}
          strokeWidth={1.5}
          className="text-[var(--color-primary)] mt-0.5 shrink-0"
          aria-hidden="true"
        />
        <p className="text-[var(--text-body-sm)] text-[var(--color-text-body)]">
          {address}
        </p>
      </div>
    </div>
  );
}

/* ── Fallback when coordinates are missing ───────────────── */
export function NoMapAvailable({ address }: { address: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)]" style={{ height: 280 }}>
        <div className="text-center space-y-2">
          <MapPin size={32} strokeWidth={1.5} className="text-[var(--color-text-muted)] mx-auto" aria-hidden="true" />
          <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">Map not available</p>
        </div>
      </div>
      <div className="flex items-start gap-2.5">
        <MapPin size={16} strokeWidth={1.5} className="text-[var(--color-primary)] mt-0.5 shrink-0" aria-hidden="true" />
        <p className="text-[var(--text-body-sm)] text-[var(--color-text-body)]">{address}</p>
      </div>
    </div>
  );
}