# Host Profile and Messaging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public host profile with persisted response insights, a reliable hostel inquiry flow, and an authenticated inbox for students and owners.

**Architecture:** Add a per-host response-summary table and a parameterized PostgreSQL aggregation over message timestamps, with an idempotent backfill command. Update summary data in the same transaction as metric-affecting message writes, then expose only the approved public profile and summary fields on hostel detail. Reuse the existing participant-scoped conversation APIs for inquiries and a new `/messages` client UI; preserve signed-out inquiry drafts in tab-scoped session storage through sign-in.

**Tech Stack:** Next.js 16.4 App Router, React 19, TypeScript 6, Prisma 7, PostgreSQL, Auth.js v5, Vitest 4, Playwright.

**Spec:** [Host Profile, Response Insights, and Messaging](../specs/2026-10-26-host-profile-and-messaging.md)

## Global Constraints

- A guest-started thread is a conversation whose first message is from the student participant.
- Aggregate host response summaries across all conversations about all active or inactive listings owned by that host; display the host-level summary on each of their hostel pages.
- Response rate is the percentage of guest-started threads with at least one subsequent message from the host who owns the hostel. Include unanswered threads in the denominator.
- Typical response time is the median elapsed time from the first student message to the first subsequent message from that host, calculated across replied guest-started threads.
- Use message timestamps as the source of truth. Do not infer or fabricate metrics from profile or listing data.
- Do not show response metrics when there is no usable guest-started history. If there are guest-started threads but none has a host reply, show a 0% response rate and omit response time.
- Ensure a hostel-page inquiry reaches the selected conversation even when a conversation already exists; do not silently discard the submitted message.
- Inbox access is for authenticated students and owners. Each user sees only conversations in which they participate. The existing API remains the authority for authorization and unread state.
- Never expose a host’s email, phone, street address, payment details, or internal account fields in the public host section.
- Do not add email, SMS, push notifications, or a new real-time service.
- A signed-out visitor can compose an inquiry, sign in, and have the preserved draft sent afterward before returning to the selected thread.
- When a message write changes host metrics, persist the message and refreshed summary atomically; if summary refresh fails, fail the transaction so a successful response cannot leave stale metrics.
- Preserve the existing conversation API authentication, participant authorization, validation, rate limits, pagination, and notification behavior.
- Read the relevant Next.js 16.4 guides under `node_modules/next/dist/docs/` before writing Next.js code.
- Add no dependencies or behavior outside the approved scope.
- Commit each independently passing task separately after its verification step.

## Review Focus

1. **Message ordering and ties:** classify a thread by its first message ordered by `createdAt`, then `id`, and count only a later host reply. Pin equal-timestamp ordering and host-started threads in the PostgreSQL aggregation test.
2. **Metric write failures and concurrent replies:** a committed message must not leave a stale response summary. Pin rollback on aggregation failure and retry serialization conflicts in the message-route tests.
3. **Existing-conversation inquiries:** the initial message must be delivered whether the API creates or finds the thread. Pin both paths in `src/app/api/conversations/route.test.ts`.
4. **Draft privacy and wrong-thread prevention:** signed-out inquiry text must not enter a URL, survive only in the current tab, and be cleared only after delivery or explicit cancellation. Pin callback, storage failure, and hostel-ID matching in inquiry-flow tests.
5. **Participant privacy and unread state:** nonparticipants must not read or send messages, and opening a selected thread must use existing read-marking behavior. Pin these in inbox/API tests.

---

## File Structure

