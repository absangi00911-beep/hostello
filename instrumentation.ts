// Path: src/instrumentation.ts
// Next.js App Router requires this file at the project root (alongside next.config.ts)
// for server-side initialisation. The SDK reads it automatically.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Server-side Sentry init (Node.js runtime — API routes, Server Components)
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // Edge runtime Sentry init (middleware, edge routes)
    await import("./sentry.edge.config");
  }
}