"use strict";
// Preloaded into the dev server through NODE_OPTIONS=--require (see
// playwright.payments.config.ts). Any request the app makes to a getsafepay.com host is sent
// to the local fake Safepay instead, so the payment flow can run without the real service
// and without real credentials. Everything else passes through untouched.
const fakeBase = process.env.E2E_FAKE_SAFEPAY_URL;

if (fakeBase && typeof globalThis.fetch === "function") {
  const realFetch = globalThis.fetch.bind(globalThis);
  const isSafepayHost = (hostname) => hostname === "getsafepay.com" || hostname.endsWith(".getsafepay.com");

  globalThis.fetch = function fetchThroughFakeSafepay(input, init) {
    let url;
    try {
      url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    } catch {
      return realFetch(input, init);
    }
    if (!isSafepayHost(url.hostname)) return realFetch(input, init);

    const headers = new Headers(init && init.headers ? init.headers : undefined);
    headers.set("x-original-host", url.hostname);
    return realFetch(new URL(url.pathname + url.search, fakeBase), { ...init, headers });
  };
}
