# Environment Variables Setup

## Required for Production Deployment

### Upstash QStash (Cron Jobs) - REQUIRED for Hobby Plan

Since Vercel crons are not available on the Hobby tier, we use **Upstash QStash** for scheduled jobs.

```bash
QSTASH_TOKEN=your-qstash-token-here
CRON_SECRET=your-random-secret-here
APP_URL=https://your-app.vercel.app  # Production URL after deployment
```

Get `QSTASH_TOKEN` from: https://console.upstash.com/qstash

Generate `CRON_SECRET` with:
```bash
openssl rand -base64 32
```

---

## Setup Instructions

### 1. Create Upstash QStash Account

1. Go to [console.upstash.com](https://console.upstash.com/)
2. Select **QStash** from the menu
3. Copy your API Token

### 2. Add Environment Variables

Add to your `.env.local` (development) and Vercel dashboard (production):

```bash
# Upstash QStash
QSTASH_TOKEN=your-token-from-upstash
CRON_SECRET=your-random-secret
APP_URL=http://localhost:3000  # Development

# Production (update in Vercel dashboard)
APP_URL=https://your-app.vercel.app
```

### 3. Schedule the Jobs

Once deployed to Vercel, run:

```bash
npm run schedule-cron
```

This creates the recurring schedules in Upstash QStash.

---

## Cron Jobs Available

Two background jobs run automatically:

### 1. Mark Completed Stays
- **Endpoint:** `POST /api/cron/mark-completed-stays`
- **Schedule:** Daily at 00:00 UTC (0 0 * * *)
- **Purpose:** Transitions CONFIRMED bookings to COMPLETED after checkout date
- **Impact:** Enables review system (users can only review COMPLETED stays)

### 2. Cancel Abandoned Payments
- **Endpoint:** `POST /api/cron/cancel-abandoned-payments`
- **Schedule:** Every 5 minutes (* * * * */5)
- **Purpose:** Cancels PENDING bookings that have no payment after 30 minutes
- **Impact:** Frees up hostel capacity blocked by abandoned bookings

---

## Verify Cron Jobs are Running

### Check Upstash Dashboard

1. Go to https://console.upstash.com/qstash
2. Click on **Schedules**
3. You should see both cron jobs listed:
   - `mark-completed-stays` (daily)
   - `cancel-abandoned-payments` (every 5 min)

### View Execution Logs

- Click on any schedule to see execution history
- Failed executions will show error details

---

## Testing Cron Locally

To test cron endpoints without Upstash, use curl:

```bash
# Test mark-completed-stays
curl -X POST http://localhost:3000/api/cron/mark-completed-stays \
  -H "Authorization: Bearer your-cron-secret"

# Test cancel-abandoned-payments
curl -X POST http://localhost:3000/api/cron/cancel-abandoned-payments \
  -H "Authorization: Bearer your-cron-secret"
```

Replace `your-cron-secret` with the `CRON_SECRET` value you set locally.

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
| `QSTASH_TOKEN` | ✅ Yes | Upstash QStash console |
| `CRON_SECRET` | ✅ Yes | Generate yourself |
| `APP_URL` | ✅ Yes | Your Vercel production URL |
| `UPSTASH_REDIS_REST_URL` | ✅ Yes | Upstash Redis console |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ Yes | Upstash Redis console |
| Other existing vars | ✅ Yes | (database, auth, payment, etc.) |

All other environment variables remain the same as before.
