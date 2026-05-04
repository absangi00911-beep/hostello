# Auth Onboarding Role Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a light, role-first signup flow where students and owners choose their account type before submitting the shared auth form.

**Architecture:** Keep the auth routes and API unchanged. Store the selected signup role in the signup page component, submit it to the existing `/api/auth/signup` endpoint, and keep role-aware copy local to signup so the shared auth layout remains role-neutral. Improve styling through existing CSS modules and global design tokens.

**Tech Stack:** Next.js App Router, React client components, TypeScript, CSS Modules, existing `Button` component, existing Zod-backed signup API.

---

## File Structure

- Modify `src/app/(auth)/signup/page.tsx`: add `SignupRole` state, role choice data, role-aware copy, aligned client validation, role-aware submit payload, and role-aware success state.
- Modify `src/app/(auth)/signup/signup.module.css`: add role selector, helper text, next-step preview, refined form spacing, accessible states, and responsive behavior.
- Modify `src/app/(auth)/login/page.tsx`: update subtitle copy only.
- Modify `src/app/(auth)/layout.tsx`: replace generic metric-like feature copy with stable trust points.
- Modify `src/app/(auth)/layout.module.css`: restyle the side panel from saturated gradient to restrained neutral trust panel.
- No new routes, schema changes, API changes, or database migrations.

## Task 1: Add Role State And Role-Aware Signup Copy

**Files:**
- Modify: `src/app/(auth)/signup/page.tsx`

- [ ] **Step 1: Add the role type and role content above `SignupPage`**

Add this code after the imports:

```tsx
type SignupRole = 'STUDENT' | 'OWNER'

const roleOptions: Array<{
  value: SignupRole
  mark: string
  label: string
  description: string
}> = [
  {
    value: 'STUDENT',
    mark: 'Search',
    label: "I'm looking for a hostel",
    description: 'Search, save, message, and book verified places.',
  },
  {
    value: 'OWNER',
    mark: 'Manage',
    label: 'I manage a hostel',
    description: 'List rooms, manage bookings, and reply from one dashboard.',
  },
]

const roleCopy: Record<
  SignupRole,
  {
    subtitle: string
    cta: string
    successBody: string
    nextSteps: string[]
  }
> = {
  STUDENT: {
    subtitle: 'Save hostels, message owners, and book verified places directly.',
    cta: 'Create student account',
    successBody: 'Verify your account, then continue searching verified hostels.',
    nextSteps: ['Verify email', 'Search verified hostels', 'Book directly'],
  },
  OWNER: {
    subtitle: 'List your rooms, manage inquiries, and track bookings from one dashboard.',
    cta: 'Create owner account',
    successBody: 'Verify your account, then continue to your owner dashboard.',
    nextSteps: ['Verify email', 'Add your first listing', 'Manage bookings'],
  },
}
```

- [ ] **Step 2: Add selected role state**

Inside `SignupPage`, after the existing `success` state:

```tsx
const [selectedRole, setSelectedRole] = useState<SignupRole>('STUDENT')
```

- [ ] **Step 3: Submit selected role instead of hardcoded student**

Replace this line inside the signup request body:

```tsx
role: 'STUDENT',
```

with:

```tsx
role: selectedRole,
```

- [ ] **Step 4: Run lint for TypeScript syntax**

Run:

```bash
npm run lint
```

Expected: no syntax errors from `src/app/(auth)/signup/page.tsx`. Existing unrelated lint findings, if any, must be recorded before continuing.

- [ ] **Step 5: Commit**

```bash
git add -- src/app/(auth)/signup/page.tsx
git commit -m "Add signup role state"
```

## Task 2: Render The Role Selector

**Files:**
- Modify: `src/app/(auth)/signup/page.tsx`
- Modify: `src/app/(auth)/signup/signup.module.css`

- [ ] **Step 1: Replace the signup header copy**

In `src/app/(auth)/signup/page.tsx`, replace the header block with:

```tsx
<div className={styles.header}>
  <h1 className={styles.title}>Create your Hostello account</h1>
  <p className={styles.subtitle}>{roleCopy[selectedRole].subtitle}</p>
</div>
```

- [ ] **Step 2: Insert the role selector before the form**

Place this JSX between the header and `<form>`:

```tsx
<section className={styles.roleSection} aria-labelledby="role-heading">
  <div className={styles.roleHeader}>
    <h2 id="role-heading" className={styles.roleTitle}>
      What brings you to Hostello?
    </h2>
    <p className={styles.roleHint}>Choose the account type that matches how you will use Hostello.</p>
  </div>

  <div className={styles.roleGrid} role="radiogroup" aria-labelledby="role-heading">
    {roleOptions.map((option) => {
      const isSelected = selectedRole === option.value

      return (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={isSelected}
          className={`${styles.roleOption} ${isSelected ? styles.roleOptionSelected : ''}`}
          onClick={() => setSelectedRole(option.value)}
          disabled={isLoading}
        >
          <span className={styles.roleMark}>{option.mark}</span>
          <span className={styles.roleText}>
            <span className={styles.roleLabel}>{option.label}</span>
            <span className={styles.roleDescription}>{option.description}</span>
          </span>
        </button>
      )
    })}
  </div>
</section>
```

- [ ] **Step 3: Add role selector CSS**

Add this to `src/app/(auth)/signup/signup.module.css` after `.subtitle`:

```css
.roleSection {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.roleHeader {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.roleTitle {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.3;
  letter-spacing: 0;
}

.roleHint {
  font-size: 0.875rem;
  color: var(--color-text-soft);
  line-height: 1.5;
}

.roleGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-sm);
}

.roleOption {
  min-height: 92px;
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  text-align: left;
}

.roleOption:hover:not(:disabled) {
  border-color: var(--color-primary-300);
  background: var(--color-primary-50);
}

.roleOption:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

.roleOptionSelected {
  border-color: var(--color-primary-500);
  background: var(--color-primary-50);
  box-shadow: inset 0 0 0 1px var(--color-primary-500);
}

.roleMark {
  flex: 0 0 auto;
  padding: 3px 7px;
  border-radius: var(--radius-sm);
  background: var(--color-ground);
  color: var(--color-primary-700);
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.4;
}

.roleText {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.roleLabel {
  font-size: 0.9375rem;
  font-weight: 700;
  line-height: 1.35;
}

.roleDescription {
  font-size: 0.8125rem;
  color: var(--color-text-soft);
  line-height: 1.45;
}
```

- [ ] **Step 4: Add the small-screen stack**

Add this inside the existing mobile media area or at the bottom of the CSS file:

```css
@media (max-width: 360px) {
  .roleGrid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: Run lint**

Run:

```bash
npm run lint
```

Expected: no new lint errors from the signup page or CSS module import usage.

- [ ] **Step 6: Commit**

```bash
git add -- src/app/(auth)/signup/page.tsx src/app/(auth)/signup/signup.module.css
git commit -m "Add role-first signup selector"
```

## Task 3: Align Signup Form Validation And Helper Copy

**Files:**
- Modify: `src/app/(auth)/signup/page.tsx`
- Modify: `src/app/(auth)/signup/signup.module.css`

- [ ] **Step 1: Replace client-side password and phone validation**

In `handleSubmit`, replace the current password length check and phone regex check with:

```tsx
if (formData.password.length < 8) {
  throw new Error('Use at least 8 characters, including one uppercase letter and one number.')
}

