# Prisma migration rename runbook
# Run these commands once against every database (dev + production).
# They mark each migration as "already applied" under the new name
# without re-executing any SQL.

# ── Step 1: resolve old names as "rolled back" (remove them from _prisma_migrations)
npx prisma migrate resolve --rolled-back 0_init
npx prisma migrate resolve --rolled-back 1_currency_int
npx prisma migrate resolve --rolled-back 2_add_notifications
npx prisma migrate resolve --rolled-back 3_add_phone_verification
npx prisma migrate resolve --rolled-back 4_add_last_known_price

# ── Step 2: mark the new names as "already applied" (no SQL is run)
npx prisma migrate resolve --applied 20260101000000_init
npx prisma migrate resolve --applied 20260115000000_currency_int
npx prisma migrate resolve --applied 20260201000000_add_notifications
npx prisma migrate resolve --applied 20260215000000_add_phone_verification
npx prisma migrate resolve --applied 20260301000000_add_last_known_price

# ── Step 3: verify — output should show all 7 migrations as "applied", none as "pending"
npx prisma migrate status

# ── Notes
# - Run against dev first, confirm "migrate status" is clean, then run against prod.
# - Set DATABASE_URL to the target DB before each run.
# - The two timestamped migrations (20260426, 20260510) were already correctly named
#   and do not need any action.
# - If "rolled-back" errors on a name that doesn't exist in _prisma_migrations,
#   that's fine — it means it was never registered under that name. Skip it and
#   proceed to the --applied step.