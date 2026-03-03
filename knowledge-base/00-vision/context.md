# Vision — Why Covoiturage Exists

## The Problem

Every morning across rural France, hundreds of thousands of people each climb alone into a 5-seat car and drive the same road toward the same city. The road clogs. Fuel burns. Money evaporates. CO2 accumulates. And at 18h, the exact same thing happens in reverse.

This is not a technology problem — it's a coordination problem. People *want* to share rides. They try sometimes with neighbors. But it fails because:

1. **Schedule variability** — "I start at 7h30 on Monday but 11h30 on Wednesday." Finding someone with the exact same pattern by word-of-mouth is nearly impossible.
2. **No system of record** — there's no shared place where everyone's schedule is visible and matchable.
3. **Social friction** — asking your neighbor every week "what time do you work tomorrow?" doesn't scale.

## The Insight

AI can solve this. If every commuter in a corridor declares their weekly schedule, an algorithm can:
- Cluster people by compatible time windows and geographic proximity
- Form stable carpool groups of 2-5 people
- Assign fair driver rotation
- Re-optimize weekly as schedules shift

The variable schedule problem — the exact thing that kills informal carpooling — is trivially solvable with computation.

## The Corridor Model

Rural-to-city commuting follows **corridors** — linear routes from villages through intermediate towns into the city center. This is fundamentally different from urban ride-sharing (Uber model) where trips are arbitrary point-to-point.

Corridor properties:
- **Linear**: villages are ordered along a road axis
- **Directional**: morning = countryside→city, evening = city→countryside
- **Predictable**: same people, same road, every workday
- **Sequential pickup**: a driver heading toward the city can pick up people along the way

This corridor structure makes matching dramatically simpler than general-purpose ride-sharing.

## First Corridor: Ligné → Nantes

```
Ligné ──→ Saint-Mars-du-Désert ──→ Carquefou ──→ Nantes Centre
  ~25km          ~18km                ~10km          0km
```

Population along this corridor: ~30,000+ people
Estimated daily commuters toward Nantes: 8,000-12,000
If 20% adopt → 1,600-2,400 people → 400-600 fewer cars daily

## Why Now

1. **AI cost collapsed** — matching algorithms that required expensive infrastructure 5 years ago now run for pennies
2. **Climate urgency** — transport is 31% of French CO2 emissions, personal cars are the largest chunk
3. **Cost of living crisis** — fuel + insurance + maintenance = €3,000-6,000/year per car
4. **Remote work normalization** — variable schedules are the new normal, making old fixed-schedule carpooling obsolete

## The Vision at Scale

Start with one corridor. Prove the model works. Then:
- Expand to all corridors feeding Nantes (~15 corridors)
- Expand to other mid-size French cities (Rennes, Bordeaux, Toulouse, Lyon...)
- Every French city has 5-20 rural corridors feeding it
- That's 100,000+ corridors nationally
- EU has the same pattern everywhere

## Impact Per Corridor (Conservative)

| Metric | Before | After (20% adoption) |
|--------|--------|---------------------|
| Cars on road | 10,000 | 8,000 (-20%) |
| CO2/day | 50 tonnes | 40 tonnes (-20%) |
| Avg. commute cost | €12/day | €4/day (-66%) |
| Traffic density | Congested | Fluid |
| Social connections | Isolated | 2-4 daily companions |

## Founding Story

Edgar lives in the countryside near Nantes with his mom. Every day, he watches a parade of single-occupant cars crawl past on the same road. His mom's schedule varies — 7h30 some days, 11h30 others — so she can't easily coordinate with the neighbors who drive the same route. The solution isn't more roads or electric cars. It's filling the empty seats that already exist.
