/**
 * Environment variable validation for production safety.
 *
 * This module runs at startup and validates that all critical configuration
 * variables are present in their respective environments. Missing variables
 * are caught early with clear error messages, preventing silent failures at
 * request time.
 *
 * Run at: module import time (when the server starts)
 * Behavior:
 *   - Production deployments: throws on missing critical variables
 *   - Preview deployments: warns when production-only variables are missing
 *   - Development: warns on missing optional variables
 */

import { isProductionDeployment } from "@/lib/deployment-env";

type EnvValidationRule = {
  /** Environment variable name */
  name: string;
  /** Whether this variable is required in production */
  requiredInProduction: boolean;
  /** Human-readable description of what this variable controls */
  description: string;
};

/**
 * Rules for environment variable validation.
 * Add entries here to enforce validation across the app.
 */
export const ENV_VALIDATION_RULES: EnvValidationRule[] = [
  // -- Database & Auth ----------------------------------------------------
  {
    name: "DATABASE_URL",
    requiredInProduction: true,
    description: "Neon PostgreSQL connection string",
  },
  {
    name: "AUTH_SECRET",
    requiredInProduction: true,
    description: "NextAuth session encryption key",
  },
  {
    name: "AUTH_URL",
    requiredInProduction: true,
    description: "NextAuth callback URL",
  },

  // -- Storage (R2/Cloudflare) --------------------------------------------
  {
    name: "R2_ACCOUNT_ID",
    requiredInProduction: true,
    description: "Cloudflare R2 account ID",
  },
  {
    name: "R2_ACCESS_KEY_ID",
    requiredInProduction: true,
    description: "Cloudflare R2 API token access key",
  },
  {
    name: "R2_SECRET_ACCESS_KEY",
    requiredInProduction: true,
    description: "Cloudflare R2 API token secret key",
  },
  {
    name: "R2_BUCKET_NAME",
    requiredInProduction: true,
    description: "Cloudflare R2 bucket name for image uploads",
  },
  {
    name: "R2_VERIFICATION_BUCKET_NAME",
    requiredInProduction: true,
    description: "Private Cloudflare R2 bucket for student verification documents",
  },
  {
    name: "R2_VERIFICATION_ACCESS_KEY_ID",
    requiredInProduction: true,
    description: "Bucket-scoped Cloudflare R2 API token access key for private verification documents",
  },
  {
    name: "R2_VERIFICATION_SECRET_ACCESS_KEY",
    requiredInProduction: true,
    description: "Bucket-scoped Cloudflare R2 API token secret for private verification documents",
  },
  {
    name: "R2_PUBLIC_URL",
    requiredInProduction: true,
    description:
      "Public URL for R2 bucket (used for image URL allowlisting and display). " +
      "Absence in production causes image updates to silently fail with misleading errors.",
  },

  // -- Payments -----------------------------------------------------------
  {
    name: "SAFEPAY_SECRET",
    requiredInProduction: true,
    description: "Safepay merchant secret for server-side payment API requests",
  },
  {
    name: "SAFEPAY_API_KEY",
    requiredInProduction: true,
    description: "Safepay public API key (sec_...) used when creating v3 payment sessions",
  },
  {
    name: "SAFEPAY_WEBHOOK_SECRET",
    requiredInProduction: true,
    description: "Safepay webhook secret for signature verification",
  },
  {
    name: "JAZZCASH_MERCHANT_ID",
    requiredInProduction: false,
    description: "JazzCash merchant ID (required only when jazzcash payment method is enabled)",
  },
  {
    name: "JAZZCASH_PASSWORD",
    requiredInProduction: false,
    description: "JazzCash merchant password (required only when jazzcash payment method is enabled)",
  },
  {
    name: "JAZZCASH_INTEGRITY_SALT",
    requiredInProduction: false,
    description: "JazzCash HMAC integrity salt (required only when jazzcash payment method is enabled)",
  },
  {
    name: "EASYPAISA_STORE_ID",
    requiredInProduction: false,
    description: "EasyPaisa store ID (required only when easypaisa payment method is enabled)",
  },
  {
    name: "EASYPAISA_HASH_KEY",
    requiredInProduction: false,
    description: "EasyPaisa AES-128 hash key (required only when easypaisa payment method is enabled)",
  },

  // -- Upstash (rate limiting, caching, cron) -----------------------------
  {
    name: "UPSTASH_REDIS_REST_URL",
    requiredInProduction: true,
    description: "Upstash Redis REST API URL",
  },
  {
    name: "UPSTASH_REDIS_REST_TOKEN",
    requiredInProduction: true,
    description: "Upstash Redis authentication token",
  },
  {
    name: "CRON_SECRET",
    requiredInProduction: true,
    description: "Secret token for authenticating cron job requests from Upstash",
  },
  {
    name: "QSTASH_TOKEN",
    requiredInProduction: true,
    description: "QStash API token for durable payment-webhook dispatch and scheduled jobs",
  },
  {
    name: "QSTASH_CURRENT_SIGNING_KEY",
    requiredInProduction: true,
    description: "Current QStash signing key for verifying queued webhook deliveries",
  },
  {
    name: "QSTASH_NEXT_SIGNING_KEY",
    requiredInProduction: true,
    description: "Next QStash signing key for verifying queued webhook deliveries during key rotation",
  },

  // -- Email --------------------------------------------------------------
  {
    name: "RESEND_API_KEY",
    requiredInProduction: true,
    description: "Resend email API key",
  },
  {
    name: "EMAIL_FROM",
    requiredInProduction: true,
    description: "Sender email address and name (e.g., 'App <app@domain.com>')",
  },

  // -- Search (Typesense) -------------------------------------------------
  {
    name: "TYPESENSE_API_KEY",
    requiredInProduction: false,
    description: "Typesense search API key (falls back to Prisma if not set)",
  },
  {
    name: "TYPESENSE_HOST",
    requiredInProduction: false,
    description: "Typesense server host/endpoint (falls back to Prisma if not set)",
  },

];

