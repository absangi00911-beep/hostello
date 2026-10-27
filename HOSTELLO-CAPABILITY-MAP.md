# Capability Map: HostelLo Web Experience

This map combines the approved web capabilities with the deferred room
inventory and availability capabilities, which are now in scope for the
date-aware booking and alert behavior.

| Module id | Responsibility | Depends on | Specification |
|---|---|---|---|
| `web-foundation` | Responsive application shell, role-aware navigation, shared visual language, accessible interaction primitives, and public/legal page shells | — | [SPEC-web-foundation.md](docs/superpowers/specs/SPEC-web-foundation.md) |
| `room-inventory` | Owner-managed room details and capacity, preserving existing room and booking relationships | `web-foundation` | [SPEC-room-inventory.md](docs/superpowers/specs/SPEC-room-inventory.md) |
| `room-availability` | Date-aware occupancy, blocked-date enforcement, capacity-safe booking transitions, and exact availability reads | `room-inventory` | [SPEC-room-availability.md](docs/superpowers/specs/SPEC-room-availability.md) |
| `notification-center` | In-app notification list, unread state, and read actions for all roles | `web-foundation` | [SPEC-notification-center.md](docs/superpowers/specs/SPEC-notification-center.md) |
| `student-marketplace` | Public hostel discovery and details, favorites, date-based room selection, booking and payment journeys, and student account surfaces | `web-foundation`, `room-availability`, `notification-center` | [SPEC-student-marketplace.md](docs/superpowers/specs/SPEC-student-marketplace.md) |
| `owner-workspace` | Owner listing and room management, booking decisions, blocked dates, messages, reviews, analytics, and earnings | `web-foundation`, `room-inventory`, `room-availability`, `notification-center` | [SPEC-owner-workspace.md](docs/superpowers/specs/SPEC-owner-workspace.md) |
| `admin-console` | Existing admin moderation, verification, payment, refund, payout, and search-operations workflows | `web-foundation`, `notification-center` | [SPEC-admin-console.md](docs/superpowers/specs/SPEC-admin-console.md) |
| `availability-alerts` | Date-aware alerts for a saved hostel or saved search, delivered in-app | `room-availability`, `notification-center`, `student-marketplace` | [SPEC-availability-alerts.md](docs/superpowers/specs/SPEC-availability-alerts.md) |

## Build order

1. `web-foundation`
2. `room-inventory` → `room-availability`
3. `notification-center`
4. `student-marketplace`, `owner-workspace`, and `admin-console` (parallel where
   their shared contracts are stable)
5. `availability-alerts`

The room-inventory and room-availability modules are added from the existing
deferred room-booking capability map. The six previously approved web module
IDs remain unchanged. The ordering makes the date-aware inventory contract
available before student booking, owner capacity changes, and alert matching
consume it.
