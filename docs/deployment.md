# Development And Deployment Runbook

## Project Decisions (Fixed)

- Branch strategy: `feature/*` centric development.
- DB switch timing: move from staging DB to production DB after delete feature is implemented.
- Reason for switch timing: keep current trial data if it is usable.
- Release timing: release is defined by domain setup completion.

## Current Phase

- Code branch in active use: `feature/*`
- DB in active use: Supabase staging
- Vercel env target: Preview/Production may temporarily point to staging until DB switch.

## DB Switch Checklist (After Delete Feature)

1. Create production Supabase project.
2. Apply migrations in `supabase/migrations/` to production DB.
3. Set Vercel Production env vars to production DB values.
4. Run smoke test on production URL.
5. Keep staging DB for ongoing feature verification.

## Environment Variables

Required keys:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DEMO_USER_ID` (optional)

## Notes

- Migration files are the source of truth for schema changes.
- Even in feature-only flow, avoid ad-hoc SQL changes without migration files.

## CI/CD And Migration Automation

GitHub Actions workflows:

- `.github/workflows/ci.yml`
  - trigger: `pull_request`, `push(main)`
  - runs: `npm ci`, `npm run build`
- `.github/workflows/db-staging.yml`
  - trigger: `push(main)` when `supabase/migrations/**` changed, or manual run
  - runs: apply migrations to staging DB
- `.github/workflows/db-production.yml`
  - trigger: manual only (`workflow_dispatch`)
  - guard: `confirm=apply` is required
  - runs: apply migrations to production DB

Required GitHub repository secrets:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_STAGING_PROJECT_REF`
- `SUPABASE_STAGING_DB_PASSWORD`
- `SUPABASE_PRODUCTION_PROJECT_REF`
- `SUPABASE_PRODUCTION_DB_PASSWORD`
