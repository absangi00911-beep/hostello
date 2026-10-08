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
});
