# Netlify + SQLite deployment

## Overview
- Frontend/app target: Netlify (`apps/web` Next.js app)
- DB: local SQLite file on disk (`data/covoiturage.sqlite`)
- No external DB service required

## Local prep
1. Ensure `DATABASE_URL=file:./data/covoiturage.sqlite` is set in Netlify env.
2. Run Drizzle push for SQLite schema:
   - `pnpm --filter @covoiturage/db push`
3. Start app locally:
   - `pnpm --filter @covoiturage/web dev`

## Netlify
1. Connect repo in Netlify.
2. Build command: `pnpm --filter @covoiturage/web build`
3. Publish directory: `apps/web/.next`
4. Add env vars:
   - `DATABASE_URL=file:./data/covoiturage.sqlite`
   - `NEXT_PUBLIC_APP_URL=https://<your-site>.netlify.app`

## End-to-end verification checklist
1. Register a user
2. Set home/work location
3. Submit weekly schedule
4. Open `/results` and confirm group/plan visibility
