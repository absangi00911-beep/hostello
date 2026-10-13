# Hostello API Mastery Guide

This guide is for learning how APIs work and how to understand, test, and
eventually write Hostello API endpoints. It starts from the basics and moves
toward production concerns. You do not need to understand every route in the
repository at once.

The API implementation is the source of truth. Start exploring at
[`../src/app/api/`](../src/app/api/), and use
[`../SYSTEM.md`](../SYSTEM.md) for the wider architecture and security
overview. Hostello uses Next.js App Router Route Handlers; the matching
version-specific framework reference is in
[`../node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`](../node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md).

## 1. The mental model: a conversation over HTTP

An API is a contract between a **client** and a **server**. The client sends a
request that describes what it wants. The server checks the request, performs
work, and sends a response.

For a hostel search:

```text
Browser / mobile app                        Hostello server
       │                                          │
       │ GET /api/hostels?q=lahore&limit=5        │
       ├─────────────────────────────────────────►│
       │                                          │ parse filters
       │                                          │ limit request rate
       │                                          │ search and fetch records
       │  200 OK + JSON response                  │
       │◄─────────────────────────────────────────┤
       │ display the hostel cards                 │
```

The important parts of an HTTP request are:

| Part | Meaning | Example |
|---|---|---|
| Method | The kind of action requested. | `GET`, `POST`, `PATCH`, `DELETE` |
| Path | The resource or operation being addressed. | `/api/hostels` |
| Query string | Optional filters after `?`. | `?q=lahore&limit=5` |
| Headers | Metadata about the request. | `Content-Type`, `Authorization`, `Origin` |
| Body | Data sent with a request, commonly JSON. | `{"hostelId":"...","guests":2}` |

An HTTP response contains a **status code**, **headers**, and sometimes a
**body**. Hostello's JSON bodies are commonly shaped like:

```json
{ "data": {}, "message": "Optional human-readable message" }
```

or:

```json
{ "error": "A safe explanation", "details": {} }
```

That is a convention, not a guarantee that every route returns the same
fields. Always inspect the actual route and its callers.

## 2. HTTP methods: choosing the action

| Method | Typical meaning | Hostello-style example |
|---|---|---|
| `GET` | Read data; should not intentionally change server state. | Search hostels or read a booking. |
| `POST` | Create something or ask the server to perform an action. | Create a booking or initiate payment. |
| `PATCH` | Partially update a resource or apply a named transition. | Update a hostel listing or cancel a booking. |
| `PUT` | Replace a resource representation. | Not a common pattern in the routes reviewed. |
| `DELETE` | Remove a resource or association. | Delete a saved alert or favorite. |

The words are conventions, not security checks. A `GET` endpoint must not be
used to confirm a payment, and a `POST` endpoint still needs authentication,
authorization, validation, and protection against repeated requests.

### Safe and idempotent operations

- **Safe** means the client can request the operation without intending to
  change state. `GET` should be safe.
- **Idempotent** means repeating the same request has the same intended
  effect as sending it once. Reading with `GET` is idempotent. A carefully
  designed `PUT` or `DELETE` is often idempotent. A `POST` that creates a
  record usually is not.

These concepts matter for browser refreshes, mobile retries, network timeouts,
and payment callbacks. If a client retries a non-idempotent action after a
timeout, the server may have completed it even though the client never saw the
response. Critical operations need a deliberate duplicate-request strategy
(for example, a persisted idempotency key or a unique provider event ID).
Rate limiting alone does not make an operation idempotent.

## 3. URLs and resources

Hostello routes are organized by feature and resource:

```text
/api/hostels                 collection: search/list or create
/api/hostels/{param}         one hostel: detail or owner edit
/api/bookings                booking collection: list or create
/api/bookings/{id}           one booking: read or apply an action
/api/reviews/{id}/reply      a related reply operation
```

In Next.js App Router, a `route.ts` file declares HTTP handlers for its folder:

```text
src/app/api/hostels/route.ts
                    └────────────── /api/hostels

src/app/api/bookings/[id]/route.ts
                    └────────────── /api/bookings/{id}
```

Square brackets mark a **dynamic route segment**. The actual value comes from
the request path. In this project's Next.js version, route `params` are
asynchronous and must be awaited:

```ts
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // Validate id before using it.
}
```

Do not copy route-handler signatures from old tutorials without checking the
installed Next.js docs. For this project, route params have the
`Promise<...>` shape.

