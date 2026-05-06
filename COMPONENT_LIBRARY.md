# HostelHub Shared Component Library

## Overview

The shared component library provides reusable, accessible, and consistently styled UI components and utilities for the HostelHub application. All components follow Material Design 3 principles and are fully typed with TypeScript.

## Directory Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── buttons.tsx          # Button components (Primary, Secondary, Ghost, Icon)
│   │   ├── form-inputs.tsx      # Form inputs (TextInput, NumberInput, Checkbox, Radio, Select, TextArea)
│   │   └── index.ts             # Library exports
│   └── ...other components
├── lib/
│   ├── styling-constants.ts     # Standardized CSS class strings
│   └── performance-utils.tsx    # Performance optimization utilities
└── ...
```

## Styling Constants

All styling constants are centralized in `src/lib/styling-constants.ts`.

### Button Styles

```tsx
import { BUTTON_STYLES } from '@/lib/styling-constants';

// Available styles
BUTTON_STYLES.primary      // Filled background (main action)
BUTTON_STYLES.secondary    // Outlined border (alternative action)
BUTTON_STYLES.tertiary     // Text only (minimal)
BUTTON_STYLES.icon         // Icon-only button
BUTTON_STYLES.ghost        // No background, minimal styling
```

### Input Styles

```tsx
import { INPUT_STYLES } from '@/lib/styling-constants';

INPUT_STYLES.text          // Standard text input
INPUT_STYLES.error         // Error state
INPUT_STYLES.number        // Number input
INPUT_STYLES.search        // Search input
```

### Form Control Styles

```tsx
import { FORM_STYLES } from '@/lib/styling-constants';

FORM_STYLES.checkbox       // Checkbox styling
FORM_STYLES.radio          // Radio button styling
FORM_STYLES.select         // Select/dropdown styling
FORM_STYLES.textarea       // Textarea styling
```

## Components

### Button Components

#### PrimaryButton
Main action button with filled background.

```tsx
import { PrimaryButton } from '@/components/ui';

<PrimaryButton onClick={handleSubmit}>
  Submit Booking
</PrimaryButton>

// With loading state
<PrimaryButton isLoading={isSubmitting} disabled={isSubmitting}>
  Submitting...
</PrimaryButton>
```

#### SecondaryButton
Alternative action button with border outline.

```tsx
import { SecondaryButton } from '@/components/ui';

<SecondaryButton onClick={handleCancel}>
  Cancel
</SecondaryButton>
```

#### GhostButton
Minimal button without background.

```tsx
import { GhostButton } from '@/components/ui';

<GhostButton>
  Learn More
</GhostButton>
```

#### IconButton
Icon-only button with automatic aria-label.

```tsx
import { IconButton } from '@/components/ui';
import { Heart } from 'lucide-react';

<IconButton 
  icon={<Heart className="w-5 h-5" />} 
  label="Save hostel"
  onClick={handleSave}
/>
```

#### LinkButton
Text button styled like a link.

```tsx
import { LinkButton } from '@/components/ui';

<LinkButton underline onClick={handleNavigate}>
  View all results
</LinkButton>
```

### Form Input Components

#### TextInput
Text input with optional label, error state, and helper text.

```tsx
import { TextInput } from '@/components/ui';

<TextInput
  label="Email"
  placeholder="your@email.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
  helperText="We'll never share your email"
/>
```

#### NumberInput
Number input with validation and min/max bounds.

```tsx
import { NumberInput } from '@/components/ui';

<NumberInput
  label="Monthly Price"
  min={0}
  max={100000}
  value={price}
  onChange={(e) => setPrice(Number(e.target.value))}
  error={priceError}
/>
```

#### Checkbox
Styled checkbox with optional label.

```tsx
import { Checkbox } from '@/components/ui';

<Checkbox
  label="I agree to terms"
  checked={accepted}
  onChange={(e) => setAccepted(e.target.checked)}
/>
```

#### Radio
Styled radio button with optional label.

```tsx
import { Radio } from '@/components/ui';

<Radio
  name="room-type"
  label="Mixed Dorms"
  value="mixed"
  checked={roomType === 'mixed'}
  onChange={(e) => setRoomType(e.target.value)}
/>
```

#### Select
Styled select dropdown with options array.

```tsx
import { Select } from '@/components/ui';

<Select
  label="City"
  options={[
    { value: 'barcelona', label: 'Barcelona, Spain' },
    { value: 'prague', label: 'Prague, Czech Republic' },
  ]}
  value={city}
  onChange={(e) => setCity(e.target.value)}
/>
```

#### TextArea
Styled textarea with optional label and error state.

```tsx
import { TextArea } from '@/components/ui';

<TextArea
  label="Review"
  placeholder="Share your experience..."
  rows={5}
  value={review}
  onChange={(e) => setReview(e.target.value)}
  error={reviewError}
/>
```

## Performance Utilities

### LazyImage
Lazy-load images using Intersection Observer.

```tsx
import { LazyImage } from '@/lib/performance-utils';

<LazyImage
  src="https://example.com/image.jpg"
  alt="Hostel photo"
  placeholder="data:image/svg+xml,%3Csvg..."
  width={300}
  height={200}
/>
```

### useIntersectionObserver
Hook for detecting when element enters viewport.

```tsx
import { useIntersectionObserver } from '@/lib/performance-utils';

