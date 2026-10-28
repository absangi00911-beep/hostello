# Tailwind Migration Capability Map

The migration replaces app-owned component styling with Tailwind utilities while preserving the current design and behavior.

| Module id | Responsibility | Depends on |
|---|---|---|
| `tailwind-foundation` | Enable Tailwind v4 and carry over design tokens, resets, typography, and global styles | — |
| `shared-ui` | Convert shared navigation, authentication controls, and reusable interactions | `tailwind-foundation` |
| `discovery` | Convert the home/browse and search pages, including hostel listing cards | `tailwind-foundation`, `shared-ui` |
| `hostel-detail` | Convert hostel detail page and its component sections | `tailwind-foundation`, `shared-ui` |
| `student-pages` | Convert profile, trips, and wishlist pages | `tailwind-foundation`, `shared-ui` |
| `account-messaging` | Convert login and messaging pages | `tailwind-foundation`, `shared-ui` |

Build order: `tailwind-foundation` → `shared-ui` → `discovery`, `hostel-detail`, `student-pages`, and `account-messaging`.

Each module is specified, planned, implemented, and verified before moving on. The four page-group modules may be scheduled independently after their shared prerequisites are complete.