if (!/[A-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
  throw new Error('Use at least 8 characters, including one uppercase letter and one number.')
}

if (formData.password !== formData.confirmPassword) {
  throw new Error('Passwords do not match.')
}

if (!/^(\+92|0)[0-9]{10}$/.test(formData.phone.replace(/\s/g, ''))) {
  throw new Error('Enter a valid Pakistani phone number.')
}
```

Keep the missing-field and email checks before these checks.

- [ ] **Step 2: Update required labels and helper text**

Use labels without asterisks and add helper paragraphs for phone and password:

```tsx
<label htmlFor="phone" className={styles.label}>
  Phone number
</label>
<input
  type="tel"
  id="phone"
  name="phone"
  value={formData.phone}
  onChange={handleChange}
  placeholder="+923001234567"
  className={styles.input}
  disabled={isLoading}
/>
<p className={styles.fieldHint}>Use a Pakistani number, for example +923001234567.</p>
```

For password:

```tsx
<label htmlFor="password" className={styles.label}>
  Password
</label>
<input
  type="password"
  id="password"
  name="password"
  value={formData.password}
  onChange={handleChange}
  placeholder="Enter a strong password"
  className={styles.input}
  disabled={isLoading}
/>
<p className={styles.fieldHint}>At least 8 characters, including one uppercase letter and one number.</p>
```

Also remove asterisks from the full name, email, and confirm password labels.

- [ ] **Step 3: Change the submit button copy**

Replace:

```tsx
{isLoading ? 'Creating Account...' : 'Create Account'}
```

with:

```tsx
{isLoading ? 'Creating account...' : roleCopy[selectedRole].cta}
```

- [ ] **Step 4: Add helper text CSS**

Add this to `src/app/(auth)/signup/signup.module.css` near `.label`:

```css
.fieldHint {
  margin-top: -2px;
  font-size: 0.78rem;
  color: var(--color-text-muted);
  line-height: 1.45;
}
```

- [ ] **Step 5: Run lint**

Run:

```bash
npm run lint
```

Expected: no new lint errors.

- [ ] **Step 6: Commit**

```bash
git add -- src/app/(auth)/signup/page.tsx src/app/(auth)/signup/signup.module.css
git commit -m "Align signup validation copy"
```

## Task 4: Add Role-Aware Success And Next-Step Preview

**Files:**
- Modify: `src/app/(auth)/signup/page.tsx`
- Modify: `src/app/(auth)/signup/signup.module.css`

- [ ] **Step 1: Update the success state JSX**

Replace the current success card content with:

```tsx
<div className={styles.successCard}>
  <div className={styles.successIcon}>✓</div>
  <h2 className={styles.successTitle}>Check your email</h2>
  <p className={styles.successText}>
    We sent a verification link to <strong>{formData.email}</strong>.{' '}
    {roleCopy[selectedRole].successBody}
  </p>
  <div className={styles.nextSteps} aria-label="Next steps">
    {roleCopy[selectedRole].nextSteps.map((step, index) => (
      <div key={step} className={styles.nextStep}>
        <span className={styles.nextStepNumber}>{index + 1}</span>
        <span>{step}</span>
      </div>
    ))}
  </div>
  <Link href="/login">
    <Button fullWidth>
      Go to sign in
    </Button>
  </Link>
</div>
```

- [ ] **Step 2: Add the same next-step preview below the form**

Place this JSX between the terms block and submit button:

```tsx
<div className={styles.nextStepsPanel}>
  <p className={styles.nextStepsTitle}>What happens next</p>
  <div className={styles.nextSteps} aria-label="Signup next steps">
    {roleCopy[selectedRole].nextSteps.map((step, index) => (
      <div key={step} className={styles.nextStep}>
        <span className={styles.nextStepNumber}>{index + 1}</span>
        <span>{step}</span>
      </div>
    ))}
  </div>
</div>
```

- [ ] **Step 3: Add next-step CSS**

Add this near the success styles:

```css
.nextStepsPanel {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-ground);
}

.nextStepsTitle {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.3;
}

.nextSteps {
  display: grid;
  gap: var(--space-sm);
}

.nextStep {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 0.875rem;
  color: var(--color-text-soft);
  line-height: 1.4;
}

.nextStepNumber {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  background: var(--color-primary-50);
  color: var(--color-primary-700);
  font-size: 0.75rem;
  font-weight: 700;
}
```

- [ ] **Step 4: Run lint**

Run:

```bash
npm run lint
```

Expected: no new lint errors.

- [ ] **Step 5: Commit**

```bash
git add -- src/app/(auth)/signup/page.tsx src/app/(auth)/signup/signup.module.css
git commit -m "Add role-aware signup next steps"
```

## Task 5: Calm The Shared Auth Layout And Login Copy

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(auth)/layout.tsx`
- Modify: `src/app/(auth)/layout.module.css`

- [ ] **Step 1: Update login subtitle**

In `src/app/(auth)/login/page.tsx`, replace:

```tsx
<p className={styles.subtitle}>Sign in to your HostelLo account</p>
```

with:

```tsx
<p className={styles.subtitle}>
  Access bookings, messages, saved hostels, and listing tools from one account.
</p>
```

- [ ] **Step 2: Update side panel copy**

In `src/app/(auth)/layout.tsx`, replace the side panel title, text, and features with:

```tsx
<h2 className={styles.sidePanelTitle}>A clearer way to book and manage hostels</h2>
<p className={styles.sidePanelText}>
  Verified listings, direct messages, and booking tools in one place for students and owners.
</p>
<div className={styles.features}>
  <div className={styles.feature}>
    <span className={styles.featureIcon}>✓</span>
    <span className={styles.featureLabel}>Verified hostel listings</span>
  </div>
  <div className={styles.feature}>
    <span className={styles.featureIcon}>✓</span>
    <span className={styles.featureLabel}>Real reviews and direct messages</span>
  </div>
  <div className={styles.feature}>
    <span className={styles.featureIcon}>✓</span>
    <span className={styles.featureLabel}>One dashboard for bookings and listing tools</span>
  </div>
</div>
```

- [ ] **Step 3: Restyle the side panel**

In `src/app/(auth)/layout.module.css`, replace the `.sidePanel` rule with:

```css
.sidePanel {
  background: color-mix(in srgb, var(--color-primary-50) 52%, var(--color-ground));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-2xl);
  color: var(--color-text);
  box-shadow: var(--shadow-sm);
  display: none;
}
```

Update `.sidePanelText` to remove opacity:

```css
.sidePanelText {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--color-text-soft);
}
```

Update `.featureIcon`:

```css
.featureIcon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-primary-700);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
}
```

- [ ] **Step 4: Run lint**

Run:

```bash
npm run lint
```

Expected: no new lint errors.

- [ ] **Step 5: Commit**

```bash
git add -- src/app/(auth)/login/page.tsx src/app/(auth)/layout.tsx src/app/(auth)/layout.module.css
git commit -m "Refine shared auth trust panel"
```

## Task 6: Verify Behavior And Responsive UI

**Files:**
- Inspect: `src/app/(auth)/signup/page.tsx`
- Inspect: `src/app/(auth)/signup/signup.module.css`
- Inspect: `src/app/(auth)/login/page.tsx`
- Inspect: `src/app/(auth)/layout.tsx`
- Inspect: `src/app/(auth)/layout.module.css`

- [ ] **Step 1: Run lint**

Run:

```bash
npm run lint
```

Expected: command exits successfully.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: Prisma generation and Next.js build complete successfully.

- [ ] **Step 3: Start the dev server**

Run:

```bash
npm run dev
```

Expected: local Next.js dev server starts and prints a localhost URL.

- [ ] **Step 4: Browser-check signup at desktop width**

Open `/signup` at about 1280px wide and verify:
- Student role is selected by default.
- Both role choices are visible above the form.
- Selecting owner changes subtitle, CTA, and next-step preview.
- No text overlaps in role buttons, helper text, terms, or next-step preview.
- Side panel is restrained neutral, not a saturated gradient.

- [ ] **Step 5: Browser-check signup at mobile width**

Open `/signup` at 375px wide and verify:
- The form is single-column.
- Role choices fit without horizontal scrolling.
- All inputs and buttons are at least 44px tall.
- Next-step preview does not crowd the submit button.

- [ ] **Step 6: Browser-check validation**

On `/signup`, verify:
- Empty submit shows the missing fields error.
- `bad-email` shows the invalid email error.
- `12345` in phone shows "Enter a valid Pakistani phone number."
- `password` shows the password strength message.
- Password mismatch shows "Passwords do not match."

- [ ] **Step 7: Browser-check role payload**

Use the browser network panel or temporarily inspect the request payload during manual testing. Verify:
- Student submit sends `"role":"STUDENT"`.
- Owner submit sends `"role":"OWNER"`.

Do not commit temporary logging or inspection code.

- [ ] **Step 8: Browser-check login**

Open `/login` at desktop and mobile widths. Verify:
- Login has no role selector.
- Subtitle is role-neutral.
- The side panel remains visually aligned with signup.

- [ ] **Step 9: Final commit if verification fixes were needed**

If verification required any fixes:

```bash
git add -- src/app/(auth)
git commit -m "Polish auth onboarding verification issues"
```

If no fixes were needed, do not create an empty commit.

## Plan Self-Review

- Spec coverage: role choice, default student role, shared form, selected role payload, role-aware success copy, login copy, neutral auth panel, validation alignment, accessibility, and responsive verification are covered by Tasks 1-6.
- Placeholder scan: no task contains deferred implementation placeholders.
- Type consistency: the plan uses `SignupRole = 'STUDENT' | 'OWNER'` consistently with the Prisma role enum and existing signup API.
