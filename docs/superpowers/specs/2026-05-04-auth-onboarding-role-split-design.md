# Auth Onboarding Role Split Design

## Context

Hostello serves two account types: students looking for verified hostels and owners managing listings, inquiries, and bookings. The current signup page always submits `role: "STUDENT"` even though the backend already accepts `STUDENT` and `OWNER`. The redesign should make role selection explicit while keeping onboarding light.

This is product UI. The interface should feel trustworthy, fast, and familiar. It should avoid decorative complexity, heavy marketing language, and multi-step setup before the user has an account.

## Goals

- Let new users choose between student and owner accounts before submitting signup.
- Keep signup as a single page with one shared form.
- Send the selected role to the existing signup API.
- Make success copy and next-step guidance role-aware.
- Improve the auth layout so it feels calmer, more concrete, and more consistent with Hostello's product design system.

## Non-Goals

- No separate `/signup/student` or `/signup/owner` routes.
- No multi-step wizard.
- No profile preferences, university details, city selection, hostel listing creation, or owner business details during signup.
- No schema or database role changes.

## UX Flow

1. The user opens `/signup`.
2. The page asks: "What brings you to Hostello?"
3. The user chooses one role:
   - Student: "I'm looking for a hostel"
   - Owner: "I manage a hostel"
4. The shared account form stays visible below the role selector, with the selected role highlighted.
5. The form collects full name, email, Pakistani phone number, password, and confirm password.
6. Submitting the form calls `/api/auth/signup` with `role: "STUDENT"` or `role: "OWNER"`.
7. The success state confirms that a verification email was sent and shows role-aware next-step copy.

Default role should be `STUDENT` to preserve current behavior and reduce friction for the primary audience, but the role choice must be visible and selectable before submit.

## Signup Content

### Shared Header

Title: "Create your Hostello account"

Subtitle changes after role selection:
- Student: "Save hostels, message owners, and book verified places directly."
- Owner: "List your rooms, manage inquiries, and track bookings from one dashboard."

### Role Selector

The role selector uses two equal-width choice controls rather than tabs. Each option includes a small icon or text mark, a direct label, and one supporting line.

Student option:
- Label: "I'm looking for a hostel"
- Supporting line: "Search, save, message, and book verified places."

Owner option:
- Label: "I manage a hostel"
- Supporting line: "List rooms, manage bookings, and reply from one dashboard."

Selected state:
- Primary indigo border.
- Very light indigo background.
- Stronger label weight.
- Accessible selected indication via `aria-pressed` or radio semantics.

### Form

Fields remain shared:
- Full name
- Email address
- Phone number
- Password
- Confirm password

Labels should avoid asterisks where possible. Use helper copy instead:
- Phone helper: "Use a Pakistani number, for example +923001234567."
- Password helper: "At least 8 characters, including one uppercase letter and one number."

Primary CTA changes by role:
- Student: "Create student account"
- Owner: "Create owner account"

### Success State

The success state remains on the signup page after account creation.

Student success:
- Title: "Check your email"
- Body: "We sent a verification link to [email]. Verify your account, then continue searching verified hostels."
- CTA: "Go to sign in"

Owner success:
- Title: "Check your email"
- Body: "We sent a verification link to [email]. Verify your account, then continue to your owner dashboard."
- CTA: "Go to sign in"

## Login

Login should remain role-neutral. One account can access the correct post-login experience through existing session role logic.

Recommended copy:
- Title: "Welcome back"
- Subtitle: "Access bookings, messages, saved hostels, and listing tools from one account."

No role selector is needed on login.

## Layout

Desktop layout:
- Two columns inside the existing auth layout.
- Left column contains the form.
- Right column contains trust and next-step context.
- Avoid wrapping the form in a heavy nested card.

Mobile layout:
- Single column.
- Signup role selector stacks vertically below 360px.
- Form appears before trust details.
- Trust panel can be simplified or moved beneath the form.

The side panel should move away from the current saturated gradient block. Use a tinted neutral surface with concrete, scannable trust details.

## Side Panel

The side panel should support the active auth page and selected signup role.

For signup, show "What happens next" with a three-step preview:
- Student: "Verify email", "Search verified hostels", "Book directly"
- Owner: "Verify email", "Add your first listing", "Manage bookings"

For login, show stable trust points:
- Verified hostel listings
- Real reviews and direct messages
- One dashboard for bookings and listing tools

The panel should not use generic inflated metrics unless those metrics are verified and maintained.

## Visual Treatment

Theme scene: a student or owner uses the auth screen on a phone or laptop in the evening, wanting speed and reassurance before entering personal details.

Color strategy: restrained product UI.
- Use the existing indigo accent only for selected state, links, focus, and primary action.
- Use warm neutral surfaces for the page and side panel.
- Use semantic colors for errors and success only.
- Avoid gradient text, decorative glass effects, side-stripe borders, and nested card grids.

Typography:
- Keep the existing Inter/Figtree system.
- Use compact product hierarchy, not oversized hero type.
- Keep labels and helper text legible on mobile.

Motion:
- Use 150-200ms transitions for role selection, focus, and button states.
- Respect `prefers-reduced-motion`.
- No page-load choreography.

## States And Validation

The form must include:
- Default, hover, focus, disabled, and loading states for inputs and buttons.
- Error state for missing fields, invalid email, invalid Pakistani phone number, weak password, mismatched passwords, duplicate email, and rate limiting.
- Success state for both roles.

Validation copy should be specific and human:
- "Enter a valid Pakistani phone number."
- "Use at least 8 characters, including one uppercase letter and one number."
- "Passwords do not match."

## Accessibility

- Role choices should be keyboard reachable and screen-reader understandable.
- Focus rings must remain visible.
- The selected role must not be conveyed by color alone.
- Error messages should be close to the form and announced clearly.
- Inputs must retain visible labels.
- Touch targets should be at least 44px tall.

## Implementation Notes

- Update `src/app/(auth)/signup/page.tsx` to track `role: "STUDENT" | "OWNER"` in component state.
- Submit the selected role instead of the current hardcoded `STUDENT`.
- Update `src/app/(auth)/signup/signup.module.css` for the role selector, helper text, and improved success state.
- Keep `src/app/(auth)/layout.tsx` role-neutral. Place the role-aware next-step preview inside `src/app/(auth)/signup/page.tsx` so the layout does not need signup state.
- Consider aligning client-side validation with `signupSchema`, especially password strength and Pakistani phone format.

## Testing

- Verify student signup submits `role: "STUDENT"`.
- Verify owner signup submits `role: "OWNER"`.
- Verify the default role remains student.
- Verify validation errors for missing fields, invalid email, invalid phone, weak password, and password mismatch.
- Verify success copy changes by selected role.
- Verify keyboard selection and focus behavior for role choices.
- Verify mobile layout at 375px and desktop layout around 1280px.
