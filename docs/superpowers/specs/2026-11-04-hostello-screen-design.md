# HostelLo consolidated screen and state design

**Status:** Design proposal for Founder and human-owner review. Explicit
Founder sign-off is still required before any UI implementation.
**Scope:** The eight modules in `HOSTELLO-CAPABILITY-MAP.md`; screen and state
design only. This document does not approve product policy, backend contracts,
or implementation.
**Design baseline checked:** `d2f1b06fcd4e2f6e258b37a2731d494ff1519640`

## 1. Design intent and boundaries

HostelLo opens on hostels, not a marketing page. The student path is
discover → compare → choose a room and date range → request a booking → follow
the server-reported booking/payment state. Owner and admin areas are separate,
role-scoped workspaces. Use short, plain-English copy, visible prices in whole
PKR, real listing data, and no unsupported badges or promises.

This design covers these eight capability modules:

1. `web-foundation`
2. `room-inventory`
3. `room-availability`
4. `notification-center`
5. `student-marketplace`
6. `owner-workspace`
7. `admin-console`
8. `availability-alerts`

The screens below describe intended destinations even where the current
implementation is partial or a planned API is not yet available. They are not
evidence that a screen, API, or state has shipped. Use the relevant module
specification as the behavior contract; do not add actions to compensate for a
missing API. An unavailable or unauthorized operation must remain unavailable
and visible as such.

### Out of scope

- New features, sign-in methods, payment/cancellation/refund/payout rules, or
  legal/privacy copy.
- Marketing content, nightly prices, invented hostel facts, user-account
  administration, or student-facing price alerts.
- New delivery channels for notifications, new backend services, or a new
  data/API contract.
- UI coding before the visual direction and this consolidated proposal receive
  explicit sign-off.

### Screen inventory

| Module | Designed surfaces |
|---|---|
| Web foundation | Shared shell and role navigation; listings-first discovery entry; sign-in; sign-up; email verification; password recovery/reset; contact; Terms and Privacy shells. |
| Room inventory | Owner listing create/edit with an integrated multi-room editor; room add/edit/remove and capacity-conflict states. |
| Room availability | Date-and-guest selector with exact room availability; booking review/create conflict; owner blocked-date calendar. |
| Notification center | Shared paginated notification list and per-item/bulk read and delete states. |
| Student marketplace | Search/results; public hostel detail; favorites; booking list/detail/cancellation; payment handoff/status; profile; student verification; reviews; roommate finder/report; conversations/messages. |
| Owner workspace | Dashboard; listing list and review status; listing/room editor; booking queue/detail and decisions; blocked dates; conversations; review replies; analytics; earnings; subscription. |
| Admin console | Overview; listing review; verification queue/document review/analytics; roommate-report moderation; booking detail; refund and payout operations; payment-event inspection/retry; listing statistics; search synchronization. |
| Availability alerts | Student alert list and hostel/search create/edit form; pause/resume/delete and match/expiry states; notification entry points on search/detail. |

## 2. Shared design system proposal

These are design calls for review, not owner-approved policy or a mandate to
change the current code. Prefer the installed stack and shared components;
introduce no design-system or icon dependency.

### Visual direction

- Keep the page quiet and utilitarian: white/soft neutral surfaces, generous
  spacing, clear dividers, readable system typography, and listing photography
  that comes from the listing. Avoid promotional hero art, deep card nesting,
  decorative gradients, or dense dashboard chrome.
- **Proposed accent:** restrained forest green with calm neutral surfaces, as
  described in `SPEC-web-foundation.md` and the dated web direction. This is
  not the current token value: `src/app/globals.css` presently defines a blue
  brand (`#2563eb`). The owner must resolve this visual-direction mismatch
  before implementation changes the existing tokens.
- Use a compact, consistent type hierarchy: one page title, section headings,
  readable body copy, and small but legible metadata. Do not encode meaning in
  font weight or color alone. Use the existing system/Inter font setup.
- Photo cards show only supported facts: hostel name, location, monthly PKR
  price, rating/review data when present, and a useful image alternative.
  Never invent “verified”, “popular”, availability, or safety badges.
- Use text labels alongside icons for primary navigation and actions. Icons
  may be decorative when adjacent text already names the action.

### Proposed contrast pairs

The following proposal is measured against WCAG contrast formulae. Normal
text pairs exceed 4.5:1; large text and non-text controls therefore also
clear the 3:1 thresholds. These values require owner sign-off and do not claim
that the current application already uses them.

| Proposed foreground / background | Contrast | Use |
|---|---:|---|
| `#17231C` / `#F7F9F7` | 15.34:1 | Main text on canvas |
| `#45564A` / `#FFFFFF` | 7.83:1 | Secondary text on surface |
| `#14532D` / `#FFFFFF` | 9.11:1 | Text links, primary button label on green |
| `#14532D` / `#DCFCE7` | 8.30:1 | Success/status text on soft-green surface |
| `#92400E` / `#FFFBEB` | 6.84:1 | Warning/status text on warm surface |
| `#991B1B` / `#FEF2F2` | 7.60:1 | Error/status text on pale-red surface |
| `#64748B` / `#FFFFFF` | 4.76:1 | Proposed neutral divider/control edge where used |

Verify actual rendered text, hover, disabled, focus, and status combinations
again in the browser after the owner approves the palette; do not treat these
sample pairs as a substitute for testing the full design.

### Layout, interaction, and accessibility rules

- Mobile-first; work at **360 CSS px** without page-level horizontal overflow.
  Keep the existing 320px regression target where those screens already have
  it. At small widths, stack content and collapse secondary navigation rather
  than shrinking text or hiding required actions.
- Desktop uses a centered readable content column for student flows and a
  persistent, clearly labeled sidebar or header navigation for owner/admin
  workspaces. Long operational tables become labeled row cards on mobile.
- On student-facing mobile pages, use the existing five destinations:
  Explore, Wishlists, Trips, Messages, Profile. Keep the tab bar clear of
  content and focused controls using bottom padding and safe-area insets.
  Do not replace owner/admin navigation with student tabs.
- Search results and listings remain the first-class content. On mobile,
  search can compact to the existing search pill and category controls; no
  marketing hero precedes results.
