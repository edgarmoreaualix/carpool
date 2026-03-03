// ── Core Domain Types ─────────────────────────────────────────────

export interface Point {
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  homeLocation: Point;
  workLocation: Point;
  hasCar: boolean;
  maxPassengers: number; // 0 if no car
  commune: string; // e.g. "Ligné"
}

// ── Schedule Types ────────────────────────────────────────────────

export type DayOfWeek = 0 | 1 | 2 | 3 | 4; // Mon=0, Fri=4

export interface ScheduleEntry {
  day: DayOfWeek;
  departureTime: Time; // "07:30"
  toleranceMinutes: number; // ±15 means matchable 07:15-07:45
  returnTime: Time; // "17:30"
  returnToleranceMinutes: number;
}

export interface WeeklySchedule {
  userId: string;
  weekStart: string; // ISO date "2026-03-09"
  entries: ScheduleEntry[];
}

/** Time as "HH:MM" string (24h format) */
export type Time = string;

// ── Corridor Types ────────────────────────────────────────────────

export interface CorridorStop {
  name: string;
  type: "origin" | "intermediate" | "destination";
  lat: number;
  lng: number;
  population: number;
  estimatedCommuters: number | null;
  postalCode: string;
}

export interface RoadSegment {
  from: string;
  to: string;
  distanceKm: number;
  roads: string[];
  speedLimitKmh: number;
}

export interface Corridor {
  id: string;
  name: string;
  description: string;
  stops: CorridorStop[];
  roadSegments: RoadSegment[];
  route: GeoJSONLineString;
  totalDistanceKm: number;
  typicalDriveMinutes: { freeFlow: number; peakHour: number };
}

export interface GeoJSONLineString {
  type: "LineString";
  coordinates: [lng: number, lat: number][];
}

// ── Matching Types ────────────────────────────────────────────────

export interface Commuter {
  user: User;
  schedule: WeeklySchedule;
  corridorPosition: number; // 0 (origin) to 1 (destination), set by clustering
}

export interface GeographicCluster {
  id: string;
  members: Commuter[];
  centroid: Point;
  corridorRange: [start: number, end: number]; // range on corridor (0-1)
}

export type GroupMemberRole = "driver" | "passenger";

export interface GroupMembership {
  userId: string;
  role: GroupMemberRole;
  pickupPoint: Point;
  pickupTime: Time;
  pickupOrder: number;
}

export interface DayPlan {
  day: DayOfWeek;
  driverId: string;
  members: GroupMembership[];
  departureTime: Time;
  estimatedArrivalTime: Time;
}

export interface CarpoolGroup {
  id: string;
  corridorId: string;
  weekStart: string;
  members: User[];
  dayPlans: DayPlan[];
}

export interface MatchingResult {
  groups: CarpoolGroup[];
  totalCommuters: number;
  matchedCommuters: number;
  fullyMatchedCommuters: number;
  partiallyMatched: number;
  unmatched: number;
  vehiclesRemoved: number;
  avgGroupSize: number;
  avgDetourMinutes: number;
  avgScheduleCompromiseMinutes: number;
  co2SavedKgPerWeek: number;
  costSavedEurPerWeek: number;
}

export interface MatchingConfig {
  maxGroupSize: number; // 5
  maxDetourMinutes: number; // 10
  timeToleranceMinutes: number; // 15
  maxCorridorOffsetKm: number; // 3 — max distance from corridor to be included
  maxClusterSpreadKm: number; // 8 — max spread within a cluster
  co2PerKmGrams: number; // 120
  costPerKmEur: number; // 0.15
}

export const DEFAULT_MATCHING_CONFIG: MatchingConfig = {
  maxGroupSize: 5,
  maxDetourMinutes: 10,
  timeToleranceMinutes: 15,
  maxCorridorOffsetKm: 3,
  maxClusterSpreadKm: 8,
  co2PerKmGrams: 120,
  costPerKmEur: 0.15,
};

// ── Simulation Types ──────────────────────────────────────────────

export interface SimulatedCommuter extends Commuter {
  hasCar: boolean;
  willingnessToCarpool: number; // 0-1
  scheduleVariability: "fixed" | "slightly_variable" | "highly_variable";
}

export interface TrafficSegmentSnapshot {
  from: string;
  to: string;
  vehicleCount: number;
  averageSpeedKmh: number;
  density: number; // vehicles/km
  occupancy: number; // persons/vehicle
}

export interface TrafficSnapshot {
  timestamp: string; // ISO datetime
  segments: TrafficSegmentSnapshot[];
  totalVehicles: number;
  totalPersons: number;
  co2Kg: number;
}

export type SimulationScenario = "status_quo" | "adoption_20" | "adoption_50";

export interface SimulationConfig {
  corridorId: string;
  totalCommuters: number;
  carpoolWillingness: number; // 0.40
  adoptionRate: number; // 0.20
  matching: MatchingConfig;
  traffic: {
    peakHourCapacity: number; // 1800 vehicles/hour/lane
    lanes: number; // 2
    freeFlowSpeedKmh: number; // 70
  };
  timeStepMinutes: number; // 5
}

export interface SimulationResult {
  scenario: SimulationScenario;
  config: SimulationConfig;
  snapshots: TrafficSnapshot[];
  matching: MatchingResult;
  summary: {
    peakVehiclesBefore: number;
    peakVehiclesAfter: number;
    peakReductionPercent: number;
    totalCo2SavedKg: number;
    avgCostSavedEurPerPerson: number;
  };
}
