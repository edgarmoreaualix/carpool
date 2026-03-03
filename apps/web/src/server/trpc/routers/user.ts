import { and, eq } from "drizzle-orm";
import { schema } from "@covoiturage/db/client";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export const userRouter = router({
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, input.email))
        .limit(1);

      if (existing[0]) {
        return { userId: existing[0].id, created: false };
      }

      const id = crypto.randomUUID();
      await ctx.db.insert(schema.users).values({
        id,
        name: input.name,
        email: input.email,
        homeLat: 47.3556,
        homeLng: -1.3478,
        workLat: 47.2184,
        workLng: -1.5536,
        commune: "Ligné",
        hasCar: true,
        maxPassengers: 3,
        createdAt: new Date().toISOString(),
      });

      return { userId: id, created: true };
    }),

  updateLocation: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        home: z.object({ lat: z.number(), lng: z.number(), commune: z.string().min(1) }),
        work: z.object({ lat: z.number(), lng: z.number(), commune: z.string().min(1) }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(schema.users)
        .set({
          homeLat: input.home.lat,
          homeLng: input.home.lng,
          workLat: input.work.lat,
          workLng: input.work.lng,
          commune: input.home.commune,
        })
        .where(eq(schema.users.id, input.userId));

      return { ok: true };
    }),

  profile: publicProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, input.userId))
        .limit(1);

      const user = rows[0];
      if (!user) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        home: { lat: user.homeLat, lng: user.homeLng, commune: user.commune },
        work: { lat: user.workLat, lng: user.workLng, commune: "Nantes" },
      };
    }),

  seedDemoUsers: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        weekStart: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const baseSchedule = await ctx.db
        .select()
        .from(schema.scheduleEntries)
        .where(and(eq(schema.scheduleEntries.userId, input.userId), eq(schema.scheduleEntries.weekStart, input.weekStart)));

      if (baseSchedule.length === 0) {
        return { ok: false as const, reason: "no-base-schedule" as const };
      }

      const demoUsers = [
        {
          name: "Thomas Martin",
          email: "demo.thomas@covoiturage.local",
          commune: "Saint-Mars-du-Désert",
          homeLat: 47.3897,
          homeLng: -1.3892,
          workLat: 47.2184,
          workLng: -1.5536,
        },
        {
          name: "Léa Dubois",
          email: "demo.lea@covoiturage.local",
          commune: "Carquefou",
          homeLat: 47.2978,
          homeLng: -1.4919,
          workLat: 47.2184,
          workLng: -1.5536,
        },
      ];

      let inserted = 0;
      for (let index = 0; index < demoUsers.length; index++) {
        const demo = demoUsers[index]!;
        const existing = await ctx.db
          .select()
          .from(schema.users)
          .where(eq(schema.users.email, demo.email))
          .limit(1);

        const demoId = existing[0]?.id ?? crypto.randomUUID();
        if (!existing[0]) {
          await ctx.db.insert(schema.users).values({
            id: demoId,
            name: demo.name,
            email: demo.email,
            homeLat: demo.homeLat,
            homeLng: demo.homeLng,
            workLat: demo.workLat,
            workLng: demo.workLng,
            commune: demo.commune,
            hasCar: true,
            maxPassengers: 3,
            createdAt: new Date().toISOString(),
          });
          inserted += 1;
        }

        await ctx.db
          .delete(schema.scheduleEntries)
          .where(and(eq(schema.scheduleEntries.userId, demoId), eq(schema.scheduleEntries.weekStart, input.weekStart)));

        await ctx.db.insert(schema.scheduleEntries).values(
          baseSchedule.map((entry) => ({
            id: crypto.randomUUID(),
            userId: demoId,
            weekStart: input.weekStart,
            dayOfWeek: entry.dayOfWeek,
            departureTime: shiftTime(entry.departureTime, index === 0 ? 2 : -2),
            toleranceMinutes: entry.toleranceMinutes,
            returnTime: shiftTime(entry.returnTime, index === 0 ? 4 : -3),
            returnToleranceMinutes: entry.returnToleranceMinutes,
            isActive: true,
          })),
        );
      }

      return { ok: true as const, inserted };
    }),
});

function shiftTime(time: string, deltaMinutes: number): string {
  const parts = time.split(":").map((part) => Number(part));
  const h = parts[0];
  const m = parts[1];
  if (h == null || m == null || Number.isNaN(h) || Number.isNaN(m)) {
    return time;
  }

  const total = Math.max(0, Math.min(23 * 60 + 59, h * 60 + m + deltaMinutes));
  const hh = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const mm = (total % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}
