# Private Student Verification Storage

Student identity documents are sensitive uploads. New documents are written by an authenticated application route to a dedicated Cloudflare R2 bucket with public access disabled. The endpoint is student-only, rate-limited, caps the full request at 4.4 MB and the document at 4 MiB, and validates file signature before writing. Submission checks object metadata and signature again, then copies the verified bytes from a temporary key to a new review key that the client cannot modify. Only the review key is stored as `PENDING`. Admin review streams through an authenticated, no-store route. Approved and rejected documents are removed from private storage.

## Production setup

1. Create a dedicated R2 bucket (the example name is `hostello-private-verification`). Leave public bucket access and custom public domains disabled.
2. Create an R2 API token with **Object Read & Write**, scoped to this bucket only. The server uses it for uploads, signed metadata checks, admin reads, and deletion. Do not reuse the public listing-image token.
3. Set these server-only variables in Vercel for each environment:

   - `R2_ACCOUNT_ID`
   - `R2_VERIFICATION_BUCKET_NAME`
   - `R2_VERIFICATION_ACCESS_KEY_ID`
   - `R2_VERIFICATION_SECRET_ACCESS_KEY`

4. Verify that anonymous bucket reads fail and that the application rejects non-student uploads while permitting a student to submit and an admin to review a document. Browser CORS configuration is not needed because the browser sends the small file to the authenticated application route; the server writes to R2.

## Limits and legacy data

The application accepts JPEG, PNG, WebP, and PDF files up to 4 MiB. The 4.4 MB request cap leaves multipart overhead below Vercel Functions' 4.5 MB request-body limit. The server checks file size and byte signature before writing to R2, then checks R2 metadata and signature before submission. Upload/submission requests are limited to five per student per hour. The hourly `/api/cron/cleanup-verification-uploads` job deletes temporary objects older than one hour. Schedule it through `npm run schedule-cron` and confirm it appears in QStash.

Documents submitted before this private-storage change may still be publicly readable at their original R2 URLs. The admin UI now proxies legacy images through an authenticated route, but that does not revoke the original public URL. Before release, identify legacy verification objects from the production database, back up/migrate documents that must be retained, then delete their copies from the public bucket and confirm the old URLs return 404. This operation requires production database and R2 access and has not been performed from this workspace.

References: [Cloudflare R2 API token permissions](https://developers.cloudflare.com/r2/api/tokens/) and [Vercel Function limits](https://vercel.com/docs/functions/limitations).
