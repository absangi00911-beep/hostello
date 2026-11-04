# HostelLo backlog

Replaces the paused room-inventory checklist (Oct 19, 2026); that checklist is kept in git history. Rules: small tasks, build order from HOSTELLO-CAPABILITY-MAP.md, student booking first. Task status lives in `tasks/team-assignments.md`.

## Now (approved Nov 4, 2026)
- [ ] A-002 Auditor: re-audit web-foundation at 86cf03b
- [ ] B-006 Backend: constant-time secret compares + stale refunds.ts comment
- [ ] Q-001 QA: role-matrix test + role-redirect e2e
- [ ] OWNER-1: Safepay sandbox E1 and F runs

## Next, needs a decision first
- [ ] Owner decision D-4 (inventory model: seat holds vs monthly buckets), which gates room-inventory and room-availability (R-01)
- [ ] Owner decision D-2 (stay rules, billing, booking-time method list), R-02
- [ ] Owner decision D-3 (payout timing and custody), R-03 and R-05
- [ ] Owner policy on late payments (reinstate if seat free, else refund), R-04 item 11
- [ ] Design direction (audit rows 18-19): blue/Inter in code vs green/system fonts in spec

## Then, in build order
1. web-foundation: finish whatever A-002 still lists as Partial/Missing (one PKR formatter, skip link, 44px admin tap targets, shared empty state)
2. room-inventory (re-scope from current schema; old plan references removed pages)
3. room-availability (needs D-4)
4. notification-center
5. student-marketplace / owner-workspace / admin-console (parallel)
6. availability-alerts

## Launch gates (no real money until all P0 closed)
R-01, R-02, R-03, R-04 (late payments, sweeper, refund-audit trigger, QStash retry), R-05. R-06 console steps reported done by owner; first green production run still to be confirmed.
