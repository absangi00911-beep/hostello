import { createHash } from "crypto";

/** Hash a high-entropy, single-use token before storing it. */
export function hashOneTimeToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
