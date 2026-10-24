// Path: src/lib/background.ts

import { after } from "next/server";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { logOperationalEvent, type OperationalLogContext } from "@/lib/operational-logger";

/**
 * Run best-effort work (emails, search-index updates) after the response has
 * been sent, without letting it be cut off.
 *
 * On serverless platforms, a promise that is started and not awaited can be
 * frozen or killed as soon as the response is returned. `after()` registers the
 * work with the platform so the invocation stays alive until it finishes.
 *
 * - Failures are logged as `<event>.failed` and never thrown to the caller.
 * - Outside a request scope (scripts, tests) `after()` is unavailable, so the
 *   task runs immediately and the returned promise resolves when it finishes.
 *
 * Use this for work whose loss is acceptable. Work that must not be lost
 * belongs in the same database transaction as the state change, or in an outbox.
 */
export function runAfterResponse(
  event: string,
  task: () => Promise<unknown>,
  logContext?: OperationalLogContext,
): Promise<void> {
  const guarded = async () => {
    try {
      await task();
    } catch (error) {
      const summary = getSafeErrorSummary(error);
      logOperationalEvent(
        "error",
        `${event}.failed`,
        {
          error_name: summary.name,
          ...(summary.code ? { error_code: summary.code } : {}),
        },
        logContext,
      );
    }
  };

  try {
    after(guarded);
    return Promise.resolve();
  } catch {
    return guarded();
  }
}
