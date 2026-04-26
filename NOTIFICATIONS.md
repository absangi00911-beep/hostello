# In-App Notification System Documentation

## Overview

A complete in-app notification system has been implemented to notify hostel owners of booking requests, reviews, and other important events. Previously, owners only received email notifications and had no way to see notifications within the app.

## Features

- **Real-time notifications** with unread badges in the navbar
- **Notification bell** showing unread count
- **Notification panel** with recent notifications (dropdown from navbar)
- **Full notification center** at `/notifications` for viewing all notifications
- **Auto-polling** every 30 seconds to fetch new notifications
- **Mark as read** functionality (individual or all at once)
- **Delete notifications** capability
- **Direct links** to related bookings/reviews from notifications
- **Rich notification types** with emoji indicators

## Database Schema

### New Enum: `NotificationType`
```
- BOOKING_REQUEST: New booking request received
- BOOKING_CONFIRMED: Booking was confirmed
- BOOKING_CANCELLED: Booking was cancelled
- BOOKING_COMPLETED: Booking completion
- MESSAGE_RECEIVED: New message in conversation
- REVIEW_RECEIVED: New review posted
- HOSTEL_APPROVED: Hostel was approved by admin
- HOSTEL_REJECTED: Hostel was rejected by admin
```

### New Table: `notifications`
```prisma
model Notification {
  id String @id @default(cuid())
  userId String              // Owner receiving the notification
  type NotificationType
  title String              // "New Booking Request"
  message String            // "John Doe has requested booking for..."
  bookingId String?          // Link to related booking
  reviewId String?           // Link to related review
  hostelId String?           // Link to related hostel
  read Boolean @default(false)
  readAt DateTime?
  createdAt DateTime @default(now())
}
```

**Indexes:**
- `userId` - Fast lookup of notifications for a user
- `bookingId` - Fast lookup of notifications for a booking
- `read` - Fast unread count queries
- `createdAt` - Chronological sorting

## Migration

Run the migration to add notifications table:
```bash
# If using prisma migrate
npx prisma migrate deploy

# Or manually run migration
# prisma/migrations/2_add_notifications/migration.sql
```

## API Endpoints

### GET `/api/notifications`
Fetch notifications with pagination and unread count.

**Query Parameters:**
- `limit` (optional, default: 10, max: 50) - Results per page
- `page` (optional, default: 1) - Page number

**Response:**
```json
{
  "data": [
    {
      "id": "...",
      "type": "BOOKING_REQUEST",
      "title": "New Booking Request",
      "message": "...",
      "read": false,
      "createdAt": "2026-04-25T10:00:00Z",
      "booking": {
        "id": "...",
        "status": "PENDING",
        "hostel": { "id": "...", "name": "..." }
      }
    }
  ],
  "unreadCount": 3,
  "total": 15,
  "page": 1,
  "limit": 10,
  "hasMore": true
}
```

### PUT `/api/notifications`
Bulk action on notifications.

**Body:**
```json
{
  "action": "read-all"
}
```

### PUT `/api/notifications/[id]`
Mark a single notification as read.

**Response:**
```json
{
  "message": "Notification marked as read."
}
```

### DELETE `/api/notifications/[id]`
Delete a notification.

**Response:**
```json
{
  "message": "Notification deleted."
}
```

## Frontend Components

### 1. `useNotifications` Hook
Custom React hook for managing notification state and operations.

**Usage:**
```typescript
const {
  notifications,    // Array of notifications
  unreadCount,      // Number of unread notifications
  loading,          // Loading state
  error,            // Error object
  markAsRead,       // Function to mark one as read
  markAllAsRead,    // Function to mark all as read
  deleteNotification, // Function to delete one
  refetch           // Function to manually refetch
} = useNotifications();
```

**Features:**
- Auto-fetches on mount
- Polls for new notifications every 30 seconds
- Caches locally to reduce API calls
- Handles errors gracefully

### 2. `NotificationBell` Component
Bell icon with unread badge and dropdown panel for recent notifications.

**Props:**
```typescript
interface NotificationBellProps {
  solid?: boolean;  // Whether to use solid styling (vs transparent)
}
```

**Features:**
- Shows red badge with unread count
- Dropdown panel with last 20 notifications
- Quick actions: mark as read, delete
- Link to full notification center
- Click notification to navigate to related booking

**Location:** `/src/components/shared/notification-bell.tsx`

### 3. Notification Center Page
Full-page view of all notifications at `/notifications`

