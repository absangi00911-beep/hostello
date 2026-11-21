// Shared by playwright.payments.config.ts and the payment specs. Imports nothing, so the
// config can load it. Every value here is a fake that only exists for this test run.

export const APP_PORT = 3101;
export const APP_URL = `http://127.0.0.1:${APP_PORT}`;
export const FAKE_SAFEPAY_PORT = 3199;
export const FAKE_SAFEPAY_URL = `http://127.0.0.1:${FAKE_SAFEPAY_PORT}`;

/** Merchant credentials handed to the dev server. They never match a real Safepay account. */
export const FAKE_SAFEPAY: { secret: string; apiKey: string; webhookSecret: string } = {
  secret: "e2e-fake-safepay-merchant-secret",
  apiKey: "sec_e2e_fake_merchant_key",
  webhookSecret: "e2e-fake-safepay-webhook-secret",
};

export const E2E_CRON_SECRET = "e2e-fake-cron-secret-for-local-runs";

/**
 * Settings that must be empty for the server process, even if a .env.local defines them:
 * an explicit empty value in the process environment beats every .env file. Leaving any of
 * these set could let this test talk to a real provider, queue, or search service.
 */
export const DISABLED_EXTERNAL_SERVICES = [
  "RESEND_API_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "QSTASH_TOKEN",
  "QSTASH_CURRENT_SIGNING_KEY",
  "QSTASH_NEXT_SIGNING_KEY",
  "TYPESENSE_HOST",
  "TYPESENSE_API_KEY",
  "JAZZCASH_MERCHANT_ID",
  "JAZZCASH_PASSWORD",
  "JAZZCASH_INTEGRITY_SALT",
  "EASYPAISA_STORE_ID",
  "EASYPAISA_HASH_KEY",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;
