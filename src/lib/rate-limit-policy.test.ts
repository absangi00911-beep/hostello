import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Brute-force and abuse-sensitive routes must refuse requests when the shared Redis
 * limiter is down (see `failClosed` in rate-limit.ts). This guards against a new call
 * site in these files silently using the per-instance fallback.
 */
const FAIL_CLOSED_FILES = [
  "src/lib/auth/credentials-authorize.ts",
  "src/lib/auth/email-otp-authorize.ts",
  "src/app/api/auth/signup/route.ts",
  "src/app/api/auth/forgot-password/route.ts",
  "src/app/api/auth/reset-password/route.ts",
  "src/app/api/auth/email-otp/route.ts",
  "src/app/api/auth/email-otp/verify/route.ts",
  "src/app/api/auth/phone/request-otp/route.ts",
  "src/app/api/auth/resend-verification/route.ts",
  "src/app/api/profile/change-password/route.ts",
  "src/app/api/auth/delete-account/route.ts",
];

function rateLimitCalls(source: string): string[] {
  const calls: string[] = [];
  let from = 0;
  for (;;) {
    const start = source.indexOf("await rateLimit(", from);
    if (start === -1) return calls;
    let depth = 0;
    let end = start + "await rateLimit".length;
    do {
      const char = source[end];
      if (char === "(") depth += 1;
      if (char === ")") depth -= 1;
      end += 1;
    } while (depth > 0);
    calls.push(source.slice(start, end));
    from = end;
  }
}

describe("fail-closed rate limit policy", () => {
  it.each(FAIL_CLOSED_FILES)("%s opts every rateLimit call into failClosed", (file) => {
    const calls = rateLimitCalls(readFileSync(file, "utf8"));

    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) expect(call).toContain("failClosed: true");
  });
});
