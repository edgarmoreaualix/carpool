import { haversineDistance, projectOnCorridor } from "@covoiturage/geo";
import type {
  Commuter,
  GeoJSONLineString,
  GeographicCluster,
  MatchingConfig,
} from "@covoiturage/shared";

interface ProjectedCommuter {
  commuter: Commuter;
  position: number;
}

export function clusterByGeography(
  commuters: Commuter[],
  corridor: GeoJSONLineString,
  config: MatchingConfig
): GeographicCluster[] {
  const maxOffsetMeters = config.maxCorridorOffsetKm * 1000;
  const corridorLengthKm = getCorridorLengthKm(corridor);

  const eligible: ProjectedCommuter[] = [];
  for (const commuter of commuters) {
    const projection = projectOnCorridor(commuter.user.homeLocation, corridor);
    commuter.corridorPosition = projection.position;

    if (projection.distanceFromCorridor <= maxOffsetMeters) {
      eligible.push({ commuter, position: projection.position });
    }
  }

  if (eligible.length === 0) {
    return [];
  }

  eligible.sort((a, b) => a.position - b.position);

  const grouped: ProjectedCommuter[][] = [];
  let current: ProjectedCommuter[] = [];

  for (const candidate of eligible) {
    if (current.length === 0) {
      current.push(candidate);
      continue;
    }

    const startPosition = current[0]!.position;
    const spreadKm = (candidate.position - startPosition) * corridorLengthKm;

    if (spreadKm <= config.maxClusterSpreadKm) {
      current.push(candidate);
      continue;
    }

    grouped.push(current);
    current = [candidate];
  }

  if (current.length > 0) {
    grouped.push(current);
  }

  return grouped.map((members, index) => {
    const commutersInCluster = members.map((member) => member.commuter);
    const positions = members.map((member) => member.position);
    const latSum = commutersInCluster.reduce(
      (sum, commuter) => sum + commuter.user.homeLocation.lat,
      0
    );
    const lngSum = commutersInCluster.reduce(
      (sum, commuter) => sum + commuter.user.homeLocation.lng,
      0
    );

    return {
      id: `geocluster-${index + 1}`,
      members: commutersInCluster,
      centroid: {
        lat: latSum / commutersInCluster.length,
        lng: lngSum / commutersInCluster.length,
      },
      corridorRange: [Math.min(...positions), Math.max(...positions)],
    };
  });
}

function getCorridorLengthKm(corridor: GeoJSONLineString): number {
  if (corridor.coordinates.length < 2) {
    return 0;
  }

  let meters = 0;
  for (let i = 0; i < corridor.coordinates.length - 1; i++) {
    const from = corridor.coordinates[i]!;
    const to = corridor.coordinates[i + 1]!;
    meters += haversineDistance(
      { lat: from[1], lng: from[0] },
      { lat: to[1], lng: to[0] }
    );
  }

  return meters / 1000;
}
