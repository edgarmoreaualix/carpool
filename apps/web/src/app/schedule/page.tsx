"use client";

import { useState } from "react";
import type { WeeklySchedule } from "@covoiturage/shared";

import { ScheduleInput } from "@/components/schedule-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SchedulePage() {
  const [latestSchedule, setLatestSchedule] = useState<WeeklySchedule | null>(null);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <section className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">Planification</p>
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Déclarez vos trajets de la semaine</h1>
        <p className="max-w-2xl text-muted-foreground">
          Ce formulaire mobile-first vous permet d’activer vos jours de déplacement, choisir vos horaires et définir
          votre tolérance de flexibilité.
        </p>
      </section>

      <ScheduleInput onSubmit={setLatestSchedule} />

      {latestSchedule && (
        <Card>
          <CardHeader>
            <CardTitle>Prévisualisation JSON soumise</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs text-muted-foreground sm:text-sm">
              {JSON.stringify(latestSchedule, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
