# Database workflow — READ BEFORE TOUCHING

This project manages its schema with **`prisma db push`** (schema-first), NOT
migration files. `../schema.prisma` is the single source of truth and matches
the live Supabase database exactly (verified 2026-07-10, including all indexes).

## After changing schema.prisma
    cd backend
    npm run db:push

## Setting up a brand-new database (staging / disaster recovery)
    cd backend   # with DATABASE_URL / DIRECT_URL pointing at the new DB
    npm run db:push

That single command builds the complete, correct schema. Do NOT run
`prisma migrate deploy` — there are intentionally no migration files.

## History
The original migration (built for the old "jobs" schema, superseded by
db push long ago) is archived in `../_archived_migrations/` and its
bookkeeping row was removed from the live DB's `_prisma_migrations` table
on 2026-07-10. It must never be re-applied.

If the team later wants versioned migrations (recommended once there is
real production data), baseline with:
    npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/00000000000000_baseline/migration.sql
    npx prisma migrate resolve --applied 00000000000000_baseline
