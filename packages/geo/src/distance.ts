import type { Point } from "@covoiturage/shared";
import { EARTH_RADIUS_M } from "@covoiturage/shared";

/**
 * Haversine distance between two points in meters.
 */
export function haversineDistance(a: Point, b: Point): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLng = Math.sin(dLng / 2);

  const h =
    sinHalfLat * sinHalfLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinHalfLng * sinHalfLng;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}
