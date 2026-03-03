import { describe, expect, it } from "vitest";
import type { Corridor, SimulatedCommuter, SimulationConfig } from "@covoiturage/shared";
import { buildTrafficTimeline, greenshieldsSpeed } from "../traffic-model";
import { generatePopulation } from "../population";

const corridor: Corridor = {
  id: "test",
  name: "Test",
  description: "Test",
  totalDistanceKm: 25,
  typicalDriveMinutes: { freeFlow: 28, peakHour: 45 },
  stops: [
    { name: "A", type: "origin", lat: 47.35, lng: -1.34, population: 1000, estimatedCommuters: 300, postalCode: "1" },
    { name: "B", type: "intermediate", lat: 47.32, lng: -1.45, population: 1000, estimatedCommuters: 300, postalCode: "2" },
    { name: "C", type: "destination", lat: 47.21, lng: -1.55, population: 1000, estimatedCommuters: null, postalCode: "3" },
  ],
  route: { type: "LineString", coordinates: [[-1.34, 47.35], [-1.45, 47.32], [-1.55, 47.21]] },
  roadSegments: [
    { from: "A", to: "B", distanceKm: 10, roads: ["D1"], speedLimitKmh: 80 },
    { from: "B", to: "C", distanceKm: 15, roads: ["N1"], speedLimitKmh: 90 },
  ],
};

const config: SimulationConfig = {
  corridorId: corridor.id,
  totalCommuters: 200,
  carpoolWillingness: 0.4,
  adoptionRate: 0.2,
  matching: {
    maxGroupSize: 5,
    maxDetourMinutes: 10,
    timeToleranceMinutes: 15,
    maxCorridorOffsetKm: 3,
    maxClusterSpreadKm: 8,
    co2PerKmGrams: 120,
    costPerKmEur: 0.15,
  },
  traffic: { peakHourCapacity: 1800, lanes: 2, freeFlowSpeedKmh: 70 },
  timeStepMinutes: 5,
};

describe("traffic model", () => {
  it("builds a full timeline with increasing timestamps", () => {
    const population = generatePopulation(config, corridor);
    const snapshots = buildTrafficTimeline({ corridor, population, adoptionRate: 0.2 });

    expect(snapshots.length).toBe(205);
    expect(snapshots[0]?.timestamp).toBe("2026-03-09T05:00:00.000Z");
    expect(snapshots[snapshots.length - 1]?.timestamp).toBe("2026-03-09T22:00:00.000Z");

    for (let i = 1; i < snapshots.length; i++) {
      expect(new Date(snapshots[i]!.timestamp).getTime()).toBeGreaterThan(
        new Date(snapshots[i - 1]!.timestamp).getTime()
      );
    }
  });

  it("speed decreases when density increases", () => {
    const low = greenshieldsSpeed(10, 70, 80);
    const high = greenshieldsSpeed(60, 70, 80);
    expect(low).toBeGreaterThan(high);
  });

  it("handles empty population", () => {
    const snapshots = buildTrafficTimeline({ corridor, population: [] as SimulatedCommuter[], adoptionRate: 0.2 });
    expect(snapshots.every((snapshot) => snapshot.totalVehicles >= 0)).toBe(true);
    expect(snapshots.every((snapshot) => snapshot.totalPersons >= 0)).toBe(true);
  });
});
