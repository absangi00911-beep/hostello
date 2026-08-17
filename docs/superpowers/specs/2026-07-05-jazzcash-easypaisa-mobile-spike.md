# JazzCash / EasyPaisa on Mobile — Design Spike

Date: 2026-07-05
Status: Investigation complete, not implemented. Enablement timing is a business decision (see WEB_APP_PROGRESS.md P1) — this note exists so that decision isn't blocked on "we don't know what it would take."

## Why mobile can't use them today

It's not one blocker, it's two independent, small ones — worth separating because they have different fixes:

**Gap A — getting to the gateway.** Safepay's mobile flow works because `createCheckoutSession` returns a plain URL (`redirectUrl`) that `WebBrowser.openAuthSessionAsync` can simply open. JazzCash and EasyPaisa don't work that way: `createJazzCashSession`/`createEasypaisaSession` (both already implemented, in `src/lib/jazzcash.ts` / `src/lib/easypaisa.ts`) return `{ formUrl, params }` — the *web* client renders a hidden HTML form and auto-submits it via POST. `openAuthSessionAsync` can only open a URL; it has no way to carry a POST body or form fields.

**Gap B — getting back to the app.** Both gateways POST their result to `/api/payment/callback?provider=...&bookingId=...` (`src/app/api/payment/callback/route.ts`), which — after verifying the payment — does its own `303` redirect to `${APP_URL}/payment/success?bookingId=...`. That's always a plain HTTPS URL. `payment/initiate`'s Safepay branch already swaps in `hostello://payment/return` when `isMobile` is true; the JazzCash/EasyPaisa branches don't, and neither does the callback route's final redirect — there's currently no signal on that request telling it which client originally started the payment.

Neither gap is a fundamental mobile limitation — both are small, targeted gaps in code that's 90% already there.

## Recommended fix

**For Gap A:** add one new lightweight route, e.g. `GET /payment/redirect-form`, that server-renders the exact hidden-form-plus-auto-submit-script HTML the web client currently builds client-side, taking `formUrl` + the param set as its own query/body input. Point `WebBrowser.openAuthSessionAsync` at *this* URL instead of the gateway's `formUrl` directly. The page loads, its inline script calls `.submit()` on mount, and the browser carries on to the real gateway exactly as it does today from web. No new native dependency, no change to the proven `openAuthSessionAsync` + custom-scheme-prefix mechanism already shipping for Safepay.

(The alternative — swap `expo-web-browser` for `react-native-webview` and feed it raw HTML via `source={{ html }}` — also works, but means a new dependency and a different redirect-interception mechanism (`onShouldStartLoadWithRequest`) than the one already proven in production. Prefer the bounce-page route unless there's a reason to move off `openAuthSessionAsync` entirely.)

**For Gap B:** thread the same `isMobile` signal that Safepay's branch already computes into `createJazzCashSession`/`createEasypaisaSession`'s `pp_ReturnURL`/`postBackURL` construction — concretely, append `&client=mobile` alongside the existing `provider`/`bookingId` params, no schema change needed. Then in `/api/payment/callback`, read that `client` param and redirect to `hostello://payment/return?bookingId=...&status=paid|failed` instead of the web URL when it's present. This mirrors exactly what the Safepay branch already does; it's just not wired through for the other two yet.

## What this doesn't cover (still genuinely open)

- **Mobile app UI**: flip `enabled: false` → `true` for `jazzcash`/`easypaisa` in `PAYMENT_METHODS` (`apps/mobile/app/(app)/booking/[id]/index.tsx`) once the above ships — trivial, but listed so it isn't forgotten.
- **Sandbox testing on physical devices** — same category as the Safepay physical-device QA already on the P1 list; this doesn't reduce that work, it adds two more payment methods to it.
- **The actual "should we enable these on mobile now" call** — unchanged by this note. This just means that decision is no longer blocked on "we don't know what the work would look like."
