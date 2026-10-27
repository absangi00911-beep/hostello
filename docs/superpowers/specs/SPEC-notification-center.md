# Spec: `notification-center`

## Objective

Give all signed-in roles one accessible in-app place to view and manage their
notifications, including availability-alert notifications.

## Scope

- Notification list, unread count, individual mark-read, mark-all-read, and
  delete actions using the existing notification API.
- Role-specific navigation badge and clear links to the related booking,
  hostel, verification, report, or alert destination.
- Loading, empty, read/unread, pagination, and error states.
- Availability notifications are English-only and in-app only.

## Existing interfaces

- `GET /api/notifications` provides paginated data and unread count.
- `PUT /api/notifications` marks all notifications read.
- `PUT /api/notifications/[id]` marks one as read.
- `DELETE /api/notifications/[id]` deletes one notification.

## Boundaries

- Scope reads and writes to the authenticated user.
- Do not add email, SMS, push delivery, or a new real-time transport.
- Keep transactional notification creation coupled to the underlying business
  state when required by its producer.

## Success criteria

- Each role can reach the notification center from the shared shell.
- Unread count remains consistent after individual and bulk read actions.
- Notification links are safe and lead only to authorized destinations.
- Failed requests are visible and recoverable; no silent success state.

## Testing

- Component tests for unread, empty, pagination, and error states.
- API tests for user scoping, read actions, and deletion.
- Browser test for notification navigation and read-state feedback.
