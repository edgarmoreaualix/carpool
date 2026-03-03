# Infrastructure — Deployment & DevOps

## Hosting Strategy (MVP)

### Frontend: Vercel
- Free tier: 100GB bandwidth, serverless functions
- Instant deploys from git push
- Preview deployments for PRs
- Edge functions for API routes

### Database: Supabase
- Free tier: 500MB database, 1GB storage
- PostgreSQL with PostGIS extension
- Built-in auth (backup to Better Auth)
- Real-time subscriptions (future use)
- Dashboard for easy data inspection

### Alternative: Neon (serverless PostgreSQL)
- Better cold-start performance than Supabase
- Branching (useful for testing)
- PostGIS support
- Consider if Supabase free tier is limiting

### Map Tiles: Self-hosted PMTiles
- Generate PMTiles for Loire-Atlantique from OSM
- Host on Vercel Edge / Cloudflare R2 (free)
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
  deploy:   # Vercel (automatic via integration)
```

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

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
- **Logs**: Vercel logs (built-in)

## Security Basics

- All data in transit: HTTPS (Vercel default)
- Auth tokens: HTTP-only cookies, not localStorage
- Input validation: Zod schemas at API boundary
- Rate limiting: Vercel built-in
- GDPR: users can delete their account and all data
- No tracking pixels, no third-party cookies
- Location data is sensitive — minimize storage, encrypt at rest

## Database Migrations

- Drizzle ORM migrations (SQL-based, version controlled)
- Migration files in `packages/db/migrations/`
- Seed script for development data
- Separate seed for simulation data

## Local Development

```bash
# Prerequisites
node >= 20, pnpm >= 9, docker (for local PostgreSQL)

# Setup
pnpm install
docker compose up -d  # PostgreSQL + PostGIS
pnpm db:push          # Apply schema
pnpm db:seed          # Seed data
pnpm dev              # Start all apps (Turborepo)

# URLs
Web app:    http://localhost:3000
Simulation: http://localhost:3001
DB Studio:  http://localhost:3002 (Drizzle Studio)
```
