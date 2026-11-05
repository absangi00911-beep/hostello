BEGIN;

LOCK TABLE "bookings", "rooms" IN SHARE ROW EXCLUSIVE MODE;

DO $preflight$
DECLARE
  roomless_bookings BIGINT;
  invalid_date_bookings BIGINT;
  invalid_guest_bookings BIGINT;
  unknown_room_bookings BIGINT;
  room_hostel_mismatches BIGINT;
  over_capacity_rooms BIGINT;
BEGIN
  WITH active AS (
    SELECT b.*
    FROM "bookings" b
    WHERE b.status::text IN ('PENDING', 'CONFIRMED')
      AND (NOT isfinite(b."checkOut") OR b."checkOut"::date > CURRENT_DATE)
  )
  SELECT
    count(*) FILTER (WHERE b."roomId" IS NULL),
    count(*) FILTER (
      WHERE NOT isfinite(b."checkIn")
         OR NOT isfinite(b."checkOut")
         OR b."checkOut"::date <= b."checkIn"::date
    ),
    count(*) FILTER (WHERE b.guests <= 0),
    count(*) FILTER (WHERE b."roomId" IS NOT NULL AND r.id IS NULL),
    count(*) FILTER (
      WHERE b."roomId" IS NOT NULL
        AND r.id IS NOT NULL
        AND r."hostelId" IS DISTINCT FROM b."hostelId"
    )
  INTO
    roomless_bookings,
    invalid_date_bookings,
    invalid_guest_bookings,
    unknown_room_bookings,
    room_hostel_mismatches
  FROM active b
  LEFT JOIN "rooms" r ON r.id = b."roomId";

  WITH active_valid AS (
    SELECT b."roomId", b."checkIn"::date AS check_in,
           b."checkOut"::date AS check_out, b.guests
    FROM "bookings" b
    JOIN "rooms" r ON r.id = b."roomId"
    WHERE b.status::text IN ('PENDING', 'CONFIRMED')
      AND b."checkOut"::date > CURRENT_DATE
      AND b."roomId" IS NOT NULL
      AND isfinite(b."checkIn")
      AND isfinite(b."checkOut")
      AND b."checkOut"::date > b."checkIn"::date
      AND b.guests > 0
      AND r."hostelId" = b."hostelId"
  ),
  events AS (
    SELECT "roomId", check_in AS event_date, guests AS delta
    FROM active_valid
    UNION ALL
    SELECT "roomId", check_out AS event_date, -guests AS delta
    FROM active_valid
  ),
  daily_events AS (
    SELECT "roomId", event_date, sum(delta) AS delta
    FROM events
    GROUP BY "roomId", event_date
  ),
  occupancy AS (
    SELECT "roomId",
           sum(delta) OVER (PARTITION BY "roomId" ORDER BY event_date) AS demand
    FROM daily_events
  )
  SELECT count(*)
  INTO over_capacity_rooms
  FROM (
    SELECT o."roomId"
    FROM occupancy o
    JOIN "rooms" r ON r.id = o."roomId"
    GROUP BY o."roomId", r.capacity
    HAVING max(o.demand) > r.capacity
  ) conflicts;

  IF roomless_bookings + invalid_date_bookings + invalid_guest_bookings
     + unknown_room_bookings + room_hostel_mismatches + over_capacity_rooms > 0 THEN
    RAISE EXCEPTION
      'seat-hold migration preflight blocked: roomless bookings %, invalid dates %, invalid guests %, unknown rooms %, room-hostel mismatches %, over-capacity rooms %',
      roomless_bookings,
      invalid_date_bookings,
      invalid_guest_bookings,
      unknown_room_bookings,
      room_hostel_mismatches,
      over_capacity_rooms;
  END IF;
END;
$preflight$;

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE "seat_holds" (
  "id" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "seatNo" INTEGER NOT NULL,
  "bookingId" TEXT NOT NULL,
  "checkIn" DATE NOT NULL,
  "checkOut" DATE NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "seat_holds_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "seat_holds_seatNo_check" CHECK ("seatNo" >= 1),
  CONSTRAINT "seat_holds_date_range_check" CHECK ("checkOut" > "checkIn"),
  CONSTRAINT "seat_holds_bookingId_seatNo_key" UNIQUE ("bookingId", "seatNo"),
  CONSTRAINT "seat_holds_roomId_fkey"
    FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "seat_holds_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "seat_holds_no_overlapping_seat"
    EXCLUDE USING gist (
      "roomId" WITH =,
      "seatNo" WITH =,
      daterange("checkIn", "checkOut", '[)') WITH &&
    )
);

CREATE INDEX "seat_holds_roomId_idx" ON "seat_holds"("roomId");
CREATE INDEX "seat_holds_bookingId_idx" ON "seat_holds"("bookingId");

DO $backfill$
DECLARE
  booking RECORD;
  requested_seat INTEGER;
  assigned_seat INTEGER;
BEGIN
  FOR booking IN
    SELECT b.id, b."roomId", b."checkIn"::date AS check_in,
           b."checkOut"::date AS check_out, b.guests, r.capacity
    FROM "bookings" b
    JOIN "rooms" r ON r.id = b."roomId"
    WHERE b.status::text IN ('PENDING', 'CONFIRMED')
      AND b."checkOut"::date > CURRENT_DATE
    ORDER BY b."roomId", b."checkIn"::date, b."checkOut"::date, b.id
  LOOP
    FOR requested_seat IN 1..booking.guests LOOP
      SELECT available.seat_no
      INTO assigned_seat
      FROM generate_series(1, booking.capacity) AS available(seat_no)
      WHERE NOT EXISTS (
        SELECT 1
        FROM "seat_holds" existing
        WHERE existing."roomId" = booking."roomId"
          AND existing."seatNo" = available.seat_no
          AND daterange(existing."checkIn", existing."checkOut", '[)')
              && daterange(booking.check_in, booking.check_out, '[)')
      )
      ORDER BY available.seat_no
      LIMIT 1;

      IF assigned_seat IS NULL THEN
        RAISE EXCEPTION 'seat-hold backfill found an unassignable seat';
      END IF;

      INSERT INTO "seat_holds" ("id", "roomId", "seatNo", "bookingId", "checkIn", "checkOut")
      VALUES (
        booking.id || '_seat_' || assigned_seat::text,
        booking."roomId",
        assigned_seat,
        booking.id,
        booking.check_in,
        booking.check_out
      );
      assigned_seat := NULL;
    END LOOP;
  END LOOP;
END;
$backfill$;

COMMIT;
