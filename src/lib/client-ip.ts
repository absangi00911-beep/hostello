interface RequestWithIp {
  headers?: {
    get(name: string): string | null;
  };
  ip?: string | null;
}

/**
 * Return the address supplied by the trusted ingress boundary.
 *
 * Production runs on Vercel, which overwrites `x-forwarded-for` to prevent IP
 * spoofing. Do not trust `cf-connecting-ip` or `x-real-ip` unless the immediate
 * ingress is explicitly configured to overwrite them. A forwarded chain is
 * ambiguous without a trusted-proxy policy, so it is rejected rather than
 * guessed at.
 */
export function getTrustedClientIp(req: RequestWithIp): string | null {
  const forwardedFor = req.headers?.get("x-forwarded-for");
  if (forwardedFor !== null && forwardedFor !== undefined) {
    const ip = forwardedFor.trim();
    if (!ip || ip.includes(",")) return null;
    return ip;
  }

  return req.ip || null;
}
