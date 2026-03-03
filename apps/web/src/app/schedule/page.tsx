"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { WeeklySchedule } from "@covoiturage/shared";

import { ScheduleInput } from "@/components/schedule-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { readFlow, saveSchedule } from "@/lib/flow-store";
import { trpcClient } from "@/lib/trpc-client";

export default function SchedulePage() {
  const [latestSchedule, setLatestSchedule] = useState<WeeklySchedule | null>(null);
  const [profileLabel, setProfileLabel] = useState<string>("Profil en cours");
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const flow = readFlow();
    if (flow.profile) {
      setUserId(flow.profile.userId ?? null);
      setProfileLabel(`${flow.profile.home.commune} -> ${flow.profile.work.commune}`);
    }
    if (flow.schedule) {
      setLatestSchedule(flow.schedule);
    }
  }, []);

  const handleSubmit = (schedule: WeeklySchedule) => {
    const submit = async () => {
      setSaving(true);
      setError(null);
      try {
        let resolvedUserId = userId ?? readFlow().profile?.userId ?? null;
        if (!resolvedUserId) {
          const flow = readFlow();
          const fallbackName = flow.profile?.name ?? "Utilisateur";
          const fallbackEmail =
            flow.profile?.email ?? `auto.${Date.now()}@covoiturage.local`;
          const registration = await trpcClient.user.register.mutate({
            name: fallbackName,
            email: fallbackEmail,
          });
          resolvedUserId = registration.userId;
          setUserId(resolvedUserId);
        }

        if (!resolvedUserId) {
          throw new Error("Aucun utilisateur actif. Recommencez l'inscription.");
        }
        await trpcClient.schedule.submit.mutate({
          userId: resolvedUserId,
          weekStart: schedule.weekStart,
          entries: schedule.entries,
        });
        await trpcClient.matching.triggerMatch.mutate({
          userId: resolvedUserId,
          weekStart: schedule.weekStart,
        });
        saveSchedule(schedule);
        setLatestSchedule(schedule);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Impossible d'enregistrer le planning";
        setError(message);
      } finally {
        setSaving(false);
      }
    };
    void submit();
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <section className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">Planification</p>
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Déclarez vos trajets de la semaine</h1>
        <p className="max-w-2xl text-muted-foreground">
          Corridor actif: <strong>{profileLabel}</strong>. Activez vos jours et horaires pour déclencher le matching hebdomadaire.
        </p>
      </section>

      <ScheduleInput onSubmit={handleSubmit} />
      {saving && <p className="text-sm text-muted-foreground">Synchronisation API en cours...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

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
