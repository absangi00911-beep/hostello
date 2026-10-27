# Hostel detail reference-match design

## Intent

Bring the complete HostelLo hostel-detail page much closer to the user-provided
Airbnb listing screenshot in visual style, spacing, layout, and sizing. Treat
the screenshot as the authority for page composition and visual hierarchy,
while keeping the product recognizably HostelLo and showing only truthful
listing information.

The supplied Airbnb screenshot is the authoritative reference for the
proportions and spacing visible at its captured viewport. No separate mobile
reference was supplied; adapt the same visual hierarchy responsively at other
viewport sizes.

## Goals

- Match the reference’s compact header, centered content width, restrained
  typography, light dividers, photo-mosaic proportions, reservation-card
  placement, and section rhythm.
- Apply the same visual discipline across the full detail page: overview, rooms,
  amenities, dates, reviews, map, and host.
- Keep the HostelLo wordmark and existing deep-green brand accents instead of
  Airbnb’s coral-red. Use a white canvas, charcoal text, muted metadata, and
  subtle gray borders around that brand accent.
- Build the top mosaic from the hostel’s real cover/gallery photos and actual
  room photos, with accurate alt text. Use no fabricated images or placeholders
  to force a five-image count; adapt the mosaic when fewer than five unique
  images are available.
- Keep the monthly reservation card aligned beside the listing content on
  desktop and preserve the existing booking form and date synchronization.
- Preserve the existing save, share, all-photos, review, map-privacy, and
  host-inquiry behavior.
- Keep the page responsive, accessible, and free of horizontal overflow.

## Non-goals

- Reproduce Airbnb’s logo, name, proprietary copy, or photography.
- Change HostelLo’s brand name, real listing data, booking rules, auth, APIs, or
  persistence.
- Add unsupported apartment/guest/bed/bath claims, “Guest favorite” labels, or
  invented policies, ratings, reviews, or photos.
- Add new listing content solely to mimic sections that have no corresponding
  truthful HostelLo data.
- Redesign unrelated search, home, login, or account surfaces.

## Page composition

At a desktop viewport, center the listing in a roughly 1120px shell with the
same generous side gutters as the reference. Keep the existing HostelLo header
structure but refine its height and spacing to match the screenshot’s compact
brand / centered destination-search / account-actions arrangement.

Use the following page order and hierarchy:

1. Compact HostelLo header with brand, destination search, and account actions.
2. Listing title on the left with compact share/save actions on the right.
3. A wide, shallow five-position mosaic: one large image on the left and four
   smaller images on the right. Populate it in order from the listing cover,
   listing gallery, then that same listing’s room photos, without duplicates.
4. A desktop two-column region: factual hostel overview on the left and the
   existing monthly reservation card on the right. Keep the card visually
   compact and aligned to the top of the overview.
5. Continue with the existing room, amenities, date-calendar, reviews, location,
   and host sections. Match the reference’s restrained separators, two-column
   content grids, typography scale, and compact vertical rhythm. Retain the
   actual HostelLo section titles and data.

Do not fabricate a “Guest favorite” badge. If a review aggregate exists, make
the real hostel rating and category ratings prominent in the reviews region.
If there are no ratings or reviews, preserve the current honest empty state.

## Visual direction

- White page and card surfaces; no decorative gradients or heavy shadows.
- Near-black headings and body text, muted gray secondary text, fine pale-gray
  separators, and softly rounded image/card corners.
- Use the project’s existing deep green (`--brand: #2f6549`) for primary
  actions and brand details; do not use Airbnb’s coral-red.
- Use modest heading weights and an Airbnb-like scale, with photography and
  whitespace carrying hierarchy rather than oversized bold headings.
- Keep the destination search, title row, mosaic, overview, and reservation
  card proportions close to the provided desktop reference rather than the
  current taller, more widely spaced treatment.

## Responsive behavior

- Desktop: centered shell, five-position mosaic where available, and
  overview/reservation columns.
- Tablet: preserve comfortable text and booking widths; stack the reservation
  card below the overview before either column becomes cramped.
- Mobile: compact header, single-column content, lead photo with the all-photos
  action, stacked reservation card, and existing usable calendar/review/map
  layouts.
- Avoid horizontal overflow at 320, 375, 768, 1024, and 1440 CSS pixels.

## Data, behavior, and accessibility

- Use the listing’s actual cover and gallery images followed by distinct room
  images belonging to that listing, capped at five mosaic tiles. Keep the
  complete available photo set in the all-photos dialog.
- Give reused room imagery useful room-specific alternative text; do not label
  a room photo as a generic or different hostel image.
- Keep ratings, category scores, capacity, room count, verification status,
  location, and host response details sourced from existing data.
- Preserve visible keyboard focus, accessible names, error/status messages, and
  touch-friendly controls.
- Keep the map approximate and retain its existing privacy guidance.

## Verification

- Add or update tests for gallery image selection, truthful image labeling,
  and existing detail behavior affected by layout changes.
- Run the repository’s focused tests, full Vitest suite, typecheck, and focused
  lint.
- Inspect desktop and mobile renders against the supplied screenshots and
  verify the measured shell/gallery/booking geometry, section order, and
  overflow behavior.
- Run the hostel-detail Playwright suite, including booking/date, inquiry,
  save/share, gallery, and responsive checks.
