# Cloudflare R2 Storage Setup Guide

This guide walks you through setting up Cloudflare R2 for image storage on HostelLo.

## Quick Reference

**Required Environment Variables**:
```env
R2_ACCOUNT_ID=""              # Cloudflare account ID
R2_ACCESS_KEY_ID=""           # R2 API token access key
R2_SECRET_ACCESS_KEY=""       # R2 API token secret key
R2_BUCKET_NAME="hostello-uploads"
R2_PUBLIC_URL=""              # Critical for image URLs (e.g., https://images.hostello.com)
```

**What R2 Does**:
- Stores hostel images uploaded by owners
- Provides public URLs for hostel listings, compare pages, and dashboards
- Falls back to placeholder images if not configured (dev mode)

---

## Step 1: Create a Cloudflare Account

1. Go to [cloudflare.com](https://www.cloudflare.com)
2. Sign up or log in
3. Navigate to **Dashboard** → **Account** (top left)

---

## Step 2: Create an R2 Bucket

### In Cloudflare Dashboard:

1. Click **R2** in the left sidebar
2. Click **Create bucket**
3. **Bucket name**: `hostello-uploads` (or choose your own)
4. Choose a region (us-west for North America, eu for Europe, etc.)
5. Click **Create bucket**

---

## Step 3: Generate R2 API Token

### Create API Token:

1. In R2, scroll down to **R2 API tokens** section
2. Click **Create API token**
3. Enter:
   - **Token name**: `HostelLo App` (or similar)
   - **Permission**: Select `Edit` (allows read + write)
   - **Scope**: Choose your bucket (`hostello-uploads`)
4. **TTL** (Time-to-live): Leave as default or set to no expiration for production
5. Click **Create API token**

### Copy the Credentials:

You'll see a popup with three values — **copy all three immediately** (they won't appear again):
- `Access Key ID` → goes to `R2_ACCESS_KEY_ID`
- `Secret Access Key` → goes to `R2_SECRET_ACCESS_KEY`

---

## Step 4: Get Your Account ID

1. In R2, find the **Account ID** (shown at the top of the page or in API settings)
2. This is a long hexadecimal string
3. Copy it to `R2_ACCOUNT_ID`

---

## Step 5: Set Up Public URLs (Critical for Production)

### Option A: Cloudflare Dashboard (Easy)

1. In **R2**, click on your `hostello-uploads` bucket
2. Click **Settings** tab
3. Under **CORS**, configure:
   ```json
   [
     {
       "allowedOrigins": ["https://yourapp.com", "http://localhost:3000"],
       "allowedMethods": ["GET"],
       "allowedHeaders": ["Content-Type"],
       "maxAgeSeconds": 86400
     }
   ]
   ```

4. Under **Public access**, choose:
   - **R2 domain** (default, but rate-limited): No extra setup needed
   - **Custom domain** (recommended for production): See Option B below

### Option B: Custom Domain (Production Recommended)

For better performance and no rate limiting:

1. In Cloudflare Dashboard, go to **Domains**
2. Select your domain (e.g., `hostello.com`)
3. Go to **DNS** → **Records**
4. Add CNAME record:
   ```
   Name: images (creates images.hostello.com)
   Target: <your-account-id>.r2.cloudflarestorage.com
   Proxy status: Proxied (orange cloud)
   ```
5. Then in R2 Settings, add custom domain: `images.hostello.com`

---

## Step 6: Configure Environment Variables

In `.env.local` (development) and Vercel/production:

```env
# R2 Storage
R2_ACCOUNT_ID="abc123def456"                           # From step 4
R2_ACCESS_KEY_ID="1234567890abcdef"                   # From step 3
R2_SECRET_ACCESS_KEY="secret_abc123xyz789"             # From step 3 - keep secret!
R2_BUCKET_NAME="hostello-uploads"                      # Your bucket name
R2_PUBLIC_URL="https://images.hostello.com"            # From step 5
```

**⚠️ IMPORTANT**:
- Never commit `.env.local` to git
- `R2_SECRET_ACCESS_KEY` is sensitive — treat like a password
- In production, set these via Vercel environment variables (Settings → Environment Variables)

---

## Step 7: Test the Setup

### Local Test:

1. Start the dev server: `npm run dev`
2. Go to a hostel you own: `/dashboard/hostels/[hostel-id]`
3. Click "Upload image"
4. Select a small image and upload
5. Check the browser console:
   - ✅ Success: Image appears in hostel gallery
   - ❌ Failure: Check env variables and bucket CORS settings

