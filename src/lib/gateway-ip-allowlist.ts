/**
 * Gateway IP allowlist for verifying payment gateway callbacks.
 *
 * CSRF protection for payment callbacks relies on:
 *   1. Method-based CSRF exemption (only POST is exempted from Origin check)
 *   2. HMAC/signature verification (JazzCash uses HMAC-SHA256)
 *   3. Optional IP allowlisting (blocks requests from unexpected sources)
 *
 * IP allowlisting is optional because:
 *   - Gateway IPs may change or be geographic (regional load balancers)
 *   - Signatures provide strong verification; IPs provide defense-in-depth
 *   - Disabling IPs doesn't reduce security if signatures are verified
 *
 * To enable IP verification, set GATEWAY_IPS environment variable:
 *   GATEWAY_IPS='jazzcash:192.0.2.1,192.0.2.2;easypaisa:198.51.100.1'
 */

/**
 * Parse the GATEWAY_IPS environment variable into a set of allowed IPs per gateway.
 *
 * Format: 'gateway1:ip1,ip2;gateway2:ip3,ip4'
 *
 * Example:
 *   GATEWAY_IPS='jazzcash:203.0.113.1,203.0.113.2;easypaisa:192.0.2.1'
 *
 * @returns Map of gateway names to sets of allowed IP addresses.
 */
function parseGatewayIps(): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();

  const envValue = process.env.GATEWAY_IPS ?? "";
  if (!envValue.trim()) return map;

  for (const gatewayPart of envValue.split(";")) {
    const [gateway, ipsStr] = gatewayPart.split(":");
    if (!gateway || !ipsStr) continue;

    const ips = new Set(
      ipsStr
        .split(",")
        .map((ip) => ip.trim())
        .filter(Boolean),
    );

    if (ips.size > 0) {
      map.set(gateway.toLowerCase(), ips);
    }
  }

  return map;
}

const ALLOWED_GATEWAY_IPS = parseGatewayIps();

/**
 * Get the client's real IP address from the request, accounting for proxies.
 *
 * Checks headers in this order (common proxy patterns):
 *   1. cf-connecting-ip (Cloudflare)
 *   2. x-forwarded-for (traditional proxy, comma-separated; takes first)
 *   3. x-real-ip (Nginx reverse proxy)
 *   4. req.ip (Node.js raw socket IP)
 *
 * @param req NextRequest object
 * @returns Client IP address or null if unable to determine
 */
function getClientIp(req: any): string | null {
  // Cloudflare
  const cfIp = req.headers?.get?.("cf-connecting-ip");
  if (cfIp) return cfIp;

  // Traditional X-Forwarded-For (comma-separated list of IPs)
  const xForwardedFor = req.headers?.get?.("x-forwarded-for");
  if (xForwardedFor) {
    const ips = xForwardedFor.split(",").map((ip: string) => ip.trim());
    return ips[0] || null;
  }

  // Nginx reverse proxy
  const xRealIp = req.headers?.get?.("x-real-ip");
  if (xRealIp) return xRealIp;

  // Direct connection
  return req.ip || null;
}

/**
 * Verify that the request IP is in the allowlist for the given gateway.
 *
 * Returns null if verification passes or IP allowlisting is disabled.
 * Returns an error message if verification fails.
 *
 * @param req NextRequest object
 * @param gateway Gateway name (e.g., 'jazzcash', 'easypaisa')
 * @returns Error message if IP is not allowed; null if allowed or no allowlist
 */
export function verifyGatewayIp(req: any, gateway: string): string | null {
  // If no allowlist is configured, skip IP verification
  const allowedIps = ALLOWED_GATEWAY_IPS.get(gateway.toLowerCase());
  if (!allowedIps) return null;

  const clientIp = getClientIp(req);
  if (!clientIp) {
    return "Unable to determine client IP address";
  }

  if (!allowedIps.has(clientIp)) {
    return `Request IP ${clientIp} is not in the allowlist for gateway ${gateway}`;
  }

  return null;
}

/**
 * Get the list of configured allowed IPs for a gateway (for logging/debugging).
 *
 * @param gateway Gateway name
 * @returns Set of allowed IP addresses, or empty set if not configured
 */
export function getGatewayAllowedIps(gateway: string): Set<string> {
  return ALLOWED_GATEWAY_IPS.get(gateway.toLowerCase()) ?? new Set();
}

/**
 * Check if IP allowlisting is enabled for any gateway.
 *
 * @returns True if at least one gateway has IP restrictions configured
 */
export function isGatewayIpAllowlistingEnabled(): boolean {
  return ALLOWED_GATEWAY_IPS.size > 0;
}
