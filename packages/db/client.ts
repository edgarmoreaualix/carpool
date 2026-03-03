import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const resolvedPath = resolveSqlitePath(process.env.DATABASE_URL);
fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

const sqlite = new Database(resolvedPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export { sqlite, schema };

export function initSqliteSchema(): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      home_lat REAL NOT NULL,
      home_lng REAL NOT NULL,
      work_lat REAL NOT NULL,
      work_lng REAL NOT NULL,
      commune TEXT NOT NULL,
      has_car INTEGER NOT NULL DEFAULT 0,
      max_passengers INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS corridors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      city_destination TEXT NOT NULL,
      route_geojson TEXT NOT NULL,
      total_distance_km REAL NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schedule_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      week_start TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      departure_time TEXT NOT NULL,
      tolerance_minutes INTEGER NOT NULL DEFAULT 15,
      return_time TEXT NOT NULL,
      return_tolerance_minutes INTEGER NOT NULL DEFAULT 15,
      is_active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS schedule_user_week_day_idx
      ON schedule_entries(user_id, week_start, day_of_week);

    CREATE TABLE IF NOT EXISTS carpool_groups (
      id TEXT PRIMARY KEY,
      corridor_id TEXT NOT NULL,
      week_start TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (corridor_id) REFERENCES corridors(id)
    );

    CREATE TABLE IF NOT EXISTS group_memberships (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      role TEXT NOT NULL,
      pickup_order INTEGER,
      pickup_lat REAL,
      pickup_lng REAL,
      pickup_time TEXT,
      FOREIGN KEY (group_id) REFERENCES carpool_groups(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS membership_group_user_day_idx
      ON group_memberships(group_id, user_id, day_of_week);
  `);
}

function resolveSqlitePath(databaseUrl?: string): string {
  const candidate = databaseUrl?.trim();
  if (candidate && candidate.startsWith("file:")) {
    const raw = candidate.replace(/^file:/, "");
    return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
  }
  if (candidate && !candidate.startsWith("file:")) {
    return candidate;
  }
  return path.resolve(process.cwd(), "data/covoiturage.sqlite");
}
