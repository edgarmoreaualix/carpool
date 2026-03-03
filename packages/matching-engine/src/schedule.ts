import type {
  Commuter,
  DayOfWeek,
  GeographicCluster,
  MatchingConfig,
  ScheduleEntry,
} from "@covoiturage/shared";

interface DepartureWindow {
  commuterId: string;
  startMinutes: number;
  endMinutes: number;
}

const WORK_DAYS: DayOfWeek[] = [0, 1, 2, 3, 4];

export function findScheduleCompatibleGroups(
  cluster: GeographicCluster,
  config: MatchingConfig
): Commuter[][] {
  const pairOverlapDays = new Map<string, number>();
  const commuterById = new Map<string, Commuter>();

  for (const commuter of cluster.members) {
    commuterById.set(commuter.user.id, commuter);
  }

  for (const day of WORK_DAYS) {
    const dayGroups = findDayOverlapGroups(cluster.members, day, config);

    for (const group of dayGroups) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const key = makePairKey(group[i]!, group[j]!);
          pairOverlapDays.set(key, (pairOverlapDays.get(key) ?? 0) + 1);
        }
      }
    }
  }

  const commuterIds = cluster.members.map((commuter) => commuter.user.id).sort();
  const unassigned = new Set(commuterIds);
  const weeklyGroups: Commuter[][] = [];

  for (const commuterId of commuterIds) {
    if (!unassigned.has(commuterId)) {
      continue;
    }

    const compatibleCandidates = commuterIds
      .filter(
        (candidateId) =>
          candidateId !== commuterId &&
          unassigned.has(candidateId) &&
          (pairOverlapDays.get(makePairKey(commuterId, candidateId)) ?? 0) >= 3
      )
      .sort((a, b) => {
        const aScore = pairOverlapDays.get(makePairKey(commuterId, a)) ?? 0;
        const bScore = pairOverlapDays.get(makePairKey(commuterId, b)) ?? 0;
        return bScore - aScore;
      });

    if (compatibleCandidates.length === 0) {
      continue;
    }

    const groupIds = [commuterId];
    for (const candidateId of compatibleCandidates) {
      const pairwiseCompatibleWithGroup = groupIds.every(
        (memberId) =>
          (pairOverlapDays.get(makePairKey(memberId, candidateId)) ?? 0) >= 3
      );

      if (pairwiseCompatibleWithGroup) {
        groupIds.push(candidateId);
      }
    }

    if (groupIds.length < 2) {
      continue;
    }

    for (const memberId of groupIds) {
      unassigned.delete(memberId);
    }

    const groupCommuters = groupIds
      .map((id) => commuterById.get(id))
      .filter((commuter): commuter is Commuter => Boolean(commuter));
    weeklyGroups.push(groupCommuters);
  }

  return weeklyGroups;
}

function findDayOverlapGroups(
  commuters: Commuter[],
  day: DayOfWeek,
  config: MatchingConfig
): string[][] {
  const windows: DepartureWindow[] = commuters
    .map((commuter) => {
      const entry = commuter.schedule.entries.find((candidate) => candidate.day === day);
      if (!entry) {
        return null;
      }

      return toDepartureWindow(commuter.user.id, entry, config.timeToleranceMinutes);
    })
    .filter((window): window is DepartureWindow => Boolean(window))
    .sort((a, b) => a.startMinutes - b.startMinutes);

  const groups: string[][] = [];
  let currentGroup: DepartureWindow[] = [];
  let overlapStart = Number.NEGATIVE_INFINITY;
  let overlapEnd = Number.POSITIVE_INFINITY;

  for (const window of windows) {
    if (currentGroup.length === 0) {
      currentGroup = [window];
      overlapStart = window.startMinutes;
      overlapEnd = window.endMinutes;
      continue;
    }

    if (window.startMinutes <= overlapEnd) {
      currentGroup.push(window);
      overlapStart = Math.max(overlapStart, window.startMinutes);
      overlapEnd = Math.min(overlapEnd, window.endMinutes);
      continue;
    }

    if (currentGroup.length >= 2 && overlapStart <= overlapEnd) {
      groups.push(currentGroup.map((member) => member.commuterId));
    }

    currentGroup = [window];
    overlapStart = window.startMinutes;
    overlapEnd = window.endMinutes;
  }

  if (currentGroup.length >= 2 && overlapStart <= overlapEnd) {
    groups.push(currentGroup.map((member) => member.commuterId));
  }

  return groups;
}

function toDepartureWindow(
  commuterId: string,
  entry: ScheduleEntry,
  defaultToleranceMinutes: number
): DepartureWindow {
  const departure = parseTime(entry.departureTime);
  const tolerance = entry.toleranceMinutes ?? defaultToleranceMinutes;
  return {
    commuterId,
    startMinutes: departure - tolerance,
    endMinutes: departure + tolerance,
  };
}

function parseTime(value: string): number {
  const [hourStr, minuteStr] = value.split(":");
  const hours = Number(hourStr);
  const minutes = Number(minuteStr);
  return hours * 60 + minutes;
}

function makePairKey(a: string, b: string): string {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}