## 4. Reading an existing endpoint

When opening a route, trace it in this order:

1. **Find its URL.** Convert the file path under `src/app/api` into a URL.
2. **Find its methods.** Look for exported `GET`, `POST`, `PATCH`, and
   `DELETE` functions.
3. **Find callers.** Search the client code for the endpoint path. A caller
   reveals the request body, headers, and response fields it expects.
4. **Read the tests.** Tests show expected behavior and rejected cases.
5. **Trace helpers and services.** Follow imports such as `auth`, `db`,
   validation schemas, and service functions.
6. **Write down the contract.** Record input, permissions, side effects,
   response shape, status codes, and errors.

Start with these routes:

| Route | Why it is useful to study |
|---|---|
| [`hostels/route.ts`](../src/app/api/hostels/route.ts) `GET` | Public search; teaches query strings, bounds, rate limits, search helpers, and response shaping. |
| [`hostels/route.ts`](../src/app/api/hostels/route.ts) `POST` | Owner-only creation; teaches authentication, role authorization, JSON limits, Zod validation, database transactions, and `201 Created`. |
| [`bookings/route.ts`](../src/app/api/bookings/route.ts) `GET` and `POST` | Teaches session checks, role-dependent visibility, pagination, validation, and domain-service calls. |
| [`hostels/[param]/route.ts`](../src/app/api/hostels/%5Bparam%5D/route.ts) | Teaches async path params, ownership checks, and safe conditional updates. |
| [`bookings/[id]/route.ts`](../src/app/api/bookings/%5Bid%5D/route.ts) | Teaches detailed object-level permission checks and business state transitions. |

For each route, also open the adjacent `route.test.ts` file. For example,
[`hostels/route.test.ts`](../src/app/api/hostels/route.test.ts) tests request
limits, input bounds, search ordering, and listing creation.

## 5. The lifecycle of a request

A reliable endpoint typically follows this sequence:

```text
Incoming request
      │
      ▼
Framework/proxy checks
      │
      ▼
Parse URL, params, headers, body
      │
      ▼
Bound input size and validate shape
      │
      ▼
Authenticate caller ──► reject if not signed in
      │
      ▼
Authorize role, ownership, and requested action
      │
      ▼
Apply rate limit / business rules
      │
      ▼
Read or change data (transaction if needed)
      │
      ▼
Return client-safe JSON + correct status
      │
      └── unexpected failure: safe log + generic error response
```

There is not one mandatory order for every route. A route may authenticate
before reading a body, and may rate-limit before expensive work. The security
and performance goal is to reject invalid or unauthorized requests before
doing sensitive or costly operations.

## 6. Inputs: path, query, headers, and body

### Path parameters

Use path parameters to identify a resource, such as the `{id}` in
`/api/bookings/{id}`. Treat them as untrusted strings: check that they are
present and within expected bounds before querying the database. See
[`route-params.ts`](../src/lib/route-params.ts) for a shared length-checking
helper.

### Query parameters

Use query parameters for optional filters and pagination:

```text
GET /api/hostels?q=campus&city=Lahore&page=1&limit=20
```

In a route, query parameters can be read with `request.nextUrl.searchParams`
or the Web URL API. They arrive as strings. Convert numbers deliberately and
validate them; `Number("not-a-number")` is `NaN`, not a useful filter.

Hostello's pagination helper is
[`parsePagination`](../src/lib/pagination.ts). It applies defaults and bounds
the page/limit values to avoid huge result sets. Different endpoints may also
set their own maximum page size.

### Headers

Headers carry request metadata:

- `Content-Type: application/json` tells the server the body is JSON.
- `Authorization: Bearer ...` carries a mobile session token.
- `Origin` is checked for browser state-changing requests.
- A provider signature header authenticates a webhook payload.

Never trust a client-supplied user ID or role header to establish identity.
The authenticated session or a verified provider signature is the authority.
Never log authorization tokens, cookies, passwords, or full sensitive payloads.

### JSON request bodies

A JSON body is for data sent with a request, usually `POST` or `PATCH`:

```json
{
  "hostelId": "cl...",
  "checkIn": "2027-01-10",
  "checkOut": "2027-01-15",
  "guests": 2,
  "paymentMethod": "safepay"
}
```

