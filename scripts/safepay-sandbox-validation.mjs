#!/usr/bin/env node
// Path: scripts/safepay-sandbox-validation.mjs
/**
 * Helper for docs/runbooks/safepay-sandbox-validation.md (R-04 item 9).
 *
 * SANDBOX ONLY. This script never contacts Safepay. It only reads the local
 * database and, for `replay-webhook`, posts to your locally running app.
 * It refuses to run unless NEXT_PUBLIC_SAFEPAY_ENV is exactly "sandbox".
 *
 * Commands (run with tsx so the app's TypeScript db client can load):
 *   npx tsx --env-file=.env.local scripts/safepay-sandbox-validation.mjs preflight
 *   npx tsx --env-file=.env.local scripts/safepay-sandbox-validation.mjs report <bookingId> --confirm-non-production-db
 *   npx tsx --env-file=.env.local scripts/safepay-sandbox-validation.mjs replay-webhook <bookingId> --confirm-non-production-db [--base-url http://localhost:3000] [--dry-run]
 *
 * Output never contains keys, secrets, tokens, emails or names. Provider
 * trackers are masked to their last 6 characters.
 */

import { createHmac } from "node:crypto";
import { fileURLToPath } from "node:url";

export const REQUIRED_ENV = ["SAFEPAY_SECRET", "SAFEPAY_API_KEY", "SAFEPAY_WEBHOOK_SECRET", "DATABASE_URL"];

/** Returns a list of reasons the script must refuse to run. Empty means OK. */
export function sandboxProblems(env) {
  const problems = [];
  if (env.NEXT_PUBLIC_SAFEPAY_ENV !== "sandbox") {
    problems.push(
      'NEXT_PUBLIC_SAFEPAY_ENV must be exactly "sandbox". (The app treats any value other than "production", including unset, as sandbox; this script requires it to be explicit.)',
    );
  }
  if (env.NODE_ENV === "production") problems.push("NODE_ENV is production.");
  for (const name of REQUIRED_ENV) {
    if (!env[name]) problems.push(`${name} is not set.`);
  }
  if (env.SAFEPAY_API_KEY && !/^sec_[A-Za-z0-9_-]+$/.test(env.SAFEPAY_API_KEY)) {
    problems.push("SAFEPAY_API_KEY does not have the expected sec_... format.");
  }
  return problems;
}

export function maskTracker(tracker) {
  return typeof tracker === "string" && tracker.length > 0 ? `...${tracker.slice(-6)}` : null;
}

