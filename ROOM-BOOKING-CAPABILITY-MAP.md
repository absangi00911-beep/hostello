# Capability Map: Room Inventory and Booking

**Current status (October 19, 2026):** This is a capability map, not a
statement that the listed screens exist. The first-party UI has been removed.
Student room selection and owner room-management screens are deferred until
the redesign; backend API capabilities remain in scope.

| Module id | Responsibility | Depends on |
|---|---|---|
| `room-inventory` | Owner-managed room details and capacity for each hostel | — |
| `room-availability` | Date-aware seat holds, occupancy counts, and capacity-safe booking transitions | `room-inventory` |
| `student-room-selection` | Room details, date-based occupancy, and selection within the hostel detail page | `room-inventory`, `room-availability` |

Backend build order: `room-inventory` → `room-availability`. The
`student-room-selection` interface depends on both and is deferred until the
redesign.

Approved scope:
- Students select a specific room from within the hostel detail page; no separate room route.
- The supplied image is used as the background for the embedded Rooms section.
- Owners manage individual rooms, including name, description, monthly price, photos, and seat capacity.
- Availability is date-aware. Approved seats are shown as booked, pending requests as held, and vacant seats separately for the selected stay.
- Pending requests hold seats until cancellation, decline, expiration, or checkout. Renewals keep seats occupied by extending the stay.
- Existing listings without room records cannot accept new booking requests until room details are added.
- Capacity must remain safe when bookings overlap or are approved concurrently.