function AdsSection() {
  const { ref, isVisible } = useIntersectionObserver();
  
  return (
    <div ref={ref}>
      {isVisible && <Advertisement />}
    </div>
  );
}
```

### useDebounce
Hook for debouncing values (e.g., search input).

```tsx
import { useDebounce } from '@/lib/performance-utils';

function SearchHostels() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  
  useEffect(() => {
    if (debouncedSearch) {
      fetchHostels(debouncedSearch);
    }
  }, [debouncedSearch]);
  
  return <input value={search} onChange={(e) => setSearch(e.target.value)} />;
}
```

### MemoizedListItem
Prevents re-renders of list items when parent updates.

```tsx
import { MemoizedListItem } from '@/lib/performance-utils';

{hostels.map((hostel) => (
  <MemoizedListItem
    key={hostel.id}
    item={hostel}
    renderItem={(h) => <HostelCard hostel={h} />}
  />
))}
```

### VirtualizedList
Virtualized list component for long lists (100+ items).

```tsx
import { VirtualizedList } from '@/lib/performance-utils';

<VirtualizedList
  items={hostels}
  itemHeight={200}
  visibleCount={5}
  renderItem={(hostel, index) => (
    <HostelCard key={hostel.id} hostel={hostel} />
  )}
  className="h-96"
/>
```

### usePreloadImage
Hook for preloading images before display.

```tsx
import { usePreloadImage } from '@/lib/performance-utils';

function HostelCard({ hostel }) {
  const isLoaded = usePreloadImage(hostel.image);
  
  return (
    <div>
      {isLoaded ? (
        <img src={hostel.image} alt={hostel.name} />
      ) : (
        <Skeleton />
      )}
    </div>
  );
}
```

## Design System Integration

All components use the HostelHub design system:

- **Colors**: Defined in `globals.css` as CSS custom properties
- **Typography**: Material Design 3 font sizes and weights
- **Spacing**: 8px base unit scale (space-1 = 8px, space-2 = 16px, etc.)
- **Shadows**: Consistent depth system
- **Border radius**: Predefined curves (rounded, rounded-lg, etc.)
- **Focus states**: 2px focus ring with primary color

## Accessibility

All components are built with accessibility in mind:

- ✅ Proper label associations (`htmlFor`, `aria-describedby`)
- ✅ Error state announcements (`aria-invalid`)
- ✅ Focus management and visible focus rings
- ✅ Keyboard navigation support
- ✅ Semantic HTML elements
- ✅ Screen reader support
- ✅ Color contrast compliance (WCAG AA minimum)

## Usage Examples

### Complete Form with All Components

```tsx
'use client';

import { PrimaryButton, SecondaryButton, TextInput, NumberInput, Select, Checkbox, TextArea } from '@/components/ui';
import { useState } from 'react';

export default function CreateListingForm() {
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    city: '',
    description: '',
    verified: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    // Validate and submit
    const response = await fetch('/api/listings', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  };

  return (
    <form className="space-y-6 max-w-md">
      <TextInput
        label="Hostel Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
      />

      <NumberInput
        label="Monthly Price (PKR)"
        min={1000}
        max={100000}
        value={formData.price}
        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
        error={errors.price}
      />

      <Select
        label="City"
        options={[
          { value: 'lahore', label: 'Lahore' },
          { value: 'islamabad', label: 'Islamabad' },
        ]}
        value={formData.city}
        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
      />

      <TextArea
        label="Description"
        rows={4}
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />

      <Checkbox
        label="This hostel is verified"
        checked={formData.verified}
        onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
      />

      <div className="flex gap-4">
        <PrimaryButton onClick={handleSubmit}>
          Create Listing
        </PrimaryButton>
        <SecondaryButton onClick={() => window.history.back()}>
          Cancel
        </SecondaryButton>
      </div>
    </form>
  );
}
```

## Migration Guide

### From Custom Styles to Shared Components

**Before:**
```tsx
<button className="bg-primary-container text-on-primary font-label text-label px-space-4 py-2 rounded transition-all duration-200 hover:scale-[0.98] active:scale-[0.95] focus:outline-none focus:ring-2 focus:ring-primary-light/50 shadow-sm">
  Submit
</button>
```

**After:**
```tsx
import { PrimaryButton } from '@/components/ui';

<PrimaryButton onClick={handleSubmit}>
  Submit
</PrimaryButton>
```

## Contributing

When adding new components:

1. Create component in `src/components/ui/`
2. Add styling constants to `src/lib/styling-constants.ts` if needed
3. Export from `src/components/ui/index.ts`
4. Add TypeScript types for all props
5. Include aria-labels and semantic HTML
6. Add examples to this documentation
7. Test accessibility with screen reader
8. Run `npm run build` to verify no TypeScript errors

## Best Practices

- Use components from `@/components/ui` instead of styling custom elements
- Always provide proper labels and aria attributes
- Wrap long lists with `VirtualizedList` or paginate
- Use `LazyImage` for all non-critical images
- Debounce search/filter inputs
- Memoize expensive list renders
- Keep styling consistent using design tokens

## Support

For questions or issues with components, check:
- This documentation
- Component source code with JSDoc comments
- `PERFORMANCE.md` for optimization patterns
- Component Storybook (coming soon)

---

**Last Updated:** May 6, 2026
**Maintained By:** HostelHub Frontend Team
