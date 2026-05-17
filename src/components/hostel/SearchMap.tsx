"use client";
// Path: src/components/hostel/SearchMap.tsx

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, Star, ShieldCheck, AlertCircle } from "lucide-react";
import { formatPKR } from "@/components/ui/shared";
import type { HostelCardData } from "./HostelCard";

interface SearchMapProps {
  hostels: HostelCardData[];
  city?: string;
}

/* ── Helpers ─────────────────────────────────────────────── */
function getMappableHostels(hostels: HostelCardData[]) {
  return hostels.filter(
    (h) =>
      typeof h.latitude  === "number" && isFinite(h.latitude)  &&
      typeof h.longitude === "number" && isFinite(h.longitude)
  );
}

/** Best guess at map centre — average of all markers or a city fallback. */
function getCenter(
  hostels: HostelCardData[],
  city?: string,
): [number, number] {
  const mappable = getMappableHostels(hostels);
  if (mappable.length > 0) {
    const lat = mappable.reduce((s, h) => s + h.latitude!, 0) / mappable.length;
    const lng = mappable.reduce((s, h) => s + h.longitude!, 0) / mappable.length;
    return [lat, lng];
  }
  // City fallback centres (Pakistan)
  const CITY_CENTERS: Record<string, [number, number]> = {
    lahore:      [31.5204, 74.3587],
    karachi:     [24.8607, 67.0011],
    islamabad:   [33.6844, 73.0479],
    rawalpindi:  [33.5651, 73.0169],
    faisalabad:  [31.4504, 73.1350],
    multan:      [30.1575, 71.5249],
    peshawar:    [34.0151, 71.5249],
    quetta:      [30.1798, 66.9750],
  };
  const key = city?.toLowerCase() ?? "";
  return CITY_CENTERS[key] ?? [30.3753, 69.3451]; // Pakistan centre
}

/* ── Popup HTML ──────────────────────────────────────────── */
function buildPopupHtml(hostel: HostelCardData): string {
  const img = hostel.coverImage
    ? `<img src="${hostel.coverImage}" alt="${hostel.name}" style="width:100%;height:90px;object-fit:cover;border-radius:6px 6px 0 0;display:block;margin:0 0 8px;">`
    : "";
  const verified = hostel.verified
    ? `<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:600;color:oklch(0.52 0.14 80);background:oklch(0.95 0.05 80);padding:1px 6px;border-radius:20px;">✓ Verified</span>`
    : "";
  const rating = hostel.reviewCount > 0
    ? `<span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;color:#555;">★ ${hostel.rating.toFixed(1)} (${hostel.reviewCount})</span>`
    : "";

  return `
    <div style="width:200px;font-family:sans-serif;line-height:1.4;">
      ${img}
      <div style="padding: ${img ? "0 8px 8px" : "8px"}">
        <a href="/hostels/${hostel.slug}" style="font-size:13px;font-weight:700;color:#1a120a;text-decoration:none;display:block;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${hostel.name}
        </a>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;flex-wrap:wrap;">
          ${verified}
          ${rating}
        </div>
        <div style="font-size:14px;font-weight:700;color:oklch(0.48 0.12 68);">
          ${formatPKR(hostel.pricePerMonth)}<span style="font-size:11px;font-weight:400;color:#888;">/mo</span>
        </div>
        <a href="/hostels/${hostel.slug}" style="display:block;margin-top:8px;text-align:center;background:oklch(0.62 0.17 65);color:#fff;font-size:12px;font-weight:600;padding:5px 0;border-radius:6px;text-decoration:none;">
          View details
        </a>
      </div>
    </div>
  `.trim();
}

