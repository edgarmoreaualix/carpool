import { describe, expect, it } from "vitest";
import type { WeeklySchedule } from "@covoiturage/shared";
import { _readFlowFromStorage, _writeFlowToStorage, computeHasMatch } from "./flow-store";

class MemoryStorage {
  private map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

const schedule = (entries: number): WeeklySchedule => ({
  userId: "u1",
  weekStart: "2026-03-09",
  entries: Array.from({ length: entries }, (_, index) => ({
    day: Math.min(index, 4) as 0 | 1 | 2 | 3 | 4,
    departureTime: "07:30",
    toleranceMinutes: 15,
    returnTime: "17:30",
    returnToleranceMinutes: 15,
  })),
});

describe("flow store", () => {
  it("computes match eligibility from schedule size", () => {
    expect(computeHasMatch(undefined)).toBe(false);
    expect(computeHasMatch(schedule(2))).toBe(false);
    expect(computeHasMatch(schedule(3))).toBe(true);
  });

  it("persists and reads serialized flow state", () => {
    const storage = new MemoryStorage();
    _writeFlowToStorage(storage, {
      schedule: schedule(4),
      profile: {
        home: { lat: 47.3, lng: -1.3, commune: "Ligné" },
        work: { lat: 47.2, lng: -1.5, commune: "Nantes" },
      },
    });

    const state = _readFlowFromStorage(storage);
    expect(state.schedule?.entries).toHaveLength(4);
    expect(state.profile?.home.commune).toBe("Ligné");
  });
});
