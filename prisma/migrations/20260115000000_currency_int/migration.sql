-- Change floating-point currency columns to integers to prevent precision issues.
-- All values are multiplied by 1 since they're already whole numbers in PKR.

-- Convert Hostel.pricePerMonth from Float to Int
ALTER TABLE "hostels" 
  ALTER COLUMN "pricePerMonth" TYPE integer;

-- Convert Room.pricePerMonth from Float to Int
ALTER TABLE "rooms" 
  ALTER COLUMN "pricePerMonth" TYPE integer;

-- Convert Booking.total from Float to Int
ALTER TABLE "bookings" 
  ALTER COLUMN "total" TYPE integer;

-- PriceAlert.targetPrice remains Float since it's for user-defined thresholds,
-- not primary currency storage. If needed, can be converted separately.
