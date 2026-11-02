-- Hostels created before cancellation policies existed have a NULL policy, which
-- blocks booking ("Booking is temporarily unavailable while cancellation terms
-- are updated."). Give them the STANDARD terms so they are bookable again.
-- Owners can change this at any time from the listing editor, and existing
-- bookings are unaffected because they snapshot their own policy.
UPDATE "hostels"
SET "cancellationPolicy" = 'STANDARD'
WHERE "cancellationPolicy" IS NULL;
