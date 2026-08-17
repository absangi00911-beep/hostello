// Path: src/components/owner/ListingLocationPicker.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { LocateFixed, MapPin } from "lucide-react";

type LeafletMap = import("leaflet").Map;
type LeafletMarker = import("leaflet").Marker;

interface ListingLocationPickerProps {
  latitude: number | "";
  longitude: number | "";
  onChange: (lat: number, lng: number) => void;
}

// Lahore — used as a sensible starting center when no pin has been placed yet.
const DEFAULT_CENTER: [number, number] = [31.5204, 74.3587];

export function ListingLocationPicker({
  latitude,
  longitude,
  onChange,
}: ListingLocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const placeMarkerRef = useRef<((lat: number, lng: number, pan?: boolean) => void) | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [locating, setLocating] = useState(false);
  const hasPin = latitude !== "" && longitude !== "";

  // Init map once. Re-reads latitude/longitude only to decide the *initial*
  // center — after that, the map owns marker position via click/drag, and
  // pushes changes back up through onChange rather than re-syncing from props.
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    async function initMap() {
      try {
        const L = (await import("leaflet")).default;

        // @ts-expect-error Leaflet keeps this private helper on the default icon prototype.
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        const startCenter: [number, number] =
          latitude !== "" && longitude !== "" ? [latitude, longitude] : DEFAULT_CENTER;

        const map = L.map(mapRef.current!, {
          center: startCenter,
          zoom: latitude !== "" && longitude !== "" ? 15 : 12,
          scrollWheelZoom: false,
          zoomControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        const brandIcon = L.divIcon({
          html: `
            <div style="
              width: 28px; height: 28px;
              background: var(--color-primary);
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

        function placeMarker(lat: number, lng: number, pan = false) {
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            markerRef.current = L.marker([lat, lng], {
              icon: brandIcon,
              draggable: true,
            }).addTo(map);
            markerRef.current.on("dragend", () => {
              const pos = markerRef.current!.getLatLng();
              onChangeRef.current(
                Math.round(pos.lat * 1e6) / 1e6,
                Math.round(pos.lng * 1e6) / 1e6
              );
            });
          }
          if (pan) map.setView([lat, lng], Math.max(map.getZoom(), 15));
        }

        if (latitude !== "" && longitude !== "") {
          placeMarker(latitude, longitude);
        }

        map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
          const { lat, lng } = e.latlng;
          placeMarker(lat, lng);
          onChangeRef.current(Math.round(lat * 1e6) / 1e6, Math.round(lng * 1e6) / 1e6);
        });

        mapInstanceRef.current = map;
        placeMarkerRef.current = placeMarker;
      } catch (err) {
        console.warn("[ListingLocationPicker] Leaflet failed to load:", err);
      }
    }

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        placeMarkerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Leaflet CSS
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error("Location isn't available in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 1e6) / 1e6;
        const lng = Math.round(pos.coords.longitude * 1e6) / 1e6;
        placeMarkerRef.current?.(lat, lng, true);
        onChangeRef.current(lat, lng);
        setLocating(false);
      },
      () => {
        toast.error("Couldn't get your location. Place the pin manually instead.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div
          ref={mapRef}
          className="w-full rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border-default)]"
          style={{ height: 320 }}
          role="application"
          aria-label="Click or drag the pin to set your hostel's exact location"
        />
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="absolute top-3 right-3 z-[1000] inline-flex items-center gap-1.5 rounded-full bg-[var(--color-bg-card)] px-3 py-1.5 text-[var(--text-caption)] font-[600] text-[var(--color-text-body)] shadow-[var(--shadow-md)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-overlay)] transition-colors duration-[var(--transition-fast)] disabled:opacity-60"
        >
          <LocateFixed
            size={13}
            strokeWidth={2}
            className={locating ? "animate-pulse" : ""}
            aria-hidden="true"
          />
          {locating ? "Locating…" : "Use current location"}
        </button>
      </div>

      <div className="flex items-start gap-2.5">
        <MapPin
          size={15}
          strokeWidth={1.5}
          className="text-[var(--color-primary)] mt-0.5 shrink-0"
          aria-hidden="true"
        />
        <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
          {hasPin
            ? `Pin set at ${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}. Drag it or click elsewhere on the map to adjust.`
            : "Click anywhere on the map to drop a pin at your hostel's location, or use your current location."}
        </p>
      </div>
    </div>
  );
}
