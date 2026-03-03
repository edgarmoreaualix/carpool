import { describe, expect, it } from "vitest";
import type { Corridor, SimulationConfig } from "@covoiturage/shared";
import { haversineDistance } from "@covoiturage/geo";
import { generatePopulation } from "../population";

const corridor: Corridor = {
  id: "test-corridor",
  name: "Test Corridor",
  description: "Synthetic corridor for tests",
  totalDistanceKm: 25,
  typicalDriveMinutes: { freeFlow: 30, peakHour: 45 },
  stops: [
    {
      name: "Ligné",
      type: "origin",
      lat: 47.3556,
      lng: -1.3478,
      population: 5200,
      estimatedCommuters: 1200,
      postalCode: "44850",
    },
    {
      name: "Saint-Mars-du-Désert",
      type: "intermediate",
      lat: 47.3897,
      lng: -1.3892,
      population: 4800,
      estimatedCommuters: 1100,
      postalCode: "44850",
    },
    {
      name: "Carquefou",
      type: "intermediate",
      lat: 47.2978,
      lng: -1.4919,
      population: 20000,
      estimatedCommuters: 4500,
      postalCode: "44470",
    },
    {
      name: "Nantes Centre",
      type: "destination",
      lat: 47.2184,
      lng: -1.5536,
      population: 320000,
      estimatedCommuters: null,
      postalCode: "44000",
    },
  ],
  route: {
    type: "LineString",
    coordinates: [
      [-1.3478, 47.3556],
      [-1.3892, 47.3897],
      [-1.4919, 47.2978],
      [-1.5536, 47.2184],
    ],
  },
  roadSegments: [
    {
      from: "Ligné",
      to: "Saint-Mars-du-Désert",
      distanceKm: 7,
      roads: ["D39"],
      speedLimitKmh: 80,
    },
    {
      from: "Saint-Mars-du-Désert",
      to: "Carquefou",
      distanceKm: 8,
      roads: ["D31"],
      speedLimitKmh: 80,
    },
    {
      from: "Carquefou",
      to: "Nantes Centre",
      distanceKm: 10,
      roads: ["N844"],
      speedLimitKmh: 90,
    },
  ],
};

const config: SimulationConfig = {
  corridorId: corridor.id,
  totalCommuters: 1000,
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
  traffic: {
    peakHourCapacity: 1800,
    lanes: 2,
    freeFlowSpeedKmh: 70,
  },
  timeStepMinutes: 5,
};

describe("generatePopulation", () => {
  it("generates synthetic commuters with expected distributions and valid fields", () => {
    const population = generatePopulation(config, corridor);
    expect(population).toHaveLength(config.totalCommuters);

    const destination = corridor.stops.find((stop) => stop.type === "destination")!;
    const stopsByName = new Map(corridor.stops.map((stop) => [stop.name, stop]));

    const hasCarShare =
      population.filter((commuter) => commuter.hasCar).length / population.length;
    expect(hasCarShare).toBeGreaterThan(0.78);
    expect(hasCarShare).toBeLessThan(0.92);

    const aboveHalfShare =
      population.filter((commuter) => commuter.willingnessToCarpool > 0.5).length /
      population.length;
    expect(aboveHalfShare).toBeGreaterThan(0.33);
    expect(aboveHalfShare).toBeLessThan(0.47);

    const fixedShare =
      population.filter((commuter) => commuter.scheduleVariability === "fixed").length /
      population.length;
    const slightShare =
      population.filter(
        (commuter) => commuter.scheduleVariability === "slightly_variable"
      ).length / population.length;
    const highShare =
      population.filter((commuter) => commuter.scheduleVariability === "highly_variable")
        .length / population.length;

    expect(fixedShare).toBeGreaterThan(0.5);
    expect(fixedShare).toBeLessThan(0.68);
    expect(slightShare).toBeGreaterThan(0.18);
    expect(slightShare).toBeLessThan(0.32);
    expect(highShare).toBeGreaterThan(0.1);
    expect(highShare).toBeLessThan(0.2);

    for (const commuter of population) {
      const homeStop = stopsByName.get(commuter.user.commune);
      expect(homeStop).toBeDefined();
      expect(commuter.schedule.entries).toHaveLength(5);
      expect(commuter.willingnessToCarpool).toBeGreaterThanOrEqual(0);
      expect(commuter.willingnessToCarpool).toBeLessThanOrEqual(1);
      expect(commuter.user.maxPassengers).toBeGreaterThanOrEqual(0);
      expect(commuter.user.maxPassengers).toBeLessThanOrEqual(4);

      const homeDistanceKm =
        haversineDistance(commuter.user.homeLocation, {
          lat: homeStop!.lat,
          lng: homeStop!.lng,
        }) / 1000;
      expect(homeDistanceKm).toBeLessThanOrEqual(2.1);

      const workDistanceKm =
        haversineDistance(commuter.user.workLocation, {
          lat: destination.lat,
          lng: destination.lng,
        }) / 1000;
      expect(workDistanceKm).toBeLessThanOrEqual(0.9);
    }
  });

  it("distributes homes roughly proportional to estimated commuter weights", () => {
    const population = generatePopulation(config, corridor);

    const counts = population.reduce<Record<string, number>>((acc, commuter) => {
      acc[commuter.user.commune] = (acc[commuter.user.commune] ?? 0) + 1;
      return acc;
    }, {});

    const total = config.totalCommuters;
    expect((counts["Ligné"] ?? 0) / total).toBeGreaterThan(0.13);
    expect((counts["Ligné"] ?? 0) / total).toBeLessThan(0.23);

    expect((counts["Saint-Mars-du-Désert"] ?? 0) / total).toBeGreaterThan(0.12);
    expect((counts["Saint-Mars-du-Désert"] ?? 0) / total).toBeLessThan(0.22);

    expect((counts["Carquefou"] ?? 0) / total).toBeGreaterThan(0.58);
    expect((counts["Carquefou"] ?? 0) / total).toBeLessThan(0.74);
  });
});