- Every interactive target is at least **44 × 44 CSS px**, including icon-only
  buttons, pagination, calendar controls, and menu items. Increase hit area
  without adding visible clutter.
- Use semantic headings, landmarks, labels, links, buttons, tables/lists, and
  form errors. Provide a persistent visible `:focus-visible` ring with offset;
  never remove keyboard focus. Dialogs trap focus while open, close with
  Escape when safe, and restore focus to the trigger.
- Announce async outcomes and status changes using `role="status"` /
  `aria-live="polite"`; use `role="alert"` for urgent submission errors.
  Status always has visible text and an icon/shape in addition to color.
  Associate field errors with inputs and move focus to the first invalid field
  after a blocked submit.
- Honor `prefers-reduced-motion: reduce`: remove nonessential transitions,
  parallax, and animated skeleton shimmer. Never make movement the only
  loading/status cue.
- Keep keyboard order equal to visual order. Calendar dates, tabs, pagination,
  menus, and dialogs must be keyboard-operable with an announced selected,
  current, or disabled state.
- Image alternatives describe useful content, not “image”; decorative images
  use empty alt text. Do not place private student, owner, verification, or
  payment data into page titles, analytics labels, or browser-visible logs.

### Shared state vocabulary

Each screen below names the states it uses. Apply these shared patterns
consistently; tailor the heading and retry destination to the screen.

| Key | State and user-facing treatment |
|---|---|
| **L** | Loading: keep page title and layout stable; use non-animated or reduced-motion-safe skeletons sized like the incoming content. Announce “Loading …” once; do not make a blank page look like success. Disable duplicate submission while a mutation is pending. |
| **E** | Empty: explain what is absent and offer only an in-scope next step. Example: “No saved hostels yet.” / “Explore hostels.” Do not use empty state for a failed request. |
| **X** | Recoverable error: “We couldn’t load this right now.” with a labeled Retry action. Retain safe user-entered form values; do not show success-shaped fallback data. |
| **OK** | Success: show the server-confirmed result, destination, and next available step. Announce changes via a polite status region. Never announce success before the server confirms it. |
| **D** | Access denied: signed-out users follow the existing login/return path. A signed-in user without the required role sees the existing safe not-found/denied behavior; never expose protected data in the client first. |
| **V** | Validation: inline, field-specific explanation; retain valid entries, mark invalid fields semantically, and focus the first invalid field. Do not invent new policy limits. |
| **C** | Conflict/stale state: “This changed while you were viewing it.” Explain the affected item/date/action and offer the safe server-supported retry, refresh, or change-input path. Do not silently overwrite. |
| **U** | Uncertain outcome: state that confirmation is not available yet; preserve the current server state and provide a safe status refresh path. Do not present a failed network response as success or invite a duplicate irreversible action. |
| **—** | Not applicable: this screen has no corresponding content or action (for example, login has no resource-empty state). |

## 3. Screen and state specifications

### Module 1 — `web-foundation`

**Purpose:** Give students, owners, and admins a consistent shell while
putting hostel discovery first. **Primary goal:** reach the correct public or
role-specific destination without confusing navigation with authorization.

#### Shared shell and role navigation

- **Layout/copy:** A simple brand header with primary destination links,
  account controls, and a notification affordance with a text unread count.
  Student desktop navigation exposes Explore, Wishlists, Trips, Messages, and
  Profile; student mobile uses the five labeled tabs. Owner navigation exposes
  Dashboard, Listings, Bookings, Messages, Reviews, Analytics, Earnings, and
  Subscription only where the corresponding screen exists. Admin navigation
  exposes only the console queues/tools in this spec. Use “Notifications” as
  the notification destination; do not rely on a badge alone.
- **States:** L while role/session or unread count is resolved; X leaves
  navigation usable and the count unavailable rather than showing zero; D
  guards protected destinations on the server. OK updates current-page and
  unread state after a confirmed action.
- **Responsive/accessibility:** Semantic `<nav>` with a unique label per
  navigation region; links expose `aria-current="page"`. At 360px, no
  horizontal header overflow. All menu triggers are 44px targets and keyboard
  operable.

#### Public home / discovery entry (`/`)

- **Purpose/goal:** Start a student hostel search immediately.
- **Layout/copy:** Search entry is first, followed by existing category
  controls and listing-first content. Use a concise heading such as “Find a
  hostel that fits your stay.” Search uses existing destination, date, and
  guest inputs. Keep the current categories and their meanings; show the
  existing “Nearby” option only when location access is available. Do not
  imply a campus directory or campus-specific ranking. Listing rows/cards
  show real photo, name, location, monthly PKR price, and available rating
  data. “Become a host” is a quiet secondary link, not a competing hero.
- **States:** L for listing data; E: “No hostels to show yet.” with the
  existing search entry still available; X retry; OK shows returned hostels;
  D is not applicable to public browsing. Location denied/unavailable is an
  inline search state (“Location isn’t available. Choose a city instead.”),
  not a blocked page.
- **Responsive/accessibility:** On narrow student screens, retain the compact
  search pill and horizontal category/listing rows only where the existing
  components support them; preserve a visible partial next-card cue without
  trapping keyboard scrolling. Respect safe area above student tabs.

#### Search results (`/search`)

- **Purpose/goal:** Refine an existing supported search and compare the
  returned listings.
- **Layout/copy:** Keep the submitted query visible and editable. Place
  supported filters in a compact filter panel/drawer, active filters as
  removable labeled chips, then result count/sort and paginated listing
  results. Search filters remain those supported by the public search
  contract (including city, gender, price, amenities, rating/category, and
  pagination where applicable); explain filters in plain language. “Nearby”
  means device-location proximity only, not a campus lookup.
- **States:** L preserves the filter summary; E: “No hostels match these
  filters.” with “Clear filters” and an editable search; X retry while
  retaining query/filters; OK shows results and page; V identifies invalid
  filter input; D applies only to signed-in-only save actions (prompt to sign
  in without losing search). A denied location request falls back to city
  search.
- **Responsive/accessibility:** On mobile, filters open in a labeled
  full-screen or bottom-sheet panel with Apply and Reset; results remain
  reachable without sticky controls covering content. Pagination is
  keyboard-accessible and announces the new result range.

