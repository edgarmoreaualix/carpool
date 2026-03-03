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
| **Database** | PostgreSQL + PostGIS | Best geospatial support, proven at scale |
| **ORM** | Drizzle ORM | Type-safe, lightweight, great DX |
| **Auth** | Better Auth | Simple, self-hosted, no vendor lock-in |
| **Hosting** | Vercel (frontend) + Supabase (DB) | Free tier generous, instant deploys |
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
│       │     PostgreSQL + PostGIS          │                │
│       │  ┌──────┐ ┌────────┐ ┌────────┐  │                │
│       │  │Users │ │Schedules│ │Groups  │  │                │
│       │  └──────┘ └────────┘ └────────┘  │                │
│       └──────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

## Database Schema (Core Tables)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  home_location GEOGRAPHY(POINT, 4326) NOT NULL,
  work_location GEOGRAPHY(POINT, 4326) NOT NULL,
  has_car BOOLEAN DEFAULT false,
  max_passengers INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Corridors (predefined routes)
CREATE TABLE corridors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- "Ligné → Nantes"
  route GEOGRAPHY(LINESTRING, 4326),     -- The road geometry
  city_destination TEXT NOT NULL,         -- "Nantes"
  villages TEXT[] NOT NULL               -- ["Ligné", "Saint-Mars-du-Désert", "Carquefou"]
);

-- Weekly schedule entries
CREATE TABLE schedule_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  week_start DATE NOT NULL,
  day_of_week INTEGER NOT NULL,          -- 0=Mon, 4=Fri
  departure_time TIME NOT NULL,
  tolerance_minutes INTEGER DEFAULT 15,
  return_time TIME NOT NULL,
  return_tolerance_minutes INTEGER DEFAULT 15,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, week_start, day_of_week)
);

-- Matched carpool groups
CREATE TABLE carpool_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor_id UUID REFERENCES corridors(id),
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group memberships with driver assignments
CREATE TABLE group_memberships (
  group_id UUID REFERENCES carpool_groups(id),
  user_id UUID REFERENCES users(id),
  day_of_week INTEGER NOT NULL,
  role TEXT NOT NULL,                     -- 'driver' | 'passenger'
  pickup_order INTEGER,
  pickup_point GEOGRAPHY(POINT, 4326),
  pickup_time TIME,
  PRIMARY KEY (group_id, user_id, day_of_week)
);

-- Spatial indexes
CREATE INDEX idx_users_home ON users USING GIST(home_location);
CREATE INDEX idx_users_work ON users USING GIST(work_location);
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
