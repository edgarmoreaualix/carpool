import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { Corridor, Point } from "@covoiturage/shared";
import { isWithinCorridorBuffer, projectOnCorridor } from "../src/corridor";

const corridorDataPath = fileURLToPath(
  new URL("../../../data/corridors/ligne-nantes.json", import.meta.url)
);
const corridor = JSON.parse(readFileSync(corridorDataPath, "utf-8")) as Corridor;

function stop(name: string): Point {
  const match = corridor.stops.find((s) => s.name === name);
  if (!match) {
    throw new Error(`Stop not found: ${name}`);
  }

  return { lat: match.lat, lng: match.lng };
}

describe("projectOnCorridor", () => {
  it("projects Ligne near position 0", () => {
    const result = projectOnCorridor(stop("Ligné"), corridor.route);

    expect(result.position).toBeLessThan(0.02);
    expect(result.distanceFromCorridor).toBeLessThan(20);
  });

  it("projects Nantes near position 1", () => {
    const result = projectOnCorridor(stop("Nantes Centre"), corridor.route);

    expect(result.position).toBeGreaterThan(0.98);
    expect(result.distanceFromCorridor).toBeLessThan(20);
  });

  it("projects Saint-Mars-du-Desert between 0 and 1", () => {
    const result = projectOnCorridor(stop("Saint-Mars-du-Désert"), corridor.route);

    expect(result.position).toBeGreaterThan(0);
    expect(result.position).toBeLessThan(1);
    expect(result.distanceFromCorridor).toBeLessThan(20);
  });

  it("returns a large distance for a point far from corridor", () => {
    const bordeaux: Point = { lat: 44.8378, lng: -0.5792 };
    const result = projectOnCorridor(bordeaux, corridor.route);

    expect(result.distanceFromCorridor).toBeGreaterThan(250_000);
  });
});

describe("isWithinCorridorBuffer", () => {
  it("returns true for a point on the corridor", () => {
    const onCorridor = stop("Carquefou");

    expect(isWithinCorridorBuffer(onCorridor, corridor.route, 100)).toBe(true);
  });

  it("returns false for a point ~50km away", () => {
    const farPoint: Point = { lat: 47.7034, lng: -2.7523 }; // Vannes

    expect(isWithinCorridorBuffer(farPoint, corridor.route, 5_000)).toBe(false);
  });
});
