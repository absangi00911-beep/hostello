export const NEARBY_SEARCH_RADIUS_KM = 25;
export const NEARBY_COORDINATES_SESSION_KEY = "hostello-nearby-coordinates";

export interface NearbyCoordinates {
  latitude: number;
  longitude: number;
}

export function isNearbyCoordinates(value: unknown): value is NearbyCoordinates {
  return (
    typeof value === "object" &&
    value !== null &&
    "latitude" in value &&
    typeof value.latitude === "number" &&
    Number.isFinite(value.latitude) &&
    value.latitude >= -90 &&
    value.latitude <= 90 &&
    "longitude" in value &&
    typeof value.longitude === "number" &&
    Number.isFinite(value.longitude) &&
    value.longitude >= -180 &&
    value.longitude <= 180
  );
}

export function distanceBetweenCoordinatesKm(
  from: NearbyCoordinates,
  to: NearbyCoordinates,
): number {
  const radians = (degrees: number) => degrees * (Math.PI / 180);
  const latitudeDifference = radians(to.latitude - from.latitude);
  const longitudeDifference = radians(to.longitude - from.longitude);
  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.sin(longitudeDifference / 2) ** 2;

  return 6_371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}
