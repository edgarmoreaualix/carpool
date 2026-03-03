import type { Point, GeoJSONLineString } from "@covoiturage/shared";
import { haversineDistance } from "./distance";

/**
 * Project a point onto a corridor line, returning a position from 0 (start) to 1 (end).
 * Uses nearest-segment projection.
 */
export function projectOnCorridor(
  point: Point,
  corridor: GeoJSONLineString
): { position: number; distanceFromCorridor: number } {
  const coords = corridor.coordinates;
  let bestPosition = 0;
  let bestDistance = Infinity;

  // Calculate total corridor length for normalization
  let totalLength = 0;
  const segmentLengths: number[] = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const len = haversineDistance(
      { lat: coords[i][1], lng: coords[i][0] },
      { lat: coords[i + 1][1], lng: coords[i + 1][0] }
    );
    segmentLengths.push(len);
    totalLength += len;
  }

  let cumulativeLength = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const a: Point = { lat: coords[i][1], lng: coords[i][0] };
    const b: Point = { lat: coords[i + 1][1], lng: coords[i + 1][0] };

    const t = projectPointOnSegment(point, a, b);
    const projected: Point = {
      lat: a.lat + t * (b.lat - a.lat),
      lng: a.lng + t * (b.lng - a.lng),
    };
    const dist = haversineDistance(point, projected);

    if (dist < bestDistance) {
      bestDistance = dist;
      bestPosition = (cumulativeLength + t * segmentLengths[i]) / totalLength;
    }

    cumulativeLength += segmentLengths[i];
  }

  return { position: bestPosition, distanceFromCorridor: bestDistance };
}

/**
 * Check if a point is within `bufferMeters` of the corridor line.
 */
export function isWithinCorridorBuffer(
  point: Point,
  corridor: GeoJSONLineString,
  bufferMeters: number
): boolean {
  const { distanceFromCorridor } = projectOnCorridor(point, corridor);
  return distanceFromCorridor <= bufferMeters;
}

/**
 * Project point P onto segment AB, returning t in [0, 1].
 * t=0 means closest to A, t=1 means closest to B.
 */
function projectPointOnSegment(p: Point, a: Point, b: Point): number {
  const dx = b.lng - a.lng;
  const dy = b.lat - a.lat;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) return 0;

  const t = ((p.lng - a.lng) * dx + (p.lat - a.lat) * dy) / lenSq;
  return Math.max(0, Math.min(1, t));
}