/* ── Component ───────────────────────────────────────────── */
export function SearchMap({ hostels, city }: SearchMapProps) {
  const mapRef        = useRef<HTMLDivElement>(null);
  const mapInstance   = useRef<any>(null);
  const markersRef    = useRef<any[]>([]);
  const [error, setError]       = useState(false);
  const [noCoords, setNoCoords] = useState(false);

  const mappable = getMappableHostels(hostels);

  useEffect(() => {
    if (!mapRef.current) return;

    // Destroy previous instance on re-render
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
      markersRef.current  = [];
    }

    async function init() {
      try {
        const L = (await import("leaflet")).default;

        // Fix webpack icon paths
        // @ts-ignore
        delete L.Icon.Default.prototype._getIconUrl;

        const center = getCenter(hostels, city);
        const zoom   = mappable.length > 0 ? (mappable.length === 1 ? 15 : 13) : 12;

        const map = L.map(mapRef.current!, {
          center,
          zoom,
          scrollWheelZoom: false,
          zoomControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        if (mappable.length === 0) {
          setNoCoords(true);
          mapInstance.current = map;
          return;
        }

        // Price label markers
        mappable.forEach((hostel) => {
          const priceLabel = `Rs.${Math.round(hostel.pricePerMonth / 1000)}k`;
          const isVerified = hostel.verified;

          const icon = L.divIcon({
            html: `
              <div style="
                display:inline-flex;align-items:center;gap:3px;
                background:${isVerified ? "oklch(0.62 0.17 65)" : "oklch(0.35 0.05 50)"};
                color:#fff;
                font-size:11px;font-weight:700;
                padding:3px 7px;
                border-radius:12px;
                border:2px solid #fff;
                box-shadow:0 2px 6px rgba(0,0,0,0.25);
                white-space:nowrap;
                cursor:pointer;
              ">${priceLabel}</div>
            `,
            className: "",
            iconAnchor: [20, 14],
            popupAnchor: [0, -16],
          });

          const marker = L.marker([hostel.latitude!, hostel.longitude!], { icon })
            .addTo(map)
            .bindPopup(buildPopupHtml(hostel), {
              maxWidth: 220,
              minWidth: 200,
              closeButton: true,
              className: "hostello-popup",
            });

          markersRef.current.push(marker);
        });

        // Fit map to all markers
        if (mappable.length > 1) {
          const group = L.featureGroup(markersRef.current);
          map.fitBounds(group.getBounds().pad(0.15));
        }

        mapInstance.current = map;
      } catch (err) {
        console.warn("[SearchMap] Leaflet failed:", err);
        setError(true);
      }
    }

    init();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markersRef.current  = [];
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostels.map((h) => h.id).join(",")]);

  // Leaflet CSS
  useEffect(() => {
    if (document.querySelector('link[href*="leaflet"]')) return;
    const link = document.createElement("link");
    link.rel   = "stylesheet";
    link.href  = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }, []);

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)]"
        style={{ height: 520, background: "var(--color-bg-sidebar)" }}
      >
        <AlertCircle size={24} strokeWidth={1.5} style={{ color: "var(--color-text-muted)" }} aria-hidden="true" />
        <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
          Map could not be loaded
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Leaflet popup custom styles */}
      <style>{`
        .hostello-popup .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .hostello-popup .leaflet-popup-content {
          margin: 0;
          width: auto !important;
        }
        .hostello-popup .leaflet-popup-tip-container {
          margin-top: -1px;
        }
      `}</style>

      {/* Map container */}
      <div
        ref={mapRef}
        role="application"
        aria-label={`Map showing ${mappable.length} hostel${mappable.length !== 1 ? "s" : ""}${city ? ` in ${city}` : ""}`}
        className="w-full rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] overflow-hidden"
        style={{ height: 520 }}
      />

      {/* No-coordinates notice overlay */}
      {noCoords && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[var(--radius-xl)] pointer-events-none"
          style={{ background: "rgba(253,248,240,0.82)" }}
        >
          <MapPin size={28} strokeWidth={1.5} style={{ color: "var(--color-text-muted)" }} aria-hidden="true" />
          <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] text-center max-w-[220px]">
            These listings don't have coordinates yet. Switch to list view to browse them.
          </p>
        </div>
      )}

      {/* Marker legend */}
      {mappable.length > 0 && (
        <div
          className="absolute bottom-3 left-3 z-[400] flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-[var(--text-caption)]"
          style={{
            background:  "var(--color-bg-card)",
            border:      "1px solid var(--color-border-subtle)",
            boxShadow:   "var(--shadow-sm)",
            color:       "var(--color-text-muted)",
          }}
        >
          <span className="flex items-center gap-1.5">
            <span
              style={{
                display:"inline-block",width:10,height:10,
                borderRadius:"50%",background:"oklch(0.62 0.17 65)",
              }}
            />
            Verified
          </span>
          <span className="flex items-center gap-1.5">
            <span
              style={{
                display:"inline-block",width:10,height:10,
                borderRadius:"50%",background:"oklch(0.35 0.05 50)",
              }}
            />
            Unverified
          </span>
          <span>{mappable.length} on map</span>
        </div>
      )}
    </div>
  );
}