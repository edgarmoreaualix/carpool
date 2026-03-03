# Product — Specification & User Flows

## Core Concept

Users declare their weekly commute schedule. The AI matches them into stable carpool groups. Each week, they get a plan: who's driving, who's riding, pickup points, times.

## User Personas

### Marie (Edgar's Mom)
- 52 years old, lives in Ligné
- Works in Nantes, variable schedule (7h30-11h30 start times)
- Drives alone 25km each way
- Would love to share but can't find schedule-compatible neighbors
- Not very tech-savvy, needs simple UX

### Thomas
- 34 years old, lives in Saint-Mars-du-Désert
- Works in Nantes centre, fairly regular 8h30-17h30
- Has a young family, wants to save on fuel costs
- Open to meeting neighbors, somewhat tech-savvy

### Léa
- 28 years old, lives in Carquefou
- Works in Nantes, flexible hours (startup job)
- Environmentally conscious, doesn't own a car
- Needs rides, happy to contribute to fuel costs
- Very tech-savvy

## MVP User Flow

### 1. Onboarding (2 minutes)
```
Welcome → Enter your village/address → Pin location on map → Done
```

### 2. Schedule Declaration (3 minutes)
```
"What's your typical week?"

Monday:    Depart [07:30] → Arrive Nantes by [08:15] | Return [17:30]
Tuesday:   Depart [07:30] → Arrive Nantes by [08:15] | Return [17:30]
Wednesday: OFF
Thursday:  Depart [11:00] → Arrive Nantes by [11:45] | Return [19:00]
Friday:    Depart [07:30] → Arrive Nantes by [08:15] | Return [16:00]

□ My schedule varies — I'll update weekly
□ I have a car and can drive
□ I prefer to be a passenger only
```

### 3. Matching Results (delivered Sunday evening for next week)
```
Your Carpool Group — Week of March 9

GROUP "Ligné Express"
├── Marie (Ligné) — Driver Mon, Fri
├── Thomas (Saint-Mars) — Driver Tue
└── Pierre (Ligné) — Driver Thu

MONDAY 7h30
  Marie drives → picks up Pierre (Ligné, +2min) → Thomas (Saint-Mars, +8min) → Nantes (08:15)

TUESDAY 7h30
  Thomas drives → picks up Marie (detour via Ligné, +5min) → Nantes (08:20)

THURSDAY 11h00
  Pierre drives → Marie (Ligné, +2min) → Nantes (11:40)

FRIDAY 7h30
  Marie drives → Pierre → Thomas → Nantes (08:15)
```

### 4. Weekly Lifecycle
```
Sunday PM  → Receive your carpool plan for the week
Mon-Fri    → Follow the plan (pickup notifications 15min before)
Friday PM  → Confirm next week's schedule (or tap "same as this week")
Sunday PM  → New optimized plan
```

## Feature Prioritization

### P0 — MVP (Build First)
- Map-based location input
- Weekly schedule declaration form
- AI matching algorithm (batch, weekly)
- Results display (group, schedule, driver rotation)
- Basic notifications (your plan is ready)

### P1 — Post-MVP
- In-app chat within carpool group
- Schedule modification mid-week
- Fuel cost splitting calculator
- Rating system (punctuality, comfort)
- Push notifications for pickup reminders

### P2 — Growth
- Multi-corridor support
- Employer dashboard (see employee participation)
- Local authority dashboard (traffic impact data)
- Gamification (CO2 saved, money saved, trees planted)
- Payment integration for cost sharing

### P3 — Scale
- Real-time GPS for pickup coordination
- Dynamic re-matching when someone cancels
- Inter-corridor transfers
- Integration with public transit schedules
- Mobile app (React Native)

## Schedule Flexibility Model

The key innovation. Schedules are not rigid — they're declared with **tolerance windows**:

```
Desired departure: 07:30
Tolerance: ±15 minutes
→ Matchable window: 07:15 - 07:45
```

The AI tries to match people whose windows overlap. Wider tolerance = more potential matches = better groups.

## Data Model (Simplified)

```
User {
  id, name, email
  home_location: Point (lat, lng)
  work_location: Point (lat, lng)
  has_car: boolean
  max_passengers: number (if has_car)
}

WeeklySchedule {
  user_id
  week_start: Date
  entries: [
    { day: DayOfWeek, departure_time: Time, tolerance_minutes: number, return_time: Time }
  ]
}

CarpoolGroup {
  id
  corridor_id
  week_start: Date
  members: [User]
  plan: [
    { day, driver: User, passengers: [User], pickups: [{ user, point, time }] }
  ]
}
```

## Key UX Principles

1. **Minimal input, maximum output** — declare schedule once, get a full week's plan
2. **Predictability over flexibility** — people want to know Tuesday's plan on Sunday, not discover it at 7am
3. **Trust through transparency** — show who's in your group, their photo, ratings
4. **Graceful degradation** — if a match can't be found, say so clearly, don't force bad matches
5. **Mobile-first** — this will be used at 7am on a phone, design for that
