# Airbnb-Inspired Messages Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Hostello's messages page to match the supplied Airbnb-inspired desktop and mobile references while preserving existing conversation and inquiry behavior.

**Architecture:** Keep the existing authenticated App Router page and client inbox. Extend the conversation-list fetch helper to accept search and unread filters already supported by the API, then connect those filters to the inbox UI. Restyle the existing components into a responsive split inbox, with a mobile list/thread switch and a Hostello-branded empty state.

**Tech Stack:** Next.js 16.4, React 19, TypeScript 6, Tailwind CSS 4, existing Lucide React dependency, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-01-messages-page-airbnb-redesign.md`

## Global Constraints

- Preserve authentication, role checks, participant-scoped API access, pending-inquiry delivery, unread/read state, pagination, and recoverable errors.
- Keep search and unread filters backed by the existing API parameters; do not silently substitute a partial client-only filter.
- Do not add archive/past-conversation support, change database or API contracts, add dependencies, or change route structure without approval.
- Never weaken message authorization, discard an inquiry or message, remove existing error handling, or expose private account information.

## Review Focus

- Search terms containing spaces, ampersands, or non-ASCII characters must be URL encoded and still match hostel or participant names. Test filtered query construction in Task 1.
- Empty search and disabled unread-only filtering must request the ordinary conversation list without accidental filters. Test default and cleared filters in Task 1.
- When both filters are enabled, searching must not clear unread-only mode, or vice versa. Test combined query parameters in Task 1.
- A late response from an earlier search must not replace results for the current search. Test out-of-order responses in Task 2.
- Pagination and refresh after filtering must keep the same filters, and returning from a thread on mobile must retain the current list state. Test filtered pagination and mobile return behavior in Task 2.

---

### Task 1: Add filter-aware conversation fetching

**Files:**
- Modify: `src/lib/messages-inbox.ts`
- Test: `src/components/messages/MessagesInbox.test.tsx`

**Interfaces:**
- Produces `ConversationListFilters`, with optional `search?: string` and
  `unreadOnly?: boolean`.
- Extends `fetchConversationList` to
  `fetchConversationList(page: number, request?: Request, filters?: ConversationListFilters): Promise<ConversationListPage>`.
  Keeping `request` as the second argument preserves existing test callers.
- `search` is trimmed and sent only when non-empty. `unreadOnly` is sent as
  `unread=true` only when true. The helper continues to use `limit=20`.

- [ ] **Step 1: Add failing query-construction tests**

Add tests in `MessagesInbox.test.tsx` that call
`fetchConversationList(2, request, { search: "Canal View & Suites", unreadOnly: true })`
and assert the request URL contains `page=2`, `limit=20`, an encoded search
value, and `unread=true`. Add a second test asserting a blank search and
`unreadOnly: false` omit both optional query parameters.

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `npm test -- --run src/components/messages/MessagesInbox.test.tsx`

Expected: the new tests fail because `fetchConversationList` currently accepts
no filters and always requests the unfiltered list.

- [ ] **Step 3: Implement typed optional filters**

Add `ConversationListFilters` and build the query with `URLSearchParams`.
Preserve the injectable `Request` argument and existing error handling.

- [ ] **Step 4: Run the focused test and confirm it passes**

Run: `npm test -- --run src/components/messages/MessagesInbox.test.tsx`

Expected: all tests in the file pass, including the existing pagination and
error cases.

- [ ] **Step 5: Commit the filter-aware helper**

```bash
git add src/lib/messages-inbox.ts src/components/messages/MessagesInbox.test.tsx
git commit -m "feat: support message inbox filters" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

### Task 2: Redesign and wire the responsive inbox

**Files:**
- Modify: `src/components/messages/useMessagesInbox.ts`
- Modify: `src/components/messages/MessagesInbox.tsx`
- Modify: `src/components/messages/ConversationList.tsx`
- Test: `src/components/messages/MessagesInbox.test.tsx`
- Test: `e2e/messages.spec.ts`

**Interfaces:**
- Consumes `ConversationListFilters` and the filtered
  `fetchConversationList` from Task 1.
- The inbox hook exposes `searchQuery`, `setSearchQuery`, `unreadOnly`,
  and `setUnreadOnly`, alongside its existing values and actions.
