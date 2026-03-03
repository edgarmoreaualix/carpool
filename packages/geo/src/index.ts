/**
 * Geo — Geographic utilities
 *
 * Pure functions for distance, corridor membership, pickup points.
 * All coordinates: WGS84 (EPSG:4326). All distances: meters.
 */

export { haversineDistance } from "./distance";
export { projectOnCorridor, isWithinCorridorBuffer } from "./corridor";

// pickup.ts will be added by backend agent
