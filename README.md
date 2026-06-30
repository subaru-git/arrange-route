# Arrange Route MVP

## Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

If Supabase env vars are missing, the app runs with demo in-memory data for `/scores/70`.

## Environments

- `local`: `.env.local` + Supabase staging project
- `staging`: Vercel Preview + Supabase staging project
- `production`: Vercel Production + Supabase production project

Detailed runbook: `docs/deployment.md`

## Database Migration

Initial migration SQL is in:

- `supabase/migrations/20260215_000001_init.sql`

Apply to `staging` first, then `production`.