#### Sign-in (`/login` and existing sign-in dialog)

- **Purpose/goal:** Authenticate and return to the requested safe destination.
- **Layout/copy:** Email and password fields, “Sign in”, password-recovery
  link, and account-creation link. Show “Continue with Google” only when both
  Google credentials are configured. The current source also configures an
  email-code provider and the sign-in dialog has an email-code flow; this
  method is **not listed in `PRODUCT.md`** and needs Founder confirmation
  before its presentation is standardized. Phone OTP is phone verification,
  not sign-in, and is not offered here.
- **States:** L during submit; V for missing/invalid inputs; X for provider or
  request failure; OK returns to the validated callback destination; D for
  already-authenticated or disallowed destinations uses existing redirects.
  Invalid/expired email code is shown beside the code entry if that existing
  flow is approved for the full sign-in page.
- **Responsive/accessibility:** One-column form with labels always visible;
  password visibility control has a 44px target and an accessible name;
  keyboard submits only from valid form controls.

#### Sign-up (`/signup`)

- **Purpose/goal:** Create a student or owner account using an existing
  registration path.
- **Layout/copy:** Name, email, password, and the existing student/owner
  choice. Keep the intended role choice visible and explain it neutrally; do
  not offer admin registration. Show supported auth methods only, subject to
  the email-code decision above. CTA: “Create account”.
- **States:** L during submission; V on field errors; X on API/provider
  failure; OK: “Check your email to verify your account.” and the existing
  verification continuation; D when an existing signed-in account should
  return to its role workspace.
- **Responsive/accessibility:** Vertical form and grouped role choice with a
  programmatic legend, not color-only selection.

#### Email verification and resend

- **Purpose/goal:** Complete account email verification using the existing
  email link/code flow.
- **Layout/copy:** Brief status, the email address only when safe to display,
  code/link entry only if required by the existing flow, and a resend action
  with server-reported availability. Copy: “Verify your email to continue.”
- **States:** L while checking/submitting; V for malformed code; X for
  delivery/verification failure with retry/resend; OK confirms only the
  server-reported verification and links onward; D for expired/used token
  shows a safe recovery path without exposing account existence.
- **Responsive/accessibility:** Code inputs (if present) remain one labeled
  field to assistive technology and paste; no timed animation or unannounced
  auto-advance.

#### Password recovery and reset (`/forgot-password`, `/reset-password`)

- **Purpose/goal:** Request and complete the existing password reset.
- **Layout/copy:** Forgot-password has one email field and “Send reset
  instructions.” Reset has new password and confirmation, with a clear
  password requirement only where enforced by current validation.
- **States:** L during request/save; V for invalid email/password/token;
  X generic recoverable failure; OK uses neutral copy (“If an account matches
  that email, reset instructions will be sent.”) and “Your password has been
  updated” only after confirmed completion; D for expired/used reset token
  with a request-new-link path.
- **Responsive/accessibility:** Same single-column form and focus/error
  behavior; do not disclose whether an email belongs to an account.

#### Contact (`/contact`)

- **Purpose/goal:** Send a message through the existing support/contact flow.
- **Layout/copy:** Existing supported name/email/subject/message fields and
  “Send message”; do not promise a response time or add a new support channel.
- **States:** L during submit; V field validation; X retains entered content;
  OK confirms submission only after server acceptance; D is not applicable
  unless the existing route requires authentication.
- **Responsive/accessibility:** Stacked labeled fields and readable character
  guidance only when enforced by the current form.

#### Terms and Privacy shells (`/terms`, `/privacy`)

- **Purpose/goal:** Provide a navigation destination without fabricating
  legal content.
- **Layout/copy:** Page title, clear “Content awaiting review” notice, and
  route back to browsing. Do not render invented rules, placeholder legal
  paragraphs, or an acceptance checkbox attached to unapproved copy.
- **States:** L only if an approved document is loaded; X explains content is
  unavailable; OK means only the approved document rendered; D is not
  applicable. Until approved text exists, the shell is explicitly unfinished.
- **Responsive/accessibility:** Readable text column and semantic heading
  hierarchy; no false affordance that implies agreement.

### Module 2 — `room-inventory`

**Purpose:** Let owners maintain rooms as the source of bookable inventory.
**Primary goal:** add or edit room details without changing room identity or
invalidating active holds.

#### Listing create and edit with room editor

- **Purpose/goal:** Create/edit listing details and its rooms in one
  owner-scoped workflow.
- **Layout/copy:** Listing information first, then a clearly grouped “Rooms”
  section with repeatable room rows/panels. Each room captures only specified
  fields: name, description, monthly PKR price, photos, facilities, and seat
  capacity. Show derived totals as read-only. Never offer an owner-editable
  “available seats” field. Primary action: “Save listing” (or existing
  create/edit equivalent); room actions: “Add room”, “Edit room”, “Remove
  room”.
- **States:** L loads listing/rooms; E for a new listing is an editable blank
  form, while a listing with no room entries shows “Add at least one room
  before accepting new bookings” without implying an unapproved submit rule;
  X retains safe form data; V field-level errors; OK returns to the listing
  with server-confirmed values and review status; D for non-owner or
  non-owning user; C when a delete or capacity reduction conflicts with an
  active hold, naming the affected room and dates if returned by the server.
  No partial-save success on a conflict.
- **Responsive/accessibility:** Room panels stack at 360px; add/remove
  controls remain adjacent to their room heading and announce the item count.
  Group related fields with labels; do not encode capacity only with a
  visual meter.

#### Room add/edit/remove states

- **Purpose/goal:** Change one room while preserving its stable ID and booking
  relationships.
- **Layout/copy:** Inline panel or dialog attached to the relevant listing;
  visible room name, submitted values, and a clear Save/Cancel pair. Removal
  confirmation names the room and warns that existing relationships may
  prevent removal; it does not invent a retention period.
- **States:** L while loading/saving; E is not applicable to an existing room
  edit; X preserves entered changes; V identifies the invalid field; OK
  announces “Room updated” / “Room added” / “Room removed” only after server
  confirmation; D for a listing outside the owner's scope; C explains that
  active bookings prevent the requested removal/capacity change and leaves
  persisted values unchanged.
