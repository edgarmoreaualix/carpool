import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyPlan } from "./types";

export function DailyPlanTimeline({ plans }: { plans: DailyPlan[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan de pickup quotidien</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {plans.map((plan) => (
          <section key={plan.dayLabel} className="rounded-lg border border-border p-3">
            <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-foreground">{plan.dayLabel}</h3>
              <p className="text-sm text-muted-foreground">
                Départ {plan.departureTime} · Arrivée {plan.arrivalTime}
              </p>
            </header>
            <p className="text-sm text-primary">🚗 {plan.driverName} conduit</p>
            <ol className="mt-2 space-y-2">
              {plan.stops
                .sort((a, b) => a.order - b.order)
                .map((stop) => (
                  <li key={`${plan.dayLabel}-${stop.memberId}`} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
                    <span>
                      {stop.order}. {stop.memberName} ({stop.commune})
                    </span>
                    <strong>{stop.pickupTime}</strong>
                  </li>
                ))}
            </ol>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}
