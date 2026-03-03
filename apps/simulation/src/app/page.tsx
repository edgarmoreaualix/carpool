"use client";

import React, { useMemo, useState } from "react";
import { DEMO_CORRIDOR, DEMO_SCENARIOS } from "../lib/demo-data";
import { interpolateScenario, type ScenarioName } from "../lib/scenarios";

const SCENARIOS: ScenarioName[] = ["A", "B", "C"];

export default function SimulationPage() {
  const [scenario, setScenario] = useState<ScenarioName>("B");
  const [timeIndex, setTimeIndex] = useState(32);
  const [adoptionRatePercent, setAdoptionRatePercent] = useState(20);

  const selected = DEMO_SCENARIOS[scenario];
  const snapshot = selected.snapshots[Math.min(timeIndex, selected.snapshots.length - 1)] ?? selected.snapshots[0];

  const customImpact = useMemo(() => {
    return interpolateScenario(
      DEMO_SCENARIOS.A,
      DEMO_SCENARIOS.C,
      adoptionRatePercent / 100
    );
  }, [adoptionRatePercent]);

  return (
    <main className="sim-page">
      <header className="hero">
        <p className="eyebrow">Simulation Corridor</p>
        <h1>Ligné vers Nantes, avant et après covoiturage IA</h1>
        <p>
          Explorez le trafic en temps réel simulé et l&apos;impact d&apos;une adoption progressive
          du covoiturage sur les bouchons, le CO2 et le budget mensuel.
        </p>
      </header>

      <section className="controls card">
        <div className="scenario-switch" role="tablist" aria-label="Scenario">
          {SCENARIOS.map((value) => (
            <button
              key={value}
              className={value === scenario ? "active" : ""}
              onClick={() => setScenario(value)}
              type="button"
            >
              {value === "A" ? "A - Sans covoiturage" : value === "B" ? "B - Adoption 20%" : "C - Adoption 50%"}
            </button>
          ))}
        </div>

        <label htmlFor="time-range">
          Heure: <strong>{formatClock(snapshot?.timestamp)}</strong>
        </label>
        <input
          id="time-range"
          type="range"
          min={0}
          max={Math.max(0, selected.snapshots.length - 1)}
          value={timeIndex}
          onChange={(e) => setTimeIndex(Number(e.target.value))}
        />
      </section>

      <section className="map-and-kpis">
        <article className="card map-card">
          <h2>Flux sur le corridor</h2>
          <CorridorMap vehicles={snapshot?.totalVehicles ?? 0} />
        </article>

        <aside className="kpis">
          <Kpi label="Véhicules actifs" value={Math.round(snapshot?.totalVehicles ?? 0).toString()} />
          <Kpi label="Vitesse moyenne" value={`${Math.round(avgSpeed(snapshot))} km/h`} />
          <Kpi label="Occupation moyenne" value={avgOccupancy(snapshot)} />
          <Kpi label="CO2 cumulé" value={`${(snapshot?.co2Kg ?? 0).toFixed(1)} kg`} />
        </aside>
      </section>

      <section className="dashboard card">
        <h2>Impact comparatif</h2>
        <div className="bars">
          <MetricBar
            label="Véhicules au pic"
            a={DEMO_SCENARIOS.A.totalVehicles}
            b={DEMO_SCENARIOS.B.totalVehicles}
            c={DEMO_SCENARIOS.C.totalVehicles}
            unit="veh"
          />
          <MetricBar
            label="CO2 (kg)"
            a={DEMO_SCENARIOS.A.co2Kg}
            b={DEMO_SCENARIOS.B.co2Kg}
            c={DEMO_SCENARIOS.C.co2Kg}
            unit="kg"
          />
          <MetricBar
            label="Coût carburant"
            a={DEMO_SCENARIOS.A.estimatedFuelCostEur}
            b={DEMO_SCENARIOS.B.estimatedFuelCostEur}
            c={DEMO_SCENARIOS.C.estimatedFuelCostEur}
            unit="EUR"
          />
        </div>

        <div className="adoption-control">
          <label htmlFor="adoption-range">Adoption plateforme: {adoptionRatePercent}%</label>
          <input
            id="adoption-range"
            type="range"
            min={0}
            max={60}
            value={adoptionRatePercent}
            onChange={(e) => setAdoptionRatePercent(Number(e.target.value))}
          />
          <p>
            Avec {adoptionRatePercent}% d&apos;adoption, environ <strong>{Math.round(DEMO_SCENARIOS.A.totalVehicles - customImpact.totalVehicles)} voitures</strong> sont retirées au pic, et
            l&apos;économie mensuelle estimée atteint <strong>{customImpact.estimatedMonthlySavingsEur.toFixed(0)} EUR</strong>.
          </p>
        </div>
      </section>
    </main>
  );
}