- `MessagesInbox` owns the mobile list/thread presentation state. Its back
  action hides the thread without clearing the selected conversation or its
  unsent message draft.
- `loadConversationList(page, append)` and `loadMoreConversations()` use the
  current search and unread filters. Non-append requests use a request
  sequence guard so an outdated response cannot overwrite newer results.

- [ ] **Step 1: Add failing UI and browser tests**

In `MessagesInbox.test.tsx`, assert that the empty inbox renders the
“Nothing to see here” heading, explanatory copy, “Get started” link to
`/search`, and named search/settings controls. Update the mocked inbox hook
with its new filter state and setters.

In `e2e/messages.spec.ts`, extend the mocked list API to honor the `search`
and `unread` query parameters. Add a test that searches by hostel/participant,
enables unread-only filtering without losing the search term, and confirms
the list reflects both filters. Add a test that a late response to an earlier
search does not replace the latest results. Assert that loading another
conversation page and refreshing the inbox retain the active filters. Extend
the mobile flow to select a thread, return to the list, and verify the current
filter and draft state are preserved.

- [ ] **Step 2: Run focused tests and confirm the new expectations fail**

Run: `npm test -- --run src/components/messages/MessagesInbox.test.tsx`

Run: `npx playwright test e2e/messages.spec.ts`

Expected: the new tests fail against the current inbox controls and layout.
The authenticated browser cases require the existing seeded student
credentials and should not be treated as verified if they are skipped.

- [ ] **Step 3: Connect inbox search and unread state to filtered loading**

Add search and unread state to `useMessagesInbox`. Debounce text search by
250ms, fetch unread-filter changes immediately, keep the current filters on
refresh and pagination, and ignore stale list responses. Preserve existing
thread loading, read state, pending inquiry, send, and error flows.

- [ ] **Step 4: Implement the Airbnb-inspired desktop shell and controls**

Update `MessagesInbox.tsx` and `ConversationList.tsx` to use a full-height
desktop split layout with a narrow inbox pane, flexible conversation pane,
thin divider, and the Messages heading inside the inbox pane. Replace the
current kicker and subtitle with the reference's restrained hierarchy.
Keep Hostello branding and Explore navigation; move inbox refresh into the
settings menu.

Add round, accessible search and settings buttons. Search reveals a labeled
search input; closing it clears the search. Settings exposes an “Unread
messages only” checkbox and “Refresh inbox” action. Show the empty-state copy
and `/search` link only when there are no conversations and no active search;
show a distinct no-results message with a clear-search action for an empty
filtered result. Do not add an archive or “Past conversations” section.

- [ ] **Step 5: Add mobile list/thread presentation**

At the existing mobile-navigation breakpoint, show either the inbox or the
selected thread at full content width. Add a labeled back-to-inbox button.
Keep the selected thread mounted when switching back so its URL selection and
unsent draft are preserved. Retain the student bottom navigation and avoid
horizontal overflow.

- [ ] **Step 6: Run focused unit and browser tests**

Run: `npm test -- --run src/components/messages/MessagesInbox.test.tsx`

Run: `npx playwright test e2e/messages.spec.ts`

Expected: the inbox filter controls, active thread send/read behavior,
signed-out inquiry flow, mobile back action, and required viewport checks pass.
No authenticated browser case may be counted as passing if it was skipped.

- [ ] **Step 7: Commit the responsive inbox**

```bash
git add src/components/messages/useMessagesInbox.ts src/components/messages/MessagesInbox.tsx src/components/messages/ConversationList.tsx src/components/messages/MessagesInbox.test.tsx e2e/messages.spec.ts
git commit -m "feat: redesign responsive messages inbox" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

### Final verification

- [ ] Run `npm run typecheck`; expect exit code 0.
- [ ] Run `npm run lint`; expect no errors.
- [ ] Run `npm run build`; expect exit code 0.
- [ ] Inspect the rendered page at 320, 768, 1024, and 1440 pixels; verify the
  desktop split, mobile list/thread switch, search/settings keyboard
  operation, and absence of horizontal overflow.
- [ ] Confirm the browser console has no new errors and the visible copy
  contains no “Past conversations” or archive controls.
