"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DailyPlanTimeline } from "@/components/results/daily-plan-timeline";
import { GroupSummaryCard } from "@/components/results/group-summary-card";
import { WeeklySummary } from "@/components/results/weekly-summary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { computeHasMatch, readFlow } from "@/lib/flow-store";
import { DAILY_PLANS, GROUP_MEMBERS, WEEKLY_SUMMARY } from "./mock-data";

export default function ResultsPage() {
  const [ready, setReady] = useState(false);
  const [hasSchedule, setHasSchedule] = useState(false);
  const [hasMatch, setHasMatch] = useState(false);

  useEffect(() => {
    const flow = readFlow();
    setHasSchedule(Boolean(flow.schedule));
    setHasMatch(computeHasMatch(flow.schedule));
    setReady(true);
  }, []);

  if (!ready) {
    return <main className="mx-auto w-full max-w-5xl px-4 py-10">Chargement...</main>;
  }

  if (!hasSchedule) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Commencez par votre planning</CardTitle>
            <CardDescription>Nous avons besoin de vos horaires pour calculer un groupe compatible.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/schedule" className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Déclarer mon planning
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 px-4 py-6 sm:space-y-6 sm:py-10">
      <header>
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Résultats de matching</h1>
        <p className="text-muted-foreground">Votre plan covoiturage de la semaine, jour par jour.</p>
      </header>

      {!hasMatch ? (
        <Card>
          <CardHeader>
            <CardTitle>Aucun match trouvé cette semaine</CardTitle>
            <CardDescription>
              Ajustez vos horaires ou votre tolérance pour augmenter vos chances dès dimanche prochain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Conseil: élargissez votre tolérance à ±20 minutes.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <GroupSummaryCard members={GROUP_MEMBERS} />
            <WeeklySummary summary={WEEKLY_SUMMARY} />
          </div>
          <DailyPlanTimeline plans={DAILY_PLANS} />
        </>
      )}
    </main>
  );
}