/**
 * Variables whose feature fails closed when missing (payouts return 503, SMS
 * verification returns an error). They are reported as warnings in production
 * rather than errors, so one missing key cannot take every endpoint down.
 */
const PRODUCTION_RECOMMENDED_ENV = [
  {
    name: "PAYOUT_DESTINATION_ENCRYPTION_KEY",
    description: "Encryption key for payout bank-destination snapshots (payout creation fails without it)",
  },
  { name: "TWILIO_ACCOUNT_SID", description: "Twilio account SID (phone verification fails without it)" },
  { name: "TWILIO_AUTH_TOKEN", description: "Twilio auth token (phone verification fails without it)" },
  { name: "TWILIO_PHONE_NUMBER", description: "Twilio sender number (phone verification fails without it)" },
] as const;

/**
 * Validate environment variables at startup.
 * Throws an error if critical variables are missing in production.
 * Logs warnings in Preview and development when variables are missing.
 *
 * @throws Error if a required production variable is missing
 */
export function validateEnvironment(): void {
  // Vercel Preview runs with NODE_ENV=production, but it must not require
  // production-only provider credentials to serve the rest of the app.
  // Keep local production-mode checks strict when VERCEL_ENV is unavailable.
  const isPreview = process.env.VERCEL_ENV === "preview";
  const isProduction = isProductionDeployment();
  const errors: string[] = [];
  const warnings: string[] = [];
  const productionWarnings: string[] = [];

  for (const rule of ENV_VALIDATION_RULES) {
    const isSet = process.env[rule.name] !== undefined && process.env[rule.name] !== "";

    if (!isSet && rule.requiredInProduction && isProduction) {
      errors.push(`${rule.name}: ${rule.description}`);
    } else if (!isSet && rule.requiredInProduction && isPreview) {
      warnings.push(`${rule.name}: ${rule.description} (not configured in Preview)`);
    }

    if (!isSet && !rule.requiredInProduction && !isProduction) {
      warnings.push(`${rule.name}: ${rule.description}`);
    }
  }

  if (isProduction) {
    // Safepay: an unset value would silently use the sandbox, so require an
    // explicit choice. "sandbox" is allowed (pre-launch) but is called out.
    const safepayEnvironment = process.env.NEXT_PUBLIC_SAFEPAY_ENV;
    if (safepayEnvironment !== "production" && safepayEnvironment !== "sandbox") {
      errors.push(
        'NEXT_PUBLIC_SAFEPAY_ENV: must be "production" or "sandbox". ' +
          "When unset the app silently uses the Safepay sandbox.",
      );
    } else if (safepayEnvironment === "sandbox") {
      productionWarnings.push("NEXT_PUBLIC_SAFEPAY_ENV is \"sandbox\": payments will not move real money.");
    }

    // Resend: a placeholder or malformed key must not pass as configured.
    const resendKey = process.env.RESEND_API_KEY?.trim();
    if (resendKey && (resendKey === "re_placeholder" || !resendKey.startsWith("re_"))) {
      errors.push("RESEND_API_KEY: must be a real Resend key (starts with re_), not a placeholder.");
    }

    // Features that fail closed at use time. A missing value should be visible
    // at startup, but must not take the whole API down.
    for (const rule of PRODUCTION_RECOMMENDED_ENV) {
      if (!process.env[rule.name]) productionWarnings.push(`${rule.name}: ${rule.description}`);
    }
  }

  if (errors.length > 0) {
    const message =
      "❌ CRITICAL: Missing required environment variables in production:\n" +
      errors.map((e) => `  - ${e}`).join("\n") +
      "\n\nPlease set these variables before deploying to production.";
    throw new Error(message);
  }

  if (productionWarnings.length > 0) {
    console.warn(
      "⚠️  WARNING: Production configuration needs attention:\n" +
        productionWarnings.map((w) => `  - ${w}`).join("\n"),
    );
  }

  if (warnings.length > 0 && !isProduction) {
    console.warn(
      "⚠️  WARNING: Environment variables are missing for this deployment:\n" +
        warnings.map((w) => `  - ${w}`).join("\n")
    );
  }
}

/**
 * Get a required environment variable with a descriptive error message.
 *
 * Use this instead of direct process.env access for critical variables.
 * Provides better error messages if the variable is missing.
 *
 * @param name - Environment variable name
 * @param context - Optional context for error message (e.g., "R2 image uploads")
 * @returns The environment variable value
 * @throws Error if the variable is not set
 */
export function getRequiredEnv(name: string, context?: string): string {
  const value = process.env[name];
  if (!value) {
    const rule = ENV_VALIDATION_RULES.find((r) => r.name === name);
    const description = rule ? ` — ${rule.description}` : "";
    const contextStr = context ? ` (${context})` : "";
    throw new Error(
      `Missing required environment variable: ${name}${contextStr}${description}`
    );
  }
  return value;
}

/**
 * Get an optional environment variable, returning null if not set.
 *
 * @param name - Environment variable name
 * @returns The environment variable value, or null if not set
 */
export function getOptionalEnv(name: string): string | null {
  return process.env[name] ?? null;
}

let validated = false;
export function validateEnvironmentOnce(): void {
  if (validated) return;
  validated = true;
  validateEnvironment();
}

// Only validate at runtime, not during Next.js build phase
// NEXT_PHASE is set by Next.js: during build it's "phase-production-build" or similar
// During runtime it's not set or is something else
if (typeof process !== "undefined" && process.env.NEXT_PHASE === undefined) {
  validateEnvironmentOnce();
}
