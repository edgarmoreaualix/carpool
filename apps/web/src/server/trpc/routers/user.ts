import { eq } from "drizzle-orm";
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
});
