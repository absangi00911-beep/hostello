# HostelLo — Prisma Migration Discipline

## The rule

**Never use `prisma db push` on `main`, `dev`, or any shared branch.**

`db push` applies schema changes directly to the database without writing a migration file.
Production deployments on Vercel run `prisma migrate deploy`, which reads only from
`prisma/migrations/`. Any change made with `db push` is invisible to `migrate deploy` and will
cause a production schema mismatch — silently, or with a build failure that is hard to diagnose.

This rule also applies to your local Neon dev branch if it is shared with other engineers.
Use a personal Neon branch for experimentation; run `migrate:new` before merging.

---

## How to create a new migration (the only approved method)

```bash
npm run migrate:new
```

This runs `prisma migrate dev`, which:

1. Detects the diff between `schema.prisma` and the current database state
2. Generates a timestamped SQL file under `prisma/migrations/<timestamp>_<name>/migration.sql`
3. Applies the migration to your local/dev database immediately
4. Regenerates the Prisma client types

Prisma will prompt you for a migration name. Use `snake_case` and describe what changed,
for example: `add_device_token`, `add_review_helpful_votes`, `nullable_room_description`.

**The generated `migration.sql` file must be committed alongside `schema.prisma`.** The
pre-commit hook in this repo will block your commit if you stage `schema.prisma` without a
corresponding new file in `prisma/migrations/`.

---

## What Vercel runs on every production deploy

```bash
prisma migrate deploy && prisma generate && next build
```

`prisma migrate deploy` applies every pending migration in `prisma/migrations/` in chronological
order. It does **not** generate new migrations — it only applies ones that already exist. This is
safe to run in CI and production.

This command is defined in `package.json` `"build"` and referenced explicitly in `vercel.json`
`"buildCommand"` as `npm run build`.

---

## If a migration fails in production

1. **Do not push a fix with `db push`** — that bypasses the migration history and makes the
   situation worse.

2. Check the Vercel build logs for the exact Prisma error. Common causes:
   - The migration SQL references a column or table that does not exist yet (bad ordering)
   - A `NOT NULL` column was added without a `DEFAULT` and existing rows cannot be backfilled
   - A unique constraint conflicts with existing data

3. **If the migration has not been applied at all** (it failed before touching the database):
   Fix the SQL in the migration file, or create a corrective migration locally with
   `npm run migrate:new`, then redeploy.

4. **If the migration was partially applied** (the DB is in an unknown state): mark it as
   rolled back manually in the `_prisma_migrations` table, then redeploy with the fixed SQL.
   Tag the Lead/DBA before touching the `_prisma_migrations` table directly.

5. **Never delete or rename a migration file that has already been applied to production.**
   Prisma tracks applied migrations by filename checksum. Deleting or renaming one breaks
   `migrate deploy` for every environment that has not yet applied it.

---

## Existing migrations (do not touch)

| Timestamp | Name |
|---|---|
| 20260101000000 | init |
| 20260115000000 | currency_int |
| 20260201000000 | add_notifications |
| 20260215000000 | add_phone_verification |
| 20260301000000 | add_last_known_price |
| 20260426075853 | add_conversation_participants_table |
| 20260510065319 | add_device_token |
| 20260517000000 | add_cron_logs |
| 20260517120000 | add_price_alert_unsubscribe_token |
| 20260521113857 | add_email_notifications_to_user |

All ten files have been applied to production. Their SQL must never be edited.