function CorridorMap({ vehicles }: { vehicles: number }) {
  const coords = DEMO_CORRIDOR.route.coordinates;
  const lngMin = Math.min(...coords.map(([lng]) => lng));
  const lngMax = Math.max(...coords.map(([lng]) => lng));
  const latMin = Math.min(...coords.map(([, lat]) => lat));
  const latMax = Math.max(...coords.map(([, lat]) => lat));

  const points = coords.map(([lng, lat]) => {
    const x = ((lng - lngMin) / Math.max(0.0001, lngMax - lngMin)) * 100;
    const y = 100 - ((lat - latMin) / Math.max(0.0001, latMax - latMin)) * 100;
    return `${x},${y}`;
  });

  const carCount = Math.max(8, Math.min(60, Math.round(vehicles / 8)));
  const cars = Array.from({ length: carCount }, (_, idx) => {
    const t = (idx / carCount + (Date.now() % 10000) / 10000) % 1;
    return pointOnPolyline(coords, t, lngMin, lngMax, latMin, latMax);
  });

  return (
    <svg viewBox="0 0 100 100" aria-label="Carte corridor" className="corridor-map">
      <defs>
        <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2f6b4f" />
          <stop offset="50%" stopColor="#d1a250" />
          <stop offset="100%" stopColor="#d47662" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="100" rx="6" className="map-bg" />
      <polyline points={points.join(" ")} fill="none" stroke="url(#routeGrad)" strokeWidth="2.8" />
      {cars.map((car, index) => (
        <circle key={`${car.x}-${car.y}-${index}`} cx={car.x} cy={car.y} r="1.1" className="car-dot" />
      ))}
    </svg>
  );
}

function pointOnPolyline(
  coords: [number, number][],
  progress: number,
  lngMin: number,
  lngMax: number,
  latMin: number,
  latMax: number
): { x: number; y: number } {
  const idx = progress * (coords.length - 1);
  const i = Math.floor(idx);
  const frac = idx - i;
  const a = coords[i] ?? coords[coords.length - 1]!;
  const b = coords[Math.min(i + 1, coords.length - 1)]!;
  const lng = a[0] + (b[0] - a[0]) * frac;
  const lat = a[1] + (b[1] - a[1]) * frac;
  const x = ((lng - lngMin) / Math.max(0.0001, lngMax - lngMin)) * 100;
  const y = 100 - ((lat - latMin) / Math.max(0.0001, latMax - latMin)) * 100;
  return { x, y };
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <article className="card kpi">
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function MetricBar({
  label,
  a,
  b,
  c,
  unit,
}: {
  label: string;
  a: number;
  b: number;
  c: number;
  unit: string;
}) {
  const max = Math.max(a, b, c, 1);
  return (
    <article className="metric">
      <p>{label}</p>
      <div className="row"><span>A</span><i style={{ width: `${(a / max) * 100}%` }} /><em>{a.toFixed(0)} {unit}</em></div>
      <div className="row"><span>B</span><i style={{ width: `${(b / max) * 100}%` }} /><em>{b.toFixed(0)} {unit}</em></div>
      <div className="row"><span>C</span><i style={{ width: `${(c / max) * 100}%` }} /><em>{c.toFixed(0)} {unit}</em></div>
    </article>
  );
}

function formatClock(timestamp?: string): string {
  if (!timestamp) return "--:--";
  return new Date(timestamp).toISOString().slice(11, 16);
}

function avgSpeed(snapshot?: { segments: { averageSpeedKmh: number }[] }): number {
  if (!snapshot || snapshot.segments.length === 0) return 0;
  return (
    snapshot.segments.reduce((sum, seg) => sum + seg.averageSpeedKmh, 0) /
    snapshot.segments.length
  );
}

function avgOccupancy(snapshot?: { segments: { occupancy: number }[] }): string {
  if (!snapshot || snapshot.segments.length === 0) return "0.0";
  return (
    snapshot.segments.reduce((sum, seg) => sum + seg.occupancy, 0) / snapshot.segments.length
  ).toFixed(2);
}
