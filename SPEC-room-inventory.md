# Spec: Owner-Managed Room Inventory

## Objective

Let hostel owners define and maintain the individual room entries that students
will later inspect and select. Each entry uses the existing `Room` data shape:
name, description, monthly price, photos, and seat capacity. This replaces the
current owner-facing input of only hostel-wide room and capacity totals as the
source of bookable inventory.

Listings without room details may remain visible, but cannot accept new
booking requests until the owner adds room details. Existing room IDs and their
booking relationships must be preserved when owners edit a listing.

## Assumptions

1. The room editor belongs in the existing owner create/edit listing flow.
2. `Room.available` is system-managed and is not an owner-editable field.
3. Existing `Hostel.rooms` and `Hostel.capacity` values remain for current
   consumers and are derived from the submitted room entries when those entries
   are provided.
4. A room with a pending or confirmed stay cannot be deleted or have its
   capacity reduced below the number of seats already committed for overlapping
   stays.
5. The current room schema has the necessary fields, so this capability should
   avoid schema changes unless implementation proves one necessary.

## Tech Stack

- Next.js 16 App Router
- React 19 and TypeScript
- Tailwind CSS 4
- Prisma 7 with PostgreSQL
- Shared Zod schemas in `packages/shared`
- Vitest 4

## Commands

- Focused tests: `npx vitest run <relevant-test-files>`
- Full tests: `npm test -- --run`
- Lint: `npm run lint`
- Type check: `npm run typecheck`
- Build: `npm run build`
- Development: `npm run dev`

## Project Structure

- `src/components/owner/ListingFormWizard.tsx` — owner create/edit listing UI
- `src/app/owner/listings/new/page.tsx` — new listing page
- `src/app/owner/listings/[id]/edit/page.tsx` — edit listing page and initial data
- `src/app/api/hostels/route.ts` — listing creation API
- `src/app/api/hostels/[param]/route.ts` — listing edit API
- `src/lib/hostel-service.ts` — transactional listing creation
- `packages/shared/src/validations/index.ts` — shared request schemas
- `prisma/schema.prisma` — existing `Room` and `Hostel` models
- Tests colocated with the form, routes, and service

## Code Style

Keep the room payload explicit and validate it at the shared API boundary:

```ts
const roomInputSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  pricePerMonth: z.number().int().positive(),
  capacity: z.number().int().positive(),
  images: z.array(z.string().url()).max(15),
});
```

Follow existing naming, formatting, upload, notification, error-response, and
transaction patterns. Preserve existing room IDs on edits; authorize every
room mutation through its owning hostel rather than trusting client-provided
IDs.

## Testing Strategy

- Vitest tests for room input validation and aggregate totals.
- Owner form tests for adding, editing, and removing room entries, including
  empty and invalid values.
- API/service tests for ownership checks, room persistence, preserving room IDs,
  and rejecting deletion/capacity reductions that conflict with active stays.
- Run focused tests first, then `npm test -- --run`, `npm run typecheck`, and
  `npm run lint` before completion.

## Boundaries

- Always:
  - Validate room data at API boundaries.
  - Keep owner mutations scoped to hostels owned by the authenticated owner.
  - Persist hostel and room changes atomically.
  - Preserve existing room records and booking relationships during edits.
  - Treat capacity and remaining availability as distinct concepts.
- Ask first:
  - Any database schema migration or data migration.
  - Any change to payment, booking approval, or cancellation policy.
- Never:
  - Accept owner-supplied `available` counts as authoritative.
  - Delete or silently detach rooms with active bookings.
  - Allow a room mutation to exceed or invalidate committed capacity.
  - Add a dependency or change unrelated listing behavior.

## Success Criteria

- Owners can add and edit multiple room entries in both listing creation and
  listing editing flows.
- Each entry captures name, description, monthly price, photos, and capacity.
- Edits preserve stable room IDs and booking relations.
- Hostel-wide room and capacity totals match the submitted room entries when
  room details are provided.
- Room deletions and capacity reductions that conflict with active stays return
  a clear conflict rather than silently invalidating bookings.
- Listing creation/edit validation rejects malformed room entries.
- Existing listings without room details remain viewable but cannot accept new
  bookings until details are added.
- Focused tests, full tests, lint, type check, and build pass.

## Open Questions

- None blocking for this module. The assumptions above are design calls for
  review and may be corrected before planning.
