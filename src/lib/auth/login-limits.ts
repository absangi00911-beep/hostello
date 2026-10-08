export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_IP_LIMIT = 10;
export const LOGIN_ACCOUNT_LIMIT = 5;

/** Share the same per-IP budget between web and mobile sign-in flows. */
export function loginIpLimitKey(ip: string): string {
  return `login-ip:${ip}`;
}
