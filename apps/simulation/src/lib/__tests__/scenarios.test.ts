import { describe, expect, it } from "vitest";
import type { Corridor, SimulationConfig } from "@covoiturage/shared";
import { generatePopulation } from "../population";
import { runAllScenarios } from "../scenarios";

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
  totalCommuters: 500,
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

describe("runAllScenarios", () => {
  it("improves key metrics as adoption rises", () => {
    const population = generatePopulation(config, corridor);
    const result = runAllScenarios(config, corridor, population);

    expect(result.C.totalVehicles).toBeLessThan(result.B.totalVehicles);
    expect(result.B.totalVehicles).toBeLessThan(result.A.totalVehicles);

    expect(result.C.co2Kg).toBeLessThan(result.B.co2Kg);
    expect(result.B.co2Kg).toBeLessThan(result.A.co2Kg);

    expect(result.C.estimatedMonthlySavingsEur).toBeGreaterThan(result.B.estimatedMonthlySavingsEur);
    expect(result.B.estimatedMonthlySavingsEur).toBeGreaterThanOrEqual(0);
  });
});
