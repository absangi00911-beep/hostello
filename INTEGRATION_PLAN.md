# UI Component Integration Plan

## Components to Update (19 total)

### High Priority (Heavy button/form use)
- [ ] search-results-responsive.tsx - Search interface with filters
- [ ] booking-confirmed-responsive.tsx - Booking flow with actions
- [ ] profile-settings-responsive.tsx - Settings with form inputs
- [ ] owner-dashboard-responsive.tsx - Owner actions
- [ ] admin-user-management-responsive.tsx - Admin controls

### Medium Priority
- [ ] student-dashboard-responsive.tsx - Dashboard buttons
- [ ] notifications-page-responsive.tsx - Action buttons
- [ ] add-listing-basic-info-responsive.tsx - Form inputs
- [ ] add-listing-pricing-responsive.tsx - Number inputs
- [ ] payment-page-responsive.tsx - Payment flow

### Lower Priority (Primarily display/layout)
- [ ] search-loading-skeleton-responsive.tsx - No interactive elements
- [ ] add-listing-photos-responsive.tsx - Upload flow
- [ ] add-listing-rules-amenities-responsive.tsx - Checkboxes
- [ ] add-listing-location-responsive.tsx - Map/location
- [ ] booking-room-selection-responsive.tsx - Room selection
- [ ] admin-listing-moderation-responsive.tsx - Admin moderation
- [ ] owner-onboarding-welcome-responsive.tsx - Onboarding flow
- [ ] admin-hostels-responsive.tsx - Admin list
- [ ] notifications-responsive.tsx - Display

## Replacement Patterns

### Before & After Examples

**Primary Button:**
```tsx
// BEFORE
<button className="bg-primary-container text-on-primary font-label text-label px-4 py-2 rounded hover:bg-primary-dark transition-colors">
  Click me
</button>

// AFTER
import { PrimaryButton } from '@/components/ui';
<PrimaryButton onClick={handler}>Click me</PrimaryButton>
```

**Text Input:**
```tsx
// BEFORE
<input 
  className="w-full h-12 px-3 border border-border-default rounded focus:ring-2 focus:ring-primary-container/50"
  type="text"
  placeholder="Enter name"
/>

// AFTER
import { TextInput } from '@/components/ui';
<TextInput label="Name" placeholder="Enter name" />
```

**Checkbox:**
```tsx
// BEFORE
<input type="checkbox" className="w-4 h-4 rounded" checked={checked} onChange={handler} />

// AFTER
import { Checkbox } from '@/components/ui';
<Checkbox label="Option" checked={checked} onChange={handler} />
```

**Select/Dropdown:**
```tsx
// BEFORE
<select className="w-full h-12 px-3 border border-border-default rounded">
  <option>Option 1</option>
</select>

// AFTER
import { Select } from '@/components/ui';
<Select 
  options={[{ value: 'opt1', label: 'Option 1' }]}
  value={value}
  onChange={handler}
/>
```

## Status
- [ ] Import statements updated
- [ ] Primary buttons replaced
- [ ] Secondary buttons replaced
- [ ] Form inputs replaced
- [ ] Build verified
