# Architecture — System Design

## Tech Stack Decision Matrix

| Layer | Choice | Why |
|-------|--------|-----|
| **Monorepo** | Turborepo | Fast, TS-native, simple config |
| **Frontend** | Next.js 15 (App Router) | SSR for SEO, RSC for performance, massive ecosystem |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid UI development, consistent design system |
| **Maps** | MapLibre GL JS + PMTiles | Fully open-source, no API key, self-hosted tiles |
| **Map tiles** | Protomaps (PMTiles on CDN) | Free, fast, offline-capable |
| **Backend** | Next.js API routes + tRPC | Type-safe end-to-end, no separate server needed for MVP |
| **Database** | SQLite (better-sqlite3) | Zero-config, file-based, no external service needed |
| **ORM** | Drizzle ORM (better-sqlite3) | Type-safe, lightweight, great DX |
| **Auth** | Better Auth | Simple, self-hosted, no vendor lock-in |
| **Hosting** | Netlify | Free tier generous, instant deploys, serverless functions |
| **Simulation** | TypeScript + D3.js + deck.gl | Runs in browser, beautiful visualizations |
| **Matching engine** | Pure TypeScript library | No dependencies, testable, portable |
| **Notifications** | Resend (email) | Simple API, free tier |

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENTS                              │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐    │
│  │ Web App  │  │ Simulator│  │ Admin Dashboard    │    │
│  │ (Next.js)│  │ (Next.js)│  │ (Next.js)          │    │
│  └────┬─────┘  └────┬─────┘  └────────┬───────────┘    │
│       │              │                  │                │
│       └──────────────┼──────────────────┘                │
│                      │ tRPC                              │
│       ┌──────────────┴──────────────────┐                │
│       │         API Layer (tRPC)         │                │
│       │  ┌──────┐ ┌───────┐ ┌────────┐  │                │
│       │  │Users │ │Schedule│ │Matching│  │                │
│       │  │Router│ │Router  │ │Router  │  │                │
│       │  └──┬───┘ └───┬───┘ └───┬────┘  │                │
│       └─────┼─────────┼─────────┼────────┘                │
│             │         │         │                         │
│       ┌─────┴─────────┴─────────┴────────┐                │
│       │        Service Layer              │                │
│       │  ┌──────────────────────────┐    │                │
│       │  │   Matching Engine        │    │                │
│       │  │   (pure functions)       │    │                │
│       │  └──────────────────────────┘    │                │
│       └──────────────┬───────────────────┘                │
│                      │                                    │
│       ┌──────────────┴───────────────────┐                │
│       │        SQLite (file-based)        │                │
│       │  ┌──────┐ ┌────────┐ ┌────────┐  │                │
│       │  │Users │ │Schedules│ │Groups  │  │                │
│       │  └──────┘ └────────┘ └────────┘  │                │
│       └──────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

## Database Schema (Core Tables — SQLite)

All geospatial math is done in TypeScript (packages/geo/), not in the database.
Coordinates stored as plain REAL columns (lat/lng).

```sql
-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY,                    -- UUID generated in app
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  home_lat REAL NOT NULL,
  home_lng REAL NOT NULL,
  work_lat REAL NOT NULL,
  work_lng REAL NOT NULL,
  commune TEXT NOT NULL,
  has_car INTEGER NOT NULL DEFAULT 0,     -- 0/1 boolean
  max_passengers INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Corridors (predefined routes)
CREATE TABLE corridors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  city_destination TEXT NOT NULL,
  route_geojson TEXT NOT NULL,            -- GeoJSON LineString as JSON string
  total_distance_km REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Weekly schedule entries
CREATE TABLE schedule_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start TEXT NOT NULL,               -- ISO date "2026-03-09"
  day_of_week INTEGER NOT NULL,           -- 0=Mon, 4=Fri
  departure_time TEXT NOT NULL,           -- "07:30"
  tolerance_minutes INTEGER NOT NULL DEFAULT 15,
  return_time TEXT NOT NULL,
  return_tolerance_minutes INTEGER NOT NULL DEFAULT 15,
  is_active INTEGER NOT NULL DEFAULT 1,
  UNIQUE(user_id, week_start, day_of_week)
);

-- Matched carpool groups
CREATE TABLE carpool_groups (
  id TEXT PRIMARY KEY,
  corridor_id TEXT NOT NULL REFERENCES corridors(id),
  week_start TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Group memberships with driver assignments
CREATE TABLE group_memberships (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES carpool_groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  role TEXT NOT NULL,                      -- 'driver' | 'passenger'
  pickup_order INTEGER,
  pickup_lat REAL,
  pickup_lng REAL,
  pickup_time TEXT,
  UNIQUE(group_id, user_id, day_of_week)
);

CREATE INDEX idx_schedule_week ON schedule_entries(week_start, day_of_week);
```

