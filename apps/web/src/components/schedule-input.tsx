"use client";

import { useMemo, useState } from "react";
import type { DayOfWeek, WeeklySchedule } from "@covoiturage/shared";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 0, label: "Lundi" },
  { key: 1, label: "Mardi" },
  { key: 2, label: "Mercredi" },
  { key: 3, label: "Jeudi" },
  { key: 4, label: "Vendredi" },
];

type DayValues = {
  departureTime: string;
  returnTime: string;
  toleranceMinutes: number;
};

const DEFAULT_DAY_VALUES: DayValues = {
  departureTime: "07:30",
  returnTime: "17:30",
  toleranceMinutes: 15,
};

export interface ScheduleInputProps {
  onSubmit: (schedule: WeeklySchedule) => void;
  userId?: string;
  weekStart?: string;
  className?: string;
}

const getMondayIso = (): string => {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  now.setDate(now.getDate() + diff);
  return now.toISOString().slice(0, 10);
};

const findMainDeparture = (times: string[]): string => {
  if (!times.length) {
    return "--:--";
  }

  const counts = new Map<string, number>();

  for (const time of times) {
    counts.set(time, (counts.get(time) ?? 0) + 1);
  }

  let best = times[0] ?? "--:--";
  let bestCount = counts.get(best) ?? 0;

  for (const [time, count] of counts.entries()) {
    if (count > bestCount || (count === bestCount && time < best)) {
      best = time;
      bestCount = count;
    }
  }

  return best;
};