- **Responsive/accessibility:** Dialog focus management follows shared rules;
  on mobile use a full-width sheet with a visible title and close/cancel
  action.

### Module 3 — `room-availability`

**Purpose:** Make student reads, booking writes, and owner blocks agree on
date-bounded room capacity. **Primary goal:** select a room that fits every
occupied day or recover cleanly when availability changes.

#### Exact stay dates, guest count, and room choice (hostel detail entry)

- **Purpose/goal:** Select check-in/check-out dates, guest count, and a
  specific room using exact availability.
- **Layout/copy:** Date range and guest count precede room options. Each room
  presents name, monthly PKR price, capacity, and server-returned available
  seats per date; show a concise “Available for all selected dates” only when
  the exact-range service confirms it. Display a selected room summary and
  continue to booking review. Show that checkout is not an occupied night;
  date semantics remain server-authoritative.
- **States:** L for date/room availability; E if no room fits the selected
  range, with “Change dates or guest count”; X retries the exact query;
  V for invalid or past date range/guest count per existing validation; OK
  marks the selected room; D prompts sign-in only when the next operation
  requires it; C when availability becomes stale, clearing an invalid room
  selection and offering refresh/change dates. No monthly occupancy estimate
  is labeled as exact availability.
- **Responsive/accessibility:** Date/guest inputs open keyboard-operable
  controls; the selected date range and room are announced. A mobile room
  comparison becomes a vertically stacked list, not a horizontally
  overflowing table.

#### Booking review and request

- **Purpose/goal:** Review the exact hostel, room, dates, guests, and
  server-provided price/cancellation terms before creating a request.
- **Layout/copy:** Single review column on mobile; desktop may pair details
  with a summary. Keep monthly PKR price, total, booking/payment state, and
  cancellation terms as returned by the existing contract. CTA reflects the
  server flow; never label a request “confirmed” merely because it was
  submitted.
- **States:** L while rechecking/creating; E is not applicable; V identifies
  missing room/dates/guest fields; X offers safe retry without duplicate
  submission; OK shows the returned booking state and next step; D for
  unauthenticated/unauthorized request; C (`409`) says “This room is no longer
  available for those dates.” and offers “Change dates” / “Choose another
  room”. U after a network interruption says “We couldn’t confirm the request
  status. Check booking status before trying again.” No implied booking or
  charge.
- **Responsive/accessibility:** Keep the primary action reachable without
  covering terms or the selected dates; submission and result are announced
  once.

#### Owner blocked-date calendar

- **Purpose/goal:** View and manage an owner's blocked dates without
  invalidating active holds.
- **Layout/copy:** Month calendar with previous/next month, visible blocked
  ranges, and a labeled date-range editor. Explain inclusivity in context:
  “Blocked dates include both the start and end date.” CTA: “Block dates” /
  “Remove block” only when allowed by the existing service.
- **States:** L for calendar/range data; E shows no blocks and an available
  range editor; X retry; V for invalid/reversed range; OK names the saved
  blocked range; D for non-owner/non-owning listing; C when an active hold
  overlaps the requested block, names affected dates, and leaves the calendar
  unchanged.
- **Responsive/accessibility:** Calendar is keyboard-operable; announce month,
  weekday/date, selected range, blocked/disabled state. At narrow widths,
  prefer one month at a time; never require color alone to distinguish a
  block.

### Module 4 — `notification-center`

**Purpose:** One authenticated in-app center for every role. **Primary goal:**
open a safe destination or update a notification's read state.

#### Notification list (`/notifications`)

- **Layout/copy:** Page title “Notifications”, unread count as text, a
  paginated chronological list, and per-item “Mark as read” / “Delete”
  controls plus “Mark all as read”. Each item has a concise message, date,
  read/unread text, and a related safe destination when provided. No new
  filters or delivery settings.
- **States:** L for page and unread count; E: “You’re all caught up.”; X
  retry while retaining the visible list; OK updates the affected item/count
  only after API confirmation; D redirects signed-out users and scopes data
  to the current user; U after a failed mutation keeps the prior read/delete
  state and gives a retry; C for stale pagination refreshes the current page
  without claiming loss of notifications.
- **Responsive/accessibility:** List becomes stacked notification rows with
  the message before metadata/actions. Read state has visible text plus
  non-color cue. Announce count changes and pagination updates.

### Module 5 — `student-marketplace`

**Purpose:** Let a student discover, evaluate, request, and manage a stay
using existing student capabilities. **Primary goal:** make an informed
choice without exposing private owner/admin data.

#### Public hostel detail

- **Purpose/goal:** Evaluate one public listing, choose dates/room, and proceed
  to a request.
- **Layout/copy:** Follow the current detail order and dated layout reference:
  title/location; real listing photos; monthly price and available ratings;
  description; room and amenity sections; date and room selector; review
  section; a distinct “Where you’ll be” location section; then “Meet your
  host” public information only where present and safe. Keep contact/message
  entry within existing behavior and the booking summary close to the room
  choice. Availability-alert controls appear only as defined in Module 8. Do
  not expose owner email/phone, admin metadata, or unapproved policy copy.
- **States:** L for public-safe detail and availability; E/not-found uses the
  existing not-found state (not an empty listing shell); X offers retry;
  OK shows server-backed content; D is not applicable to public read, while
  favorites/message/booking actions use the existing sign-in return flow; C
  invalidates a stale room selection and returns to the date picker.
- **Responsive/accessibility:** Photo gallery has labeled previous/next
  controls and useful image alternatives; mobile puts dates/room choice
  before secondary details and keeps price visible without obscuring page
  content.

#### Favorites / Wishlists (`/wishlists`)

- **Purpose/goal:** Revisit saved public hostels.
- **Layout/copy:** Simple list/grid of saved hostels with image, name,
  location, monthly PKR price, and a server-confirmed save/unsave control.
  Each card links to public detail.
- **States:** L; E: “No saved hostels yet.” / “Explore hostels.”; X retry,
  not an empty success; OK confirms the save state and retains the card
  unless the server confirms removal; D sends signed-out visitors through
  the return-to-wishlist sign-in flow.
- **Responsive/accessibility:** Single-column or compact grid at 360px;
  heart controls have explicit “Save/Remove from wishlists” names and
  announced outcomes.

