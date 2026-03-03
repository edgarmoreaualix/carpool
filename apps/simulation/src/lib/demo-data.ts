import corridorJson from "../../../../data/corridors/ligne-nantes.json";
import type { Corridor, SimulationConfig } from "@covoiturage/shared";
import { generatePopulation } from "./population";
import { runAllScenarios } from "./scenarios";

export const DEMO_CORRIDOR = corridorJson as unknown as Corridor;

export const DEMO_CONFIG: SimulationConfig = {
  corridorId: DEMO_CORRIDOR.id,
  totalCommuters: 1200,
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

export function withSeed<T>(seed: number, work: () => T): T {
  const previousRandom = Math.random;
  let state = seed;

  Math.random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };

  try {
    return work();
  } finally {
    Math.random = previousRandom;
  }
}

export const DEMO_POPULATION = withSeed(42, () => generatePopulation(DEMO_CONFIG, DEMO_CORRIDOR));
export const DEMO_SCENARIOS = runAllScenarios(DEMO_CONFIG, DEMO_CORRIDOR, DEMO_POPULATION);
