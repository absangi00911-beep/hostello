export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_IP_LIMIT = 10;
export const LOGIN_ACCOUNT_LIMIT = 5;

/**
 * Cap on attempts against one email across ALL source IPs. The per-IP and
 * per-(email, IP) buckets above do not stop a distributed attacker who rotates
 * addresses. Kept well above LOGIN_ACCOUNT_LIMIT so one person cannot easily
 * lock a victim out: reaching it takes 30 attempts in a window, not 5.
 */
export const LOGIN_EMAIL_GLOBAL_LIMIT = 30;

/** Share the same per-IP budget across credential sign-in endpoints. */
export function loginIpLimitKey(ip: string): string {
  return `login-ip:${ip}`;
}
