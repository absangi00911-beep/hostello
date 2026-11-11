import { isIP } from "node:net";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/** Resolve a Playwright target without silently allowing arbitrary remote URLs. */
export function resolvePlaywrightTarget(env = process.env) {
  const configured = env.PLAYWRIGHT_BASE_URL;
  const candidate = configured || "http://127.0.0.1:3100";
  let url;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("PLAYWRIGHT_BASE_URL must be a valid absolute URL.");
  }

  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("Playwright target must use HTTP(S) and must not contain credentials.");
  }
  if (url.search || url.hash) {
    throw new Error("Playwright target must not contain a query string or fragment.");
  }

  const isLoopback = LOOPBACK_HOSTS.has(url.hostname.toLowerCase());
  if (isLoopback) {
    return { baseURL: url.toString().replace(/\/$/, ""), isLocal: true };
  }

  if (env.PLAYWRIGHT_ALLOW_REMOTE_SANDBOX !== "1") {
    throw new Error(
      "Refusing non-loopback Playwright target. Remote runs require PLAYWRIGHT_ALLOW_REMOTE_SANDBOX=1 and an explicitly approved sandbox host.",
    );
  }
  if (url.protocol !== "https:") {
    throw new Error("Remote Playwright sandbox targets must use HTTPS.");
  }
  const approvedHost = env.PLAYWRIGHT_SANDBOX_HOST?.trim().toLowerCase();
  if (!approvedHost || approvedHost !== url.hostname.toLowerCase()) {
    throw new Error("PLAYWRIGHT_SANDBOX_HOST must exactly match the approved remote sandbox hostname.");
  }
  if (isIP(url.hostname.replace(/^\[|\]$/g, ""))) {
    throw new Error("Remote Playwright sandbox target must use its approved DNS hostname, not an IP address.");
  }

  return { baseURL: url.toString().replace(/\/$/, ""), isLocal: false };
}