- `prisma/schema.prisma` and `prisma/migrations/20261026000000_add_host_response_summaries/migration.sql` — persisted summary table.
- `src/lib/host-response-summary.ts` and `src/lib/host-response-summary.test.ts` — PostgreSQL summary calculation, transaction refresh, and persistence.
- `scripts/backfill-host-response-summaries.ts` — idempotent backfill for existing owner message history.
- `src/app/api/conversations/route.ts` and its test — create-or-find inquiry behavior and initial-message delivery.
- `src/app/api/conversations/[id]/route.ts` and its test — atomic message/summary refresh for host replies.
- `src/lib/hostel-detail.ts` and its test — public-safe host projection and persisted summary selection.
- `src/components/hostel-detail/HostelHostSection.tsx` and its test — host profile, response details, and message entry point.
- `src/components/hostel-detail/HostelInquiryForm.tsx` and its test — inquiry composition, delivery, sign-in handoff, and draft lifecycle.
- `src/app/hostels/[param]/page.tsx`, `src/app/globals.css`, and the hostel-detail browser spec — place and style the host section after location.
- `src/app/login/page.tsx` and `src/components/auth/LoginDialog.tsx` — safely honor a validated internal post-login destination.
- `src/app/messages/page.tsx` and `src/components/messages/MessagesInbox.tsx` — authenticated inbox route and client experience.
- `src/components/messages/MessagesInbox.test.tsx` and `e2e/messages.spec.ts` — inbox state and end-to-end coverage.

## Tasks

