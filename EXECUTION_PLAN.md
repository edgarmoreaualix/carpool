# Execution Plan — Build Sequence

## Overview

5 build phases, each designed for maximum parallelism via Orchestra.
Estimated wall-clock time with parallel agents: **2-3 sessions**.

---

## Phase 1: Foundation (Sequential — 1 agent)

**Must complete before anything else.**

| Task | Agent | Context Files |
|------|-------|---------------|
| Initialize Turborepo monorepo, package.json workspaces, tsconfig, turbo.json | builder | CLAUDE.md, 03-architecture |
| Create shared types package (User, Schedule, CarpoolGroup, Corridor interfaces) | builder | CLAUDE.md, 02-product, 05-ai-matching |
| Set up Drizzle ORM schema + local Docker PostgreSQL + PostGIS | builder | CLAUDE.md, 03-architecture |
| Seed the Ligné→Nantes corridor data | builder | CLAUDE.md, data/corridors/ligne-nantes.json |

**Deliverable**: `pnpm dev` works, empty apps load, DB connects, types compile.

---

## Phase 2: Core Engines (Parallel — 3 agents)

**The brains of the system. No UI needed yet.**

| Task | Agent | Context Files | Branch |
|------|-------|---------------|--------|
| **Matching engine** — cluster, schedule overlap, optimize, rotate | engine-builder | 05-ai-matching, shared types | feat/matching-engine |
| **Geo utilities** — distance, corridor membership, pickup points | geo-builder | 03-architecture (geo section), corridor data | feat/geo-utils |
| **Population generator** — synthetic commuters for simulation | sim-builder | 04-simulation (Population Generator section) | feat/population-gen |

**Deliverable**: Each package has src + tests. `pnpm test` passes in all three.

---

## Phase 3: Simulation (Parallel — 2 agents, after Phase 2)

**The demo that wins Station F.**

| Task | Agent | Context Files | Branch |
|------|-------|---------------|--------|
| **Traffic flow model + corridor map visualization** — MapLibre map, animated car dots, congestion colors, time scrubber | sim-viz | 04-simulation, 06-design | feat/traffic-sim |
| **Impact dashboard + before/after comparison** — charts (D3/Recharts), stats panel, scenario toggle (A/B/C) | dashboard-builder | 04-simulation (Visualization section), 06-design | feat/impact-dashboard |

**Deliverable**: `localhost:3001` — interactive simulation, scrub through a day, toggle carpooling on/off, see traffic + stats change.

---

## Phase 4: Web App (Parallel — 3 agents, after Phase 1)

**Can run in parallel with Phase 3.**

| Task | Agent | Context Files | Branch |
|------|-------|---------------|--------|
| **Auth + onboarding + map location input** — Better Auth setup, registration flow, MapLibre location picker | web-auth | 02-product (Onboarding section), 06-design, 07-infrastructure | feat/auth-onboarding |
| **Schedule input UI** — weekly calendar grid, time pickers, tolerance slider, "variable schedule" toggle | web-schedule | 02-product (Schedule section), 06-design | feat/schedule-input |
| **Matching results display** — group card, daily timeline, driver rotation view, weekly summary | web-results | 02-product (Matching Results section), 06-design | feat/matching-results |

**Deliverable**: Each feature works in isolation with mock data.

---

## Phase 5: Integration (Sequential — 1-2 agents, after Phase 2-4)

**Wire everything together.**

| Task | Agent | Context Files | Branch |
|------|-------|---------------|--------|
| Connect schedule submission → matching engine → results display | integrator | 03-architecture (API section), all | feat/integration |
| Landing page with simulation embed | crafter | 06-design, 08-growth | feat/landing-page |
| End-to-end test: register → set location → submit schedule → view matches | critic | 02-product (User Flow) | feat/e2e-tests |
| Deploy to Vercel + Supabase | builder | 07-infrastructure | feat/deploy |

**Deliverable**: Full working MVP accessible at a public URL.

---

## Orchestra Dispatch Plan

### Session 1: Phase 1 + start Phase 2
```bash
# Phase 1 (sequential)
orch init
# Edit builder.task → monorepo setup
orch dispatch
orch poll  # Wait for completion

# Phase 2 (parallel — 3 agents)
# Edit engine-builder.task, geo-builder.task, sim-builder.task
ORCH_WORKERS="engine-builder geo-builder sim-builder" orch dispatch
orch poll
```

### Session 2: Phase 3 + Phase 4 (parallel — 5 agents)
```bash
ORCH_WORKERS="sim-viz dashboard-builder web-auth web-schedule web-results" orch dispatch
orch poll
orch merge  # Merge all feature branches
```

### Session 3: Phase 5 (integration)
```bash
ORCH_WORKERS="integrator crafter critic" orch dispatch
orch poll
orch merge
# Deploy
```

---

## Speed Multipliers

### Tools That 10x Us

| Tool | What It Does | When to Use |
|------|-------------|-------------|
| **Orchestra + Codex** | Parallel agent execution | Phases 2-4: fan out 3-5 agents |
| **shadcn/ui** | Pre-built accessible components | All UI work — don't build buttons from scratch |
| **v0.dev** | AI UI prototyping | Complex layouts (schedule grid, results card) |
| **Protomaps/PMTiles** | Free self-hosted map tiles | All map views — no API key bureaucracy |
| **deck.gl** | GPU-accelerated data viz | Traffic flow animation — thousands of moving dots |
| **Drizzle Studio** | Visual DB browser | Development — inspect data without SQL |
| **Turborepo** | Parallel builds + caching | All builds — only rebuild what changed |
| **Vercel Preview Deploys** | Instant staging URLs per branch | Every PR gets a live preview |

### Skills to Invoke

| Skill | When |
|-------|------|
| `ui-ux-pro-max` | Design system setup, component architecture decisions |
| `frontend-design` | Polished UI components that don't look like generic AI output |
| `claude-developer-platform` | If we integrate Claude for smart suggestions |
| `landing-page-copywriter` | Landing page copy for the public site |
| `copywriting` | User-facing text (onboarding, results, notifications) |

### Automations to Build

1. **Weekly schedule pre-fill**: "Same as last week?" → one tap
2. **Matching cron job**: runs every Sunday 17h, emails results by 18h
3. **Simulation data pipeline**: OSM extract → road network → corridor definition (scripted)
4. **CI/CD**: push to main → deploy to Vercel (automatic via GitHub integration)
5. **Seed data generator**: one command to populate DB with realistic test data
