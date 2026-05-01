# Environment Validation & Image URL Allowlist Security Fix

## Problem

The image URL allowlist in `/api/hostels/[param]/route.ts` silently failed in production if `R2_PUBLIC_URL` was missing:

1. `getAllowedImageOrigins()` would return an empty array
2. `isImageUrlAllowed()` would reject all image URLs
3. Image update requests would fail with a misleading error: "Image URL not allowed"
4. No startup warning or error to indicate the root cause: missing R2_PUBLIC_URL configuration
5. This could go unnoticed until a user tried to upload images in production

### Example Scenario

```typescript
// In production, if R2_PUBLIC_URL is not set:
const origins = getAllowedImageOrigins(); // Returns []
isImageUrlAllowed("https://my-bucket.r2.cloudflarestorage.com/image.jpg"); // Returns false
// Error response: "Image URL not allowed" (misleading — real issue is missing R2_PUBLIC_URL)
```

## Solution

### 1. Environment Validation at Startup

Created `src/lib/env-validation.ts` to validate all critical environment variables at server startup:

```typescript
import { validateEnvironment } from "@/lib/env-validation";

// In middleware.ts, at module import time:
validateEnvironment();
```

**Benefits:**
- Throws with a clear error message immediately on server start if critical variables are missing
- Prevents silent failures at request time
- Provides context about what each variable controls
- Production-specific validation (only enforces critical variables in production)

**Example Error Output:**

```
❌ CRITICAL: Missing required environment variables in production:
  - R2_PUBLIC_URL: Public URL for R2 bucket (used for image URL allowlisting and display)
  - SAFEPAY_SECRET: Safepay merchant secret for HMAC verification

Please set these variables before deploying to production.
```

### 2. Fail-Fast Image Allowlist

Updated `getAllowedImageOrigins()` to use the validation utility:

```typescript
function getAllowedImageOrigins(): string[] {
  const origins: string[] = [];

  // In production, R2_PUBLIC_URL is required for the image allowlist to function.
  // getRequiredEnv will throw with a clear error message if it's missing.
  if (process.env.NODE_ENV === "production") {
    const r2PublicUrl = getRequiredEnv(
      "R2_PUBLIC_URL",
      "image allowlist initialization"
    );
    origins.push(r2PublicUrl.replace(/\/+$/, ""));
  } else {
    // In development, R2_PUBLIC_URL is optional
    const r2PublicUrl = getOptionalEnv("R2_PUBLIC_URL");
    if (r2PublicUrl) {
      origins.push(r2PublicUrl.replace(/\/+$/, ""));
    }
    origins.push("https://images.unsplash.com");
  }

  return origins;
}
```

**Benefits:**
- **Production**: Throws immediately if R2_PUBLIC_URL is missing (caught at startup)
- **Development**: Allows missing R2_PUBLIC_URL; falls back to Unsplash for testing
- No silent failures or misleading error messages
- Clear, actionable error messages

### 3. Helper Functions for Environment Access

Three new utility functions for consistent environment variable handling:

```typescript
// Required variable — throws if missing in production
const value = getRequiredEnv("R2_PUBLIC_URL", "image uploads");

// Optional variable — returns null if not set
const value = getOptionalEnv("OPTIONAL_VAR");

// Bulk validation at startup
validateEnvironment();
```

## Files Modified

| File | Change |
|------|--------|
| `src/lib/env-validation.ts` | **NEW** — Environment validation utility |
| `src/middleware.ts` | Added `validateEnvironment()` call at startup |
| `src/app/api/hostels/[param]/route.ts` | Updated `getAllowedImageOrigins()` to use validation utility |
| `.env.example` | Added clarifying comment for `R2_PUBLIC_URL` |

## Environment Variables

All critical variables are now validated at startup. If you're deploying to production, ensure these are set:

### Storage (R2)
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- **`R2_PUBLIC_URL`** ← This one is easy to forget!

### Payments
- `SAFEPAY_SECRET`
- `SAFEPAY_WEBHOOK_SECRET`
- `JAZZCASH_MERCHANT_ID`
- `JAZZCASH_PASSWORD`
- `JAZZCASH_INTEGRITY_SALT`
- `EASYPAISA_STORE_ID`
- `EASYPAISA_HASH_KEY`

### Other Services
- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `TYPESENSE_API_KEY`
- `TYPESENSE_HOST`

## Testing

### Verify Validation Works

1. **Remove a critical variable** (e.g., `R2_PUBLIC_URL`) from `.env.production.local`
2. **Start the server** — it should throw immediately with a clear error
3. **Restore the variable** and restart — server should start normally

### Example Test in Development

```bash
# Start with all variables unset
npm run dev

# Should see warnings for missing optional variables, but server still starts

# Add R2_PUBLIC_URL to .env.local
echo "R2_PUBLIC_URL=https://my-bucket.r2.cloudflarestorage.com" >> .env.local
npm run dev

# Image upload endpoints should now work
```

## Migration Notes

### For Existing Deployments

1. **No breaking changes** — validation only runs at server startup
2. **Existing deployments with R2_PUBLIC_URL set** — no change in behavior
3. **Deployments with missing R2_PUBLIC_URL** — server will now fail on startup (this is intentional; prevents silent failures)

### For New Deployments

1. Copy `.env.example` to your production environment configuration
2. Fill in all required variables (marked with `CRITICAL` comments)
3. Deploy — server will validate and fail fast if anything is missing

## Debugging Image Upload Issues

If image uploads fail:

1. **Check server logs** for environment validation errors at startup
2. **Verify R2_PUBLIC_URL** is set in your production environment
3. **Check that R2_PUBLIC_URL** format is correct: `https://bucket.r2.cloudflarestorage.com` (no trailing slash)
4. **Ensure R2 credentials** are correct (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, etc.)

## Security Implications

- **Fail-Fast Design**: Missing critical configuration is caught at startup, not when processing requests
- **No Silent Failures**: Empty allowlist no longer silently rejects all uploads
- **Clear Error Messages**: Users and developers know exactly what's misconfigured
- **Production-Safe**: Only enforces validation in production; development is flexible for testing

## Future Enhancements

To extend validation to new variables:

1. Add an entry to `ENV_VALIDATION_RULES` in `src/lib/env-validation.ts`
2. Use `getRequiredEnv()` or `getOptionalEnv()` when accessing the variable
3. Server startup will automatically validate the new variable