## Monorepo Structure

```
covoiturage/
├── package.json                 # Root workspace config
├── turbo.json                   # Turborepo pipeline
├── apps/
│   ├── web/                     # Main Next.js app
│   │   ├── app/
│   │   │   ├── (auth)/          # Login, register
│   │   │   ├── (app)/           # Authenticated app
│   │   │   │   ├── schedule/    # Schedule input
│   │   │   │   ├── matches/     # View carpool groups
│   │   │   │   ├── map/         # Interactive map
│   │   │   │   └── profile/     # User settings
│   │   │   └── api/trpc/        # tRPC handler
│   │   ├── components/
│   │   ├── lib/
│   │   └── server/
│   │       ├── routers/         # tRPC routers
│   │       └── services/        # Business logic
│   ├── simulation/              # Traffic simulation app
│   │   ├── app/
│   │   │   ├── corridor/        # Corridor visualization
│   │   │   ├── traffic/         # Traffic flow simulation
│   │   │   └── impact/          # Before/after comparison
│   │   └── lib/
│   │       ├── population.ts    # Synthetic population generator
│   │       ├── traffic.ts       # Traffic flow model
│   │       └── renderer.ts      # Visualization engine
│   └── api/                     # Standalone API (future)
├── packages/
│   ├── matching-engine/         # Core matching algorithm
│   │   ├── src/
│   │   │   ├── cluster.ts       # Geographic clustering
│   │   │   ├── schedule.ts      # Time window matching
│   │   │   ├── optimize.ts      # Group optimization
│   │   │   ├── rotate.ts        # Driver rotation
│   │   │   └── index.ts
│   │   └── __tests__/
│   ├── geo/                     # Geographic utilities
│   │   ├── src/
│   │   │   ├── distance.ts      # Haversine, route distance
│   │   │   ├── corridor.ts      # Corridor membership check
│   │   │   └── pickup.ts        # Optimal pickup points
│   │   └── __tests__/
│   ├── db/                      # Database schema + migrations
│   │   ├── schema/
│   │   ├── migrations/
│   │   └── seed/
│   └── shared/                  # Shared types
│       └── src/
│           ├── types.ts
│           └── constants.ts
└── data/
    ├── corridors/
    │   └── ligne-nantes.json    # Corridor definition with coordinates
    ├── synthetic/
    │   └── population.json      # Generated commuter profiles
    └── osm/
        └── nantes-area.pbf      # OpenStreetMap extract
```

## API Design (tRPC Routers)

```typescript
// Key procedures
const appRouter = router({
  user: router({
    register: publicProcedure.input(registerSchema).mutation(/* ... */),
    updateLocation: protectedProcedure.input(locationSchema).mutation(/* ... */),
    profile: protectedProcedure.query(/* ... */),
  }),
  schedule: router({
    submit: protectedProcedure.input(weeklyScheduleSchema).mutation(/* ... */),
    current: protectedProcedure.query(/* ... */),
    history: protectedProcedure.query(/* ... */),
  }),
  matching: router({
    myGroup: protectedProcedure.query(/* ... */),
    weekPlan: protectedProcedure.input(weekSchema).query(/* ... */),
    triggerMatch: adminProcedure.mutation(/* ... */),  // Manual trigger for testing
  }),
  corridor: router({
    list: publicProcedure.query(/* ... */),
    stats: publicProcedure.input(corridorSchema).query(/* ... */),
  }),
  simulation: router({
    generate: publicProcedure.input(simParamsSchema).mutation(/* ... */),
    results: publicProcedure.input(simIdSchema).query(/* ... */),
  }),
});
```
