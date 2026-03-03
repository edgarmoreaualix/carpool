import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db, initSqliteSchema, schema } from "@covoiturage/db/client";
import type { Corridor } from "@covoiturage/shared";

let bootstrapped = false;

export interface TrpcContext {
  db: typeof db;
}

export async function createContext(): Promise<TrpcContext> {
  if (!bootstrapped) {
    initSqliteSchema();
    await ensureDefaultCorridor();
    bootstrapped = true;
  }

  return { db };
}

async function ensureDefaultCorridor(): Promise<void> {
  const slug = "ligne-nantes";
  const existing = await db
    .select()
    .from(schema.corridors)
    .where(eq(schema.corridors.slug, slug))
    .limit(1);

  if (existing.length > 0) return;

  const corridorPath = path.resolve(process.cwd(), "../../data/corridors/ligne-nantes.json");
  const raw = fs.readFileSync(corridorPath, "utf-8");
  const corridor = JSON.parse(raw) as Corridor;

  await db.insert(schema.corridors).values({
    id: corridor.id,
    slug,
    name: corridor.name,
    description: corridor.description,
    cityDestination: corridor.stops[corridor.stops.length - 1]?.name ?? "Nantes",
    routeGeoJson: JSON.stringify(corridor.route),
    totalDistanceKm: corridor.totalDistanceKm,
    createdAt: new Date().toISOString(),
  });
}
