# AI Matching — Algorithm Design

## Problem Statement

Given N commuters along a corridor, each with:
- A home location (point on or near the corridor)
- A work destination (zone in the city)
- A weekly schedule (variable departure/return times with tolerance windows)
- Driver/passenger preference

Produce optimal carpool groups of 2-5 people that minimize:
- Total vehicles on the road
- Detour time for drivers
- Schedule compromise for passengers

While maximizing:
- Group stability (same people week-to-week when possible)
- Fair driver rotation
- Pickup convenience

## Algorithm Overview

The matching runs as a **weekly batch process** (not real-time). This is a key architectural decision — batch matching over a full week produces dramatically better results than greedy per-trip matching.

### Phase 1: Geographic Clustering

Group commuters by corridor position and proximity:

```
Input:  All commuters with home locations
Output: Geographic clusters (people who live close enough to share a car)

Algorithm:
1. Project each commuter's home onto the corridor line → get corridor_position (0-1)
2. Cluster by corridor_position using DBSCAN or simple window:
   - Max pickup detour: 5 minutes / ~3km off-corridor
   - Max spread along corridor within cluster: 10 minutes / ~8km
3. Each cluster = potential carpool group (may split further by schedule)
```

### Phase 2: Schedule Compatibility

Within each geographic cluster, find schedule-compatible subgroups:

```
Input:  Geographic cluster of commuters + their weekly schedules
Output: Schedule-compatible subgroups

For each day of the week:
  1. Extract each person's departure window: [desired_time - tolerance, desired_time + tolerance]
  2. Find maximal overlapping sets using interval scheduling:
     - Sort by window start
     - Greedily group people with overlapping windows
     - Choose departure time = median of desired times in group
  3. Person is "matchable" on this day if their window overlaps with ≥1 other person

A weekly subgroup = people who are matchable together on ≥3 days of the week
```

### Phase 3: Group Optimization

Select the best grouping from candidate subgroups:

```
Input:  All possible schedule-compatible subgroups
Output: Final carpool groups (2-5 people each)

Optimization objective (minimize):
  cost = Σ (detour_minutes × w1)
       + Σ (schedule_compromise_minutes × w2)
       + Σ (unmatched_people × w3)
       - Σ (group_stability_bonus × w4)

Constraints:
  - Each person in at most 1 group
  - Group size: 2-5 people
  - At least 1 driver per group per day
  - Max detour: 10 minutes
  - Max schedule compromise: 15 minutes

Approach:
  - For MVP: greedy assignment (fast, good enough for <10k people)
  - For scale: integer linear programming or constraint satisfaction
```

### Phase 4: Driver Rotation

Assign driving duties fairly within each group:

```
Input:  Final group + member driver capabilities
Output: Daily driver assignments

Rules:
1. Only members with has_car=true can drive
2. Distribute driving days evenly among drivers
3. Prefer the member whose home is furthest from city (natural first pickup)
4. If only 1 driver → they always drive (passengers compensate with payment)
5. Handle cases where driver count < driving days → some days unmatched
```

### Phase 5: Pickup Planning

Optimize pickup order and points:

```
Input:  Group + driver assignment + member locations
Output: Ordered pickup sequence with estimated times

Algorithm:
1. Driver starts from home
2. Visit other members in corridor order (countryside → city)
3. Pickup point = nearest point on corridor road to member's home
4. Calculate arrival time at each pickup:
   drive_time(prev_point, pickup_point) + 1min boarding
5. Verify total trip time ≤ solo_drive_time + max_detour
```

## Schedule Variability Handling

The core innovation. Three types of commuters:

### Type A: Fixed Schedule (60%)
```
Same time every workday: Mon-Fri 7h30 → easy to match
```

### Type B: Slightly Variable (25%)
```
Usually 7h30, but Wed & Fri at 8h30
→ Match with other 7h30 people for Mon/Tue/Thu
→ Match with 8h30 people for Wed/Fri (may be different group)
→ Or: one stable group with compromise (everyone does 7h45)
```

### Type C: Highly Variable (15%)
```
Mon 7h30, Tue 11h00, Wed OFF, Thu 9h00, Fri 7h30
→ Match Mon+Fri with morning group
→ Match Tue with late-morning group (different people)
→ Thu may be unmatched (too few 9h00 commuters nearby)
```

The algorithm handles this by **matching per-day first**, then consolidating into stable weekly groups where possible. A person might be in:
- 1 stable group (best case — same people all week)
- 2 groups (morning group + late group on certain days)
- Partially matched (some days matched, some days solo)

## Matching Quality Metrics

```typescript
interface MatchingResult {
  totalCommuters: number;
  matchedCommuters: number;        // people in at least 1 group
  fullyMatchedCommuters: number;   // matched every day they commute
  partiallyMatched: number;        // matched some days
  unmatched: number;               // couldn't find a group

  vehiclesRemoved: number;         // cars taken off road
  avgGroupSize: number;            // target: 3-4
  avgDetourMinutes: number;        // target: <5
  avgScheduleCompromise: number;   // target: <10 min

  co2SavedKgPerWeek: number;
  costSavedEurPerWeek: number;
}
```

## Future AI Enhancements

### Learning from History
- Track which groups work well (low cancellations, positive ratings)
- Bias future matching toward proven-compatible combinations
- Detect and avoid problematic pairings

### Predictive Scheduling
- "Marie usually works late on Wednesdays" → pre-fill schedule
- Detect patterns in schedule changes → anticipate next week

### Dynamic Re-matching
- If someone cancels Monday morning, find a replacement from the pool of solo commuters
- Requires shift from pure batch to hybrid batch + real-time

### Social Compatibility
- After enough data: match by stated preferences (quiet ride vs. chatty, music vs. no music)
- Network effects: "you rode with Thomas who rides with Pierre, so you might like Pierre's group"

## Implementation Notes

- The matching engine is a **pure function library** — no DB, no HTTP, no side effects
- Input: array of commuters with schedules + config params
- Output: array of groups with assignments
- This makes it trivially testable and usable in both the app and the simulation
- Target performance: match 10,000 commuters in <5 seconds
