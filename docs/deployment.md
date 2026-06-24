# Development And Deployment Runbook

## Project Decisions (Fixed)

- Branch strategy: `feature/*` centric development.
- Existing Supabase data is the production data source.
- Staging uses a separate empty Supabase project.
- Release timing: release is defined by domain setup completion.

## Environment Mapping

- Vercel Production -> Supabase production project
- Vercel Preview -> Supabase staging project
- Local development -> Supabase staging project
- Production data remains in the existing Supabase project promoted from staging.
- The staging project is initialized only from `supabase/migrations/` and test data.

## Environment Variables

Required keys:

- `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`, or `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, or `SUPABASE_SERVICE_KEY` (server-only; not required for logged-in posting, but still required while demo-user comments or admin-only maintenance flows remain)
- `DEMO_USER_ID` (optional)

Supabase Auth Google OAuth redirect URLs:

- Local: `http://localhost:3000/auth/callback`
- Vercel Preview / Production: `https://<domain>/auth/callback`

## Notes

- Migration files are the source of truth for schema changes.
- Even in feature-only flow, avoid ad-hoc SQL changes without migration files.
- Do not use `supabase migration repair` for a new empty project. Run
  `supabase db push` so every migration is actually applied.

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
