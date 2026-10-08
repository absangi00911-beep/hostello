# System design and launch-readiness checkpoint — 2026-10-08

This dated addendum records new build and dependency-audit evidence for the active system design (`SYSTEM.md`, v3.114 at the previous checkpoint). It does not change the approved launch scope or mark any release gate complete.

## Build and mobile evidence

- A production-mode Next.js build passed Prisma client generation, Next compilation, the post-compile hook, and TypeScript. Static generation then failed because pages such as `/university/aku` query Prisma while the configured disposable database endpoint is unreachable. No production database was contacted. A full build remains open until a disposable database or fixture-backed build environment is available.
- The Android JavaScript export completed on the existing Expo SDK 57 stack: 1,563 modules bundled. The export emitted a warning that the configured iOS Firebase plist (`./GoogleService-Info.plist`) is absent; that remains an iOS beta/release setup gate.
- The export source map contains `query-string` and `decode-uri-component`. It did not contain `braces`, `node-forge`, or `uuid`. This only describes the generated Android JavaScript bundle; it does not clear packages used by the Metro/EAS build toolchain or native build tooling.
- The export's source-map trace showed both Expo Router's custom query parser and a generic React Navigation parser path. The active `getStateFromPath` export wiring could not be confirmed in this checkpoint, so reachability of the vulnerable decoder through app-controlled links remains unresolved.

## Mobile dependency security gate

The latest recorded `npm audit --omit=dev` for `apps/mobile` reported 30 findings (19 high, 11 moderate). Do not use `npm audit fix --force`: npm warned that it would downgrade Expo to SDK 44. SDK 58 migration is not authorized. Resolve findings with SDK 57-compatible targeted upgrades or a reviewed compatibility patch, then rerun the audit and Android/iOS export checks.

- `decode-uri-component@0.2.2` is within the affected range for [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr); the advisory lists `0.5.0` as patched. That release is ESM-only, while the recorded `query-string@7.1.3` dependency uses CommonJS `require()`. Do not add a blind npm override; first verify the live parser call path and a compatible update or adapter.
- `braces@3.0.3` is affected by [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), a stack-exhaustion denial of service through deeply nested patterns. The advisory currently lists no patched version. Establish whether untrusted patterns can reach it in the build environment and document a mitigation or risk disposition.
- `node-forge@1.4.0` is affected by [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv), concerning RSA PKCS#1 v1.5 signature verification. The advisory currently lists no patched version. Trace its consumers and whether attacker-controlled signatures can reach verification before deciding remediation or risk acceptance.
- The recorded `uuid@7.0.3` falls within [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq)'s affected range. The vulnerable operations are `v3()`, `v5()`, and `v6()` when writing to a caller-provided buffer; the advisory says `v4()`, `v1()`, and `v7()` validate bounds. The Android JavaScript bundle did not include `uuid`; the Xcode/Metro call path still needs source-level verification.

### Required closure evidence

- For every finding, capture the direct/transitive dependency path, the runtime-versus-build classification, and the exact lockfile version. A bundle scan alone does not close a build-tool finding.
- For the decoder, show which parser handles external links, cap attacker-controlled URL/query input before decoding, and demonstrate the chosen patched dependency or adapter works in the SDK 57 Android and iOS link flows.
- For `braces` and `node-forge`, trace actual call sites and input control. If a fixed version is unavailable, remove the vulnerable package from the reachable build/runtime path or document a concrete isolation and risk decision before release.
- For `uuid`, inspect Xcode's installed source and call sites; verify any use of `v3()`, `v5()`, or `v6()` with a supplied buffer/offset, rather than inferring safety from its absence in the Android bundle.
- Close the aggregate audit only after a clean install, full dependency audit, and platform export/build checks on the retained SDK 57 toolchain. Do not use a forced SDK downgrade as a remediation.

## Safepay payment-integrity notes — verify against the actual product flow

Safepay publishes separate material for standard Checkout webhooks and the newer Raastwire API. The signing contract must be selected from the product actually used by HostelLo; do not combine examples across those integrations.

- For standard Checkout, Safepay documents the `X-SFPY-SIGNATURE` header and its Node SDK's `webhooks.constructEvent` with the raw request payload. Keep raw bytes available until signature verification; use the exact configured endpoint secret and retain the prior secret briefly during rotation so already-queued events remain verifiable. See [Safepay Checkout HMAC verification](https://safepay-docs.netlify.app/developers/webhooks/verify-hmac-signatures/).
- Safepay requires HTTPS with TLS 1.2 or 1.3, says deliveries that are not acknowledged within 10 seconds enter its retry queue, and recommends persisting the event before returning success and applying business logic after acknowledgement. Implement this as a durable inbox: verify, insert idempotently by the actual product's stable provider event token/ID, acknowledge quickly, then process asynchronously. See [Safepay webhook operations](https://safepay-docs.netlify.app/developers/webhooks/overview/).
- Treat event type/version as provider data. Safepay recommends subscribing to 2.0.0 events and notes event types can expand; preserve unknown verified events for inspection without applying payment-state changes. Correlate sandbox events to payment trackers and test sandbox and live secrets separately. See [Safepay event types](https://safepay-docs.netlify.app/developers/webhooks/webhook-types/).
- Raastwire's provider guidance describes a distinct timestamp-plus-raw-body SHA-256 signature and event-id upsert pattern. Apply that contract only if the configured product is Raastwire; standard Checkout's docs show a different SDK verification interface. See [Safepay Raastwire overview](https://safepay.mintlify.app/overview/introduction) and [Raastwire integration playbook](https://safepay.pk/blog/content/raast-integration-playbook).
- Before closing the payment gate, inspect the actual Checkout/Raastwire client and callback route, confirm the verified signature algorithm and secret source, enforce server-side amount/currency/order correlation, make event handling idempotent and monotonic, and prove that browser redirects alone never mark a booking paid. Run success, failure, duplicate, invalid-signature, stale-event, refund, and out-of-order sandbox cases.

## Remaining launch gates

- Confirm the decoder and native/build-tool advisory call paths once local repository commands are available; do not treat bundle absence as proof that a build dependency is safe.
- Complete a production build with a disposable database/fixture source and run the broad browser review against that build.
- Provide the Apple Team ID/App ID prefix and Android release-signing certificate SHA-256 fingerprint before finalizing tracked universal/app-link verification files. The owner previously confirmed these values are not yet available.
- Payment persistence and provider sandbox validation, private object storage and legacy public-document cleanup, database recovery/connection controls, observability alerts, mobile signing/secrets, and device QA remain separate operator- or provider-dependent launch gates.

## Reproducible evidence to collect next

1. Inspect Expo Router's installed `react-navigation/native` exports and prove which `getStateFromPath` implementation handles external and in-app links.
2. Trace `xcode@3.0.1` and all `uuid` consumers for API methods and buffer/offset arguments.
3. Produce a dependency-path report separating shipped web/mobile code from build-only tools; resolve or explicitly disposition each reachable advisory.
4. Build and review with a disposable database, then run route/auth smoke checks and mobile deep-link tests.