export function ScheduleInput({
  onSubmit,
  userId = "demo-user",
  weekStart,
  className,
}: ScheduleInputProps) {
  const [activeDays, setActiveDays] = useState<Record<DayOfWeek, boolean>>({
    0: true,
    1: true,
    2: true,
    3: true,
    4: true,
  });
  const [isVariablePlanning, setIsVariablePlanning] = useState(false);
  const [sharedValues, setSharedValues] = useState<DayValues>(DEFAULT_DAY_VALUES);
  const [dayValues, setDayValues] = useState<Record<DayOfWeek, DayValues>>({
    0: DEFAULT_DAY_VALUES,
    1: DEFAULT_DAY_VALUES,
    2: DEFAULT_DAY_VALUES,
    3: DEFAULT_DAY_VALUES,
    4: DEFAULT_DAY_VALUES,
  });

  const activeDaysCount = useMemo(
    () => Object.values(activeDays).filter(Boolean).length,
    [activeDays],
  );

  const effectiveValues = (day: DayOfWeek): DayValues =>
    isVariablePlanning ? dayValues[day] : sharedValues;

  const mainDeparture = useMemo(() => {
    const times = DAYS.filter((day) => activeDays[day.key]).map((day) => effectiveValues(day.key).departureTime);
    return findMainDeparture(times);
  }, [activeDays, dayValues, isVariablePlanning, sharedValues]);

  const updateDayValues = (day: DayOfWeek, next: Partial<DayValues>) => {
    setDayValues((previous) => ({
      ...previous,
      [day]: {
        ...previous[day],
        ...next,
      },
    }));
  };

  const handleSubmit = () => {
    const entries = DAYS.filter((day) => activeDays[day.key]).map((day) => {
      const values = effectiveValues(day.key);

      return {
        day: day.key,
        departureTime: values.departureTime,
        toleranceMinutes: values.toleranceMinutes,
        returnTime: values.returnTime,
        returnToleranceMinutes: values.toleranceMinutes,
      };
    });

    onSubmit({
      userId,
      weekStart: weekStart ?? getMondayIso(),
      entries,
    });
  };

  return (
    <Card className={cn("w-full border-border/80 bg-card/95 shadow-sm", className)}>
      <CardHeader className="space-y-3">
        <CardTitle className="text-xl text-foreground sm:text-2xl">Votre planning hebdomadaire</CardTitle>
        <CardDescription>
          Activez vos jours de trajet et définissez vos horaires de départ/retour avec une tolérance.
        </CardDescription>

        <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-muted/35 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-foreground">Mon planning varie</p>
            <p className="text-sm text-muted-foreground">Activez pour personnaliser les horaires jour par jour.</p>
          </div>
          <Toggle
            pressed={isVariablePlanning}
            onPressedChange={setIsVariablePlanning}
            variant="outline"
            size="lg"
            className="w-full justify-center sm:w-auto"
            aria-label="Activer un planning variable"
          >
            {isVariablePlanning ? "Planning variable" : "Planning commun"}
          </Toggle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!isVariablePlanning && (
          <div className="rounded-lg border border-secondary/60 bg-secondary/15 p-3">
            <p className="mb-3 text-sm font-medium text-secondary-foreground">Horaires communs pour tous les jours actifs</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="depart-commun">Départ (matin)</Label>
                <Input
                  id="depart-commun"
                  type="time"
                  value={sharedValues.departureTime}
                  onChange={(event) => setSharedValues((prev) => ({ ...prev, departureTime: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retour-commun">Retour (soir)</Label>
                <Input
                  id="retour-commun"
                  type="time"
                  value={sharedValues.returnTime}
                  onChange={(event) => setSharedValues((prev) => ({ ...prev, returnTime: event.target.value }))}
                />
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <Label>Tolérance: ±{sharedValues.toleranceMinutes} min</Label>
              <Slider
                min={5}
                max={30}
                step={1}
                value={[sharedValues.toleranceMinutes]}
                onValueChange={(value) => setSharedValues((prev) => ({ ...prev, toleranceMinutes: value[0] ?? 15 }))}
              />
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {DAYS.map((day) => {
            const isActive = activeDays[day.key];
            const values = effectiveValues(day.key);

            return (
              <div key={day.key} className="rounded-lg border border-border/70 bg-background p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center justify-between gap-3 sm:justify-start">
                    <p className="font-semibold text-foreground">{day.label}</p>
                    <Toggle
                      pressed={isActive}
                      onPressedChange={(pressed) =>
                        setActiveDays((previous) => ({
                          ...previous,
                          [day.key]: pressed,
                        }))
                      }
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      aria-label={`Activer ${day.label}`}
                    >
                      {isActive ? "ON" : "OFF"}
                    </Toggle>
                  </div>

                  {!isVariablePlanning && (
                    <p className="text-xs text-muted-foreground">Même horaire que les autres jours actifs</p>
                  )}
                </div>

                {isActive && isVariablePlanning && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`depart-${day.key}`}>Départ (matin)</Label>
                      <Input
                        id={`depart-${day.key}`}
                        type="time"
                        value={values.departureTime}
                        onChange={(event) =>
                          updateDayValues(day.key, {
                            departureTime: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`retour-${day.key}`}>Retour (soir)</Label>
                      <Input
                        id={`retour-${day.key}`}
                        type="time"
                        value={values.returnTime}
                        onChange={(event) =>
                          updateDayValues(day.key, {
                            returnTime: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Tolérance: ±{values.toleranceMinutes} min</Label>
                      <Slider
                        min={5}
                        max={30}
                        step={1}
                        value={[values.toleranceMinutes]}
                        onValueChange={(value) =>
                          updateDayValues(day.key, {
                            toleranceMinutes: value[0] ?? 15,
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border border-accent/60 bg-accent/15 p-3 text-sm text-accent-foreground">
          Vous partez <span className="font-semibold">{activeDaysCount} jours</span> par semaine, principalement vers{" "}
          <span className="font-semibold">{mainDeparture}</span>.
        </div>

        <Button type="button" className="w-full sm:w-auto" onClick={handleSubmit} disabled={activeDaysCount === 0}>
          Enregistrer mon planning
        </Button>
      </CardContent>
    </Card>
  );
}
