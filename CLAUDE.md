# Covoiturage — AI-Powered Rural Carpooling

## What This Is
An AI-powered carpooling platform that matches rural commuters with variable schedules into weekly carpool groups along countryside-to-city corridors. Built to eliminate the absurdity of 5-seat cars carrying 1 person on the same road at the same time.

## Mission
Reduce pollution, unclog rural corridors, save money, and foster local social connections — starting with the Ligné/Saint-Mars-du-Désert/Carquefou → Nantes corridor in Loire-Atlantique, France.

## Project Structure

```
covoiturage/
├── CLAUDE.md                          # You are here — master context
├── knowledge-base/
│   ├── 00-vision/                     # Why we exist
│   ├── 01-market/                     # Market, competitors, Station F
│   ├── 02-product/                    # Product spec, user flows, MVP
│   ├── 03-architecture/              # Tech stack, system design, APIs
│   ├── 04-simulation/                # Traffic simulation engine
│   ├── 05-ai-matching/               # Matching algorithm & AI logic
│   ├── 06-design/                    # UI/UX, branding, design system
│   ├── 07-infrastructure/            # DevOps, deployment, monitoring
│   ├── 08-growth/                    # Go-to-market, Station F pitch
│   └── 09-operations/               # Workflow, orchestra, agent setup
├── apps/
│   ├── web/                           # Next.js web app (primary)
│   ├── simulation/                    # Traffic simulation & visualization
│   └── api/                           # Backend API
├── packages/
│   ├── matching-engine/               # Core AI matching algorithm
│   ├── geo/                           # Geographic utilities
│   └── shared/                        # Shared types, utils
└── data/
    ├── corridors/                     # Geographic corridor definitions
    ├── synthetic/                     # Synthetic population data
    └── osm/                           # OpenStreetMap extracts
```

## Conventions

- **Language**: TypeScript everywhere (frontend, backend, simulation)
- **Monorepo**: Turborepo for build orchestration
- **Styling**: Tailwind CSS + shadcn/ui components
- **Maps**: MapLibre GL JS (open-source, no API key needed for tiles)
- **Database**: SQLite via better-sqlite3 (lightweight, zero-config, file-based)
- **ORM**: Drizzle ORM (type-safe, lightweight) with `drizzle-orm/better-sqlite3`
- **API**: tRPC for type-safe client-server communication
- **Auth**: Better Auth (simple, self-hosted)
- **State**: Zustand for client state
- **Hosting**: Netlify (frontend + serverless functions)
- **Testing**: Vitest for unit, Playwright for e2e

## Key Design Decisions

1. **Weekly batch matching** — not real-time ride-hailing. Users submit schedules, AI returns optimized groups weekly.
2. **Corridor-based** — routes are modeled as linear corridors (countryside → city), not arbitrary point-to-point.
3. **Variable schedules supported** — "Monday 7h30, Wednesday 11h30" is a first-class use case.
4. **Driver rotation** — fair sharing of driving duties within matched groups.
5. **Simulation-first** — we prove the concept with realistic corridor simulations before building the full product.

## Agent Instructions

When working on this codebase:
- Read the relevant `knowledge-base/` section BEFORE writing code
- Each knowledge-base section has a `context.md` with full specifications
- Follow the tech stack defined here — do not introduce new dependencies without justification
- Keep the matching engine as a pure function library — no side effects, no database calls
- All geographic coordinates use WGS84 (EPSG:4326), distances in meters
- French locale for user-facing strings (but code/comments in English)
- Commit messages in English, conventional commits format

## Development Workflow

1. **Planning** → Claude Code (Opus) in conversation mode
2. **Parallel implementation** → Orchestra dispatching to Codex agents
3. **Review & integration** → Claude Code for merge conflicts, architecture review
4. **Simulation & validation** → Claude Code for analysis, visualization tweaks

## MVP Scope (Phase 1)

- [ ] Traffic simulation engine for the Nantes corridor
- [ ] Interactive map visualization (before/after carpooling)
- [ ] Schedule input UI (declare weekly commute pattern)
- [ ] AI matching algorithm (group commuters by schedule + geography)
- [ ] Results dashboard (your matched group, driver rotation, weekly view)