#### Trips / booking list (`/trips`)

- **Purpose/goal:** Understand current and past booking states and open a
  booking.
- **Layout/copy:** Group by server-returned status/date if available. Each
  row shows hostel, room where returned, stay dates, guests, whole-PKR
  amount, and an explicit text booking/payment status. CTA: “View booking”.
- **States:** L; E: “No bookings yet.” / “Explore hostels.”; X retry; OK
  shows returned status without upgrading pending to confirmed; D
  authenticates as student; C refreshes when state changes while open.
- **Responsive/accessibility:** Rows stack as labeled cards; status is text
  and icon/shape, not color alone.

#### Booking detail and cancellation

- **Purpose/goal:** Inspect one booking and use only currently authorized
  actions.
- **Layout/copy:** Booking state first, then hostel/room, stay dates, guest
  count, total, payment state, server-provided cancellation terms, and
  available actions. Cancellation confirmation repeats the specific booking
  and server-calculated effect; do not create a new window, fee, or refund
  rule.
- **States:** L; E/not-found uses a safe not-found state; X retry; OK follows
  server state; D denies other users' booking access; C if action eligibility
  changed; U for an unresolved payment/refund result with no duplicate
  action; V for a rejected action. A completed cancellation is not a
  successful refund unless the server separately confirms refund status.
- **Responsive/accessibility:** Long policy text is readable inline; confirm
  actions are keyboard accessible and name the target booking.

#### Payment handoff and status

- **Purpose/goal:** Continue through the existing Safepay-only initiation
  flow and accurately reflect payment state.
- **Layout/copy:** Booking/amount summary, “Continue to Safepay” only when
  eligible, and clear return to booking detail. Status copy derives from the
  server: “Payment pending”, “Payment received”, “Payment failed”, or
  “Payment status not confirmed” as appropriate. Do not offer JazzCash or
  EasyPaisa; no new payment/cancellation/refund promise.
- **States:** L while initiating/callback reconciliation; E is not
  applicable; X offers a status check and only a server-authorized retry;
  OK shows payment accepted only after confirmation; D for unauthorized
  booking; C when booking/payment eligibility changed; U after callback or
  network uncertainty warns against paying again until status is checked.
  Show only the status and outcome reported by the server. Do not imply that a
  late payment has reinstated a booking or resulted in a refund before the
  server confirms that outcome.
- **Responsive/accessibility:** Amount and booking reference remain visible;
  any external handoff has an announced destination and does not erase the
  booking context.

#### Student profile (`/profile`)

- **Purpose/goal:** Review the student's existing profile summary and reach
  existing account destinations.
- **Layout/copy:** Compact avatar/display name and only fields/counts already
  returned by the profile contract; include available links to bookings,
  wishlists, messages, verification, and “Become a host.” Follow the
  2026-10-28 mobile scope: this initial profile summary is read-only; do not
  invent profile editing or expose email/phone in the compact public-facing
  summary.
- **States:** L; E for optional absent fields omits the field rather than
  fabricating a value; X retry; OK shows server-returned values; D sends a
  signed-out visitor to login and denies other roles according to the existing
  route guard.
- **Responsive/accessibility:** One-column profile summary with clear labeled
  links; do not let avatar become the only identity label.

#### Student verification

- **Purpose/goal:** Submit or inspect the existing student-verification
  request.
- **Layout/copy:** Current verification status, required existing form
  fields, and protected document upload only where supported. Use neutral
  copy: “Verification status” and the server state. Do not promise review
  timing or display an uploaded document outside the authorized flow.
- **States:** L during status/upload; E when no request exists, with the
  existing start action; X retry; V file/type/field validation from current
  constraints; OK confirms upload/request receipt, not approval; D for
  non-student; C when a duplicate or changed request is rejected; U if upload
  completion is uncertain and requires status refresh before resubmission.
- **Responsive/accessibility:** Upload can be operated with keyboard and
  assistive technology; status and upload errors are announced without
  reading private document contents aloud.

#### Reviews

- **Purpose/goal:** Read existing hostel reviews and submit/revise only where
  the backend authorizes it.
- **Layout/copy:** Review summary and chronological review content; form
  appears only when the current API says the student is eligible. Keep rating
  numerically/textually labeled; do not infer verified-stay status from a
  missing field.
- **States:** L; E: “No reviews yet.”; X retry; V field errors; OK shows the
  persisted review; D hides unauthorized mutation while retaining permitted
  public reading; C when eligibility or review state changed; U if submission
  result is uncertain, requiring refresh before duplicate submission.
- **Responsive/accessibility:** Ratings have text alternatives; review body
  remains readable and actions have explicit labels.

#### Roommate finder and report

- **Purpose/goal:** Browse the existing roommate content and report a
  specific post when the current API offers that action.
- **Layout/copy:** Public-safe profile/post information, filters only when
  supported, a clear post detail/link, and a labeled report action. Do not
  expose private user fields or add a direct messaging route not in the
  existing capability.
- **States:** L; E: “No roommate posts to show.”; X retry; V for report
  input; OK confirms the report was received, not that moderation has
  concluded; D for signed-out or unauthorized actions; C when a post becomes
  unavailable; U for uncertain report submission, with status check before
  repeating.
- **Responsive/accessibility:** Post cards use semantic headings and readable
  content; report dialog explains the target post and supports keyboard.

#### Conversations and messages (`/messages`)

- **Purpose/goal:** Find a participant-scoped conversation, read it, and send
  a message.
- **Layout/copy:** Reconcile the 2026-10-26 profile/messaging contract and
  2026-11-01 inbox redesign: desktop uses a conversation list beside the
  selected thread; mobile shows one pane at a time with an explicit
  conversation-list/back action. The inbox header has labeled search and
  settings controls. Search filters by hostel or participant through the
  existing API search parameter. Settings expose the existing unread-only
  filter and inbox refresh. Show listing context only when supplied by the
  conversation. With no conversations, show the exact copy “Nothing to see
  here” and a “Get started” link to hostel search. Preserve the existing
  composer, draft, and send-error behavior; do not promise real-time delivery.