The server must not assume that `Content-Type` guarantees valid JSON or that
the body has a reasonable size. Hostello's
[`readBoundedJson`](../src/lib/bounded-json.ts) reads JSON with a byte limit
and returns structured errors for malformed or oversized bodies.

## 7. Validation: data is untrusted until checked

Validation answers questions like:

- Is this field present?
- Is it the right type?
- Is its length/number within acceptable bounds?
- Does it belong to an allowed set?
- Do multiple fields make sense together?

Hostello uses Zod schemas. Shared request schemas live in
[`packages/shared/src/validations/index.ts`](../packages/shared/src/validations/index.ts)
and are re-exported through
[`src/lib/validations.ts`](../src/lib/validations.ts). For example,
`bookingSchema` validates a hostel ID, date values, number of guests, and an
allowed payment method, and it checks that check-out follows check-in.

Use `safeParse` when handling client data:

```ts
const parsed = bookingSchema.safeParse(body.data);
if (!parsed.success) {
  return NextResponse.json(
    { error: "Validation failed.", details: parsed.error.flatten() },
    { status: 400 },
  );
}

// Use parsed.data after successful validation, not the original body.
```

Validation is not authorization. A valid `hostelId` does not prove the caller
owns the hostel. A valid `action: "confirm"` does not prove the caller is
allowed to confirm that booking. Validate syntax and business permission
separately.

## 8. Authentication and authorization

**Authentication** asks, “Who is making the request?”

**Authorization** asks, “May this user perform this action on this resource?”

Hostello uses `auth()` from
[`src/lib/auth/config.ts`](../src/lib/auth/config.ts) in many route handlers.
A session proves an identity, but it does not automatically grant access to
every resource.

Typical checks:

```ts
const session = await auth();
if (!session) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

if (session.user.role !== "OWNER") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

For resource-level authorization, include the current user in the lookup or
write predicate. For example, an owner should update a hostel only when both
`id` and `ownerId` match. Do not fetch by ID, trust the request, and update
without checking ownership.

Typical meanings:

- `401 Unauthorized`: the request lacks a valid authenticated identity.
- `403 Forbidden`: the caller is known, but the action is not allowed.
- `404 Not Found`: the resource does not exist, or the API deliberately hides
  its existence from this caller.

Use the route's intended policy consistently. An API may return `404` rather
than `403` when revealing another person's resource would leak information.

### Browser and mobile authentication

Browser requests use NextAuth's HTTP-only session cookies. Mobile requests
use a bearer token; [`src/proxy.ts`](../src/proxy.ts) bridges that token into
the cookie shape NextAuth expects. The mobile request helper is
[`apps/mobile/src/services/api.ts`](../apps/mobile/src/services/api.ts).

The proxy's CSRF checks are an additional request-shaping/security layer,
not a replacement for authentication and authorization inside the route.
State-changing browser requests also need CSRF protection; mobile bearer
requests follow the project's separate flow.

## 9. Business rules and data access

After parsing and authorization, a route performs domain work. That may mean
querying Prisma directly or calling a service such as
`createBooking`. A route should not let the client choose protected fields
such as owner ID, payment status, admin role, or calculated totals.

For writes:

- Use a **transaction** when multiple related database changes must succeed
  or fail together.
- Use a conditional update when a state may have changed since it was read.
- Return a conflict (`409`) when the request is valid but cannot be applied to
  the resource's current state.
- Keep payment, booking, payout, and account-deletion transitions in their
  domain logic; do not treat them as ordinary field edits.

For reads:

- Select only fields the caller is allowed to see.
- Scope rows by the authenticated user/owner where appropriate.
- Paginate collection results and cap maximum page size.
- Consider whether cached/search-provider results need to be revalidated
  against the database before returning them.

The booking and hostel APIs illustrate these patterns. The booking listing
scopes results differently for students and owners in
[`bookings/route.ts`](../src/app/api/bookings/route.ts). Hostel listing
creation checks quotas and performs relevant work inside a serializable
transaction in [`hostels/route.ts`](../src/app/api/hostels/route.ts).

## 10. Responses and status codes

Use a status code that describes what happened, and return a stable JSON shape
that the caller can handle:

| Status | Meaning | Example use |
|---|---|---|
| `200 OK` | Request succeeded and returns data. | Successful search/read/update. |
| `201 Created` | A resource was created. | Booking or listing created. |
| `204 No Content` | Request succeeded with no response body. | Some delete operations. |
| `207 Multi-Status` | Multiple checks include a mix of healthy/unhealthy results. | Cron health endpoint. |
| `400 Bad Request` | Malformed or invalid input. | Invalid JSON, parameter, or schema. |
| `401 Unauthorized` | Authentication is missing or invalid. | No valid session. |
| `403 Forbidden` | Authenticated caller lacks permission. | Wrong role. |
| `404 Not Found` | Resource does not exist or is intentionally hidden. | Unknown or inaccessible record. |
| `409 Conflict` | Request conflicts with current resource state. | Stale update or invalid state transition. |
| `413 Content Too Large` | Request body exceeds the allowed size. | Oversized JSON or upload. |
| `429 Too Many Requests` | Caller exceeded a rate limit. | Too many searches or actions. |
| `500 Internal Server Error` | Unexpected server-side failure. | Database or unhandled dependency error. |

Avoid returning stack traces, SQL errors, secrets, or provider response bodies
to the client. Log a safe diagnostic summary and return a generic error for
unexpected failures. Hostello's
[`safe-error.ts`](../src/lib/safe-error.ts) is designed to avoid logging
provider details that can contain sensitive request data.

## 11. Pagination, rate limits, and resource bounds

APIs consume server resources. A safe collection endpoint should bound the
amount of data and work one request can trigger:

- Maximum query-string and text-field lengths.
- Maximum JSON/form body bytes.
- Maximum page size and offset.
- Maximum number/size of repeated filters.
- Rate limits for public IPs or authenticated accounts.

Hostello uses helpers for these concerns, including
[`bounded-json.ts`](../src/lib/bounded-json.ts),
[`pagination.ts`](../src/lib/pagination.ts), and
[`rate-limit.ts`](../src/lib/rate-limit.ts). Rate-limited responses commonly
include `429` and may include a `Retry-After` header.

Rate limits help control abuse and service cost; they are not a replacement
for access control. Likewise, pagination does not replace query validation.

## 12. Errors and debugging

Think of errors in two groups:

1. **Expected request/domain errors:** invalid input, not signed in, not
   permitted, resource absent, quota exceeded, or state conflict. Return a
   meaningful status and client-safe message.
2. **Unexpected failures:** database unavailable, programming error, or
   provider outage. Log safe diagnostics, return a generic `500`, and monitor
   the failure.

When debugging:

1. Inspect the browser/mobile Network panel or the API client result.
2. Record method, path, status, and a redacted response body.
3. Find the route file from the URL.
4. Find the corresponding test and client call.
5. Follow service/helper imports to the failing operation.
6. Check server logs/monitoring without exposing secrets.

For a local request, PowerShell can call a public read-only endpoint:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/hostels?q=lahore&limit=5"
```

