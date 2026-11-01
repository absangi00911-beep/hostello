# Spec: Airbnb-Inspired Messages Page

## Objective

Redesign Hostello's authenticated messages page to follow the clean, spacious
inbox layout in the supplied Airbnb desktop and mobile references, while
preserving Hostello branding and all existing conversation behavior.

Students and owners should be able to find a conversation, open it, read and
send messages, and recover from loading or delivery errors. Students should
still be able to arrive from a saved hostel inquiry and continue in the correct
thread.

The interface uses a full-height desktop split view: a narrow conversation
column on the left and a thread area on the right. The left header has the
Messages title and round search and settings controls. An empty inbox shows a
centered “Nothing to see here” message and a “Get started” link to hostel
search. Existing Hostello navigation and student mobile tab navigation remain.
On mobile, the list and selected thread occupy the screen as separate views,
with a back action from the thread to the list.

Search filters conversations by hostel or participant using the existing API
search parameter. The settings control exposes the existing unread-only filter
and inbox refresh action. The existing per-thread message refresh, read state,
pagination, composer, and send-error behavior remain available.

Archived or past conversations, archiving controls, and database changes are
explicitly out of scope.

## Tech Stack

- Next.js 16.4 App Router
- React 19 and TypeScript 6
- Tailwind CSS 4 and existing Hostello CSS variables
- Existing Lucide React dependency for search and settings icons
- Existing authenticated conversation API and PostgreSQL/Prisma data model
- Vitest for component/unit tests and Playwright for browser tests

No new dependency or database migration is planned.

## Commands

- Focused test: `npm test -- --run src/components/messages/MessagesInbox.test.tsx`
- Browser test: `npx playwright test e2e/messages.spec.ts`
- Type check: `npm run typecheck`
- Lint: `npm run lint`
- Build: `npm run build`
- Development server: `npm run dev`

## Project Structure

- `src/components/messages/MessagesInbox.tsx` - responsive page shell and
  search/settings controls
- `src/components/messages/ConversationList.tsx` - active conversation list,
  empty state, and selectable rows
- `src/components/messages/ConversationThread.tsx` - selected thread and
  existing composer
- `src/components/messages/useMessagesInbox.ts` - inbox state and filtered
  conversation loading
- `src/lib/messages-inbox.ts` - typed conversation fetch helpers
- `src/components/messages/MessagesInbox.test.tsx` - component and filtering
  tests
- `e2e/messages.spec.ts` - authenticated conversation and responsive browser
  flows

No API route, database schema, or migration file should change. The existing
`GET /api/conversations` route already supports search and unread filtering.

## Code Style

Follow the existing React component and Tailwind utility conventions. Use
semantic buttons and labeled form controls for interactive elements, reuse
existing CSS variables, and keep interactive inbox state in the existing client
component/hook boundary.

```tsx
<button
  aria-label="Search conversations"
  className="grid h-12 w-12 place-items-center rounded-full bg-surface-muted"
  onClick={toggleSearch}
  type="button"
>
  <Search aria-hidden="true" size={20} />
</button>
```

Keep the reference's restrained white space and fine dividers, but use
Hostello's logo, blue accent, and existing navigation rather than Airbnb
branding or assets.

## Testing Strategy

- Vitest: assert the empty-state copy and search destination, accessible search
  and settings controls, active/unread filtering, and that existing thread
  selection/composer behavior remains intact.
- Playwright: cover searching and unread filtering with the mocked conversation
  API, opening and sending within a thread, signed-out inquiry delivery, and
  no horizontal overflow at 320, 768, 1024, and 1440 pixels.
- Type check, lint, and production build after the focused tests.
- Inspect the page in a browser at desktop and mobile widths; check console
  output and keyboard operation of search, settings, and thread navigation.

## Boundaries

- Always: preserve authentication, role checks, participant-scoped API access,
  pending-inquiry delivery, unread/read state, pagination, and recoverable
  errors.
- Always: keep search and unread filters backed by the existing API parameters;
  do not silently substitute a partial client-only filter.
- Ask first: adding archive/past-conversation support, changing database or API
  contracts, adding dependencies, or changing the route structure.
- Never: weaken message authorization, discard an inquiry or message, remove
  existing error handling, or expose private account information.

## Success Criteria

- At desktop width, the Messages page has a narrow left inbox pane, a flexible
  thread pane, and a clear vertical divider; it uses the supplied screenshots
  as layout references while retaining Hostello identity.
- At mobile width, the inbox is usable without horizontal overflow, and opening
  a thread gives it the full available content width with a keyboard-accessible
  back action.
- Search and unread-only controls retrieve the matching conversation set from
  the existing API and work alongside pagination.
- With no conversations, the inbox presents the centered empty state and
  “Get started” navigates to hostel search.
- Selecting a conversation still loads its messages and marks incoming
  messages read; sending a reply, refreshing, and loading older messages still
  work.
- Signed-out inquiry delivery still opens the correct conversation after
  login, and the draft is not lost.
- Loading, empty, API error, and send error states remain visible and
  recoverable. Search and settings controls are keyboard accessible and
  labeled.
- No archive or past-conversation section, schema change, migration, or new
  dependency is introduced.

## Open Questions

None. Per-user archiving and the “Past conversations” section were explicitly
removed from scope.