- **States:** L for inbox/thread; E in the empty inbox: “Nothing to see here”
  with “Get started” linking to hostel search; E in a selected thread with no
  messages: “Start the conversation.”; X keeps loading/API/send errors visible
  and recoverable, preserves the draft, and offers the relevant retry; OK
  confirms the sent message and read state only after API response. Preserve
  inbox search and unread-only filtering with pagination, inbox refresh,
  per-thread message refresh, incoming-message read state, and loading older
  messages. D redirects signed-out users and denies nonparticipants; C if the
  conversation is no longer accessible; U if send outcome is unknown, marks
  the message “Not confirmed” and requires refresh before resending.
- **Responsive/accessibility:** Thread messages are not announced repeatedly;
  new messages are announced politely. Search, settings, refresh, unread
  filtering, pagination, and thread navigation are labeled and keyboard
  accessible. Composer is labeled; keyboard send behavior does not make Enter
  the only send path.

### Module 6 — `owner-workspace`

**Purpose:** Operate listings, rooms, bookings, and existing owner tools.
**Primary goal:** Complete an authorized task with a clear server-reported
outcome.

#### Owner dashboard (`/owner`)

- **Layout/copy:** A concise “Host dashboard” with current listing, booking,
  message, and operational summary data only where returned by existing
  endpoints. Primary links go to Listings and Bookings; secondary tools use
  named destinations. Do not invent earnings, response, or performance
  metrics.
- **States:** L; E uses a next step such as “Create your first listing” only
  when the server confirms none exist; X retry; OK shows server values; D
  routes signed-out users to login and denies other roles with the existing
  not-found behavior.
- **Responsive/accessibility:** Summary items become a single-column stack;
  clear headings precede each operational queue.

#### Listing list and review status

- **Purpose/goal:** Find a listing and understand whether it is draft,
  pending, active, or another server-returned status.
- **Layout/copy:** Search/sort only if supported; listing name, location,
  review status as text, monthly price, room count where returned, and
  Edit/View actions. “New listing” uses the existing quota/eligibility
  response.
- **States:** L; E with “Create a listing” only if allowed; X retry; OK lists
  current records/status; D scopes to owner; C when quota/status changes
  prevent an action. Do not promise review timing.
- **Responsive/accessibility:** Mobile uses a labeled list/card, not a dense
  table; status text is always visible.

#### Listing and room editor

- **Purpose/goal:** Create/edit listing and room data; detailed fields/states
  are defined in Module 2.
- **Layout/copy:** Preserve values on edit, show review status separately
  from editable fields, and provide cancel/back without an accidental
  destructive action.
- **States:** Module 2 L/E/X/V/OK/D/C. Listing-level rejection or quota
  conflict uses the server message; never imply room edits updated
  availability until confirmed.
- **Responsive/accessibility:** Module 2 rules; long multi-room form supports
  direct section navigation without changing field order.

#### Booking queue and detail/decision

- **Purpose/goal:** Review bookings for owned listings and make only eligible
  confirm/decline decisions.
- **Layout/copy:** Queue rows show hostel/room, dates, requested guests,
  payment state, booking state, and the server-returned response deadline
  where present. Detail shows only student fields already authorized for
  this owner workflow. Confirm/decline actions appear only for paid pending
  requests allowed by the API; decline confirmation repeats the affected
  request but adds no reason policy.
- **States:** L; E: “No bookings to review.”; X retry; OK reflects the
  server-returned state; D prevents cross-owner access; V for rejected
  action/input; C if a booking/payment/hold changed before the decision and
  refreshes the queue; U after an interrupted decision disables duplicate
  actions until status is refreshed.
- **Responsive/accessibility:** Queue turns into cards with explicit
  Booking status and Payment status labels; decision buttons have clear
  target names.

#### Blocked dates

- **Purpose/goal:** Manage listing date blocks within the exact conflict
  rules in Module 3.
- **Layout/copy:** Reuse the Module 3 calendar and range editor, linked from
  the selected listing.
- **States:** Module 3 L/E/X/V/OK/D/C. Conflict text identifies the affected
  range; no block is shown as saved until the server confirms it.
- **Responsive/accessibility:** Module 3 calendar rules.

#### Conversations

- **Purpose/goal:** Reply to existing participant-scoped conversations.
- **Layout/copy:** Reuse the student/owner inbox and thread from Module 5;
  owner navigation is role-specific, but message semantics and privacy are
  identical.
- **States:** Module 5 L/E/X/OK/D/C/U; only current conversation participants
  can view or send.
- **Responsive/accessibility:** Module 5 inbox rules.

#### Review replies

- **Purpose/goal:** Read reviews for owned listings and submit a reply when
  the current API permits it.
- **Layout/copy:** Review text and rating, hostel context, existing reply,
  and a reply field/action. No added review-editing or moderation policy.
- **States:** L; E: “No reviews to reply to.”; X retry; V field errors; OK
  shows the persisted reply; D prevents cross-owner mutation; C if a reply
  already changed; U requires refresh before retrying an uncertain submit.
- **Responsive/accessibility:** Preserve review/reply association in the
  stacked mobile layout and label the reply field with its review.

#### Analytics and earnings

- **Purpose/goal:** Inspect existing, server-provided owner business data.
- **Layout/copy:** Separate “Analytics” and “Earnings” screens. Show only
  returned values with clear date/period and whole-PKR units. Do not invent
  payout dates, fees, account balances, forecasts, or chart denominators.
- **States:** L; E when the API returns no records, with a truthful
  “No data for this period” message; X retry; OK uses source periods/units;
  D scopes to owner; U for a stale/uncertain financial operation, never as a
  balance.
- **Responsive/accessibility:** Charts have a tabular/text equivalent; mobile
  summaries precede detail. Currency labels are explicit.

#### Subscription

- **Purpose/goal:** View/manage the existing subscription capability.
- **Layout/copy:** Current plan/status and only existing supported actions,
  using server-provided terms and whole-PKR values where available. Do not
  invent pricing, renewal/cancellation terms, or plan benefits.
- **States:** L; E when no subscription exists with only existing eligible
  next step; X retry; OK after server confirmation; D for non-owner; C when
  a plan/quota change invalidates the action; U for uncertain payment/status
  with no duplicate purchase action.
- **Responsive/accessibility:** Plan status and action are visible text;
  financial values include PKR.

