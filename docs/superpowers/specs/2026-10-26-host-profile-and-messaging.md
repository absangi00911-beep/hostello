# Host Profile, Response Insights, and Messaging

**Status:** Partially verified; implementation is present, but final
verification remains incomplete because no eligible history was available for
a populated backfill check and one Chromium end-to-end test fails.

Task 5 confirmed the migration is applied to the local development database and
the backfill ran twice against the current empty summary set. The
database contains no host summaries for owners with message history, so
populated summary accuracy and idempotency remain unverified. The full
Chromium suite also has one failing private-conversation authorization test
and one skipped Google sign-in test because OAuth credentials are unavailable.
See `.superpowers/sdd/2026-10-26-host-profile-and-messaging/task-5-report.md`
for the detailed verification results.

## Objective

Continue the hostel-detail page in the supplied reference with a “Meet your
host” section, and let students and owners continue their conversations in an
authenticated inbox.

## Scope

- Add a responsive host profile section after “Where you’ll be” on the hostel
  detail page.
- Show only public host information: name, avatar, bio, city, and membership
  date when available. Include an action to message the host.
- Persist host response summaries derived from all available conversation
  history, backfill existing messages, and refresh summaries as messages are
  sent.
- Add an authenticated `/messages` inbox for students and owners. It includes
  a conversation list and selected conversation thread, supports sending and
  reading messages, and shows loading, empty, and recoverable error states.
- Allow a signed-in student to start a conversation from a hostel page. A
  signed-out visitor can compose an inquiry, sign in, and have the preserved
  draft sent afterward before returning to the selected thread.

## Response-summary contract

- A guest-started thread is a conversation whose first message is from the
  student participant.
- Aggregate host response summaries across all conversations about all active
  or inactive listings owned by that host; display the host-level summary on
  each of their hostel pages.
- Response rate is the percentage of guest-started threads with at least one
  subsequent message from the host who owns the hostel. Include unanswered
  threads in the denominator.
- Typical response time is the median elapsed time from the first student
  message to the first subsequent message from that host, calculated across
  replied guest-started threads.
- Use message timestamps as the source of truth. Do not infer or fabricate
  metrics from profile or listing data.
- Do not show response metrics when there is no usable guest-started history.
  If there are guest-started threads but none has a host reply, show a 0%
  response rate and omit response time.
- Keep a persisted, refreshable summary; the implementation plan must specify
  how initial backfill and ongoing updates remain accurate if a message write
  succeeds but summary refresh fails.

## Messaging and privacy boundaries

- Reuse the existing conversation collection and participant-scoped thread
  APIs. Do not weaken authentication, participant authorization, validation,
  or rate limits.
- Ensure a hostel-page inquiry reaches the selected conversation even when a
  conversation already exists; do not silently discard the submitted message.
- Inbox access is for authenticated students and owners. Each user sees only
  conversations in which they participate. The existing API remains the
  authority for authorization and unread state.
- Never expose a host’s email, phone, street address, payment details, or
  internal account fields in the public host section.
- Do not add email, SMS, push notifications, or a new real-time service.

## Success criteria

- The new section follows the reference and appears after the location section
  without changing the existing detail-page section order.
- Public host fields and response metrics are absent when unavailable and do
  not expose private account data.
- A student can message the host from the detail page, sign in when required,
  and arrive in the correct thread with the submitted message present. The
  signed-out inquiry draft survives sign-in and is not lost or sent to a
  different listing.
- Students and owners can open `/messages`, select a conversation, read
  messages, send a reply, and see unread state update.
- Conversation reads and writes remain participant-scoped, validated, and
  rate-limited; errors are visible and recoverable.
- Response summaries match the stated all-history definitions after backfill
  and after new messages.

## Non-goals

- The reference’s following “Things to know” section.
- Editing public host-profile information or adding host-account settings.
- Replacing the existing conversation APIs or changing notification delivery.
- Real-time sockets, email, SMS, push, or adding conversation deletion.
- Changing booking, payment, or listing-review behavior.

## Testing

- Unit and service tests for response-rate and median-response calculations,
  including unanswered threads, no usable history, and timestamp ordering.
- Migration/backfill and ongoing-refresh tests, including summary-refresh
  failure behavior.
- Component tests for the host section and inbox loading, empty, error,
  unread, and send states.
- API tests for authentication, role boundaries, participant authorization,
  validation, existing-conversation inquiry delivery, and rate limits.
- Browser tests for signed-in and signed-out inquiry flows, navigating to the
  selected inbox thread, and responsive layouts.