### Production Test (Vercel):

1. Redeploy: `git push origin main`
2. Go to your production domain
3. Upload an image as an owner
4. Verify it appears correctly in listings

---

## Troubleshooting

### Error: "R2 not configured — returning placeholder URL"

**Cause**: One or more environment variables are missing or empty

**Fix**:
1. Verify all four variables are set:
   ```bash
   echo $R2_ACCOUNT_ID
   echo $R2_ACCESS_KEY_ID
   echo $R2_SECRET_ACCESS_KEY
   echo $R2_BUCKET_NAME
   ```
2. If using Vercel, check Environment Variables in project Settings
3. Restart dev server after updating `.env.local`

### Error: "NoSuchBucket"

**Cause**: Bucket name in `R2_BUCKET_NAME` doesn't exist

**Fix**:
1. Verify bucket name matches exactly (case-sensitive)
2. Check Cloudflare R2 dashboard for correct bucket name
3. Update `R2_BUCKET_NAME` in `.env.local` and restart

### Error: "SignatureDoesNotMatch" or "InvalidAccessKeyId"

**Cause**: `R2_ACCESS_KEY_ID` or `R2_SECRET_ACCESS_KEY` is incorrect

**Fix**:
1. Delete the old API token in Cloudflare
2. Create a new one and copy values carefully
3. Update both variables in `.env.local`
4. Restart dev server

### Error: "403 Forbidden" when viewing images

**Cause**: Bucket not publicly accessible or `R2_PUBLIC_URL` is wrong

**Fix**:
1. In R2 bucket Settings, ensure **Public access** is enabled
2. If using custom domain, verify CNAME record is configured correctly
3. Check `R2_PUBLIC_URL` matches your domain exactly (including https://)
4. Wait a few minutes for DNS propagation if you just added CNAME

### Images upload but don't display

**Cause**: `R2_PUBLIC_URL` is incorrect or bucket has CORS issues

**Fix**:
1. Check browser DevTools → Network tab
2. Look for image request — it should start with your `R2_PUBLIC_URL`
3. Verify CORS settings in R2 bucket allow `GET` from your domain:
   ```json
   {
     "allowedOrigins": ["https://yourapp.com", "http://localhost:3000"],
     "allowedMethods": ["GET"],
     "allowedHeaders": ["*"]
   }
   ```

---

## Security Best Practices

1. **Rotate API Tokens Regularly**
   - Delete old tokens in Cloudflare
   - Create new ones and update environment variables
   - Recommended: quarterly rotation

2. **Use Minimal Permissions**
   - API tokens should have only `Edit` (not full account admin)
   - Scope to specific buckets, not all of R2

3. **Separate Buckets by Environment**
   - Dev: `hostello-uploads-dev`
   - Production: `hostello-uploads`
   - Prevents accidental mixing

4. **Monitor R2 Usage**
   - Check Cloudflare billing for unexpected upload/bandwidth costs
   - Set up alerts for high usage

5. **Content Security**
   - All images are validated on upload (MIME type, file size)
   - Images are immutable (never overwritten, only deleted/replaced)
   - Bucket stores only images, no sensitive data

---

## File Structure in R2

After uploads, your R2 bucket will contain:

```
hostello-uploads/
├── hostels/
│   ├── 1704067200000-modern-bedroom.jpg
│   ├── 1704067234000-bathroom.jpg
│   └── 1704067268000-common-area.jpg
```

Format: `hostels/{timestamp}-{sanitized-filename}`

This ensures:
- Unique filenames (no collisions)
- Organized by type (extensible for documents, etc. later)
- Human-readable when needed

---

## Cost Estimate

**Cloudflare R2 Pricing** (as of 2026):
- Storage: $0.015/GB/month
- API requests: $4.50/million requests
- Bandwidth (outbound): Free for Cloudflare users*

*If using custom domain through Cloudflare, bandwidth may be free or discounted

**Example**: 1000 hostels × 5 images × 2MB average
- Storage: 10GB × $0.015 = ~$0.15/month
- API: Minimal (mostly reads)

Very cost-effective for a hostel platform.

---

## Next Steps

After R2 is configured:

1. ✅ Test uploading hostel images
2. ✅ Verify images appear on hostel cards in listings
3. ✅ Test on /hostels/compare page
4. ✅ Deploy to production and verify there
5. (Future) Add image optimization pipeline with Cloudflare Image Resizing

---

## References

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [AWS S3 SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/welcome.html)
- Project code: `src/app/api/upload/route.ts`
