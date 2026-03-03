# Simulation — Traffic Corridor Modeling

## Purpose

Build a realistic simulation of the Ligné → Nantes corridor to:
1. **Visualize** current traffic patterns (the problem)
2. **Demonstrate** the impact of AI-matched carpooling (the solution)
3. **Prove** the concept for the Station F pitch
4. **Calibrate** the matching algorithm with realistic data

## The Corridor: Ligné → Nantes

### Geography

```
LIGNÉ (47.3556, -1.3478)
  │  D39 / D69
  │  ~7km
  ▼
SAINT-MARS-DU-DÉSERT (47.3897, -1.3892)
  │  D31 / D39
  │  ~8km
  ▼
CARQUEFOU (47.2978, -1.4919)
  │  N844 / Périphérique
  │  ~10km
  ▼
NANTES CENTRE (47.2184, -1.5536)

Total distance: ~25km
Typical drive time: 30-45 minutes (depending on traffic)
```

### Real Population Data (INSEE)

| Commune | Population | Estimated Working Adults | Est. Nantes Commuters |
|---------|-----------|------------------------|----------------------|
| Ligné | ~5,200 | ~2,500 | ~1,200 |
| Saint-Mars-du-Désert | ~4,800 | ~2,300 | ~1,100 |
| Carquefou | ~20,000 | ~9,500 | ~4,500 |
| Surrounding hamlets | ~5,000 | ~2,400 | ~1,000 |
| **Total** | **~35,000** | **~16,700** | **~7,800** |

### Traffic Patterns (to model)

**Morning Peak (7h00-9h30)**:
- 70% of commuters depart between 7h00-8h30
- Peak density at 7h45-8h15
- Average occupancy: 1.05 persons/car
- N844 junction is the main bottleneck

**Evening Peak (16h30-19h00)**:
- More spread out than morning
- Peak at 17h30-18h15
- Same bottleneck in reverse

**Schedule Distribution (realistic model)**:
```
Start time distribution:
  6h30-7h00:  5%   (early birds)
  7h00-7h30: 20%   (standard early)
  7h30-8h00: 35%   (peak)
  8h00-8h30: 20%   (standard)
  8h30-9h00: 10%   (late start)
  9h00-9h30:  5%   (flexible/late)
  10h00+:     5%   (very flexible — like Marie some days)
```

## Simulation Architecture

### 1. Population Generator

Generate synthetic but realistic commuter profiles:

```typescript
interface SimulatedCommuter {
  id: string;
  home: { lat: number; lng: number; commune: string };
  work: { lat: number; lng: number; zone: string };  // Nantes work zone
  hasCar: boolean;             // ~85% have cars
  schedule: WeeklyPattern;
  flexibility: number;         // tolerance in minutes (5-30)
  willingnessToCarpool: number; // 0-1 probability
}

interface WeeklyPattern {
  // Each day can have different times or be OFF
  monday?: { depart: Time; return: Time };
  tuesday?: { depart: Time; return: Time };
  // ...
  variability: 'fixed' | 'slightly_variable' | 'highly_variable';
}
```

**Generation rules**:
- Homes: scatter within commune boundaries using real land-use data
- Work locations: distribute across Nantes zones (centre, île de Nantes, zone nord...)
- Schedule variability: 60% fixed, 25% slightly variable (±30min day-to-day), 15% highly variable
- Car ownership: 85% own a car, 15% need rides
- Carpool willingness: 40% willing (our addressable market)

### 2. Traffic Flow Model

Model traffic as a flow along the corridor:

```typescript
interface TrafficSnapshot {
  timestamp: Date;              // Every 5-minute interval
  segments: {
    from: string;               // "Ligné"
    to: string;                 // "Saint-Mars"
    vehicleCount: number;
    averageSpeed: number;       // km/h
    density: number;            // vehicles/km
    occupancy: number;          // persons/vehicle
  }[];
  totalVehicles: number;
  totalPersons: number;
  co2Kg: number;                // Running CO2 total
}
```

**Traffic physics (simplified)**:
- Free-flow speed: 70 km/h (rural road), 90 km/h (voie rapide), 50 km/h (periurban)
- Congestion model: speed decreases as density increases (Greenshields model)
- Capacity: ~1,800 vehicles/hour per lane
- CO2: 120g/km average car

### 3. Carpooling Scenario Model

Compare three scenarios:

**Scenario A — Status Quo**: No carpooling, everyone drives alone
**Scenario B — 20% Adoption**: 20% of willing commuters use the platform
**Scenario C — 50% Adoption**: Optimistic adoption after 1 year

For each scenario, run the matching algorithm and visualize:
- Vehicles removed from road per time slot
- Congestion reduction (speed improvement)
- CO2 reduction
- Cost savings per participant

### 4. Visualization Components

#### a. Corridor Map View
- MapLibre map showing the corridor route
- Animated dots representing cars flowing along the route
- Color-coded by congestion (green → yellow → red)
- Toggle between scenarios A/B/C
- Side panel with live stats

#### b. Time-Lapse View
- Scrub through a full day (5h00 → 22h00)
- Watch morning peak build and dissipate
- See the difference with carpooling active

#### c. Impact Dashboard
- Bar charts: vehicles, CO2, cost — before vs. after
- Animated counter: "X cars removed right now"
- Heatmap: where on the corridor is congestion reduced most
- Individual story: "Marie saves €180/month and meets 3 new neighbors"

#### d. Schedule Overlap Visualizer
- Show all commuters' departure times as a histogram
- Highlight overlapping windows that enable matching
- Demonstrate why AI matching finds groups that humans can't

## Data Sources

### OpenStreetMap
- Road network geometry for the corridor
- Building footprints for realistic home placement
- POI data for work location distribution

### INSEE (French statistics)
- Population by commune
- Employment rates
- Commuting data (flux domicile-travail)
- Will use open data: https://www.insee.fr/fr/statistiques

### Nantes Métropole Open Data
- Traffic counts on major roads
- Public transit routes (for future integration)
- https://data.nantesmetropole.fr/

## Implementation Priority

1. **Population generator** — create 7,800 synthetic commuters with realistic profiles
2. **Static snapshot** — visualize all commuters on the map at morning peak
3. **Matching engine integration** — run the algorithm, show groups formed
4. **Before/after comparison** — side-by-side or toggle visualization
5. **Time-lapse animation** — full day simulation with scrubber
6. **Impact dashboard** — summary stats and charts

## Simulation Parameters (Configurable)

```typescript
interface SimulationConfig {
  corridor: CorridorDefinition;
  population: {
    totalCommuters: number;        // 7800
    carpoolWillingness: number;    // 0.40
    adoptionRate: number;          // 0.20
  };
  matching: {
    maxGroupSize: number;          // 5
    maxDetourMinutes: number;      // 10
    timeToleranceMinutes: number;  // 15
  };
  traffic: {
    peakHourCapacity: number;      // 1800 vehicles/hour/lane
    lanes: number;                 // 2 (one direction)
    freeFlowSpeedKmh: number;     // 70
  };
  visualization: {
    timeStepMinutes: number;       // 5
    animationSpeedMs: number;      // 100 (ms per time step)
  };
}
```
