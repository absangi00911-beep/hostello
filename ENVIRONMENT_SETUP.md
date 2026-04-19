# Environment Variables Setup

## Required for Production Deployment

### Cron Job Execution

```bash
CRON_SECRET=your-random-secret-here
```

This secret must match what you configure in Vercel Cron settings or your external cron service. It prevents unauthorized calls to the cron endpoints.

Generate with:
```bash
openssl rand -base64 32
```

---

## Cron Jobs Available

Two background jobs run automatically on Vercel:

### 1. Mark Completed Stays
- **Endpoint:** `POST /api/cron/mark-completed-stays`
- **Schedule:** Daily at 00:00 UTC
- **Purpose:** Transitions CONFIRMED bookings to COMPLETED after checkout date
- **Impact:** Enables review system (users can only review COMPLETED stays)

### 2. Cancel Abandoned Payments
- **Endpoint:** `POST /api/cron/cancel-abandoned-payments`
- **Schedule:** Every 5 minutes
- **Purpose:** Cancels PENDING bookings that have no payment after 30 minutes
- **Impact:** Frees up hostel capacity blocked by abandoned bookings

---

## Configuration in Vercel

The `vercel.json` file already contains the cron schedules. No additional configuration needed in Vercel dashboard — it auto-reads from `vercel.json`.

### Verify Cron is Working

1. Deploy to Vercel
2. Check **Vercel Dashboard** → Project → **Crons** tab
3. Both jobs should appear there

### Debug Cron Execution

Cron execution logs appear in:
- Vercel Dashboard → Functions
- Any failed requests will show in error logs

---

## Testing Cron Locally

To test cron endpoints without Vercel, use curl:

```bash
# Test mark-completed-stays
curl -X POST http://localhost:3000/api/cron/mark-completed-stays \
  -H "Authorization: Bearer your-secret-here"

# Test cancel-abandoned-payments
curl -X POST http://localhost:3000/api/cron/cancel-abandoned-payments \
  -H "Authorization: Bearer your-secret-here"
```

Replace `your-secret-here` with the `CRON_SECRET` value you set locally.

---

## Rate Limiting & Redis (Production Required)

For production, Upstash Redis is **mandatory** for distributed rate limiting:

```bash
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

Without this in production, the app will throw an error and refuse to start. Get free Redis at [upstash.com](https://upstash.com).

---

## Summary: What to Deploy

Before pushing to production, ensure these are set in your Vercel environment:

| Variable | Required | Where to get it |
|----------|----------|-----------------|
| `CRON_SECRET` | ✅ Yes | Generate yourself |
| `UPSTASH_REDIS_REST_URL` | ✅ Yes | Upstash console |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ Yes | Upstash console |
| Other existing vars | ✅ Yes | (database, auth, payment, etc.) |

All other environment variables remain the same as before.
