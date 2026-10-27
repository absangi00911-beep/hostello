# Hostel detail reference layout design

## Intent

Align the top of the HostelLo hostel detail page with the user-provided Airbnb
listing screenshot. The reference is a visual guide for composition and
hierarchy, not a request to copy Airbnb's brand or listing content.

## Goals

- Recreate the reference's centered detail-page width and restrained white
  canvas.
- Place HostelLo branding at the left of the header, a compact destination
  search control in the center, and account/hosting actions at the right.
- Keep the listing title with share/save actions above the photo mosaic.
- Place an accurate listing summary beside the existing monthly booking card:
  listing type/location, available facts, and rating/review information.
- Preserve the five-tile gallery when enough photos exist, while making fewer
  photos occupy the available space honestly and without invented assets.
- Make the destination search submit to the existing hostel search experience.
- Preserve existing booking, save, share, reviews, room, and inquiry behavior.
- Keep the composition responsive and accessible.

## Non-goals

- Copy Airbnb's logo, name, proprietary text, colors, or photography.
- Invent guest-favorite badges, beds/baths, host review totals, or listing facts
  not present in HostelLo data.
- Make destination search imply that unsupported date or guest filters work.
- Redesign lower detail-page sections beyond changes required to preserve the
  page's overall content flow.
- Change booking rules, persistence, API access, or authentication.

## Reference and page structure

At desktop widths, use a full-width header with a centered compact destination
search. Keep the listing content in a narrower, centered column. The order is:

1. HostelLo header: brand, destination search, hosting and account actions.
2. Listing name and share/save actions.
3. Five-position photo mosaic, responsive to the number of real photos.
4. Two-column summary area: listing facts/rating on the left and the existing
   monthly booking card on the right.
5. Existing rooms, amenities, date calendar, reviews, location, and host
   sections continue below without losing content or behavior.

Use HostelLo's existing green identity and typography. The reference's red
brand accent is not copied.

## Content and data rules

- Use listing name, city/area, gender category, capacity, real room data, rating,
  review count, and verification state only where those facts are available.
- Avoid unsupported Airbnb-specific terms such as "entire apartment," guest
  favorite, bedrooms, beds, or baths.
- Show review and rating values from the hostel listing, not as host-level
  metrics.
- The gallery uses only the available cover and gallery images.
- The centered header search accepts a destination and navigates to the
  existing `/search` flow with an encoded city query. Search-page query
  initialization must be validated and must use its existing loading/error
  states. Date and guest filters are excluded because those do not currently
  filter hostel discovery.

## Responsive behavior

- Desktop: three-part header; centered listing column; two-column summary and
  booking card; five-photo mosaic where the viewport permits.
- Tablet: retain a usable centered header search and summary/sidebar only while
  both columns have enough room; otherwise stack the booking card below the
  listing summary.
- Mobile: compact header with brand and account actions; search control remains
  accessible; one-column content; gallery uses its lead image with a working
  all-photos action.
- Avoid horizontal overflow at 320, 375, 768, 1024, and 1440 CSS pixels.

## Accessibility and behavior

- Give the destination field a visible or programmatic label and submit button.
- Keep share, save, and booking controls keyboard-accessible with visible focus.
- Do not make decorative content interactive.
- Maintain useful alt text and empty-photo messaging.
- Keep all existing auth, booking, inquiry, and feedback states intact.

## Verification

- Focused component tests cover honest summary content and search query handling.
- Typecheck and focused lint pass.
- Hostel detail Playwright tests pass, including destination navigation and
  no-overflow checks.
- Inspect the rendered detail page at desktop and mobile sizes against the
  supplied reference. Confirm the displayed metrics come from listing data and
  that existing booking and inquiry interactions remain reachable.
