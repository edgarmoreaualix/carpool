import { describe, expect, it } from "vitest";
import type {
  Commuter,
  DayOfWeek,
  GeographicCluster,
  MatchingConfig,
  ScheduleEntry,
} from "@covoiturage/shared";
import { findScheduleCompatibleGroups } from "../src/schedule";

const config: MatchingConfig = {
  maxGroupSize: 5,
  maxDetourMinutes: 10,
  timeToleranceMinutes: 15,
  maxCorridorOffsetKm: 3,
  maxClusterSpreadKm: 8,
  co2PerKmGrams: 120,
  costPerKmEur: 0.15,
};

function createEntry(day: DayOfWeek, departureTime: string): ScheduleEntry {
  return {
    day,
    departureTime,
    toleranceMinutes: 15,
    returnTime: "17:30",
    returnToleranceMinutes: 15,
  };
}

function createCommuter(id: string, entries: ScheduleEntry[]): Commuter {
  return {
    user: {
      id,
      name: id,
      email: `${id}@example.com`,
      homeLocation: { lat: 47.3, lng: -1.4 },
      workLocation: { lat: 47.2, lng: -1.5 },
      hasCar: true,
      maxPassengers: 3,
      commune: "Ligné",
    },
    schedule: {
      userId: id,
      weekStart: "2026-03-09",
      entries,
    },
    corridorPosition: 0.1,
  };
}

function createCluster(members: Commuter[]): GeographicCluster {
  return {
    id: "cluster-1",
    members,
    centroid: { lat: 47.3, lng: -1.4 },
    corridorRange: [0, 0.3],
  };
}

describe("findScheduleCompatibleGroups", () => {
  it("returns weekly subgroups when commuters overlap on at least 3 days", () => {
    const a = createCommuter("a", [
      createEntry(0, "07:30"),
      createEntry(1, "07:35"),
      createEntry(2, "07:40"),
      createEntry(3, "08:30"),
      createEntry(4, "08:30"),
    ]);
    const b = createCommuter("b", [
      createEntry(0, "07:35"),
      createEntry(1, "07:30"),
      createEntry(2, "07:45"),
      createEntry(3, "08:45"),
      createEntry(4, "08:40"),
    ]);
    const c = createCommuter("c", [
      createEntry(0, "07:40"),
      createEntry(1, "07:30"),
      createEntry(2, "07:35"),
      createEntry(3, "09:30"),
      createEntry(4, "09:30"),
    ]);
    const d = createCommuter("d", [
      createEntry(0, "07:45"),
      createEntry(1, "10:00"),
      createEntry(2, "10:00"),
      createEntry(3, "10:00"),
      createEntry(4, "10:00"),
    ]);

    const groups = findScheduleCompatibleGroups(createCluster([a, b, c, d]), config);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.map((commuter) => commuter.user.id).sort()).toEqual(["a", "b", "c"]);
  });

  it("returns no weekly subgroup when overlap is below 3 days", () => {
    const a = createCommuter("a", [createEntry(0, "07:30"), createEntry(1, "09:30")]);
    const b = createCommuter("b", [createEntry(0, "07:35"), createEntry(1, "09:40")]);
    const c = createCommuter("c", [createEntry(0, "10:00"), createEntry(1, "10:10")]);

    const groups = findScheduleCompatibleGroups(createCluster([a, b, c]), config);
    expect(groups).toEqual([]);
  });
});
