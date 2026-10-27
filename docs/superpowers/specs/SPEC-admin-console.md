# Spec: `admin-console`

## Objective

Restore admin screens for the moderation, verification, and payment operations
already implemented by the backend.

## Dependencies

- `web-foundation`
- `notification-center`

## Scope

- Overview and listing review/status controls.
- Student verification queue, document review, and analytics.
- Roommate-report moderation.
- Refunds, payouts, payment-event inspection/retry, listing statistics, and
  search-index synchronization.
- Admin booking detail and authorized operational actions where current APIs
  permit them.

## Boundaries

- No user-account management; supporting APIs do not exist.
- Preserve existing server-side admin checks and audit behavior.
- Never display ID documents or payment/bank details outside existing
  authenticated routes.
- Confirmation dialogs are reserved for irreversible refund, payout, and
  destructive moderation actions; show pending/uncertain states explicitly.

## Success criteria

- Every existing admin workflow in scope has a navigable screen with a clear
  queue/detail/action path.
- Loading, empty, error, permission, and uncertain payment states are explicit.
- No unsupported action is shown as if it succeeded.
- Sensitive data is only requested from the existing protected endpoint and is
  not persisted in client-side logs or unrelated UI state.

## Testing

- Role guard and action-state component tests.
- API tests for authorization and audit-relevant actions.
- Browser smoke test for listing review and one payment-operations flow using
  non-production data.
