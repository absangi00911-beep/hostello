# Spec: `room-inventory`

## Objective

Let owners manage individual rooms as the source of bookable inventory while
preserving stable room IDs and existing booking relationships.

## Scope

- Add/edit/remove room entries in the owner listing create/edit flow.
- Capture name, description, monthly PKR price, photos, facilities, and seat
  capacity.
- Derive hostel-wide room/capacity totals from submitted room entries where
  applicable. `Room.available` is never an owner-editable field.
- Preserve existing room records on edits. Mutations are authorized through
  the authenticated owner and the owning hostel.
- Listings without room records remain visible but cannot accept new bookings.
- Reject room deletion or capacity reduction that conflicts with active
  overlapping holds.

## Existing interfaces

- Listing creation: `POST /api/hostels`.
- Listing edit: `PATCH /api/hostels/[param]`.
- Shared request validation: `packages/shared/src/validations`.
- Persistence helpers: `src/lib/hostel-service.ts` and
  `src/lib/room-inventory-service.ts`.
- Existing `Room` model already has the user-editable fields; avoid schema
  changes unless the date-aware implementation proves one necessary.

## Boundaries

- Never trust client-supplied availability counts.
- Do not delete or detach rooms with future pending/confirmed bookings.
- Keep hostel and room edits atomic and return a conflict for invalidating
  capacity changes.
- Any schema or data migration requires explicit approval before application.

## Success criteria

- Owners can create/edit multiple rooms and see server-validated values.
- Edits preserve room IDs and relations.
- Totals match submitted rooms.
- Existing listings without room details are still readable but not bookable.
- Capacity-conflicting edits fail clearly without partial persistence.

## Testing

- Validation and aggregate-total unit tests.
- Owner UI tests for create, edit, remove, empty, and invalid states.
- API/service tests for authorization, ID preservation, atomicity, and
  capacity conflicts.
- Real PostgreSQL tests for concurrent inventory mutations.
