export function getHostelGalleryImages(
  coverImage: string | null,
  images: string[],
): string[] {
  const candidates = [coverImage, ...images]
    .map((image) => image?.trim())
    .filter((image): image is string => Boolean(image));

  return [...new Set(candidates)];
}

export function formatHostelAmenity(amenity: string): string {
  const trimmed = amenity.trim();
  const normalized = trimmed.toLowerCase().replace(/[-_\s]+/g, "");
  if (normalized === "wifi") return "Wi-Fi";
  if (normalized === "cctv") return "CCTV";
  if (normalized === "ac") return "AC";

  return trimmed
    .replace(/[-_]+/g, " ")
    .toLowerCase()
    .replace(/^\w/, (firstLetter) => firstLetter.toUpperCase());
}

export function getHostelMapEmbedUrl(
  latitude: number | null,
  longitude: number | null,
): string | null {
  if (
    latitude === null ||
    longitude === null ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 85 ||
    Math.abs(longitude) > 180
  ) {
    return null;
  }

  const approximateLatitude = Number(latitude.toFixed(2));
  const approximateLongitude = Number(longitude.toFixed(2));
  const bounds = [
    Math.max(-180, approximateLongitude - 0.025),
    Math.max(-85, approximateLatitude - 0.015),
    Math.min(180, approximateLongitude + 0.025),
    Math.min(85, approximateLatitude + 0.015),
  ]
    .map((coordinate) => coordinate.toFixed(3))
    .join(",");
  const params = new URLSearchParams({
    bbox: bounds,
    layer: "mapnik",
    marker: `${approximateLatitude.toFixed(2)},${approximateLongitude.toFixed(2)}`,
  });

  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}
