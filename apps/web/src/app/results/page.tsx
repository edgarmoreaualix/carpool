"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DailyPlanTimeline } from "@/components/results/daily-plan-timeline";
import { GroupSummaryCard } from "@/components/results/group-summary-card";
import type { DailyPlan, ResultMember } from "@/components/results/types";
import { WeeklySummary } from "@/components/results/weekly-summary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { computeHasMatch, readFlow } from "@/lib/flow-store";
import { trpcClient } from "@/lib/trpc-client";
import { WEEKLY_SUMMARY } from "./mock-data";

interface GroupMemberRow {
  userId: string;
  dayOfWeek: number;
  role: string;
  pickupOrder: number | null;
  pickupTime: string | null;
  name: string;
  commune: string;
}

export default function ResultsPage() {
  const [ready, setReady] = useState(false);
  const [hasSchedule, setHasSchedule] = useState(false);
  const [hasMatch, setHasMatch] = useState(false);
  const [weekStart, setWeekStart] = useState<string>(new Date().toISOString().slice(0, 10));
  const [groupRows, setGroupRows] = useState<GroupMemberRow[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  useEffect(() => {
    const flow = readFlow();
    const schedule = flow.schedule;
    const userId = flow.profile?.userId;
    setCurrentUserId(userId ?? null);

    if (schedule) {
      setWeekStart(schedule.weekStart);
    }

    setHasSchedule(Boolean(schedule));
    setHasMatch(computeHasMatch(schedule));

    const load = async () => {
      if (!userId || !schedule) {
        setReady(true);
        return;
      }
      try {
        const myGroup = await trpcClient.matching.myGroup.query({
          userId,
          weekStart: schedule.weekStart,
        });
        if (myGroup?.members) {
          setGroupRows(myGroup.members as GroupMemberRow[]);
          setHasMatch(myGroup.members.length > 0);
        }
      } finally {
        setReady(true);
      }
    };

    void load();
  }, []);

  const handleSeedDemoUsers = async () => {
    if (!currentUserId) return;
    setSeeding(true);
    setSeedError(null);

    try {
      const seed = await trpcClient.user.seedDemoUsers.mutate({
        userId: currentUserId,
        weekStart,
      });
      if (!seed.ok) {
        setSeedError("Veuillez d'abord enregistrer votre planning.");
        return;
      }

      await trpcClient.matching.triggerMatch.mutate({
        userId: currentUserId,
        weekStart,
      });
      const myGroup = await trpcClient.matching.myGroup.query({
        userId: currentUserId,
        weekStart,
      });
      if (myGroup?.members) {
        setGroupRows(myGroup.members as GroupMemberRow[]);
        setHasMatch(myGroup.members.length > 0);
      } else {
        setHasMatch(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Échec du seed de démonstration";
      setSeedError(message);
    } finally {
      setSeeding(false);
    }
  };

  const members = useMemo<ResultMember[]>(() => {
    const unique = new Map<string, ResultMember>();
    for (const row of groupRows) {
      if (!unique.has(row.userId)) {
        unique.set(row.userId, { id: row.userId, name: row.name, commune: row.commune });
      }
    }
    return Array.from(unique.values());
  }, [groupRows]);

  const plans = useMemo<DailyPlan[]>(() => {
    const byDay = new Map<number, GroupMemberRow[]>();
    for (const row of groupRows) {
      const current = byDay.get(row.dayOfWeek) ?? [];
      current.push(row);
      byDay.set(row.dayOfWeek, current);
    }

    const dayLabels = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

    return Array.from(byDay.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([day, rows]) => {
        const sorted = [...rows].sort((a, b) => (a.pickupOrder ?? 99) - (b.pickupOrder ?? 99));
        const driver = sorted.find((row) => row.role === "driver") ?? sorted[0];
        const departureTime = sorted[0]?.pickupTime ?? "07:30";

        return {
          dayLabel: dayLabels[day] ?? `Jour ${day}`,
          driverName: driver?.name ?? "Conducteur non défini",
          departureTime,
          arrivalTime: estimateArrival(departureTime, 40),
          stops: sorted.map((row, index) => ({
            memberId: row.userId,
            memberName: row.name,
            commune: row.commune,
            pickupTime: row.pickupTime ?? departureTime,
            order: row.pickupOrder ?? index + 1,
          })),
        };
      });
  }, [groupRows]);

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
        <p className="text-muted-foreground">Semaine du {weekStart}: votre plan covoiturage de la semaine.</p>
      </header>

      {!hasMatch || members.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Aucun match trouvé cette semaine</CardTitle>
            <CardDescription>
              Ajustez vos horaires ou votre tolérance pour augmenter vos chances dès dimanche prochain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Conseil: élargissez votre tolérance à ±20 minutes.</p>
            <div className="mt-3">
              <button
                type="button"
                onClick={handleSeedDemoUsers}
                disabled={seeding || !currentUserId}
                className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {seeding ? "Création en cours..." : "Créer des covoitureurs de démonstration"}
              </button>
              {seedError && <p className="mt-2 text-sm text-destructive">{seedError}</p>}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <GroupSummaryCard members={members} />
            <WeeklySummary summary={WEEKLY_SUMMARY} />
          </div>
          <DailyPlanTimeline plans={plans} />
        </>
      )}
    </main>
  );
}

function estimateArrival(departureTime: string, plusMinutes: number): string {
  const parts = departureTime.split(":").map((part) => Number(part));
  const h = parts[0];
  const m = parts[1];
  if (h == null || m == null || Number.isNaN(h) || Number.isNaN(m)) return departureTime;
  const total = h * 60 + m + plusMinutes;
  const hh = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const mm = (total % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}
