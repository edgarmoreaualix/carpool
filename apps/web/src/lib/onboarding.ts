export interface LocationPoint {
  lat: number;
  lng: number;
  commune: string;
}

export interface OnboardingLocationPayload {
  home: LocationPoint;
  work: LocationPoint;
}

export const DEFAULT_HOME_POINT: LocationPoint = {
  lat: 47.3556,
  lng: -1.3478,
  commune: "Ligné",
};

export const DEFAULT_WORK_POINT: LocationPoint = {
  lat: 47.2184,
  lng: -1.5536,
  commune: "Nantes Centre",
};

export function formatCoordinate(value: number): string {
  return value.toFixed(4);
}
