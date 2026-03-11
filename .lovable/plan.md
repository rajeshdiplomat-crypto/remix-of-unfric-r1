
## Deploy Edge Functions & Run Database Migrations

### What needs to happen

**1. Deploy all edge functions** — 12 functions need to be deployed to production:
- `manage-tasks`, `manage-notes`, `manage-habits`, `manage-diary`, `manage-feed`, `manage-journal`, `manage-manifest`, `manage-settings`, `manage-emotions`, `sync-offline`, `toggle-task-completion`, `upload-image`

**2. Run pending database migrations** — 3 migration files need to be applied to the live database:
- `20260218123249` — Initial schema (tables, RLS policies)
- `20260301164021_storage_consent` — Creates storage buckets + `consent_logs` table
- `20260301195142` — Hardens storage security (removes public access, adds private RLS policies for `entry-covers` and `journal-images`)

### No code changes needed
This is purely a deployment and migration operation. All edge function code and migration SQL files are already written and ready. Implementation will:
1. Deploy all 12 edge functions via the deploy tool
2. Apply the 3 migrations to the database via the migration tool

### Files involved
- `supabase/functions/` — all 12 functions
- `supabase/migrations/` — 3 SQL files