For a `POST`, set the method, JSON content type, and body explicitly:

```powershell
$body = @{
  hostelId = "replace-with-a-real-hostel-id"
  checkIn = "2027-01-10"
  checkOut = "2027-01-15"
  guests = 2
  paymentMethod = "safepay"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/bookings" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

The booking example requires a valid student session and real valid data; it
is illustrative, not a way to bypass authentication. Avoid testing writes
against a shared or production database.

## 13. Testing an API route

An API test should verify externally observable behavior, not only internal
implementation details. Useful cases include:

- The success response has the expected status and JSON.
- Missing authentication is rejected.
- Wrong roles/ownership are rejected.
- Invalid/malformed/oversized inputs are rejected before side effects.
- Rate limits are respected.
- Not-found and conflict states are handled.
- Database/service failures do not leak details.

Hostello's route tests commonly mock database, auth, and external service
modules, then call the exported handler with a `NextRequest`. This makes the
route's behavior testable without requiring a live database or provider.

Run one route test while learning:

```powershell
npm test -- --run src/app/api/hostels/route.test.ts
```

The existing test file
[`hostels/route.test.ts`](../src/app/api/hostels/route.test.ts) is a good
example of checking status codes, JSON fields, whether helpers were called,
and whether rejected requests avoided database work.

## 14. A recipe for designing your own endpoint

Before coding, write a small contract:

```text
Purpose: What user problem does the endpoint solve?
Method/path: Which HTTP method and URL?
Caller: Public, signed-in user, owner, or admin?
Inputs: Path params, query params, headers, JSON fields?
Validation: Types, limits, formats, and cross-field rules?
Authorization: What proves this caller may read/change this record?
Effects: Database writes, notifications, payments, external calls?
Response: Exact success JSON and status?
Errors: Expected 400/401/403/404/409/429 responses?
Tests: Which success and rejection cases must pass?
```

Then build it in small steps:

1. Find a similar endpoint and test; reuse project helpers and naming.
2. Add tests for the desired contract and rejected cases.
3. Parse and bound all request-controlled values.
4. Authenticate and authorize the caller and resource.
5. Apply business rules and perform the smallest required data operation.
6. Return only fields needed by the client.
7. Run the focused test, then TypeScript:

   ```powershell
   npm test -- --run src/app/api/your-route/route.test.ts
   npx tsc --noEmit
   ```

8. Inspect the final diff, then run the wider checks required by the project.

Do not start by copying a large route line-for-line. First understand the
contract and borrow only the relevant pattern.

## 15. Learning exercises

Use a progression from low risk to high risk. Use test fixtures or a local
development database; do not experiment with production data.

### Exercise A: explain a read-only route

Study `GET /api/hostels`. Write down its query parameters, limits, rate-limit
identity, search helper, response shape, and failure response. Find the tests
for each behavior.

### Exercise B: add a filter

Add one small, legitimate search filter by following the route's current
validation/search conventions. Extend tests for both valid and invalid values.
Trace the client that consumes the response so you preserve its contract.

### Exercise C: understand creation

Trace `POST /api/bookings` from client request to route, `bookingSchema`,
`createBooking`, Prisma, and response. Identify every point where a request
can be rejected and why.

### Exercise D: design a protected read

On paper, design an authenticated endpoint that returns only the signed-in
user's own data. Decide where to enforce ownership in the database query and
how to test that another user's record cannot be read.

### Exercise E: design a state transition

Study `PATCH /api/bookings/[id]`. Identify allowed actors, allowed actions,
current-state preconditions, transactional writes, notifications/refunds, and
conflict responses. State transitions need more care than CRUD field edits.

## 16. Concepts that exist but are not the main API style here

Hostello mostly uses resource-oriented, JSON-over-HTTP Next.js Route Handlers.
The following are different API technologies or practices; do not assume they
are part of the current app just because they are common:

| Concept | What it is | Status in this guide's repository review |
|---|---|---|
| GraphQL | A query language/API runtime where clients select fields through a schema. | No GraphQL server/schema was found in the app's Route Handler structure. |
| gRPC | RPC over HTTP/2, commonly with Protocol Buffers and generated clients. | Not the app's client-facing API style. |
| JSON-RPC / XML-RPC | Explicit remote procedure-call protocols. | Not the app's client-facing API style. |
| OpenAPI / Swagger contract | A machine-readable API description that can drive docs/client generation. | No generated OpenAPI contract was found in the reviewed API setup. |
| API gateway as a separate service | A dedicated external layer for routing, quotas, keys, and policy across services. | Next.js/Vercel and app helpers handle the reviewed request path; no separate gateway service is shown. |
| Microservice-to-microservice API mesh | Independently deployed services communicating through explicit APIs. | The reviewed architecture is a Next.js monolith with integrations, not a fleet of Hostello microservices. |
| WebSocket API | Long-lived bidirectional connection for real-time messages. | Not the basic Route Handler request/response pattern described here. |
| Server-Sent Events (SSE) | Long-lived one-way server event stream. | Not the basic Route Handler request/response pattern described here. |
| Public API keys for third-party developers | Keys and a versioned external API contract intended for outside consumers. | No dedicated third-party public API program was identified in the reviewed routes. |

These are not inherently better or worse. They solve different problems. A
project should add one only when a real requirement outweighs the additional
operational and compatibility cost. This table describes the repository files
reviewed, not hidden provider-dashboard capabilities.

## 17. API mastery checklist

For any endpoint, you should eventually be able to explain:

- What URL and HTTP method does it use?
- Which client calls it?
- What are the exact inputs and outputs?
- Which values are untrusted, and how are they bounded/validated?
- How does the server know who the caller is?
- How does it prove the caller may access this specific resource?
- What database or external side effects occur?
- What happens if the request is repeated or races with another request?
- Which status codes can the caller receive?
- Which tests prove the important success and failure cases?
- What data or details must never be returned/logged?

You have mastered the practical API basics when you can trace a request from
the client through the route and domain logic to its response, and then design
a small endpoint whose contract, permissions, errors, and tests are clear
before you implement it.
