import { describe, expect, it } from "vitest";
import { EARTH_RADIUS_M } from "@covoiturage/shared";
import { haversineDistance } from "../src/distance";

describe("haversineDistance", () => {
  it("computes known city-pair distance (Paris-Lyon ~392km)", () => {
    const paris = { lat: 48.8566, lng: 2.3522 };
    const lyon = { lat: 45.764, lng: 4.8357 };

    const distance = haversineDistance(paris, lyon);

    expect(distance).toBeGreaterThan(385_000);
    expect(distance).toBeLessThan(400_000);
  });

  it("computes known local distance (Ligne-Nantes ~25km)", () => {
    const ligne = { lat: 47.3556, lng: -1.3478 };
    const nantes = { lat: 47.2184, lng: -1.5536 };

    const distance = haversineDistance(ligne, nantes);

    // Great-circle distance is shorter than road corridor length (~25km).
    expect(distance).toBeGreaterThan(21_000);
    expect(distance).toBeLessThan(23_000);
  });

  it("returns zero for the same point", () => {
    const point = { lat: 47.3556, lng: -1.3478 };

    expect(haversineDistance(point, point)).toBe(0);
  });

  it("handles antipodal points", () => {
    const a = { lat: 0, lng: 0 };
    const b = { lat: 0, lng: 180 };

    const distance = haversineDistance(a, b);
    const expected = Math.PI * EARTH_RADIUS_M;

    expect(distance).toBeCloseTo(expected, 6);
  });

  it("is symmetric (a->b === b->a)", () => {
    const a = { lat: 47.3897, lng: -1.3892 };
    const b = { lat: 47.2184, lng: -1.5536 };

    const ab = haversineDistance(a, b);
    const ba = haversineDistance(b, a);

    expect(ab).toBeCloseTo(ba, 12);
  });
});
