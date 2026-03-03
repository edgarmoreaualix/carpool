import { describe, expect, it } from "vitest";
import type { Commuter, GeoJSONLineString, MatchingConfig } from "@covoiturage/shared";
import { clusterByGeography } from "../src/cluster";

const corridor: GeoJSONLineString = {
  type: "LineString",
  coordinates: [
    [0, 0],
    [0.1, 0],
  ],
};

const config: MatchingConfig = {
  maxGroupSize: 5,
  maxDetourMinutes: 10,
  timeToleranceMinutes: 15,
  maxCorridorOffsetKm: 2,
  maxClusterSpreadKm: 3,
  co2PerKmGrams: 120,
  costPerKmEur: 0.15,
};

function createCommuter(id: string, lat: number, lng: number): Commuter {
  return {
    user: {
      id,
      name: id,
      email: `${id}@example.com`,
      homeLocation: { lat, lng },
      workLocation: { lat: 0, lng: 0.1 },
      hasCar: true,
      maxPassengers: 3,
      commune: "Test",
    },
    schedule: {
      userId: id,
      weekStart: "2026-03-09",
      entries: [
        {
          day: 0,
          departureTime: "08:00",
          toleranceMinutes: 15,
          returnTime: "17:30",
          returnToleranceMinutes: 15,
        },
      ],
    },
    corridorPosition: 0,
  };
}

describe("clusterByGeography", () => {
  it("projects commuters, excludes far commuters, and clusters by spread", () => {
    const nearA = createCommuter("a", 0, 0.01);
    const nearB = createCommuter("b", 0.0005, 0.015);
    const farAlongCorridor = createCommuter("c", 0, 0.08);
    const tooFarFromCorridor = createCommuter("d", 0.04, 0.02);

    const clusters = clusterByGeography(
      [nearA, nearB, farAlongCorridor, tooFarFromCorridor],
      corridor,
      config
    );

    expect(nearA.corridorPosition).toBeGreaterThan(0);
    expect(nearB.corridorPosition).toBeGreaterThan(nearA.corridorPosition);
    expect(farAlongCorridor.corridorPosition).toBeGreaterThan(nearB.corridorPosition);
    expect(tooFarFromCorridor.corridorPosition).toBeGreaterThan(0);

    expect(clusters).toHaveLength(2);
    expect(clusters[0]?.members.map((m) => m.user.id)).toEqual(["a", "b"]);
    expect(clusters[1]?.members.map((m) => m.user.id)).toEqual(["c"]);
    expect(clusters.flatMap((cluster) => cluster.members).map((m) => m.user.id)).not.toContain("d");
  });
});
