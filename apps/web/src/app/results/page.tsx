import { DailyPlanTimeline } from "@/components/results/daily-plan-timeline";
import { GroupSummaryCard } from "@/components/results/group-summary-card";
import { WeeklySummary } from "@/components/results/weekly-summary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DAILY_PLANS, GROUP_MEMBERS, WEEKLY_SUMMARY } from "./mock-data";

export default function ResultsPage() {
  const hasMatch = GROUP_MEMBERS.length > 0;

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
        <div className="grid gap-4 lg:grid-cols-2">
          <GroupSummaryCard members={GROUP_MEMBERS} />
          <WeeklySummary summary={WEEKLY_SUMMARY} />
        </div>
      )}

      {hasMatch && <DailyPlanTimeline plans={DAILY_PLANS} />}
    </main>
  );
}
