import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  date,
  time,
  timestamp,
  doublePrecision,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ── Users ─────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  homeLat: doublePrecision("home_lat").notNull(),
  homeLng: doublePrecision("home_lng").notNull(),
  workLat: doublePrecision("work_lat").notNull(),
  workLng: doublePrecision("work_lng").notNull(),
  commune: text("commune").notNull(),
  hasCar: boolean("has_car").notNull().default(false),
  maxPassengers: integer("max_passengers").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Corridors ─────────────────────────────────────────────────────

export const corridors = pgTable("corridors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  cityDestination: text("city_destination").notNull(),
  routeGeoJson: text("route_geojson").notNull(), // GeoJSON LineString as JSON string
  totalDistanceKm: doublePrecision("total_distance_km").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Schedule Entries ──────────────────────────────────────────────

export const scheduleEntries = pgTable(
  "schedule_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weekStart: date("week_start").notNull(),
    dayOfWeek: integer("day_of_week").notNull(), // 0=Mon, 4=Fri
    departureTime: time("departure_time").notNull(),
    toleranceMinutes: integer("tolerance_minutes").notNull().default(15),
    returnTime: time("return_time").notNull(),
    returnToleranceMinutes: integer("return_tolerance_minutes").notNull().default(15),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    uniqueIndex("schedule_user_week_day_idx").on(
      table.userId,
      table.weekStart,
      table.dayOfWeek
    ),
    index("schedule_week_idx").on(table.weekStart, table.dayOfWeek),
  ]
);

// ── Carpool Groups ────────────────────────────────────────────────

export const carpoolGroups = pgTable("carpool_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  corridorId: uuid("corridor_id")
    .notNull()
    .references(() => corridors.id),
  weekStart: date("week_start").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Group Memberships ─────────────────────────────────────────────

export const groupMemberships = pgTable(
  "group_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => carpoolGroups.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    role: text("role").notNull(), // 'driver' | 'passenger'
    pickupOrder: integer("pickup_order"),
    pickupLat: doublePrecision("pickup_lat"),
    pickupLng: doublePrecision("pickup_lng"),
    pickupTime: time("pickup_time"),
  },
  (table) => [
    uniqueIndex("membership_group_user_day_idx").on(
      table.groupId,
      table.userId,
      table.dayOfWeek
    ),
  ]
);
