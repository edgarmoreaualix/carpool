export interface ResultMember {
  id: string;
  name: string;
  commune: string;
}

export interface DailyStop {
  memberId: string;
  memberName: string;
  commune: string;
  pickupTime: string;
  order: number;
}

export interface DailyPlan {
  dayLabel: string;
  driverName: string;
  departureTime: string;
  arrivalTime: string;
  stops: DailyStop[];
}

export interface WeeklySummaryData {
  ridesShared: number;
  carsRemoved: number;
  co2SavedKg: number;
  moneySavedEur: number;
}