### Module 7 — `admin-console`

**Purpose:** Operate existing moderation, verification, payment, and search
workflows. **Primary goal:** inspect a queue item, understand its current
state, and take only an authorized auditable action.

#### Admin overview

- **Layout/copy:** Operational queues with server-returned counts and direct
  links to Listings, Verifications, Roommate reports, Bookings, Refunds,
  Payouts, Payment events, Listing statistics, and Search sync. No user
  management.
- **States:** L; E if all queues have no items: “No items need attention”;
  X retry; OK shows fresh counts; D for non-admin uses the existing safe
  not-found behavior.
- **Responsive/accessibility:** Queue links form a single-column list on
  mobile; counts have accessible text.

#### Listing review and status controls

- **Purpose/goal:** Review a listing and take an existing status action.
- **Layout/copy:** Filterable queue only by supported status/search fields;
  public listing data and moderation-relevant fields, current status, and
  allowed actions. Any status-changing action uses existing reason input
  requirements; do not create a new acceptance policy.
- **States:** L; E: “No listings in this queue.”; X retry; V for required
  action input; OK displays the server-confirmed new status; D blocks
  non-admin; C if the listing changed since load; U after uncertain action,
  disables duplicates pending refresh.
- **Responsive/accessibility:** Queue rows become cards with explicit status
  and labeled actions.

#### Student verification queue, document review, analytics

- **Purpose/goal:** Inspect the existing verification queue, use only
  authorized document retrieval, and read returned analytics.
- **Layout/copy:** Queue shows minimal status and identity fields. Document
  view is a separately protected detail/panel; load only on explicit
  authorized access, do not persist document bytes in UI state/logs, and
  provide a clear close/back. Analytics use returned totals/periods only.
  Verification actions reflect current backend options; no invented review
  criteria or timing.
- **States:** L for queue/document/analytics; E when no pending users or no
  analytics; X retry; OK confirms persisted review decision; D denies
  unauthorized roles; C when the request has already changed; U for an
  interrupted decision, requiring status refresh before retry.
- **Responsive/accessibility:** Document panel can expand on mobile with
  clear return to queue; never expose a document link outside the guarded
  view. Queue actions are keyboard accessible.

#### Roommate-report moderation

- **Purpose/goal:** Review a report and take only existing moderation
  actions.
- **Layout/copy:** Report reason/context, target post, report state, and
  authorized action. Show minimum relevant details; no user-account
  management. Destructive action requires confirmation naming the target.
- **States:** L; E: “No reports to review.”; X retry; OK reflects moderation
  result; D for non-admin; C if the report/post changed; U after uncertain
  moderation requires refresh before action.
- **Responsive/accessibility:** Keep report reason adjacent to target post;
  confirmation explains action in plain English.

#### Admin booking detail

- **Purpose/goal:** Inspect an authorized booking and use only actions
  exposed by current APIs.
- **Layout/copy:** Booking, payment, dates, room, and audit-relevant
  operational status. Sensitive student/provider data is minimized.
- **States:** L; E/not-found; X retry; OK displays server status; D blocks
  unauthorized roles; C on state change; U for unresolved payment/refund
  state and no duplicate mutation.
- **Responsive/accessibility:** Labels remain visible in compact detail;
  payment state is not color-only.

#### Refund operations

- **Purpose/goal:** Inspect refund state and request an authorized existing
  refund action.
- **Layout/copy:** Booking/reference, amount in whole PKR, current
  refund/payment state, and relevant server facts. Confirmation identifies
  the amount and target booking; no new eligibility rule, policy, or promise
  about settlement time.
- **States:** L; E if no actionable refunds; X retry; OK only after
  server-confirmed result; D denies non-admin; C if amount/state changed,
  requiring refreshed confirmation; U leaves action pending/unknown and
  prevents duplicate submission until status is reconciled.
- **Responsive/accessibility:** Confirmation is a keyboard dialog with
  amount and booking stated in text.

#### Payout operations

- **Purpose/goal:** Inspect payout state and invoke only existing authorized
  actions.
- **Layout/copy:** Current batch/status and whole-PKR amount. Display only
  payment/bank details returned by the existing protected endpoint; mask
  sensitive values by default and do not retain them in unrelated UI state.
  Confirm an irreversible action with exact target/amount. Payout policy is
  frozen; do not infer timing, fees, or settlement promises.
- **States:** L; E when no batches; X retry; OK only after confirmed server
  outcome; D non-admin; C on changed batch/amount; U explicitly says
  “Payout status isn’t confirmed yet” and blocks duplicate irreversible
  action until refresh.
- **Responsive/accessibility:** Amount and status remain visible; sensitive
  fields are not truncated into misleading values.

#### Payment-event inspection and retry

- **Purpose/goal:** Inspect an existing payment event and retry only when the
  API says retry is available.
- **Layout/copy:** Event type, time, linked booking, provider state, retry
  eligibility, and audit-safe error summary. Retry confirmation names the
  event; do not expose secrets or full provider payload.
- **States:** L; E: “No payment events to show.”; X retry; OK reflects
  server-confirmed event/retry state; D non-admin; C when event becomes
  ineligible; U after an interrupted retry leaves outcome unknown and
  requires status refresh.
- **Responsive/accessibility:** Event metadata is a labeled definition list;
  errors are readable and do not rely on color.

#### Listing statistics and search-index synchronization

- **Purpose/goal:** Read current listing counts and request the existing
  search synchronization.
- **Layout/copy:** Statistics use server-returned values/period labels.
  Search sync presents a single explicit action, current state, and
  completion time only if returned. Do not invent progress percentages or
  success from a request acceptance.
- **States:** L; E for no data; X retry; OK only when sync completion is
  confirmed; D non-admin; C for state/version changes; U when request was
  accepted but completion is unknown, with refresh rather than duplicate
  start.
- **Responsive/accessibility:** Statistics have text equivalents; sync state
  uses a visible label and polite announcement.

### Module 8 — `availability-alerts`

**Purpose:** Let a student be notified in-app when a selected hostel or
saved search meets date/guest availability criteria. **Primary goal:** create
and manage a date-bound alert without confusing an alert with a booking.

#### Alert list and create/edit form

