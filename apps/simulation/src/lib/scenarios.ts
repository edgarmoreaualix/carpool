import type { Corridor, SimulatedCommuter, SimulationConfig, TrafficSnapshot } from "@covoiturage/shared";
import { buildTrafficTimeline, estimateCo2Kg, estimateFuelCostEur } from "./traffic-model";

export type ScenarioName = "A" | "B" | "C";

export interface ScenarioResult {
  name: ScenarioName;
  adoptionRate: number;
  snapshots: TrafficSnapshot[];
  totalVehicles: number;
  totalPersons: number;
  avgOccupancy: number;
  co2Kg: number;
  estimatedFuelCostEur: number;
  estimatedMonthlySavingsEur: number;
}

export function runScenario(
  name: ScenarioName,
  config: SimulationConfig,
  corridor: Corridor,
  population: SimulatedCommuter[]
): ScenarioResult {
  const adoptionRate = scenarioAdoption(name);
  const snapshots = buildTrafficTimeline({
    corridor,
    population,
    adoptionRate,
    stepMinutes: config.timeStepMinutes,
    freeFlowSpeedKmh: config.traffic.freeFlowSpeedKmh,
  });

  const peak = snapshots.reduce(
    (best, snapshot) => (snapshot.totalVehicles > best.totalVehicles ? snapshot : best),
    snapshots[0] ?? emptySnapshot()
  );

  const co2Kg = estimateCo2Kg(snapshots);
  const estimatedFuelCostEur = estimateFuelCostEur(snapshots, 1.85);

  return {
    name,
    adoptionRate,
    snapshots,
    totalVehicles: peak.totalVehicles,
    totalPersons: peak.totalPersons,
    avgOccupancy: peak.totalVehicles > 0 ? peak.totalPersons / peak.totalVehicles : 0,
    co2Kg,
    estimatedFuelCostEur,
    estimatedMonthlySavingsEur: 0,
  };
}

export function runAllScenarios(
  config: SimulationConfig,
  corridor: Corridor,
  population: SimulatedCommuter[]
): Record<ScenarioName, ScenarioResult> {
  const A = runScenario("A", config, corridor, population);
  const B = runScenario("B", config, corridor, population);
  const C = runScenario("C", config, corridor, population);

  const baseCost = A.estimatedFuelCostEur;
  B.estimatedMonthlySavingsEur = monthlySavings(baseCost, B.estimatedFuelCostEur);
  C.estimatedMonthlySavingsEur = monthlySavings(baseCost, C.estimatedFuelCostEur);

  return { A, B, C };
}

export function interpolateScenario(
  baseline: ScenarioResult,
  optimistic: ScenarioResult,
  adoptionRate: number
): Pick<ScenarioResult, "adoptionRate" | "estimatedMonthlySavingsEur" | "co2Kg" | "totalVehicles"> {
  const alpha = clamp01(adoptionRate / 0.5);
  return {
    adoptionRate,
    totalVehicles: lerp(baseline.totalVehicles, optimistic.totalVehicles, alpha),
    co2Kg: lerp(baseline.co2Kg, optimistic.co2Kg, alpha),
    estimatedMonthlySavingsEur: lerp(0, optimistic.estimatedMonthlySavingsEur, alpha),
  };
}

function scenarioAdoption(name: ScenarioName): number {
  if (name === "A") return 0;
  if (name === "B") return 0.2;
  return 0.5;
}

function monthlySavings(baseDayCost: number, scenarioDayCost: number): number {
  return Math.max(0, (baseDayCost - scenarioDayCost) * 20);
}

function emptySnapshot(): TrafficSnapshot {
  return {
    timestamp: "2026-03-09T05:00:00.000Z",
    segments: [],
    totalVehicles: 0,
    totalPersons: 0,
    co2Kg: 0,
  };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function lerp(a: number, b: number, alpha: number): number {
  return a + (b - a) * alpha;
}
