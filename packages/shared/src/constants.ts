/** Day names in French for display */
export const DAY_NAMES_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"] as const;

/** Day names in English for code */
export const DAY_NAMES_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

/** Average CO2 emissions per km for a standard car (grams) */
export const CO2_PER_KM_GRAMS = 120;

/** Average cost per km in France (EUR) — fuel + depreciation + insurance */
export const COST_PER_KM_EUR = 0.15;

/** Earth radius in meters (for Haversine) */
export const EARTH_RADIUS_M = 6_371_000;

/** Default time tolerance for schedule matching (minutes) */
export const DEFAULT_TOLERANCE_MINUTES = 15;

/** Max group size for carpooling */
export const MAX_GROUP_SIZE = 5;

/** Min group size (solo doesn't count) */
export const MIN_GROUP_SIZE = 2;
