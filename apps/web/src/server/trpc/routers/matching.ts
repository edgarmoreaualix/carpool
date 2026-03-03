import { and, eq } from "drizzle-orm";
import { clusterByGeography, findScheduleCompatibleGroups } from "@covoiturage/matching-engine";
import {
  DEFAULT_MATCHING_CONFIG,
  type Commuter,
  type Corridor,
  type GeoJSONLineString,
  type WeeklySchedule,
} from "@covoiturage/shared";
import { schema } from "@covoiturage/db/client";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export const matchingRouter = router({
  triggerMatch: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        weekStart: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const users = await ctx.db.select().from(schema.users);
      const entries = await ctx.db
        .select()
        .from(schema.scheduleEntries)
        .where(eq(schema.scheduleEntries.weekStart, input.weekStart));
      const corridors = await ctx.db.select().from(schema.corridors).limit(1);
      const corridorRow = corridors[0];

      if (!corridorRow) {
        return { ok: false, reason: "no corridor" as const };
      }

      const commuterSchedules = new Map<string, WeeklySchedule>();
      for (const entry of entries) {
        const current = commuterSchedules.get(entry.userId) ?? {
          userId: entry.userId,
          weekStart: input.weekStart,
          entries: [],
        };
        current.entries.push({
          day: entry.dayOfWeek as 0 | 1 | 2 | 3 | 4,
          departureTime: entry.departureTime,
          toleranceMinutes: entry.toleranceMinutes,
          returnTime: entry.returnTime,
          returnToleranceMinutes: entry.returnToleranceMinutes,
        });
        commuterSchedules.set(entry.userId, current);
      }

      const commuters: Commuter[] = users
        .map((user) => {
          const schedule = commuterSchedules.get(user.id);
          if (!schedule || schedule.entries.length === 0) return null;
          return {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              homeLocation: { lat: user.homeLat, lng: user.homeLng },
              workLocation: { lat: user.workLat, lng: user.workLng },
              hasCar: user.hasCar,
              maxPassengers: user.maxPassengers,
              commune: user.commune,
            },
            schedule,
            corridorPosition: 0,
          };
        })
        .filter((value): value is Commuter => Boolean(value));

      const corridor: Corridor = {
        id: corridorRow.id,
        name: corridorRow.name,
        description: corridorRow.description ?? "",
        stops: [],
        roadSegments: [],
        route: JSON.parse(corridorRow.routeGeoJson) as GeoJSONLineString,
        totalDistanceKm: corridorRow.totalDistanceKm,
        typicalDriveMinutes: { freeFlow: 30, peakHour: 45 },
      };

      const clusters = clusterByGeography(commuters, corridor.route, DEFAULT_MATCHING_CONFIG);
      const allGroups: Commuter[][] = [];
      for (const cluster of clusters) {
        allGroups.push(...findScheduleCompatibleGroups(cluster, DEFAULT_MATCHING_CONFIG));
      }

      const selected = allGroups.find((group) => group.some((commuter) => commuter.user.id === input.userId));
      if (!selected || selected.length === 0) {
        return { ok: true, matched: false as const };
      }

      const groupId = crypto.randomUUID();
      await ctx.db.insert(schema.carpoolGroups).values({
        id: groupId,
        corridorId: corridor.id,
        weekStart: input.weekStart,
        createdAt: new Date().toISOString(),
      });

      const userSchedule = commuterSchedules.get(input.userId);
      const days = userSchedule?.entries.map((entry) => entry.day) ?? [0, 1, 2];

      const membershipRows = selected.flatMap((commuter, index) =>
        days.map((day, dayIndex) => ({
          id: crypto.randomUUID(),
          groupId,
          userId: commuter.user.id,
          dayOfWeek: day,
          role: index === dayIndex % selected.length ? "driver" : "passenger",
          pickupOrder: index + 1,
          pickupLat: commuter.user.homeLocation.lat,
          pickupLng: commuter.user.homeLocation.lng,
          pickupTime: commuter.schedule.entries.find((entry) => entry.day === day)?.departureTime ?? "07:30",
        })),
      );

      if (membershipRows.length > 0) {
        await ctx.db.insert(schema.groupMemberships).values(membershipRows);
      }

      return { ok: true, matched: true as const, groupId };
    }),

  myGroup: publicProcedure
    .input(z.object({ userId: z.string().min(1), weekStart: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const membership = await ctx.db
        .select()
        .from(schema.groupMemberships)
        .where(eq(schema.groupMemberships.userId, input.userId))
        .limit(1);

      const groupId = membership[0]?.groupId;
      if (!groupId) return null;

      const group = await ctx.db
        .select()
        .from(schema.carpoolGroups)
        .where(and(eq(schema.carpoolGroups.id, groupId), eq(schema.carpoolGroups.weekStart, input.weekStart)))
        .limit(1);
      if (!group[0]) return null;

      const members = await ctx.db
        .select({
          userId: schema.groupMemberships.userId,
          dayOfWeek: schema.groupMemberships.dayOfWeek,
          role: schema.groupMemberships.role,
          pickupOrder: schema.groupMemberships.pickupOrder,
          pickupTime: schema.groupMemberships.pickupTime,
          name: schema.users.name,
          commune: schema.users.commune,
        })
        .from(schema.groupMemberships)
        .innerJoin(schema.users, eq(schema.groupMemberships.userId, schema.users.id))
        .where(eq(schema.groupMemberships.groupId, groupId));

      return {
        groupId,
        weekStart: group[0].weekStart,
        members,
      };
    }),

  weekPlan: publicProcedure
    .input(z.object({ userId: z.string().min(1), weekStart: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          dayOfWeek: schema.groupMemberships.dayOfWeek,
          role: schema.groupMemberships.role,
          pickupOrder: schema.groupMemberships.pickupOrder,
          pickupTime: schema.groupMemberships.pickupTime,
          name: schema.users.name,
          commune: schema.users.commune,
        })
        .from(schema.groupMemberships)
        .innerJoin(schema.users, eq(schema.groupMemberships.userId, schema.users.id))
        .where(eq(schema.groupMemberships.userId, input.userId));
    }),
});
