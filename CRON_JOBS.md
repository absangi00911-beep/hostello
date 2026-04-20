# 🚀 Upstash QStash Cron Jobs Setup

Since your app is on **Vercel's Hobby tier**, Vercel Crons aren't available. We're using **Upstash QStash** instead — it's free and reliable!

## Quick Start (5 minutes)

### Step 1: Get Upstash Credentials
1. Create free account: [upstash.com](https://upstash.com)
2. Go to **QStash** → Copy your **API Token**

### Step 2: Set Environment Variables
Add to **Vercel Dashboard** → Project Settings → Environment Variables:
```
QSTASH_TOKEN=your_token_here
CRON_SECRET=generate_random_secret (use: openssl rand -base64 32)
APP_URL=https://your-app.vercel.app
```

Also add to `.env.local` for local development:
```
QSTASH_TOKEN=your_token_here
CRON_SECRET=your_random_secret
APP_URL=http://localhost:3000
```

### Step 3: Schedule the Jobs
After deploying to Vercel, run in your terminal:
```bash
npm run schedule-cron
```

This creates two recurring jobs in Upstash:
- ✅ **Mark Completed Stays** - Daily at midnight UTC
- ✅ **Cancel Abandoned Payments** - Every 5 minutes

### Step 4: Verify
1. Check [Upstash Dashboard](https://console.upstash.com/qstash) → Schedules
2. You should see both jobs listed
3. Click to view execution logs

---

## What Just Changed?

✅ Removed `vercel.json` cron configuration (not available on Hobby tier)
✅ Added `@upstash/qstash` package
✅ Created `scripts/schedule-cron-jobs.ts` to manage schedules
✅ Updated `ENVIRONMENT_SETUP.md` with new instructions

---

## Cron Jobs Explained

### 1️⃣ Mark Completed Stays
- **Runs:** Daily at 00:00 UTC
- **Does:** Marks bookings as COMPLETED after checkout
- **Why:** So users can leave reviews

### 2️⃣ Cancel Abandoned Payments  
- **Runs:** Every 5 minutes
- **Does:** Cancels bookings stuck in PENDING for 30+ minutes
- **Why:** Frees up hostel rooms

---

## Testing Locally

```bash
# Test an endpoint directly
curl -X POST http://localhost:3000/api/cron/mark-completed-stays \
  -H "Authorization: Bearer your_cron_secret"
```

---

## Need Help?

- **Upstash Docs:** https://upstash.com/docs/qstash
- **Cron Expression Help:** https://crontab.guru/
- **View Logs:** [Upstash Dashboard](https://console.upstash.com/qstash)

Enjoy hassle-free cron jobs! 🎉
