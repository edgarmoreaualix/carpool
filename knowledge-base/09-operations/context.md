# Operations — Workflow, Orchestra & Agent Setup

## Development Workflow: Claude Code + Codex + Orchestra

### When to Use What

| Tool | Use For | Strengths |
|------|---------|-----------|
| **Claude Code (Opus)** | Planning, architecture, complex decisions, debugging, review | Deep reasoning, full conversation context, interactive |
| **Codex (via Orchestra)** | Parallel implementation of well-defined tasks | Fast execution, multiple agents, isolated worktrees |
| **Claude Project** | Knowledge base management, long context research | Persistent context, document analysis |

### Workflow Pattern

```
1. PLAN (Claude Code — Opus)
   └── Discuss architecture, define tasks, write specs
   └── Create task files in .orchestra/tmp/

2. DISPATCH (Orchestra → Codex agents)
   └── Each agent gets a well-defined task + context files
   └── Agents work in parallel on isolated branches
   └── Tasks reference knowledge-base/ files for context

3. REVIEW (Claude Code — Opus)
   └── Review agent outputs
   └── Resolve merge conflicts
   └── Integration testing
   └── Iterate if needed

4. MERGE (Orchestra)
   └── Merge approved branches
   └── Run full test suite
   └── Deploy
```

### Orchestra Task Design Principles

Good Codex tasks are:
- **Self-contained**: agent can complete without asking questions
- **Context-rich**: task file references all relevant knowledge-base docs
- **Testable**: clear success criteria the agent can verify
- **Bounded**: single feature/module, not cross-cutting concerns

Example task file:
```markdown
# Task: Implement Population Generator

## Context
Read: knowledge-base/04-simulation/context.md (Population Generator section)
Read: knowledge-base/03-architecture/context.md (Monorepo Structure section)

## Objective
Create the synthetic population generator at packages/simulation/src/population.ts

## Requirements
- Generate N commuters with realistic home/work locations
- Home locations scattered within commune boundaries
- Schedule distribution per 04-simulation/context.md
- Export as typed function: generatePopulation(config) → Commuter[]
- Include unit tests

## Success Criteria
- pnpm test passes
- Generates 7800 commuters in <2 seconds
- Output matches SimulatedCommuter interface
```

### Parallel Task Groups for Orchestra

**Group 1: Foundation (Sequential — must complete first)**
- Initialize Turborepo monorepo structure
- Set up PostgreSQL schema + Drizzle ORM
- Configure shared types package

**Group 2: Core Engine (Parallel — 3 agents)**
- Agent 1: Matching engine (packages/matching-engine/)
- Agent 2: Geographic utilities (packages/geo/)
- Agent 3: Population generator (apps/simulation/lib/population.ts)

**Group 3: Simulation (Parallel — 2 agents, after Group 2)**
- Agent 1: Traffic flow model + visualization
- Agent 2: Impact dashboard + charts

**Group 4: Web App (Parallel — 3 agents, after Group 1)**
- Agent 1: Auth + user registration + location input
- Agent 2: Schedule input UI
- Agent 3: Matching results display

**Group 5: Integration (Sequential — after all)**
- Connect web app to matching engine
- End-to-end flow: register → schedule → match → view results
- Integration tests

## Repository Structure for Agent Context

Each agent should receive:
1. `CLAUDE.md` — master context (always)
2. Relevant `knowledge-base/` section(s) — per task
3. `packages/shared/src/types.ts` — shared interfaces (always after Group 1)
4. Their specific task file

## Suggested Codex Agent Personas (Orchestra)

```bash
ORCH_WORKERS="builder crafter critic"

# builder: implements features, writes code
# crafter: implements UI components, styles, visual elements
# critic: writes tests, reviews code quality, checks against spec
```

Or for larger parallelism:
```bash
ORCH_WORKERS="engine-builder sim-builder web-builder ui-crafter test-writer"
```

## Git Branching Strategy

```
main
├── feat/monorepo-setup          (Group 1)
├── feat/matching-engine         (Group 2, Agent 1)
├── feat/geo-utils               (Group 2, Agent 2)
├── feat/population-generator    (Group 2, Agent 3)
├── feat/traffic-simulation      (Group 3, Agent 1)
├── feat/impact-dashboard        (Group 3, Agent 2)
├── feat/auth-registration       (Group 4, Agent 1)
├── feat/schedule-input          (Group 4, Agent 2)
├── feat/matching-results        (Group 4, Agent 3)
└── feat/integration             (Group 5)
```

## Speed Multipliers — Tools & Skills to Integrate

### shadcn/ui Components
- Pre-built, accessible, customizable React components
- Use for: buttons, cards, forms, dialogs, calendars, sliders
- Install per-component, no bloat

### v0 by Vercel
- AI UI generator — describe a component, get React+Tailwind code
- Use for rapid prototyping of complex layouts
- Iterate in v0, then paste into codebase

### Cursor / Claude Code Skills
- `ui-ux-pro-max` skill for design system decisions
- `frontend-design` skill for polished component generation
- `claude-developer-platform` if we need Claude API integration

### MapLibre + deck.gl
- MapLibre for base map
- deck.gl for high-performance data visualization layers (traffic flow, heatmaps)
- Both open-source, GPU-accelerated

### Turborepo Remote Cache
- Cache build artifacts across machines
- Speeds up CI and local builds after first run

### GitHub Copilot in VS Code
- Complement to Claude Code for inline suggestions
- Useful for boilerplate (Drizzle schemas, tRPC routers)

## Development Environment Setup

```bash
# 1. Clone and setup
cd ~/clode/carpool
git clone <repo-url> covoiturage  # Already done
cd covoiturage

# 2. Initialize monorepo
pnpm init
pnpm add -D turbo typescript @types/node

# 3. Orchestra setup (in separate terminal)
cd ~/clode/carpool/orchestra-sh
./orch init  # From the covoiturage/ directory

# 4. Local database
docker run -d --name covoiturage-db \
  -e POSTGRES_PASSWORD=dev \
  -e POSTGRES_DB=covoiturage \
  -p 5432:5432 \
  postgis/postgis:16-3.4
```

## Communication Channels

- **GitHub Issues**: task tracking, bug reports
- **GitHub Discussions**: architecture decisions, RFC-style proposals
- **Knowledge Base** (`knowledge-base/`): living documentation, always up-to-date
- **CLAUDE.md**: master context for all AI agents