### Task 1: Persist and backfill host response summaries

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20261026000000_add_host_response_summaries/migration.sql`
- Create: `src/lib/host-response-summary.ts`
- Create: `src/lib/host-response-summary.test.ts`
- Create: `scripts/backfill-host-response-summaries.ts`

**Interfaces:**
- `HostResponseSummary` is a one-to-one user relation keyed by `hostId`, with `guestStartedThreadCount: Int`, `repliedThreadCount: Int`, `medianResponseSeconds: Float?`, and `calculatedAt: DateTime`.
- `refreshHostResponseSummary(hostId: string, tx: Prisma.TransactionClient): Promise<void>` runs a parameterized PostgreSQL aggregation across every conversation on all of the host’s listings, then upserts one summary row. When there are no guest-started threads, delete any summary row so the public projection has no metrics.
- The aggregation orders messages by `createdAt` and then `id`; it counts guest-started conversations, finds the first later owner message per thread, and calculates the median of those elapsed seconds. It reads no message bodies.
- `scripts/backfill-host-response-summaries.ts` iterates owners with conversation history, invokes the refresh helper per host, reports counts only, and exits nonzero on failure. Rerunning it is safe.

- [ ] **Step 1: Write failing tests** `calculates_response_rate_counts_and_median`, `uses_created_at_then_id_for_first_message_and_reply`, `omits_summary_without_guest_started_threads`, `keeps_zero_rate_and_null_median_for_unanswered_threads`, `refreshes_all_listing_history_without_selecting_message_content`, and `backfill_is_idempotent_and_fails_explicitly`.
- [ ] **Step 2: Run `npx vitest run src/lib/host-response-summary.test.ts`**; expected: FAIL because the model and helper are not implemented.
- [ ] **Step 3: Add `HostResponseSummary` and its `User` relation**, then create the additive migration for `host_response_summaries` with a cascading foreign key to `users`.
- [ ] **Step 4: Implement the parameterized PostgreSQL aggregation and `refreshHostResponseSummary`**; persist counts and median in seconds without reading message bodies.
- [ ] **Step 5: Implement the idempotent backfill command**, ensure database disconnect in `finally`, and surface failure with a nonzero exit code.
- [ ] **Step 6: Run `npx vitest run src/lib/host-response-summary.test.ts` and `npm run typecheck`**; expected: PASS. Verify the generated Prisma client is up to date.
- [ ] **Step 7: Commit** `feat: persist host response summaries`.

### Task 2: Keep summaries atomic with conversation messages

**Files:**
- Modify: `src/app/api/conversations/route.ts`
- Modify: `src/app/api/conversations/route.test.ts`
- Modify: `src/app/api/conversations/[id]/route.ts`
- Modify: `src/app/api/conversations/[id]/route.test.ts`
- Consume: `src/lib/host-response-summary.ts`

**Interfaces:**
- Collection `POST` continues to return the conversation ID. If the conversation already exists, it appends the submitted `initialMessage` instead of discarding it; if it is new, it atomically creates the thread, participants, and first message.
- Every collection inquiry and owner reply refreshes the owner summary in the same transaction as its message write. Refreshing collection inquiries also covers legacy threads that exist without an initial message.
- Use a bounded retry for Prisma `P2034` serialization conflicts, following `src/app/api/hostels/route.ts`; return the existing generic error response if retries fail. Deliver notifications only after the transaction commits.

- [ ] **Step 1: Add failing route tests** `appends_initial_message_to_existing_conversation`, `creates_first_message_and_summary_atomically`, `refreshes_summary_on_owner_reply`, `rolls_back_message_when_summary_refresh_fails`, and `retries_serializable_conflicts_without_duplicate_notifications`.
- [ ] **Step 2: Run `npx vitest run src/app/api/conversations/route.test.ts src/app/api/conversations/[id]/route.test.ts`**; expected: FAIL for inquiry delivery and summary refresh cases.
- [ ] **Step 3: Change collection `POST` to create-or-find and append the inquiry message for an existing conversation**, preserving active-hostel, student-only, validation, and rate-limit checks.
- [ ] **Step 4: Wrap metric-affecting message writes and summary refresh in a bounded serializable transaction**, and keep notification delivery after a successful commit.
- [ ] **Step 5: Run the two conversation route test files and `npm run typecheck`**; expected: PASS with existing auth, participant, validation, rate-limit, and notification tests unchanged.
- [ ] **Step 6: Commit** `fix: keep host response summaries in sync with messages`.

### Task 3: Add the public host section and inquiry flow

**Files:**
- Modify: `src/lib/hostel-detail.ts`
- Modify: `src/lib/hostel-detail.test.ts`
- Create: `src/components/hostel-detail/HostelHostSection.tsx`
- Create: `src/components/hostel-detail/HostelHostSection.test.tsx`
- Create: `src/components/hostel-detail/HostelInquiryForm.tsx`
- Create: `src/components/hostel-detail/HostelInquiryForm.test.tsx`
- Modify: `src/app/hostels/[param]/page.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/login/page.tsx`
- Modify: `src/components/auth/LoginDialog.tsx`
- Modify: `e2e/hostel-detail-entry.spec.ts`

**Interfaces:**
- `getPublicHostelDetail` selects host `name`, `avatar`, `bio`, `city`, and `createdAt`, and only the response summary’s `guestStartedThreadCount`, `repliedThreadCount`, and `medianResponseSeconds`. Do not select or pass email, phone, address, password, verification, or payment fields.
- `HostelHostSection` renders public profile fields and metrics after the location section. Hide the message action for the listing’s owner and for non-student signed-in roles.
- `HostelInquiryForm` accepts `hostelId`, `hostelName`, and a signed-in student flag; it posts to `/api/conversations` and navigates to `/messages?conversationId=<id>` after successful delivery.
- For signed-out inquiries, store `{ hostelId, hostelName, message }` in `sessionStorage` under `hostello:pending-inquiry:v1`, then route to login with the internal callback `/messages?pendingInquiry=1`. The inbox consumes only a draft whose hostel ID is present and clears it only after API success or explicit cancellation. Never put message text in a URL. A storage failure is shown to the user and prevents leaving the page.
- Login callback destinations are allowlisted internal paths; the credentials and OAuth flows both honor the destination instead of always redirecting to `/`.

- [ ] **Step 1: Write failing tests** for the public-field allowlist, absent and zero-rate metrics, no message action for owners/non-students, signed-in inquiry delivery, signed-out draft persistence with `hostello:pending-inquiry:v1`, no message text in URLs, storage failure, callback validation, and draft cleanup only after delivery.
- [ ] **Step 2: Run `npx vitest run src/lib/hostel-detail.test.ts src/components/hostel-detail/HostelHostSection.test.tsx src/components/hostel-detail/HostelInquiryForm.test.tsx`**; expected: FAIL for the missing host section and inquiry behavior.
- [ ] **Step 3: Extend the server-side public detail query with the approved host fields and persisted summary**, using explicit selects and extending the public-data redaction assertions.
- [ ] **Step 4: Implement `HostelHostSection` and `HostelInquiryForm`**, including accessible labels, visible request errors, signed-in delivery, and tab-scoped signed-out draft storage.
- [ ] **Step 5: Update login callback handling** so only safe same-origin paths are honored and both configured sign-in methods return to the requested destination.
- [ ] **Step 6: Compose the host section after `HostelLocationSection` and add responsive styling** without changing earlier section order.
- [ ] **Step 7: Add browser assertions** that “Meet your host” follows “Where you’ll be,” has no horizontal overflow at 320, 768, 1024, and 1440px, and the signed-in inquiry navigates to its conversation.
- [ ] **Step 8: Run the focused Vitest files, `npm run e2e -- --project=chromium e2e/hostel-detail-entry.spec.ts`, and `npm run typecheck`**; expected: PASS.
- [ ] **Step 9: Commit** `feat: add host profile and inquiry flow`.

### Task 4: Build the authenticated messages inbox

**Files:**
- Create: `src/app/messages/page.tsx`
- Create: `src/components/messages/MessagesInbox.tsx`
- Create: `src/components/messages/MessagesInbox.test.tsx`
- Create: `e2e/messages.spec.ts`
- Modify: `src/app/globals.css`
- Consume: `GET /api/conversations`, `POST /api/conversations`, `GET /api/conversations/[id]`, and `POST /api/conversations/[id]`

**Interfaces:**
- `/messages` requires an Auth.js session with role `STUDENT` or `OWNER`; anonymous users are redirected to login with a safe callback, and other roles are denied.
- `MessagesInbox` reads the selected `conversationId` from the URL. It uses the existing APIs as the authorization authority, retains collection and message pagination, and uses an explicit refresh action rather than introducing real-time transport.
- Opening a thread fetches it through the existing participant-scoped GET endpoint, which marks incoming messages read. Sending uses the existing POST endpoint; errors remain visible and allow retry.
- On `pendingInquiry=1`, deliver the matching session-storage inquiry before selecting the resulting thread; keep the draft and show a recoverable error if delivery fails.

- [ ] **Step 1: Write failing component tests** `renders_paginated_conversations_and_unread_counts`, `loads_selected_thread_and_marks_incoming_messages_read`, `sends_message_and_refreshes_thread`, `shows_retryable_load_and_send_errors`, `loads_older_messages_in_order`, and `delivers_matching_pending_inquiry_before_selecting_thread`.
- [ ] **Step 2: Run `npx vitest run src/components/messages/MessagesInbox.test.tsx`**; expected: FAIL because the inbox route and component do not exist.
- [ ] **Step 3: Implement the server route guard** for signed-in students and owners and redirect signed-out visitors back through login.
- [ ] **Step 4: Implement the inbox list and thread UI** against the existing paginated APIs; retain unread state, chronological messages, explicit refresh, older-message loading, and visible error/retry states.
- [ ] **Step 5: Implement pending-inquiry delivery** before selected-thread loading; verify the hostel ID, preserve the draft after failure, and clear it after successful delivery or user cancellation.
- [ ] **Step 6: Add Playwright tests** for student and owner access, participant-only thread visibility, sending/reading, signed-out inquiry handoff, and desktop/mobile overflow at 320, 768, 1024, and 1440px.
- [ ] **Step 7: Run `npx vitest run src/components/messages/MessagesInbox.test.tsx`, `npm run e2e -- --project=chromium e2e/messages.spec.ts`, and `npm run typecheck`**; expected: PASS.
- [ ] **Step 8: Commit** `feat: add authenticated messages inbox`.

### Task 5: Backfill and final verification

**Files:**
- Modify: `docs/superpowers/specs/2026-10-26-host-profile-and-messaging.md`
- Consume: `scripts/backfill-host-response-summaries.ts`

- [ ] **Step 1: Apply the new Prisma migration** using the project migration workflow against the configured PostgreSQL database.
- [ ] **Step 2: Run `npx tsx scripts/backfill-host-response-summaries.ts`**; expected: all owners with history receive accurate summaries, no-history owners have no summary row, and no message content is logged.
- [ ] **Step 3: Run the backfill command a second time**; expected: summary values remain identical, proving idempotency.
- [ ] **Step 4: Run the full `npx vitest run`, `npm run typecheck`, `npm run lint`, and `npm run e2e -- --project=chromium`**; expected: all pass.
- [ ] **Step 5: Update the spec status to implemented** and record the backfill command and verified summary behavior.
- [ ] **Step 6: Commit** `test: verify host messaging and response summaries`.
