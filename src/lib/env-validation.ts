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
 *   - Production: throws on missing critical variables
 *   - Development: warns on missing optional variables
 */

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
const ENV_VALIDATION_RULES: EnvValidationRule[] = [
  // ── Database & Auth ────────────────────────────────────────────────────
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

  // ── Storage (R2/Cloudflare) ────────────────────────────────────────────
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
    name: "R2_PUBLIC_URL",
    requiredInProduction: true,
    description:
      "Public URL for R2 bucket (used for image URL allowlisting and display). " +
      "Absence in production causes image updates to silently fail with misleading errors.",
  },

  // ── Payments ───────────────────────────────────────────────────────────
  {
    name: "SAFEPAY_SECRET",
    requiredInProduction: true,
    description: "Safepay merchant secret for HMAC verification",
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

  // ── Upstash (rate limiting, caching, cron) ─────────────────────────────
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

  // ── Email ──────────────────────────────────────────────────────────────
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

  // ── Search (Typesense) ─────────────────────────────────────────────────
  {
    name: "TYPESENSE_API_KEY",
    requiredInProduction: true,
    description: "Typesense search API key",
  },
  {
    name: "TYPESENSE_HOST",
    requiredInProduction: true,
    description: "Typesense server host/endpoint",
  },
];

/**
 * Validate environment variables at startup.
 * Throws an error if critical variables are missing in production.
 * Logs warnings for development if optional variables are missing.
 *
 * @throws Error if a required production variable is missing
 */
export function validateEnvironment(): void {
  const isProduction = process.env.NODE_ENV === "production";
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const rule of ENV_VALIDATION_RULES) {
    const isSet = process.env[rule.name] !== undefined && process.env[rule.name] !== "";

    if (!isSet && rule.requiredInProduction && isProduction) {
      errors.push(`${rule.name}: ${rule.description}`);
    }

    if (!isSet && !rule.requiredInProduction && !isProduction) {
      warnings.push(`${rule.name}: ${rule.description}`);
    }
  }

  if (errors.length > 0) {
    const message =
      "❌ CRITICAL: Missing required environment variables in production:\n" +
      errors.map((e) => `  - ${e}`).join("\n") +
      "\n\nPlease set these variables before deploying to production.";
    throw new Error(message);
  }

  if (warnings.length > 0 && process.env.NODE_ENV !== "production") {
    console.warn(
      "⚠️  WARNING: Missing optional environment variables in development:\n" +
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
