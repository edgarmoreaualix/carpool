# Infrastructure — Deployment & DevOps

## Hosting Strategy (MVP)

### Frontend + API: Netlify
- Free tier: 100GB bandwidth, 125k serverless function invocations
- Instant deploys from git push
- Preview deployments for PRs
- Serverless functions for API routes (Next.js adapter)

### Database: SQLite (file-based)
- No external service needed
- File lives alongside the app (e.g. `data/covoiturage.db`)
- Zero config, zero cost
- Drizzle ORM with better-sqlite3 driver
- For MVP scale (one corridor, <10k users) this is more than enough
- Migration path to PostgreSQL exists if needed at national scale

### Map Tiles: Self-hosted PMTiles
- Generate PMTiles for Loire-Atlantique from OSM
- Host on Netlify / Cloudflare R2 (free)
- No API key needed, no usage limits
- ~50MB for the local area

### Email: Resend
- Free tier: 100 emails/day (plenty for MVP)
- Simple API, great DX

## CI/CD Pipeline

```yaml
# GitHub Actions
on: [push, pull_request]

jobs:
  lint:     # ESLint + Prettier
  typecheck: # tsc --noEmit
  test:     # Vitest unit tests
  build:    # Turborepo build
  e2e:      # Playwright (on main only)
  deploy:   # Netlify (automatic via GitHub integration)
```

## Environment Variables

```bash
# Database
DATABASE_PATH=./data/covoiturage.db

# Auth
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://...

# Email
RESEND_API_KEY=...

# Maps (no key needed for PMTiles)
NEXT_PUBLIC_MAP_STYLE_URL=...

# Feature flags
NEXT_PUBLIC_SIMULATION_ENABLED=true
```

## Monitoring (Post-MVP)

- **Error tracking**: Sentry (free tier)
- **Analytics**: Plausible (privacy-friendly, or self-hosted Umami)
- **Uptime**: Better Uptime (free tier)
- **Logs**: Netlify function logs (built-in)

## Security Basics

- All data in transit: HTTPS (Netlify default)
- Auth tokens: HTTP-only cookies, not localStorage
- Input validation: Zod schemas at API boundary
- GDPR: users can delete their account and all data
- No tracking pixels, no third-party cookies
- Location data is sensitive — minimize storage

## Database Migrations

- Drizzle ORM migrations (SQL-based, version controlled)
- Migration files in `packages/db/migrations/`
- Seed script for development data
- Separate seed for simulation data

## Local Development

```bash
# Prerequisites
node >= 20, pnpm >= 9 (no Docker needed — SQLite is file-based)

# Setup
pnpm install
pnpm db:push          # Create SQLite DB + apply schema
pnpm db:seed          # Seed corridor + test data
pnpm dev              # Start all apps (Turborepo)

# URLs
Web app:    http://localhost:3000
Simulation: http://localhost:3001
DB Studio:  http://localhost:3002 (Drizzle Studio)
```
