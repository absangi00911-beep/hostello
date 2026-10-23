# Tasks: Owner-Managed Room Inventory

> **Paused (October 19, 2026):** The owner UI tasks below reference removed
> pages and components. Do not use this checklist as an active implementation
> plan until the redesign is scoped and the remaining backend work is checked
> against the current API and schema.

## Task 1: Defining the roomTypes request contract

**Description:** Add a shared validated `roomTypes` payload for room name,
description, monthly price, photos, capacity, and an optional existing room ID
used during edits. Keep the current numeric `rooms` field compatible.

**Acceptance criteria:**
- [ ] Valid room entries pass; empty names, non-positive prices/capacities,
  excessive image lists, and malformed IDs fail validation.
- [ ] Existing listing payloads without `roomTypes` remain valid for backward
  compatibility.
- [ ] Validation tests describe both valid and invalid room entries.

**Verification:**
- [ ] Run the focused shared-validation test.
- [ ] Confirm new assertions fail before implementation and pass afterward.

**Dependencies:** None.
**Files likely touched:**
- `packages/shared/src/validations/index.ts`
- `packages/shared/src/validations/index.test.ts`
**Estimated scope:** Small.

## Task 2: Persisting rooms during listing creation

**Description:** Create submitted room records atomically with the new hostel,
initialize system-managed availability from each room's capacity, and derive
the hostel's aggregate room and capacity totals.

**Acceptance criteria:**
- [ ] The listing-create transaction persists all submitted room entries.
- [ ] A failed room write leaves neither a partial hostel nor partial rooms.
- [ ] Hostel aggregate room and capacity values equal the submitted totals.
- [ ] Requests without `roomTypes` preserve existing API behavior.

**Verification:**
- [ ] Run focused `hostel-service` and `POST /api/hostels` tests.
- [ ] Confirm tests cover multi-room creation, empty legacy payloads, and
  transaction failures.

**Dependencies:** Task 1.
**Files likely touched:**
- `src/lib/hostel-service.ts`
- `src/lib/hostel-service.test.ts`
- `src/app/api/hostels/route.ts`
- `src/app/api/hostels/route.test.ts`
**Estimated scope:** Medium.

## Task 3: Adding the owner room editor to listing creation

**Description:** Let owners add, edit, and remove room entries in the existing
listing wizard and submit the validated `roomTypes` payload, using the existing
photo upload pattern.

**Acceptance criteria:**
- [ ] The create wizard supports multiple room entries with name, description,
  monthly price, seat capacity, and photos.
- [ ] Removing a draft entry updates the submitted payload and aggregate
  preview values.
- [ ] The owner cannot submit invalid room entries; room availability remains
  system-managed.

**Verification:**
- [ ] Run focused room-editor/form tests.
- [ ] Verify keyboard access and responsive layout at mobile and desktop widths.
- [ ] Confirm the create payload matches the shared schema.

**Dependencies:** Tasks 1 and 2.
**Files likely touched:**
- `src/components/owner/ListingFormWizard.tsx`
- `src/components/owner/ListingFormWizard.test.tsx`
**Estimated scope:** Small.

## Checkpoint: After Tasks 1-3

- [ ] Focused shared-schema, service, route, and form tests pass.
- [ ] New listings can create multiple persisted rooms from the owner form.
- [ ] `npm run typecheck` and `npm run build` pass.
- [ ] Review the create flow before proceeding to edits.

## Task 4: Loading and safely editing room inventory

**Description:** Preload existing rooms into the owner edit wizard and persist
changes transactionally while retaining room IDs. Reject foreign room IDs,
deletion of rooms with pending/confirmed future bookings, and capacity
reductions that would make those stays exceed room capacity.

**Acceptance criteria:**
- [ ] The edit form displays existing room data and submits edits by stable
  room ID.
- [ ] Room updates, additions, removals, and aggregate hostel totals commit
  atomically.
- [ ] Edits cannot affect rooms owned by another hostel.
- [ ] Capacity reductions are allowed only when every overlapping active stay
  still fits; unsafe removals/reductions return a conflict.
- [ ] Existing edit requests without `roomTypes` preserve current behavior.

**Verification:**
- [ ] Run focused owner edit page and `PATCH /api/hostels/[param]` tests.
- [ ] Test overlapping versus non-overlapping active stays for capacity edits.
- [ ] Run `npm test -- --run`, `npm run lint`, `npm run typecheck`, and
  `npm run build`.
- [ ] Manually verify owner create/edit flows with multiple rooms.

**Dependencies:** Tasks 1-3.
**Files likely touched:**
- `src/app/owner/listings/[id]/edit/page.tsx`
- `src/app/api/hostels/[param]/route.ts`
- `src/app/api/hostels/[param]/route.test.ts`
**Estimated scope:** Medium.
