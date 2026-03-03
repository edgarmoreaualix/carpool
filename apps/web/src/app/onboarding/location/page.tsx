"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_HOME_POINT,
  DEFAULT_WORK_POINT,
  formatCoordinate,
  type LocationPoint,
} from "@/lib/onboarding";
import { readFlow, saveProfile } from "@/lib/flow-store";
import { trpcClient } from "@/lib/trpc-client";

type Target = "home" | "work";

const MIN_LAT = 47.18;
const MAX_LAT = 47.41;
const MIN_LNG = -1.58;
const MAX_LNG = -1.32;

export default function OnboardingLocationPage() {
  const [target, setTarget] = useState<Target>("home");
  const [home, setHome] = useState<LocationPoint>(DEFAULT_HOME_POINT);
  const [work, setWork] = useState<LocationPoint>(DEFAULT_WORK_POINT);
  const [name, setName] = useState("Marie");
  const [email, setEmail] = useState("marie@exemple.fr");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeLabel = target === "home" ? "domicile" : "travail";

  const handleMapClick = (event: MouseEvent<SVGRectElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const xRatio = (event.clientX - rect.left) / rect.width;
    const yRatio = (event.clientY - rect.top) / rect.height;

    const nextPoint: LocationPoint = {
      lat: MAX_LAT - yRatio * (MAX_LAT - MIN_LAT),
      lng: MIN_LNG + xRatio * (MAX_LNG - MIN_LNG),
      commune: target === "home" ? home.commune : work.commune,
    };

    if (target === "home") {
      setHome(nextPoint);
    } else {
      setWork(nextPoint);
    }
  };

  const markers = useMemo(
    () => [
      { id: "home", point: home, color: "var(--primary)" },
      { id: "work", point: work, color: "var(--accent)" },
    ],
    [home, work],
  );

  const canContinue = home.commune.trim().length > 0 && work.commune.trim().length > 0;

  const handleContinue = () => {
    if (!canContinue) return;
    setIsSaving(true);
    setError(null);
    const flow = readFlow();
    const userId = flow.profile?.userId;
    const persist = async () => {
      try {
        if (userId) {
          await trpcClient.user.updateLocation.mutate({
            userId,
            home,
            work,
          });
        }
        saveProfile({ userId, name, email, home, work });
        if (typeof window !== "undefined") {
          window.location.href = "/schedule";
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Impossible d'enregistrer la localisation";
        setError(message);
      } finally {
        setIsSaving(false);
      }
    };
    void persist();
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-10">
      <Card>
        <CardHeader>
          <CardTitle>Déclarez vos lieux</CardTitle>
          <CardDescription>
            Sélectionnez votre domicile puis votre lieu de travail sur la carte du corridor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Prénom</Label>
              <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant={target === "home" ? "default" : "outline"} onClick={() => setTarget("home")}>
              Je place mon domicile
            </Button>
            <Button type="button" variant={target === "work" ? "default" : "outline"} onClick={() => setTarget("work")}>
              Je place mon travail
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-3">
            <p className="text-sm text-muted-foreground">
              Cliquez sur la carte pour ajuster votre <strong>{activeLabel}</strong>.
            </p>
            <svg viewBox="0 0 100 60" className="mt-3 h-64 w-full rounded-lg border border-border bg-background">
              <defs>
                <linearGradient id="corridor" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--secondary)" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="100" height="60" fill="transparent" onClick={handleMapClick} />
              <polyline points="8,8 24,12 40,18 58,30 78,43 92,54" fill="none" stroke="url(#corridor)" strokeWidth="2" strokeLinecap="round" />
              {markers.map((marker) => {
                const x = ((marker.point.lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * 100;
                const y = ((MAX_LAT - marker.point.lat) / (MAX_LAT - MIN_LAT)) * 60;
                return <circle key={marker.id} cx={x} cy={y} r="2" fill={marker.color} />;
              })}
            </svg>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="home-commune">Commune domicile</Label>
              <Input id="home-commune" value={home.commune} onChange={(event) => setHome((prev) => ({ ...prev, commune: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="work-commune">Commune travail</Label>
              <Input id="work-commune" value={work.commune} onChange={(event) => setWork((prev) => ({ ...prev, commune: event.target.value }))} />
            </div>
          </div>

          <div className="rounded-lg border border-border p-3 text-sm">
            <p className="font-medium">Résumé sélection</p>
            <p className="text-muted-foreground">Domicile: {home.commune} ({formatCoordinate(home.lat)}, {formatCoordinate(home.lng)})</p>
            <p className="text-muted-foreground">Travail: {work.commune} ({formatCoordinate(work.lat)}, {formatCoordinate(work.lng)})</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full sm:w-auto" disabled={!canContinue || isSaving} onClick={handleContinue}>
            {isSaving ? "Enregistrement..." : "Continuer"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
