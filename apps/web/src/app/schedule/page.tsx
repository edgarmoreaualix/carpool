"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { WeeklySchedule } from "@covoiturage/shared";

import { ScheduleInput } from "@/components/schedule-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { readFlow, saveSchedule } from "@/lib/flow-store";

export default function SchedulePage() {
  const [latestSchedule, setLatestSchedule] = useState<WeeklySchedule | null>(null);
  const [profileLabel, setProfileLabel] = useState<string>("Profil en cours");

  useEffect(() => {
    const flow = readFlow();
    if (flow.profile) {
      setProfileLabel(`${flow.profile.home.commune} -> ${flow.profile.work.commune}`);
    }
    if (flow.schedule) {
      setLatestSchedule(flow.schedule);
    }
  }, []);

  const handleSubmit = (schedule: WeeklySchedule) => {
    saveSchedule(schedule);
    setLatestSchedule(schedule);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <section className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">Planification</p>
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Déclarez vos trajets de la semaine</h1>
        <p className="max-w-2xl text-muted-foreground">
          Corrdior actif: <strong>{profileLabel}</strong>. Activez vos jours et horaires pour déclencher le matching hebdomadaire.
        </p>
      </section>

      <ScheduleInput onSubmit={handleSubmit} />

      {latestSchedule && (
        <Card>
          <CardHeader>
            <CardTitle>Planning enregistré</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs text-muted-foreground sm:text-sm">
              {JSON.stringify(latestSchedule, null, 2)}
            </pre>
            <Link href="/results" className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Voir mon groupe de la semaine
            </Link>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
