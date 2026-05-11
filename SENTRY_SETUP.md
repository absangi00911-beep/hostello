# Sentry Setup Guide

Sentry has been configured for error tracking on both client and server sides.

## Getting Started

### 1. Create a Sentry Account and Project
- Go to [sentry.io](https://sentry.io) and create an account
- Create a new project for your Hostello application
- Select **Next.js** as the platform during setup

### 2. Get Your DSN
- In Sentry, go to **Project Settings > Client Keys (DSN)**
- You'll see your DSN which looks like: `https://exampleKey@o0.ingest.sentry.io/0`

### 3. Configure Environment Variables
Add these to your `.env.local` file:

```bash
# Client-side error tracking
NEXT_PUBLIC_SENTRY_DSN=your_public_dsn_here

# Server-side error tracking
SENTRY_DSN=your_server_dsn_here

# Optional: For automatic release & source map uploads
SENTRY_ORG=your-org-name
SENTRY_PROJECT=your-project-name
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

### 4. Set Up Release Tracking (Optional but Recommended)
To get your auth token:
- Go to **Settings > Auth Tokens**
- Create a new token with `project:releases` and `org:read` scopes
- Save it as `SENTRY_AUTH_TOKEN` in your `.env.local`

## File Structure

- `sentry.client.config.ts` - Client-side error tracking configuration
- `sentry.server.config.ts` - Server-side error tracking configuration
- `sentry.edge.config.ts` - Edge function error tracking
- `instrumentation.ts` - Server-side initialization
- `src/app/layout.tsx` - Imports client config
- `src/app/error.tsx` - Route-level error boundary
- `src/app/global-error.tsx` - Global error boundary

## Features Configured

### Client-Side
- ✅ Error tracking
- ✅ Session replay (with privacy protection)
- ✅ Browser tracing for performance monitoring
- ✅ Source map integration

### Server-Side
- ✅ Error tracking
- ✅ Performance monitoring
- ✅ Prisma integration for database query tracking
- ✅ Distributed tracing

## Usage Examples

### Capture Custom Errors
```typescript
import * as Sentry from "@sentry/nextjs";

// Capture an exception
Sentry.captureException(error);

// Capture a message
Sentry.captureMessage("Something interesting happened", "info");

// Capture with context
Sentry.captureException(error, {
  tags: {
    section: "bookings",
  },
  extra: {
    bookingId: 123,
  },
});
```

### Manual Performance Tracking
```typescript
import * as Sentry from "@sentry/nextjs";

const transaction = Sentry.startTransaction({
  op: "db_query",
  name: "Fetch hostels",
});

// Your code here

transaction.finish();
```

### Set User Context
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.setUser({
  id: userId,
  email: userEmail,
  username: userName,
});
```

## Environment-Specific Configuration

- **Development**: All traces are sampled (1.0), debug mode is off
- **Production**: 10% of traces are sampled (0.1) to reduce overhead

You can adjust these rates in:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

## Verifying Setup

### Test Client-Side Error
Create a test page to verify the client-side setup:
```typescript
"use client";
import * as Sentry from "@sentry/nextjs";

export default function TestSentry() {
  return (
    <button
      onClick={() => {
        throw new Error("Test error from client");
      }}
    >
      Test Client Error
    </button>
  );
}
```

### Test Server-Side Error
Create a test API route:
```typescript
import * as Sentry from "@sentry/nextjs";

export async function GET() {
  try {
    throw new Error("Test error from server");
  } catch (error) {
    Sentry.captureException(error);
    return Response.json({ error: "Test error captured" }, { status: 500 });
  }
}
```

## Performance Optimization

The current configuration:
- **Session Replay Sampling**: 10% of sessions (1 out of 10)
- **Error Replay Sampling**: 100% (all errors get replays)
- **Trace Sampling**: 10% in production, 100% in development

Adjust these values in the config files based on your traffic and budget.

## Privacy & Security

- Session replays mask all text and block media by default
- User IP addresses are not captured unless explicitly set
- Adjust privacy settings in the Sentry dashboard as needed

## Troubleshooting

### DSN is Required
Make sure `NEXT_PUBLIC_SENTRY_DSN` is set in your environment:
```bash
npm run dev
# You should see: "Sentry initialized" message
```

### Source Maps Not Uploading
If you're not using the auth token, source maps won't be uploaded automatically. This is fine for development but recommended for production.

### Performance Issues
If Sentry is affecting performance:
- Reduce `tracesSampleRate` for production
- Disable session replay: set `replaysSessionSampleRate: 0`
- Use different sample rates for different environments

## Next Steps

1. ✅ Install dependencies: `npm install @sentry/nextjs`
2. ✅ Configure environment variables: Add to `.env.local`
3. ✅ Test the setup: Use the test examples above
4. ✅ Deploy: Sentry will start capturing errors in production
5. 🔄 Monitor: Check the Sentry dashboard for incoming errors and performance data

## Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Dashboard](https://sentry.io)
- [Release Tracking](https://docs.sentry.io/product/releases/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