export function isLocalBaseUrl(url) {
  try {
    return ["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** HMAC-SHA512 hex of the raw body, as src/lib/safepay.ts verifyWebhookSignature expects. */
export function signPayload(secret, body) {
  return createHmac("sha512", secret).update(body).digest("hex");
}

/** Builds the event shape src/app/api/payment/webhook/route.ts accepts for a paid booking. */
export function buildReplayEvent({ bookingId, tracker, totalPkr, apiKey }) {
  return {
    type: "payment.succeeded",
    merchant_api_key: apiKey,
    data: {
      tracker,
      state: "TRACKER_ENDED",
      amount: totalPkr * 100,
      currency: "PKR",
      metadata: { order_id: bookingId },
    },
  };
}

/**
 * Money invariants over one booking and its audit events. These are
 * consistency checks on what the app recorded; they cannot see what Safepay
 * actually refunded. Always compare with the Safepay dashboard too.
 */
export function checkInvariants(booking, events) {
  const approved = Math.min(booking.total, booking.cancellationRefundAmount ?? booking.total);
  const confirmedSum = events
    .filter((e) => e.type === "AUTOMATIC_CONFIRMED" || e.type === "MANUAL_CONFIRMED")
    .reduce((sum, e) => sum + e.amount, 0);
  const requested = events.filter((e) => e.type === "AUTOMATIC_REQUESTED");
  const outcomeByAttempt = new Map();
  for (const e of events) {
    if (e.type === "AUTOMATIC_CONFIRMED" || e.type === "AUTOMATIC_UNCERTAIN") {
      outcomeByAttempt.set(e.attemptId, (outcomeByAttempt.get(e.attemptId) ?? 0) + 1);
    }
  }
  const dangling = requested.filter((e) => (outcomeByAttempt.get(e.attemptId) ?? 0) === 0).length;
  const multi = [...outcomeByAttempt.values()].filter((n) => n > 1).length;

  return [
    { name: "refundedAmount <= total", ok: booking.refundedAmount <= booking.total, detail: `${booking.refundedAmount} vs ${booking.total}` },
    { name: "refundedAmount <= approved refund (min(total, cancellationRefundAmount))", ok: booking.refundedAmount <= approved, detail: `${booking.refundedAmount} vs ${approved}` },
    { name: "refundedAmount == sum of confirmed refund events", ok: booking.refundedAmount === confirmedSum, detail: `${booking.refundedAmount} vs ${confirmedSum}` },
    {
      name: "every automatic request has exactly one outcome (a single in-flight request is allowed only while refundState is PROCESSING)",
      ok: multi === 0 && (dangling === 0 || (dangling === 1 && booking.refundState === "PROCESSING")),
      detail: `${requested.length} requested, ${dangling} without outcome, ${multi} with several outcomes`,
    },
  ];
}

const iso = (d) => (d ? new Date(d).toISOString() : "-");

export function renderReport(booking, webhookEvents, refundEvents) {
  const lines = [];
  lines.push(`# Safepay sandbox report for booking ${booking.id}`);
  lines.push(`generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Booking");
  lines.push(`status=${booking.status} paymentStatus=${booking.paymentStatus} paymentMethod=${booking.paymentMethod ?? "null"} refundState=${booking.refundState}`);
  lines.push(`total=${booking.total} cancellationRefundAmount=${booking.cancellationRefundAmount ?? "null"} refundedAmount=${booking.refundedAmount}`);
  lines.push(`tracker=${maskTracker(booking.transactionId) ?? "null"} refundedAt=${iso(booking.refundedAt)} updatedAt=${iso(booking.updatedAt)}`);
  lines.push("");
  lines.push(`## Webhook events (${webhookEvents.length})`);
  for (const e of webhookEvents) {
    lines.push(
      `${iso(e.receivedAt)} type=${e.eventType} providerState=${e.providerState ?? "null"} amountMinor=${e.amountMinorUnits ?? "null"} ${e.currency ?? "null"} status=${e.status} attempts=${e.processingAttempts} processedAt=${iso(e.processedAt)} error=${e.lastErrorCode ?? "none"} tracker=${maskTracker(e.tracker) ?? "null"}`,
    );
  }
  lines.push("");
  lines.push(`## Refund audit events (${refundEvents.length})`);
  for (const e of refundEvents) {
    lines.push(
      `${iso(e.createdAt)} attempt=${e.attemptId.slice(0, 8)} type=${e.type} amount=${e.amount} ${e.currency} providerState=${e.providerState ?? "null"} digest=${e.providerResponseDigest ? e.providerResponseDigest.slice(0, 8) : "none"} failure=${e.failureName ?? "none"}/${e.failureCode ?? "none"}/${e.failureStatus ?? "none"}`,
    );
  }
  lines.push("");
  lines.push("## Consistency checks (app records only; also compare with the Safepay dashboard)");
  for (const c of checkInvariants(booking, refundEvents)) {
    lines.push(`${c.ok ? "OK  " : "FAIL"} ${c.name} [${c.detail}]`);
  }
  return lines.join("\n");
}

function fail(message) {
  console.error(`REFUSING: ${message}`);
  process.exitCode = 1;
}

async function loadDb() {
  // Dynamic so the pure helpers above can be imported (and tested) without a database.
  // Own client with logging off: src/lib/db.ts logs errors, and Prisma's error
  // text can include the database host, which must not end up in pasted output.
  const [{ PrismaClient }, { PrismaPg }, { Pool }] = await Promise.all([
    import("../src/generated/client"),
    import("@prisma/adapter-pg"),
    import("pg"),
  ]);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5_000, max: 2 });
  return new PrismaClient({ adapter: new PrismaPg(pool), log: [] });
}

async function main(argv) {
  const baseUrlIndex = argv.indexOf("--base-url");
  const baseUrl = baseUrlIndex >= 0 ? argv[baseUrlIndex + 1] ?? "" : "http://localhost:3000";
  // Drop the --base-url value so it is not mistaken for a positional argument.
  const positional = argv.filter((a, i) => !(baseUrlIndex >= 0 && i === baseUrlIndex + 1));
  const args = positional.filter((a) => !a.startsWith("--"));
  const flags = new Set(positional.filter((a) => a.startsWith("--")));
  const [command, bookingId] = args;

  const problems = sandboxProblems(process.env);
  if (problems.length > 0) {
    console.error("Preflight FAILED. This script only runs in a fully configured sandbox environment:");
    for (const p of problems) console.error(` - ${p}`);
    process.exitCode = 1;
    return;
  }

  if (command === "preflight") {
    console.log("Preflight OK (names checked, values never printed).");
    console.log("App resolves Safepay API host to: https://sandbox.api.getsafepay.com");
    console.log(process.env.QSTASH_TOKEN ? "QSTASH_TOKEN is set: webhooks go through QStash and need a public URL." : "QSTASH_TOKEN is unset: webhooks are processed inline (non-production only).");
    console.log(process.env.UPSTASH_REDIS_REST_URL ? "UPSTASH_REDIS_REST_URL is set: rate limits persist across restarts." : "UPSTASH_REDIS_REST_URL is unset: rate limits are held in process memory.");
    console.log("NOT VERIFIABLE HERE: that the keys are Safepay SANDBOX keys and that DATABASE_URL is not production. Confirm both yourself.");
    return;
  }

  if (command !== "report" && command !== "replay-webhook") {
    console.error("Usage: safepay-sandbox-validation.mjs <preflight | report <bookingId> | replay-webhook <bookingId>> [--confirm-non-production-db]");
    process.exitCode = 1;
    return;
  }
  if (!bookingId) return fail("a booking id is required.");
  if (!flags.has("--confirm-non-production-db")) {
    return fail("pass --confirm-non-production-db to confirm DATABASE_URL is a development, preview or branch database, never production.");
  }

  if (command === "replay-webhook" && !isLocalBaseUrl(baseUrl)) {
    return fail("--base-url must be localhost. Replays are only meant for your local sandbox app.");
  }

  const db = await loadDb();
  try {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true, status: true, paymentStatus: true, paymentMethod: true, transactionId: true,
        total: true, cancellationRefundAmount: true, refundedAmount: true, refundState: true,
        refundedAt: true, updatedAt: true,
      },
    });
    if (!booking) return fail("booking not found.");

    if (command === "report") {
      const [webhookEvents, refundEvents] = await Promise.all([
        db.safepayWebhookEvent.findMany({
          where: { merchantOrderId: bookingId },
          orderBy: { receivedAt: "asc" },
          select: { eventType: true, providerState: true, amountMinorUnits: true, currency: true, status: true, processingAttempts: true, receivedAt: true, processedAt: true, lastErrorCode: true, tracker: true },
        }),
        db.refundAuditEvent.findMany({
          where: { bookingId },
          orderBy: { createdAt: "asc" },
          select: { attemptId: true, type: true, amount: true, currency: true, providerState: true, providerResponseDigest: true, failureName: true, failureCode: true, failureStatus: true, createdAt: true },
        }),
      ]);
      console.log(renderReport(booking, webhookEvents, refundEvents));
      return;
    }

    // replay-webhook
    if (booking.paymentStatus !== "PAID" || !booking.transactionId) {
      return fail("replay only works on a booking that a real sandbox payment already marked PAID (and before it is refunded). It never creates a payment.");
    }
    if (booking.paymentMethod && booking.paymentMethod !== "safepay") {
      return fail("booking is not a Safepay booking.");
    }
    const body = JSON.stringify(
      buildReplayEvent({ bookingId, tracker: booking.transactionId, totalPkr: booking.total, apiKey: process.env.SAFEPAY_API_KEY }),
    );
    const url = `${baseUrl.replace(/\/+$/, "")}/api/payment/webhook`;
    if (flags.has("--dry-run")) {
      console.log(`Dry run: would POST the same signed ${body.length}-byte event twice to ${url} for booking ${bookingId} (tracker ${maskTracker(booking.transactionId)}).`);
      return;
    }
    const signature = signPayload(process.env.SAFEPAY_WEBHOOK_SECRET, body);
    for (const label of ["delivery 1 (new body)", "delivery 2 (identical body)"]) {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", "x-sfpy-signature": signature },
        body,
        signal: AbortSignal.timeout(15_000),
      });
      const text = (await res.text()).slice(0, 200);
      console.log(`${label}: HTTP ${res.status} ${text}`);
    }
    console.log("Now run the report command and compare with the runbook's expected results.");
  } finally {
    await db.$disconnect().catch(() => undefined);
  }
}

const isMain =
  Boolean(process.argv[1]) &&
  (fileURLToPath(import.meta.url) === process.argv[1] ||
    process.argv[1].endsWith("safepay-sandbox-validation.mjs"));
if (isMain) {
  main(process.argv.slice(2))
    .catch((err) => {
      // Do not print err.message: Prisma errors can include the database host.
      const name = err instanceof Error ? err.name : "unknown error";
      console.error(`Failed (${name}). Check DATABASE_URL and that the database is reachable.`);
      process.exitCode = 1;
    })
    .finally(() => process.exit(process.exitCode ?? 0));
}
