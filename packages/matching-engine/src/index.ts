/**
 * Matching Engine — entry point
 *
 * Pure function library. No side effects, no database, no HTTP.
 * Input: commuters + config → Output: matched carpool groups
 *
 * Phases:
 * 1. cluster.ts  — Geographic clustering by corridor position
 * 2. schedule.ts — Time window overlap matching
 * 3. optimize.ts — Group optimization (minimize detour + schedule compromise)
 * 4. rotate.ts   — Fair driver rotation assignment
 * 5. pickup.ts   — Pickup point and time calculation
 */

export { clusterByGeography } from "./cluster";
export { findScheduleCompatibleGroups } from "./schedule";
