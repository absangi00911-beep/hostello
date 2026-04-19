# Billing & Pricing Arithmetic

## Current Implementation: Calendar Month Boundary Counting

### How `calculateMonths()` Works

Located in `src/lib/utils.ts`:

```typescript
const months = (checkOut.getFullYear() - checkIn.getFullYear()) * 12 +
               (checkOut.getMonth() - checkIn.getMonth());
return Math.max(1, months);
```

This counts calendar month boundaries, not actual duration. Examples:

- **Jan 1 → Jan 30** = 0 months → floored to **1 month**
- **Jan 31 → Feb 1** = 1 month  
- **Jan 1 → Feb 1** = 1 month
- **Mar 15 → Apr 14** = 0 months → **1 month**
- **Mar 15 → Apr 15** = 1 month

### The Problem

Customers booking for **29 days in the same calendar month** pay 1 full month, but those crossing from Jan 31 → Feb 1 (just **2 days**) also pay 1 month. This creates unpredictable pricing.

### Current Behavior: DOCUMENTED CHOICE

✅ **We have chosen this approach intentionally** because:
1. Hostels typically operate on month-to-month leases
2. Simplifies calculations for owners who think in "months"
3. Matches property industry conventions
4. Server-side and client-side use same function → consistent billing

**BUT:** Users should see this clearly in the UI with a breakdown:

```
Checkout: Mar 15, 2026
Move-in: Apr 15, 2026
Duration: Counted as 1 calendar month
Price: ₨50,000 × 1 = ₨50,000
```

## Recommendations

### Option A: Keep Current (Recommended)
- Continue month-boundary counting
- **Update UI** to explicitly show "Booked for X calendar months"
- Add tooltip: "Pricing based on calendar month boundaries. Example: Jan 31 → Feb 1 = 1 month"

### Option B: Switch to Duration-Based (Fairer)
```typescript
const daysDiff = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
const months = Math.max(1, Math.ceil(daysDiff / 30));
```
- Charges based on actual days (30 days = 1 month)
- More transparent but requires **user communication** about pricing change

### Option C: Prorated Daily Pricing (Most Fair)
```typescript
const daysDiff = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24);
const total = (daysDiff / 30) * hostel.pricePerMonth;
```
- Calculate per-day rate: `pricePerMonth / 30`
- Charge for exact days used
- Requires UI overhaul to show daily rates

## Action Items

1. **Choose approach** (A, B, or C above)
2. **Update UI** in `src/components/features/booking` to show pricing breakdown
3. **Communicate change** to all registered hostel owners
4. **Test edge cases**:
   - Same-month bookings (Jan 1 → Jan 30)
   - Month-boundary bookings (Jan 31 → Feb 1)
   - Multi-month bookings (Jan 15 → Mar 15)

## Testing Examples

```typescript
// Current behavior (Option A)
calculateMonths(new Date("2026-01-01"), new Date("2026-01-30")); // 1 month
calculateMonths(new Date("2026-01-31"), new Date("2026-02-01")); // 1 month
calculateMonths(new Date("2026-01-01"), new Date("2026-03-01")); // 2 months

// If switching to Option B (duration-based)
// Jan 1 → Jan 30 = 29 days = 1 month (rounded up)
// Jan 31 → Feb 1 = 2 days = 1 month (rounded up)
// Jan 1 → Mar 1 = 60 days = 2 months
```

## Database Schema

The `Booking` model already has these fields:
- `checkIn: DateTime` — guest arrival date
- `checkOut: DateTime` — guest departure date  
- `months: Int` — calculated months (used for reference/analytics)
- `total: Int` — total charge in PKR

No schema changes needed for any option.
