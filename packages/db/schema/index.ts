import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// SQLite-first schema for local file-backed runtime.

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  homeLat: real("home_lat").notNull(),
  homeLng: real("home_lng").notNull(),
  workLat: real("work_lat").notNull(),
  workLng: real("work_lng").notNull(),
  commune: text("commune").notNull(),
  hasCar: integer("has_car", { mode: "boolean" }).notNull().default(false),
  maxPassengers: integer("max_passengers").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const corridors = sqliteTable("corridors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  cityDestination: text("city_destination").notNull(),
  routeGeoJson: text("route_geojson").notNull(),
  totalDistanceKm: real("total_distance_km").notNull(),
  createdAt: text("created_at").notNull(),
});

export const scheduleEntries = sqliteTable(
  "schedule_entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weekStart: text("week_start").notNull(),
    dayOfWeek: integer("day_of_week").notNull(),
    departureTime: text("departure_time").notNull(),
    toleranceMinutes: integer("tolerance_minutes").notNull().default(15),
    returnTime: text("return_time").notNull(),
    returnToleranceMinutes: integer("return_tolerance_minutes").notNull().default(15),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  },
  (table) => [
    uniqueIndex("schedule_user_week_day_idx").on(table.userId, table.weekStart, table.dayOfWeek),
    index("schedule_week_idx").on(table.weekStart, table.dayOfWeek),
  ],
);

export const carpoolGroups = sqliteTable("carpool_groups", {
  id: text("id").primaryKey(),
  corridorId: text("corridor_id")
    .notNull()
    .references(() => corridors.id),
  weekStart: text("week_start").notNull(),
  createdAt: text("created_at").notNull(),
});

export const groupMemberships = sqliteTable(
  "group_memberships",
  {
    id: text("id").primaryKey(),
    groupId: text("group_id")
      .notNull()
      .references(() => carpoolGroups.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    role: text("role").notNull(),
    pickupOrder: integer("pickup_order"),
    pickupLat: real("pickup_lat"),
    pickupLng: real("pickup_lng"),
    pickupTime: text("pickup_time"),
  },
  (table) => [uniqueIndex("membership_group_user_day_idx").on(table.groupId, table.userId, table.dayOfWeek)],
);
