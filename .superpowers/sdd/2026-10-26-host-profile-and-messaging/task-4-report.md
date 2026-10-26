# Task 4 Report: Authenticated Messages Inbox

## Status

Implemented and committed as `feat: add authenticated messages inbox`.

## Delivered

- Added a server-side `/messages` guard for authenticated students and owners. Signed-out visitors are redirected through the safe login callback, preserving only supported inbox control parameters; other roles receive a not-found response.
- Added a responsive inbox with paginated conversation and message loading, unread counts, chronological threads, explicit refresh, message sending, and visible retry states.
- Delivered a validated session-storage inquiry before opening its returned thread. Delivery errors preserve the draft; users can retry or explicitly discard it.
- Added focused Vitest coverage and Playwright scenarios for the requested student, owner, admin, handoff, thread-access, and viewport flows.
- Reused the existing conversations APIs; no API endpoints or dependencies were added.

## Verification

- `npx vitest run src/components/messages/MessagesInbox.test.tsx` — passed, 9 tests.
- `npm run e2e -- --project=chromium e2e/messages.spec.ts` — passed, 1 test; 6 authenticated scenarios were skipped because seeded student, owner, and admin credentials are not configured in this environment.
- `npm run typecheck` — passed.
- Targeted ESLint for the changed TypeScript files — passed.
- `git diff --check` — passed.

## Concern

Run the skipped authenticated Playwright scenarios in an environment with seeded student, owner, and admin credentials to verify the real login, participant-only API access, inquiry handoff, and responsive breakpoints end to end.

## Final-review fix: stale conversation requests

### Change

- Guarded thread refresh, older-message, initial-load, and send responses with both the selected conversation ID and the current selection request token. Stale responses no longer replace thread pages, errors, or loading state.
- Only expose page 1 when its conversation ID matches the URL selection; the composer stays unavailable during a selection mismatch.
- Reset the unsent composer text when selecting another conversation, and ignore completion side effects from a send started in a prior selection.
- Kept conversation APIs, auth, unread handling, pagination, and saved pending-inquiry delivery unchanged.

### TDD and verification

RED — `npx vitest run src/components/messages/MessagesInbox.test.tsx` before implementation:

```text
(!) Your Vite config uses features that are unsupported by `configLoader: 'native'`, which is planned to become the default in a future major version of Vite:
  - `__dirname` (vitest.config.ts:4:34). Use `import.meta.dirname` instead
Set `VITE_CONFIG_NATIVE_IGNORE_WARNING=true` to suppress this warning.

 RUN  v4.1.12 C:/Projects/Personal/hostello

 ❯ src/components/messages/MessagesInbox.test.tsx (0 test)

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/components/messages/MessagesInbox.test.tsx [ src/components/messages/MessagesInbox.test.tsx ]
Error: Cannot find module '/src/components/messages/thread-state' imported from C:/Projects/Personal/hostello/src/components/messages/MessagesInbox.test.tsx
 ❯ src/components/messages/MessagesInbox.test.tsx:6:1
      4| import { ConversationThread } from "./ConversationThread";
      5| import { MessagesInbox } from "./MessagesInbox";
      6| import {
       | ^
      7|   applyThreadPageResponse,
      8|   getSelectedThread,

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯

 Test Files  1 failed (1)
      Tests  no tests
   Start at  00:34:53
   Duration  566ms (transform 136ms, setup 0ms, import 0ms, tests 0ms, environment 0ms)
```

GREEN — final `npx vitest run src/components/messages/MessagesInbox.test.tsx`:

```text
(!) Your Vite config uses features that are unsupported by `configLoader: 'native'`, which is planned to become the default in a future major version of Vite:
  - `__dirname` (vitest.config.ts:4:34). Use `import.meta.dirname` instead
Set `VITE_CONFIG_NATIVE_IGNORE_WARNING=true` to suppress this warning.

 RUN  v4.1.12 C:/Projects/Personal/hostello

 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  00:38:27
   Duration  783ms (transform 169ms, setup 0ms, import 341ms, tests 96ms, environment 0ms)
```

`npm run typecheck`:

```text
> hostello@0.1.0 typecheck
> tsc --noEmit
```

`npx eslint src/components/messages/useMessagesInbox.ts src/components/messages/thread-state.ts src/components/messages/MessagesInbox.test.tsx` exited 0 with no output.

`npm run e2e -- --project=chromium e2e/messages.spec.ts`:

```text
> hostello@0.1.0 e2e
> playwright test --project=chromium e2e/messages.spec.ts

[WebServer]
[WebServer] > hostello@0.1.0 dev
[WebServer] > next dev --turbopack --hostname 127.0.0.1 --port 3100
[WebServer]
[WebServer] ▲ Next.js 16.4.2 (Turbopack)
[WebServer] - Local:         http://127.0.0.1:3100
[WebServer] - Network:       http://127.0.0.1:3100
[WebServer] - Environments: .env.local, .env
[WebServer] ✓ Ready in 1328ms

Running 7 tests using 1 worker

[WebServer] ✓ Running next.config.ts took 3.0s
[WebServer] - Experiments (use with caution):
[WebServer]   · clientTraceMetadata
[WebServer]
[WebServer] ⚠️  WARNING: Environment variables are missing for this deployment:
[WebServer]   - JAZZCASH_MERCHANT_ID: JazzCash merchant ID (required only when jazzcash payment method is enabled)
[WebServer]   - JAZZCASH_PASSWORD: JazzCash merchant password (required only when jazzcash payment method is enabled)
[WebServer]   - JAZZCASH_INTEGRITY_SALT: JazzCash HMAC integrity salt (required only when jazzcash payment method is enabled)
[WebServer]   - EASYPAISA_STORE_ID: EasyPaisa store ID (required only when easypaisa payment method is enabled)
[WebServer]   - EASYPAISA_HASH_KEY: EasyPaisa AES-128 hash key (required only when easypaisa payment method is enabled)
[WebServer]  GET /messages?pendingInquiry=1 307 in 2.9s (next.js: 1643ms, proxy.ts: 349ms, application-code: 957ms)
[WebServer]  GET /login?callbackUrl=%2Fmessages%3FpendingInquiry%3D1 200 in 577ms (next.js: 227ms, proxy.ts: 27ms, application-code: 324ms)
  ok 1 [chromium] › e2e\messages.spec.ts:170:1 › signed_out_visitors_are_redirected_to_login_with_a_safe_inbox_callback (10.7s)
  -  2 [chromium] › e2e\messages.spec.ts:182:1 › students_can_open_threads_and_send_messages
  -  3 [chromium] › e2e\messages.spec.ts:202:1 › owners_can_open_threads_and_mark_incoming_messages_read
  -  4 [chromium] › e2e\messages.spec.ts:221:1 › administrators_are_denied_access_to_the_messages_inbox
  -  5 [chromium] › e2e\messages.spec.ts:237:1 › signed_out_inquiries_are_delivered_after_login_and_open_the_thread
  -  6 [chromium] › e2e\messages.spec.ts:278:1 › messages_inbox_has_no_horizontal_overflow_at_required_viewports
  -  7 [chromium] › e2e\messages.spec.ts:301:1 › a nonparticipant_cannot_load_an_existing_private_conversation

  6 skipped
  1 passed (17.9s)
```

The six authenticated Playwright cases were skipped because seeded credentials are unavailable. Vite's existing native config-loader warning and optional payment-provider environment warnings were emitted.
