import { and, eq } from "drizzle-orm";
import { schema } from "@covoiturage/db/client";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";

const scheduleEntrySchema = z.object({
  day: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  departureTime: z.string(),
  toleranceMinutes: z.number().int().min(0),
  returnTime: z.string(),
  returnToleranceMinutes: z.number().int().min(0),
});

export const scheduleRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        weekStart: z.string().min(1),
        entries: z.array(scheduleEntrySchema),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(schema.scheduleEntries)
        .where(and(eq(schema.scheduleEntries.userId, input.userId), eq(schema.scheduleEntries.weekStart, input.weekStart)));

      if (input.entries.length > 0) {
        await ctx.db.insert(schema.scheduleEntries).values(
          input.entries.map((entry) => ({
            id: crypto.randomUUID(),
            userId: input.userId,
            weekStart: input.weekStart,
            dayOfWeek: entry.day,
            departureTime: entry.departureTime,
            toleranceMinutes: entry.toleranceMinutes,
            returnTime: entry.returnTime,
            returnToleranceMinutes: entry.returnToleranceMinutes,
            isActive: true,
          })),
        );
      }

      return { ok: true, count: input.entries.length };
    }),

  current: publicProcedure
    .input(z.object({ userId: z.string().min(1), weekStart: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const entries = await ctx.db
        .select()
        .from(schema.scheduleEntries)
        .where(and(eq(schema.scheduleEntries.userId, input.userId), eq(schema.scheduleEntries.weekStart, input.weekStart)));

      return {
        userId: input.userId,
        weekStart: input.weekStart,
        entries: entries.map((entry) => ({
          day: entry.dayOfWeek,
          departureTime: entry.departureTime,
          toleranceMinutes: entry.toleranceMinutes,
          returnTime: entry.returnTime,
          returnToleranceMinutes: entry.returnToleranceMinutes,
        })),
      };
    }),
});
