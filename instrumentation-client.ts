import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent, scrubSentrySpan } from "./src/lib/sentry-privacy";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: { request: false, response: false },
    httpBodies: [],
    urlQueryParams: false,
    databaseQueryData: false,
    stackFrameVariables: false,
    graphQL: { document: false, variables: false },
    genAI: { inputs: false, outputs: false },
  },
  beforeSend: (event) => scrubSentryEvent(event) as typeof event,
  beforeSendTransaction: (event) => scrubSentryEvent(event) as typeof event,
  beforeSendSpan: (span) => scrubSentrySpan(span) as typeof span,
  tracesSampleRate: 1.0,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
});

// Session Replay is a large part of the client bundle, so it is registered
// after the page has loaded instead of shipping in the first-load JavaScript.
// Errors thrown before it loads are still reported, just without a replay.
if (typeof window !== "undefined") {
  const loadReplay = () =>
    import("@sentry/nextjs").then((lazySentry) => {
      Sentry.addIntegration(
        lazySentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      );
    });

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(() => void loadReplay(), { timeout: 5000 });
  } else {
    setTimeout(() => void loadReplay(), 3000);
  }
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
