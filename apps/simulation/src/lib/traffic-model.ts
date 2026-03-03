import type { Corridor, SimulatedCommuter, TrafficSnapshot } from "@covoiturage/shared";

export interface TrafficModelParams {
  corridor: Corridor;
  population: SimulatedCommuter[];
  adoptionRate: number;
  startMinute?: number;
  endMinute?: number;
  stepMinutes?: number;
  freeFlowSpeedKmh?: number;
}

const DEFAULT_START_MINUTE = 5 * 60;
const DEFAULT_END_MINUTE = 22 * 60;
const DEFAULT_STEP_MINUTES = 5;
const DEFAULT_FREE_FLOW_KMH = 70;
const JAM_DENSITY_PER_LANE = 80;
const BASE_OCCUPANCY = 1.05;
const CARPOOL_OCCUPANCY = 2.4;
const CO2_KG_PER_KM = 0.12;
const FUEL_L_PER_KM = 0.065;

export function buildTrafficTimeline(params: TrafficModelParams): TrafficSnapshot[] {
  const {
    corridor,
    population,
    freeFlowSpeedKmh = DEFAULT_FREE_FLOW_KMH,
    startMinute = DEFAULT_START_MINUTE,
    endMinute = DEFAULT_END_MINUTE,
    stepMinutes = DEFAULT_STEP_MINUTES,
  } = params;

  const adoptionRate = clamp01(params.adoptionRate);
  const segments = corridor.roadSegments;
  if (segments.length === 0) {
    return [];
  }

  const departureMinutes = getDepartureMinutes(population);
  const avgTripMinutes = corridor.typicalDriveMinutes.peakHour;

  let co2RunningKg = 0;
  const snapshots: TrafficSnapshot[] = [];

  for (let minute = startMinute; minute <= endMinute; minute += stepMinutes) {
    const activePersons = estimateActiveTravellers(departureMinutes, minute, avgTripMinutes);

    const carpoolEligibleShare = population.length === 0 ? 0 :
      population.filter((c) => c.willingnessToCarpool >= 0.5).length / population.length;
    const pooledShare = clamp01(carpoolEligibleShare * adoptionRate);

    const pooledPersons = activePersons * pooledShare;
    const soloPersons = activePersons - pooledPersons;

    const pooledVehicles = pooledPersons / CARPOOL_OCCUPANCY;
    const soloVehicles = soloPersons / BASE_OCCUPANCY;
    const totalVehicles = Math.max(0, pooledVehicles + soloVehicles);
    const totalPersons = Math.max(0, activePersons);
    const occupancy = totalVehicles > 0 ? totalPersons / totalVehicles : 0;

    const segmentSnapshots = segments.map((segment, idx) => {
      const bottleneckFactor = idx === segments.length - 1 ? 1.25 : 1;
      const localVehicles = Math.max(0, totalVehicles * segmentShare(idx, segments.length) * bottleneckFactor);
      const density = localVehicles / Math.max(segment.distanceKm, 0.001);
      const averageSpeedKmh = greenshieldsSpeed(
        density,
        freeFlowSpeedKmh,
        JAM_DENSITY_PER_LANE
      );

      return {
        from: segment.from,
        to: segment.to,
        vehicleCount: round2(localVehicles),
        averageSpeedKmh: round2(averageSpeedKmh),
        density: round2(density),
        occupancy: round2(occupancy),
      };
    });

    const avgSpeed =
      segmentSnapshots.reduce((sum, seg) => sum + seg.averageSpeedKmh, 0) / segmentSnapshots.length;
    const avgDistancePerVehicleKm = (avgSpeed * stepMinutes) / 60;
    const co2IncrementKg = totalVehicles * avgDistancePerVehicleKm * CO2_KG_PER_KM;
    co2RunningKg += co2IncrementKg;

    snapshots.push({
      timestamp: minuteToIso(minute),
      segments: segmentSnapshots,
      totalVehicles: round2(totalVehicles),
      totalPersons: round2(totalPersons),
      co2Kg: round3(co2RunningKg),
    });
  }

  return snapshots;
}

export function estimateCo2Kg(snapshots: TrafficSnapshot[]): number {
  if (snapshots.length === 0) return 0;
  return round3(snapshots[snapshots.length - 1]?.co2Kg ?? 0);
}

export function estimateFuelCostEur(
  snapshots: TrafficSnapshot[],
  fuelPriceEurPerL: number
): number {
  if (snapshots.length < 2) return 0;

  let totalCost = 0;
  for (let i = 1; i < snapshots.length; i++) {
    const previous = snapshots[i - 1]!;
    const current = snapshots[i]!;
    const stepMinutes =
      (new Date(current.timestamp).getTime() - new Date(previous.timestamp).getTime()) /
      (60 * 1000);
    const avgSpeed = averageSegmentSpeed(current);
    const distancePerVehicleKm = (avgSpeed * stepMinutes) / 60;
    const liters = current.totalVehicles * distancePerVehicleKm * FUEL_L_PER_KM;
    totalCost += liters * fuelPriceEurPerL;
  }

  return round2(totalCost);
}

function getDepartureMinutes(population: SimulatedCommuter[]): number[] {
  return population
    .map((commuter) => commuter.schedule.entries.find((entry) => entry.day === 0)?.departureTime)
    .filter((value): value is string => Boolean(value))
    .map(parseTimeToMinutes);
}

function parseTimeToMinutes(time: string): number {
  const parts = time.split(":").map((part) => Number(part));
  const h = parts[0];
  const m = parts[1];
  if (h == null || m == null || Number.isNaN(h) || Number.isNaN(m)) {
    return 8 * 60;
  }
  return h * 60 + m;
}

function estimateActiveTravellers(
  departures: number[],
  minute: number,
  averageTripMinutes: number
): number {
  const halfWindow = Math.max(10, Math.floor(averageTripMinutes / 2));
  return departures.reduce((sum, dep) => {
    const distance = Math.abs(dep - minute);
    if (distance > halfWindow) {
      return sum;
    }
    const weight = 1 - distance / halfWindow;
    return sum + weight;
  }, 0);
}

function segmentShare(index: number, count: number): number {
  if (count === 1) return 1;
  if (index === count - 1) return 0.4;
  return 0.6 / (count - 1);
}

export function greenshieldsSpeed(
  densityVehPerKm: number,
  freeFlowKmh: number,
  jamDensityVehPerKm: number
): number {
  const normalized = 1 - densityVehPerKm / Math.max(jamDensityVehPerKm, 1);
  return Math.max(8, freeFlowKmh * normalized);
}

function averageSegmentSpeed(snapshot: TrafficSnapshot): number {
  if (snapshot.segments.length === 0) return 0;
  return (
    snapshot.segments.reduce((sum, seg) => sum + seg.averageSpeedKmh, 0) /
    snapshot.segments.length
  );
}

function minuteToIso(minute: number): string {
  const hours = Math.floor(minute / 60)
    .toString()
    .padStart(2, "0");
  const mins = (minute % 60).toString().padStart(2, "0");
  return `2026-03-09T${hours}:${mins}:00.000Z`;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
