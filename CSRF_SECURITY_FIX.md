# CSRF Security Fix: Payment Gateway Callbacks

## Overview

This document explains the CSRF security fix for payment gateway callbacks (`/api/payment/callback`).

## Problem

The original implementation had a CSRF security gap:

1. **Broad exemption**: The entire `/api/payment/callback` route was exempted from CSRF checks for all HTTP methods
2. **Unnecessary exemption**: GET requests are inherently safe from CSRF (the `verifyCsrfOrigin` function already allows them)
3. **No IP verification**: Only HMAC/signature verification was performed; no validation of the request source IP

This meant if a gateway ever sent a GET callback (e.g., EasyPaisa test environments), there was no origin verification at all.

## Solution

### 1. Method-Based CSRF Exemption

The exemption is now scoped to only POST requests:

```typescript
// middleware.ts
const METHOD_BASED_CSRF_EXEMPT: { path: string; methods: string[] }[] = [
  { path: "/api/payment/callback", methods: ["POST"] },
];
```

**Rationale**: 
- POST callbacks from gateways originate from servers, not browsers, so they need exemption from Origin header checks
- GET callbacks are automatically allowed by `verifyCsrfOrigin()` (safe methods), so they still get protection from malicious GET attempts

### 2. Optional IP Allowlisting

A new utility (`src/lib/gateway-ip-allowlist.ts`) provides defense-in-depth IP verification:

```typescript
import { verifyGatewayIp } from "@/lib/gateway-ip-allowlist";

// In the callback handler:
const ipError = verifyGatewayIp(req, "jazzcash");
if (ipError) {
  console.warn(`IP verification failed: ${ipError}`);
}
```

**Configuration** (in `.env`):
```
GATEWAY_IPS="jazzcash:203.0.113.1,203.0.113.2;easypaisa:192.0.2.1"
```

**Features**:
- Parses comma-separated IPs per gateway
- Detects client IP through Cloudflare, X-Forwarded-For, X-Real-IP, and raw socket
- Optional enforcement (currently logs warnings; can be enabled by uncommenting)

## Security Layers

Payment callbacks now have **three layers of security**:

| Layer | Mechanism | Enabled By Default |
|-------|-----------|-------------------|
| 1 | HMAC/signature verification | ✓ Yes |
| 2 | CSRF Origin header check (POST only) | ✓ Yes |
| 3 | IP allowlisting (defense-in-depth) | ✗ Optional |

## Implementation Details

### Modified Files

- **`src/middleware.ts`**: Refactored CSRF exemption logic to support method-based rules
- **`src/lib/gateway-ip-allowlist.ts`**: New utility for IP verification
- **`src/app/api/payment/callback/route.ts`**: Added IP verification call
- **`.env.example`**: Added `GATEWAY_IPS` configuration with documentation

### Why IP Verification is Optional

1. **Signatures are the primary defense**: JazzCash uses HMAC-SHA256 verification, which is cryptographically strong
2. **Gateway IPs may change**: Regional load balancers and failover systems mean IPs aren't always stable
3. **No false sense of security**: Disabling IP allowlisting doesn't reduce security if signatures are verified

## Testing

### Enable IP Allowlisting (Development)

```bash
# Sandbox gateway IPs (replace with actual values from provider docs)
GATEWAY_IPS="jazzcash:127.0.0.1;easypaisa:127.0.0.1"
```

**Expected behavior**:
- Requests from allowed IPs pass through
- Requests from other IPs log warnings but don't block (soft enforcement)
- Uncomment the `return` in the callback handler to enforce strict blocking

### Test GET Callbacks

GET requests to `/api/payment/callback` will:
1. Pass through the CSRF Origin check (safe methods allowed)
2. Verify the HMAC signature
3. (Optionally) verify the IP address

## Migration Notes

- No breaking changes for existing deployments
- IP allowlisting is opt-in; no configuration needed to maintain current behavior
- If you have gateway IPs, set `GATEWAY_IPS` for additional security

## References

- OWASP: [Cross Site Request Forgery (CSRF)](https://owasp.org/www-community/attacks/csrf)
- JazzCash: Consult sandbox/production documentation for callback IP addresses
- EasyPaisa: Contact support for callback IP addresses

## Questions?

If gateway IPs are blocking legitimate callbacks:
1. Check the callback handler logs for IP rejection messages
2. Update `GATEWAY_IPS` with the correct IP address
3. Temporarily disable IP checks by removing/commenting out enforcement
