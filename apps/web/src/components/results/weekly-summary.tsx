import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WeeklySummaryData } from "./types";

export function WeeklySummary({ summary }: { summary: WeeklySummaryData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Résumé hebdomadaire</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Trajets partagés" value={summary.ridesShared.toString()} />
        <Metric label="Voitures retirées" value={summary.carsRemoved.toString()} />
        <Metric label="CO2 évité" value={`${summary.co2SavedKg.toFixed(1)} kg`} />
        <Metric label="Économies" value={`${summary.moneySavedEur.toFixed(0)} €`} />
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-border bg-muted/30 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </article>
  );
}
