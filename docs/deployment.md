# Deployment Environments

## Environments

This project uses 3 environments.

- `local`: local Next.js + local env file
- `staging`: Vercel Preview + Supabase staging project
- `production`: Vercel Production + Supabase production project

## Supabase Project Split

Create 2 Supabase projects.

- `arrange-wiki-staging`
- `arrange-wiki-production`

Use separate database/auth for each project.

## Vercel Mapping

- Vercel `Preview` environment -> `staging` Supabase
- Vercel `Production` environment -> `production` Supabase

## Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DEMO_USER_ID` (optional for local/demo)

## Local Setup

1. Copy `.env.local.example` to `.env.local`.
2. Set local or staging Supabase variables.
3. Run `npm run dev`.

## Staging Setup (Vercel)

1. Open Vercel project settings.
2. Add `NEXT_PUBLIC_SUPABASE_URL` for `Preview`.
3. Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` for `Preview`.
4. Redeploy preview.

## Production Setup (Vercel)

1. Open Vercel project settings.
2. Add `NEXT_PUBLIC_SUPABASE_URL` for `Production`.
3. Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` for `Production`.
4. Deploy to production branch.

## Migration Policy

Apply schema changes to `staging` first, verify, then apply to `production`.

Recommended order:

1. run migration on staging
2. verify app on preview
3. run same migration on production
4. deploy production app

## Initial DB Setup (No CLI)

If Supabase CLI is not installed, run the migration SQL manually:

1. Open Supabase Dashboard for `arrange-wiki-staging`.
2. Go to SQL Editor.
3. Paste and run `supabase/migrations/20260215_000001_init.sql`.
4. Verify tables, view, and RLS policies are created.
5. Repeat the same SQL for `arrange-wiki-production` after staging verification.

## Initial DB Setup (With CLI, optional)

If you install Supabase CLI later, use:

```bash
supabase link --project-ref <staging-project-ref>
supabase db push
```

Then repeat for production project ref after validation.

## Vercel Env Registration Checklist

Preview (`staging`):

- `NEXT_PUBLIC_SUPABASE_URL=<staging-url>`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging-anon-key>`
- `DEMO_USER_ID=` (empty in staging recommended)

Production:

- `NEXT_PUBLIC_SUPABASE_URL=<production-url>`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>`
- `DEMO_USER_ID=` (empty in production)

## Branch Policy

- Feature branches -> Vercel Preview (`staging` resources)
- Main branch -> Vercel Production (`production` resources)
