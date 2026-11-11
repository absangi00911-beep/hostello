// Path: src/lib/hostel-share-image.tsx
import { ImageResponse } from "next/og";
import { APP_NAME } from "@/config/constants";
import type { HostelShareCard } from "@/lib/hostel-share-card";

export const HOSTEL_SHARE_IMAGE_SIZE = { width: 1200, height: 630 } as const;

// One hour at the edge, a day of stale-while-revalidate: prices change rarely.
const CACHE_CONTROL = "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";

/** Text-only on purpose: no remote photo fetch can fail or be abused. */
export function renderHostelShareImage(card: HostelShareCard | null): ImageResponse {
  const name = card?.name ?? `${APP_NAME} | Student hostels in Pakistan`;
  const facts = card
    ? [card.location, card.genderLabel, card.priceLabel, card.ratingLabel].filter(Boolean)
    : ["Find and book student hostels across Pakistan"];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>{APP_NAME}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: name.length > 36 ? 64 : 84,
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            {name}
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 32 }}>
            {facts.map((fact) => (
              <div key={fact} style={{ display: "flex", fontSize: 36, opacity: 0.92, marginTop: 8 }}>
                {fact}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...HOSTEL_SHARE_IMAGE_SIZE, headers: { "Cache-Control": CACHE_CONTROL } },
  );
}
