import type {
  Corridor,
  CorridorStop,
  DayOfWeek,
  ScheduleEntry,
  SimulatedCommuter,
  SimulationConfig,
} from "@covoiturage/shared";

const WORK_DAYS: DayOfWeek[] = [0, 1, 2, 3, 4];

const DEPARTURE_BUCKETS = [
  { weight: 0.05, minMinutes: 6 * 60 + 30, maxMinutes: 7 * 60 },
  { weight: 0.2, minMinutes: 7 * 60, maxMinutes: 7 * 60 + 30 },
  { weight: 0.35, minMinutes: 7 * 60 + 30, maxMinutes: 8 * 60 },
  { weight: 0.2, minMinutes: 8 * 60, maxMinutes: 8 * 60 + 30 },
  { weight: 0.1, minMinutes: 8 * 60 + 30, maxMinutes: 9 * 60 },
  { weight: 0.05, minMinutes: 9 * 60, maxMinutes: 9 * 60 + 30 },
  { weight: 0.05, minMinutes: 10 * 60, maxMinutes: 11 * 60 + 30 },
] as const;

type ScheduleVariability = SimulatedCommuter["scheduleVariability"];

export function generatePopulation(
  config: SimulationConfig,
  corridor: Corridor
): SimulatedCommuter[] {
  const homeStops = corridor.stops.filter((stop) => (stop.estimatedCommuters ?? 0) > 0);
  const destinationStop = corridor.stops.find((stop) => stop.type === "destination");
  const destination = destinationStop ?? corridor.stops[corridor.stops.length - 1];

  if (!destination || homeStops.length === 0) {
    return [];
  }

  const commuters: SimulatedCommuter[] = [];
  for (let index = 0; index < config.totalCommuters; index++) {
    const variability = sampleVariability();
    const homeStop = sampleWeightedStop(homeStops);
    const hasCar = Math.random() < 0.85;
    const willingnessToCarpool = sampleWillingness(config.carpoolWillingness);
    const baseDeparture = sampleDepartureMinutes();
    const scheduleEntries = buildScheduleEntries(baseDeparture, variability);

    const homeLocation = randomOffsetPoint(homeStop.lat, homeStop.lng, 2);
    const workLocation = randomOffsetPoint(destination.lat, destination.lng, 0.8);
    const id = `sim-${index + 1}`;

    commuters.push({
      user: {
        id,
        name: `Simulated User ${index + 1}`,
        email: `${id}@sim.local`,
        homeLocation,
        workLocation,
        hasCar,
        maxPassengers: hasCar ? randomInt(1, 4) : 0,
        commune: homeStop.name,
      },
      schedule: {
        userId: id,
        weekStart: "2026-03-09",
        entries: scheduleEntries,
      },
      corridorPosition: 0,
      hasCar,
      willingnessToCarpool,
      scheduleVariability: variability,
    });
  }

  return commuters;
}

function sampleWeightedStop(stops: CorridorStop[]): CorridorStop {
  const totalWeight = stops.reduce((sum, stop) => sum + (stop.estimatedCommuters ?? 0), 0);
  let cursor = Math.random() * totalWeight;

  for (const stop of stops) {
    cursor -= stop.estimatedCommuters ?? 0;
    if (cursor <= 0) {
      return stop;
    }
  }

  return stops[stops.length - 1]!;
}

function sampleDepartureMinutes(): number {
  const bucket = sampleWeighted(DEPARTURE_BUCKETS, (item) => item.weight);
  return randomInt(bucket.minMinutes, bucket.maxMinutes - 1);
}

function sampleVariability(): ScheduleVariability {
  const draw = Math.random();
  if (draw < 0.6) {
    return "fixed";
  }
  if (draw < 0.85) {
    return "slightly_variable";
  }
  return "highly_variable";
}

function sampleWillingness(targetAboveHalf: number): number {
  const normalizedTarget = Math.max(0, Math.min(1, targetAboveHalf));
  if (Math.random() < normalizedTarget) {
    return 0.5 + Math.random() * 0.5;
  }
  return Math.random() * 0.5;
}

function buildScheduleEntries(
  baseDepartureMinutes: number,
  variability: ScheduleVariability
): ScheduleEntry[] {
  return WORK_DAYS.map((day) => {
    let departure = baseDepartureMinutes;
    let tolerance = 10;
    let returnTolerance = 10;

    if (variability === "slightly_variable") {
      departure = clampMinutes(baseDepartureMinutes + randomInt(-20, 20));
      tolerance = 15;
      returnTolerance = 15;
    } else if (variability === "highly_variable") {
      departure = clampMinutes(sampleDepartureMinutes() + randomInt(-25, 25));
      tolerance = 25;
      returnTolerance = 25;
    }

    const returnMinutes = clampMinutes(departure + randomInt(8 * 60, 9 * 60 + 30));
    return {
      day,
      departureTime: formatTime(departure),
      toleranceMinutes: tolerance,
      returnTime: formatTime(returnMinutes),
      returnToleranceMinutes: returnTolerance,
    };
  });
}

function randomOffsetPoint(lat: number, lng: number, maxRadiusKm: number) {
  const radiusKm = Math.sqrt(Math.random()) * maxRadiusKm;
  const angle = Math.random() * 2 * Math.PI;
  const deltaLat = (radiusKm / 111) * Math.cos(angle);
  const kmPerLngDegree = Math.max(111 * Math.cos((lat * Math.PI) / 180), 1e-6);
  const deltaLng = (radiusKm / kmPerLngDegree) * Math.sin(angle);
  return {
    lat: lat + deltaLat,
    lng: lng + deltaLng,
  };
}

function formatTime(totalMinutes: number): string {
  const clamped = clampMinutes(totalMinutes);
  const hours = Math.floor(clamped / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (clamped % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function clampMinutes(value: number): number {
  return Math.max(0, Math.min(23 * 60 + 59, value));
}

function randomInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function sampleWeighted<T>(items: readonly T[], getWeight: (item: T) => number): T {
  const totalWeight = items.reduce((sum, item) => sum + getWeight(item), 0);
  let cursor = Math.random() * totalWeight;

  for (const item of items) {
    cursor -= getWeight(item);
    if (cursor <= 0) {
      return item;
    }
  }

  return items[items.length - 1]!;
}
