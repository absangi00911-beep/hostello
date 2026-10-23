# Implementation Plan: Owner-Managed Room Inventory

> **Paused (October 19, 2026):** This plan depends on owner listing screens
> that have been removed. Do not implement its UI tasks until the redesign is
> scoped. The backend requirements below are historical planning notes and
> must be checked against the current API and schema before reuse.

## Overview

Implement the `room-inventory` capability from
[SPEC-room-inventory.md](../SPEC-room-inventory.md): owners define room
entries with their own descriptions, prices, photos, and seat capacities in
the existing listing create/edit flow. Listing and room updates remain
transactional, room IDs and booking relationships are preserved, and edits
cannot invalidate future active stays.

## Architecture Decisions

- Reuse the existing Prisma `Room` model and its fields. No schema migration
  is planned.
- Add a `roomTypes` payload alongside the existing numeric `rooms` aggregate to
  avoid changing the current request contract. When `roomTypes` is submitted,
  derive `Hostel.rooms` and `Hostel.capacity` from its entries.
- Use the existing image upload flow for room photos; owners do not edit
  remaining availability.
- Create room records as part of the listing-create transaction. Update rooms
  and aggregate hostel totals in one transaction during listing edits.
- Match submitted room entries to existing records by room ID, verify every
  existing ID belongs to the edited hostel, and reject removal or capacity
  reduction when it conflicts with a pending or confirmed future stay.
- Maintain the existing `Room.available` behavior for this capability so
  current booking flows continue working. Date-aware occupancy and booking
  transitions are handled by the separate `room-availability` module.

## Dependency Graph

```text
Shared roomTypes contract
    ├── Owner listing-create persistence ── Owner room editor
    └── Owner listing-edit load/persistence and reservation safeguards
```

## Task List

### Phase 1: Contract and Creation

- [ ] Task 1: Define and test the roomTypes request contract.
- [ ] Task 2: Persist room entries transactionally on listing creation.
- [ ] Task 3: Add the owner room editor to listing creation.

### Checkpoint: Create Flow

- [ ] Shared validation and focused creation tests pass.
- [ ] A new listing can be submitted with multiple rooms and stores matching
  aggregate room/capacity totals.
- [ ] Type check and build succeed.
- [ ] Review the working create flow before editing existing listings.

### Phase 2: Editing Existing Inventory

- [ ] Task 4: Load and save room entries safely in listing edits.

### Checkpoint: Complete

- [ ] Existing room IDs and booking relationships remain intact after edits.
- [ ] Conflicting removals/capacity reductions return a clear conflict.
- [ ] Focused tests, full tests, lint, type check, and build pass.
- [ ] Owner create/edit flows work end-to-end.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Room edits can invalidate active booking allocations | High | Check pending/confirmed future bookings in the same transaction; reject unsafe changes |
| Client submits room IDs from a different hostel | High | Scope each update/delete through the authorized hostel and reject foreign IDs |
| Aggregate totals disagree with room-level data | Medium | Derive hostel totals from the submitted room entries in the transaction |
| Image uploads fail or are incomplete | Medium | Reuse existing upload validation and preserve existing room images on unrelated edits |
| The current booking flow uses a global `available` counter | Medium | Preserve and adjust the existing counter in this module; replace date-based calculations only in the dependent availability module |

## Open Questions

- None. The assumptions in the approved module spec are used for this plan.
