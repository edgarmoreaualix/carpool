import type { WeeklySchedule } from "@covoiturage/shared";
import type { LocationPoint } from "@/lib/onboarding";

export interface UserProfile {
  userId?: string;
  name?: string;
  email?: string;
  home: LocationPoint;
  work: LocationPoint;
}

interface FlowState {
  profile?: UserProfile;
  schedule?: WeeklySchedule;
}

const STORAGE_KEY = "covoiturage.flow.v1";

interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function computeHasMatch(schedule?: WeeklySchedule): boolean {
  if (!schedule) return false;
  return schedule.entries.length >= 3;
}

export function saveProfile(profile: UserProfile): void {
  updateFlow((current) => ({ ...current, profile }));
}

export function saveSchedule(schedule: WeeklySchedule): void {
  updateFlow((current) => ({ ...current, schedule }));
}

export function readFlow(): FlowState {
  const storage = getStorage();
  if (!storage) return {};

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as FlowState;
    return parsed ?? {};
  } catch {
    return {};
  }
}

function updateFlow(updater: (current: FlowState) => FlowState): void {
  const storage = getStorage();
  if (!storage) return;

  const current = readFlow();
  const next = updater(current);
  storage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function getStorage(customStorage?: KeyValueStorage): KeyValueStorage | null {
  if (customStorage) return customStorage;
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

// Test helpers
export function _readFlowFromStorage(storage: KeyValueStorage): FlowState {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return {};
  return JSON.parse(raw) as FlowState;
}

export function _writeFlowToStorage(storage: KeyValueStorage, state: FlowState): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}