- **Purpose/goal:** Create/manage either a `HOSTEL` alert or a `SEARCH` alert.
- **Layout/copy:** List shows alert type, hostel or canonical search summary,
  date range, guests, active/paused/expired state, and last-match state.
  “Create alert” opens a clearly typed form. A hostel alert starts from the
  hostel detail; a search alert starts from results and retains only
  supported filters. Form fields: date range and guest count; one of hostel
  or supported search criteria. Primary action: “Create alert” / “Save
  changes”.
- **States:** L; E: “You don’t have any availability alerts.” / “Create an
  alert”; X retry; V for invalid/past/reversed dates, unsupported filters, or
  guest count outside existing booking limits; OK reflects the server state.
  If a newly created alert already matches, show “Availability matches your
  alert. You’ll find a notification in Notifications.” while keeping the
  alert active; never imply a room has been booked. D for signed-out or
  non-student users. C on stale edits; U for an uncertain save, refreshes
  before retry.
- **Responsive/accessibility:** Form stacks on mobile; selected alert type,
  dates, and guests are read back before save. Inputs remain keyboard
  operable.

#### Pause, resume, delete, match, and expiry

- **Purpose/goal:** Control the alert lifecycle and understand notifications.
- **Layout/copy:** Row actions reflect current state: Pause/Resume, Edit,
  Delete. Deletion confirmation names the alert criteria. Show active,
  paused, expired, and last-match states with visible words. Match notices are
  in-app and link to safe public results/detail; alerts remain active after a
  match. Do not display price alerts in the redesigned student experience.
- **States:** L; E uses the list empty state; X retry; OK follows server
  confirmation; D enforces student ownership; C after alert state/date
  changes requires refresh; U prevents duplicate pause/resume/delete when the
  server outcome is unknown. A date-bound alert becomes expired when its
  check-in date begins; explain “This alert has expired” and offer only the
  existing create-new path.
- **Responsive/accessibility:** Every action remains a 44px target. Status
  and last-match information are announced and do not rely on color. Delete
  confirmation returns focus to the alert row after cancel/close.

#### Search/detail alert entry points

- **Purpose/goal:** Start a supported alert from the selected hostel or
  current search without interrupting discovery.
- **Layout/copy:** Secondary “Create availability alert” action near the
  date/guest controls on hostel detail and beside the search summary on
  results. Prefill only the current hostel or canonical supported query
  filters plus dates/guests. Require explicit sign-in for alert management.
- **States:** L while prefill is resolved; X if current criteria cannot be
  safely read; OK opens the matching alert form; D signs in with the intended
  destination preserved; C refreshes if the underlying search criteria
  changed.
- **Responsive/accessibility:** Keep the action below primary date/room
  booking controls; on mobile it must not cover the availability result or
  fixed tabs.

## 4. Decisions, dependencies, and review checklist

### Founder/human-owner decisions required

These items remain **open** and must not be silently decided during UI work:

1. **Visual direction:** approve the proposed restrained green palette or
   retain the current blue source tokens. `SPEC-web-foundation.md` describes
   green; `src/app/globals.css` currently sets blue.
2. **Email-code sign-in:** confirm whether the already configured
   `email-otp` provider and `LoginDialog` flow should be presented as a
   supported sign-in method. `PRODUCT.md` lists email/password and optional
   Google, but does not list email code. Phone OTP remains verification, not
   sign-in.
3. **Nearby wording:** confirm that the role brief’s “near my campus” request
   means the existing coordinate-based “Nearby” search. Current source has
   nearby coordinates and an API, but no campus selection/directory. This
   design uses “Nearby” and does not imply a campus-aware search.
4. **Legal agreement content:** Terms and Privacy remain unfinished until
   the owner supplies approved legal text; this design adds none.

### Implementation dependencies and known source gaps

These are implementation prerequisites, not new product decisions:

- The current availability route is a monthly occupancy summary and booking
  code still uses global `Room.available`; it is not the exact date-range,
  room-seat contract required by `SPEC-room-availability.md`. Student date
  selection, room booking, owner blocks, and availability alerts depend on
  the planned authoritative date-aware backend work. Never disguise the
  monthly response as exact availability.
- The human owner approved the late-payment backend rule before approving
  the plan: reinstate only when the requested seats are available for the full
  date range; otherwise refund the full successful payment. This is a backend
  implementation dependency, not a UI assumption. The UI shows only
  server-reported status/outcome. Task 6 must reconcile the older
  pending-policy text in `SPEC-late-payment.md` before implementation.
- The current admin-only hostel detail route cannot supply a public student
  detail page. The planned public-safe projection in
  `SPEC-student-marketplace.md` is required before public detail is wired.
- The alert screens depend on the planned HOSTEL/SEARCH alert contract. The
  existing price-alert API is not an availability-alert substitute.
- Owner listing create/edit components currently have a documented form
  export/casing issue in the 2026-11-04 gap report. The planned form baseline
  fix is a prerequisite to owner UI work; this design does not edit or
  redefine that component.
- Existing source already contains substantial UI despite stale API-only
  descriptions in `README.md`. New work must audit actual routes/components
  before deciding to add, replace, or consolidate a screen.

### Design-to-implementation checks

- [ ] Founder/human owner explicitly approves the visual direction and this
  consolidated screen/state design.
- [ ] All eight modules' screens above map to the approved capability map and
  no new action is added to bridge a missing API.
- [ ] At 360px, no page-level horizontal overflow; where existing mobile
  tests cover 320px, retain that coverage.
- [ ] Re-test WCAG AA text contrast and 3:1 non-text/focus contrast in the
  rendered theme, including disabled, hover, and status combinations.
- [ ] Keyboard-only path reaches every action; visible focus, semantic labels,
  state announcements, 44px targets, dialog focus management, and reduced
  motion are verified.
- [ ] Public, student, owner, and admin data remain separated by server-side
  authorization; sensitive documents and payment details follow existing
  protected routes only.
- [ ] Auth UI lists only methods explicitly resolved by the owner and
  supported by configuration. Phone OTP is not presented as sign-in.
- [ ] No legal/payment/payout/cancellation rule is introduced by visual copy.

**Handoff gate:** This is the complete design proposal for review, not the
Founder’s sign-off. No UI implementation is authorized by this document.
