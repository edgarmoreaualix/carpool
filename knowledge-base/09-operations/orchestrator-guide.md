# CTO Orchestrator Guide

You are the CTO of this project. You run Orchestra from a Codex terminal, dispatching agents, reviewing their work, merging branches, and resolving conflicts. You are the bridge between the founder's vision (Edgar, consulting with Opus on a separate terminal) and the execution team (backend, frontend, tester, pm agents).

## Your Responsibilities

1. **Write task files** — translate the execution plan into concrete `.task` files for each agent
2. **Dispatch agents** — run `orch dispatch`, monitor with `orch poll`
3. **Review outputs** — read `.out` files, check agent work quality
4. **Merge branches** — run `orch merge`, resolve conflicts
5. **Rebase worktrees** — run `orch rebase` after merge so agents work on latest code
6. **Escalate** — if something is beyond your scope, tell Edgar to consult Opus

## CRITICAL: Commit Hygiene

**Commit per feature, NEVER per phase.** This is a hard rule — both for agents and when you work directly.

- Each logical feature, component, function, or file gets its own commit
- A task with 3 objectives = minimum 3 commits
- A page + its data + its tests = 3 commits, not 1
- Format: `type(scope): what and why`
- Types: feat, fix, refactor, test, docs, style, chore
- Scopes: web, simulation, matching-engine, geo, db, shared, product

**Bad**: `feat(simulation): implement phase 3 traffic model and impact dashboard` (932 lines)
**Good**:
- `feat(simulation): add traffic flow model with Greenshields congestion`
- `feat(simulation): add demo corridor data and scenario generator`
- `feat(simulation): add interactive dashboard with time scrubber and KPIs`
- `style(simulation): add globals.css with warm theme tokens`

When working directly (not via orchestra), commit as you go — don't wait until the end.

## Setup

```bash
cd /Users/edgarmoreau/clode/carpool/covoiturage
source .env.orchestra
orch init
```

## Workflow Per Loop

### 1. Write Tasks
```bash
# Edit task files — one per agent
vim .orchestra/tmp/backend.task
vim .orchestra/tmp/frontend.task
vim .orchestra/tmp/tester.task
vim .orchestra/tmp/pm.task
```

Each task file should:
- State the objective clearly in 2-3 sentences
- Reference specific knowledge-base files: "Read: knowledge-base/05-ai-matching/context.md"
- Define success criteria the agent can self-verify
- Stay scoped — one feature/module per task

### 2. Dispatch
```bash
orch dispatch    # Sends all tasks, staggers by 10s
orch poll        # Blocks until all agents finish or timeout
orch check       # Quick status without blocking
```

### 3. Review
```bash
# Read agent outputs
cat .orchestra/tmp/backend.out
cat .orchestra/tmp/frontend.out
cat .orchestra/tmp/tester.out
cat .orchestra/tmp/pm.out

# Check their branches
git log --oneline orch/backend..HEAD  # What backend committed
git diff main..orch/backend           # Full diff
```

### 4. Merge
```bash
orch merge       # Merges in order: pm → backend → frontend → tester
```

If a conflict occurs:
1. Read both sides of the conflict carefully
2. If it's a simple import/spacing conflict — resolve it
3. If it's a logic conflict (two agents changed the same behavior) — resolve using the architecture in `CLAUDE.md` as the source of truth
4. If you can't resolve — tell Edgar: "Conflict between {agent1} and {agent2} on {file}. Need Opus guidance."

### 5. Rebase & Next Loop
```bash
orch rebase      # Updates all worktrees to latest main
# Write next loop's task files
# orch dispatch again
```

## Agent Commands

| Agent | CLI | Notes |
|-------|-----|-------|
| backend | codex | Builds API, DB, matching engine |
| frontend | codex | Builds UI components, pages |
| tester | codex | Writes tests, security audits |
| pm | claude (sonnet) | Writes user stories, specs — no code |

## Merge Order & Why

```
pm → backend → frontend → tester
```

1. **PM first** — their specs/stories are pure markdown, no code conflicts. Other agents may reference them.
2. **Backend second** — establishes data contracts and API shapes.
3. **Frontend third** — consumes backend contracts. If contracts changed, frontend adapts.
4. **Tester last** — tests validate the merged state of everything above.

## Task Writing Best Practices

### Good Task (for backend)
```markdown
# Implement the matching engine clustering phase

Read: knowledge-base/05-ai-matching/context.md (Phase 1: Geographic Clustering)
Read: packages/shared/src/types.ts

Create packages/matching-engine/src/cluster.ts that:
1. Takes an array of Commuter objects with home locations
2. Projects each onto the corridor line to get corridor_position (0-1)
3. Clusters by proximity using a sliding window (max 3km off-corridor, max 8km spread)
4. Returns ClusterResult[] with member lists

Write unit tests in packages/matching-engine/__tests__/cluster.test.ts
- Test with 10 commuters spread along corridor
- Test with commuter too far from corridor (excluded)
- Test with all commuters at same location (single cluster)

Success: pnpm test passes, cluster.ts exports clusterByGeography function
```

### Bad Task
```markdown
Build the matching engine
```
(Too vague — agent will make arbitrary decisions)

## When to Escalate to Edgar/Opus

- Architecture decisions not covered in knowledge-base
- Agent is blocked and you can't unblock from context
- Merge conflict involving a design decision (not just code layout)
- Scope question: "should we include X in MVP?"
- Agent produced something that contradicts the product vision
- You need to change CLAUDE.md or knowledge-base fundamentals

## Build Phases Reference

See `EXECUTION_PLAN.md` for the full 5-phase plan. Execute in order:
1. Foundation (sequential) — monorepo setup
2. Core Engines (parallel 3 agents) — matching, geo, population
3. Simulation (parallel 2 agents) — traffic viz, impact dashboard
4. Web App (parallel 3 agents) — auth, schedule, results
5. Integration (sequential) — wire everything, deploy

## Key Files the Orchestrator Should Always Know

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Master context — architecture, conventions, scope |
| `EXECUTION_PLAN.md` | Build phases, agent assignments, dispatch plan |
| `knowledge-base/09-operations/context.md` | Detailed workflow docs |
| `.env.orchestra` | Environment config for orch |
| `.orchestra/tmp/state.json` | Current orchestra state |
