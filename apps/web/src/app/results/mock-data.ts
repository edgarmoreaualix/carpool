import type { DailyPlan, ResultMember, WeeklySummaryData } from "@/components/results/types";

export const GROUP_MEMBERS: ResultMember[] = [
  { id: "u1", name: "Marie Leroux", commune: "Ligné" },
  { id: "u2", name: "Thomas Martin", commune: "Saint-Mars-du-Désert" },
  { id: "u3", name: "Léa Dubois", commune: "Carquefou" },
];

export const DAILY_PLANS: DailyPlan[] = [
  {
    dayLabel: "Lundi",
    driverName: "Marie Leroux",
    departureTime: "07:30",
    arrivalTime: "08:10",
    stops: [
      { memberId: "u1", memberName: "Marie", commune: "Ligné", pickupTime: "07:30", order: 1 },
      { memberId: "u2", memberName: "Thomas", commune: "Saint-Mars", pickupTime: "07:41", order: 2 },
      { memberId: "u3", memberName: "Léa", commune: "Carquefou", pickupTime: "07:53", order: 3 },
    ],
  },
  {
    dayLabel: "Mardi",
    driverName: "Thomas Martin",
    departureTime: "07:35",
    arrivalTime: "08:15",
    stops: [
      { memberId: "u2", memberName: "Thomas", commune: "Saint-Mars", pickupTime: "07:35", order: 1 },
      { memberId: "u1", memberName: "Marie", commune: "Ligné", pickupTime: "07:45", order: 2 },
      { memberId: "u3", memberName: "Léa", commune: "Carquefou", pickupTime: "07:58", order: 3 },
    ],
  },
];

export const WEEKLY_SUMMARY: WeeklySummaryData = {
  ridesShared: 8,
  carsRemoved: 5,
  co2SavedKg: 18.4,
  moneySavedEur: 72,
};