**Features:**
- Filter by "All" or "Unread"
- View all notification history
- Detailed info with timestamps
- Quick links to related bookings
- Bulk actions from here

**Location:** `/src/app/(main)/notifications/page.tsx`

## Integration Points

### 1. Booking Creation (Done ✓)
When a new booking is created:

**File:** `src/app/api/bookings/route.ts`

```typescript
// Create in-app notification for owner
void createNotification({
  userId: hostel.owner.id,
  type: "BOOKING_REQUEST",
  title: "New Booking Request",
  message: `${student.name} has requested a booking for ${hostel.name}...`,
  bookingId: booking.id,
  hostelId: hostel.id,
});
```

### 2. Navbar Integration (Done ✓)
Owners see notification bell in navbar.

**File:** `src/components/layout/navbar.tsx`

```typescript
{session.user.role === "OWNER" && (
  <>
    <NotificationBell solid={solid} />
    <Link href="/dashboard/hostels/new">List hostel</Link>
  </>
)}
```

## Future Enhancement Opportunities

1. **Email preference settings** - Allow owners to choose notification methods (in-app, email, both)
2. **Notification grouping** - Group similar notifications (e.g., "3 new bookings")
3. **Web Push notifications** - Send push notifications to owner's browser
4. **Notification filters** - Filter by booking, review, system notifications
5. **Notification actions** - Quick approve/reject from notification
6. **Message notifications** - When new messages arrive in conversations
7. **Real-time WebSocket** - Replace polling with real-time WebSocket connection
8. **Admin notifications** - System notifications for admins (new listings, reported issues)

## Performance Considerations

- **Polling interval:** 30 seconds (configurable)
- **Pagination:** 20 notifications loaded initially, 50 max per page
- **Indexes on:** userId, bookingId, read status, creation date
- **Lazy loading:** Notifications only fetched when component mounts
- **Automatic cleanup:** Polling interval cleaned up on component unmount

## Security Notes

- All endpoints require authentication (`auth()`)
- Users can only view their own notifications
- Users can only delete/modify their own notifications
- Email not exposed to frontend
- Timestamps use ISO 8601 format

## Testing Checklist

- [ ] Create a booking as a student
- [ ] Verify owner receives notification
- [ ] Verify unread count badge appears
- [ ] Verify notification bell dropdown shows notification
- [ ] Click notification to view booking details
- [ ] Mark notification as read
- [ ] Mark all notifications as read
- [ ] Delete notification
- [ ] Visit `/notifications` page
- [ ] Filter between "All" and "Unread"
- [ ] Verify notifications update after 30 seconds
- [ ] Test with multiple unread notifications
- [ ] Verify styling on light/dark backgrounds

## User Experience Flow

1. **Student creates booking** → Booking API creates notification
2. **Owner sees red badge** with unread count in navbar
3. **Owner clicks bell** → Sees dropdown with recent notifications
4. **Owner clicks notification** → Navigates to booking details
5. **Owner clicks "Mark as read"** → Notification marked, badge updates
6. **Owner can view all** → Click "View all notifications" or visit `/notifications`

## Troubleshooting

**Notifications not appearing:**
- Check database migration ran successfully
- Verify user has "OWNER" role
- Check browser console for API errors
- Clear browser cache and reload

**Unread count not updating:**
- Check network tab for API requests
- Verify polling is working (30-second interval)
- Try manual refetch by clicking notification bell

**Notifications not persisting:**
- Verify database connection
- Check for errors in server logs
- Ensure Prisma schema is up to date

## Files Modified/Created

### Created:
- `prisma/migrations/2_add_notifications/migration.sql` - Database schema
- `src/lib/notifications.ts` - Core notification service
- `src/app/api/notifications/route.ts` - GET/PUT endpoints
- `src/app/api/notifications/[id]/route.ts` - Single notification endpoints
- `src/hooks/use-notifications.ts` - React hook
- `src/components/shared/notification-bell.tsx` - UI component
- `src/app/(main)/notifications/page.tsx` - Notification center page

### Modified:
- `prisma/schema.prisma` - Added Notification model & enum
- `src/app/api/bookings/route.ts` - Hook notification creation
- `src/components/layout/navbar.tsx` - Added notification bell

## Next Steps

1. Run database migration: `npx prisma migrate deploy`
2. Test notification creation on booking
3. Monitor polling performance
4. Gather user feedback on notification UX
5. Consider implementing WebSocket for real-time updates
