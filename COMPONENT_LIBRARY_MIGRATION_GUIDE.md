# Component Library Migration Guide

**Version:** 1.0  
**Last Updated:** May 6, 2026  
**Status:** Production Ready

---

## Quick Start

### 1. Import Components

```typescript
// From buttons library
import { 
  PrimaryButton, 
  SecondaryButton, 
  GhostButton, 
  IconButton, 
  LinkButton 
} from '@/components/ui';

// From form inputs library
import { 
  TextInput, 
  NumberInput, 
  Checkbox, 
  Radio, 
  Select, 
  TextArea 
} from '@/components/ui';

// From performance utilities
import { 
  LazyImage, 
  useDebounce, 
  useIntersectionObserver, 
  MemoizedListItem, 
  VirtualizedList, 
  usePreloadImage 
} from '@/lib/performance-utils';
```

### 2. Use Components

```typescript
// Button
<PrimaryButton onClick={handleSave}>Save Changes</PrimaryButton>

// Form Input
<TextInput 
  label="Email" 
  placeholder="you@example.com"
  error={emailError}
  required
/>

// Lazy Image
<LazyImage
  src="https://example.com/image.jpg"
  alt="Description"
  placeholder="https://via.placeholder.com/300x200"
/>
```

---

## Component APIs

### Button Components

#### PrimaryButton
**Purpose:** Primary action button for main CTAs  
**Deployment:** All pages requiring primary action

```typescript
interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  // Supports all native button attributes
}

// Usage
<PrimaryButton 
  disabled={isLoading}
  onClick={handleSubmit}
  className="w-full"
>
  {isLoading ? 'Saving...' : 'Save'}
</PrimaryButton>
```

**Features:**
- ✅ Accessible: Full ARIA support
- ✅ Responsive: Works on all screen sizes
- ✅ Type-safe: Full TypeScript support
- ✅ Disabled state: Visual feedback
- ✅ Loading state support: Customizable via children

**Best Practices:**
```typescript
// ✅ Good: Descriptive text
<PrimaryButton>Book Now</PrimaryButton>

// ✅ Good: With loading state
<PrimaryButton disabled={isLoading}>
  {isLoading ? 'Booking...' : 'Book Now'}
</PrimaryButton>

// ❌ Avoid: Generic text
<PrimaryButton>Click</PrimaryButton>

// ❌ Avoid: No loading state
<PrimaryButton onClick={asyncFunction}>Save</PrimaryButton>
```

#### SecondaryButton
**Purpose:** Secondary actions like Cancel, Back, etc.

```typescript
<SecondaryButton onClick={handleCancel}>Cancel</SecondaryButton>
```

#### GhostButton
**Purpose:** Tertiary actions with minimal visual weight

```typescript
<GhostButton onClick={handleLearnMore}>Learn More</GhostButton>
```

#### IconButton
**Purpose:** Icon-only interactive elements with accessible labels

```typescript
import { Trash2 } from 'lucide-react';

<IconButton aria-label="Delete item" onClick={handleDelete}>
  <Trash2 size={20} />
</IconButton>
```

**Important:** Always include `aria-label` for accessibility

#### LinkButton
**Purpose:** Button-styled links

```typescript
<LinkButton href="/settings">Go to Settings</LinkButton>
```

---

### Form Input Components

#### TextInput
**Purpose:** Single-line text input with label and error handling

```typescript
interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
}

// Usage with error handling
const [email, setEmail] = useState('');
const [error, setError] = useState('');

<TextInput
  label="Email Address"
  placeholder="your@email.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={error}
  type="email"
  required
/>
```

**Features:**
- Auto-generates unique ID for accessibility
- Links error message via aria-describedby
- Validation state via aria-invalid
- Full native input attribute support

#### NumberInput
**Purpose:** Numeric input with min/max constraints

```typescript
<NumberInput
  label="Price"
  placeholder="0.00"
  min="0"
  step="0.01"
  error={priceError}
/>
```

#### Checkbox
**Purpose:** Single or multiple selection

```typescript
const [agreed, setAgreed] = useState(false);

<Checkbox
  label="I agree to terms"
  checked={agreed}
  onChange={(e) => setAgreed(e.target.checked)}
/>
```

#### Radio
**Purpose:** Mutually exclusive options

```typescript
const [selected, setSelected] = useState('option1');

<Radio
  label="Option 1"
  value="option1"
  checked={selected === 'option1'}
  onChange={(e) => setSelected(e.target.value)}
/>
```

#### Select
**Purpose:** Dropdown selection

```typescript
<Select
  label="Choose Country"
  defaultValue="usa"
  error={countryError}
>
  <option value="">-- Select --</option>
  <option value="usa">United States</option>
  <option value="canada">Canada</option>
</Select>
```

#### TextArea
**Purpose:** Multi-line text input

```typescript
<TextArea
  label="Message"
  placeholder="Enter your message..."
  rows={4}
  error={messageError}
  required
/>
```

---

## Performance Utilities

### LazyImage
**Purpose:** Load images only when visible in viewport

```typescript
import { LazyImage } from '@/lib/performance-utils';

<LazyImage
  src="https://example.com/hostel-image.jpg"
  alt="Hostel name"
  placeholder="https://via.placeholder.com/300x200?text=Loading..."
  className="rounded-lg w-full h-48 object-cover"
/>
```

**Benefits:**
- Reduces initial page load time
- Saves bandwidth for offscreen images
- Smooth loading transitions
- Supports placeholder images

**When to use:**
- ✅ Search result cards (hostel listings)
- ✅ Gallery/grid pages
- ✅ Long scrollable pages
- ✅ Below-the-fold content

**When not to use:**
- ❌ Above-the-fold hero images (use usePreloadImage instead)
- ❌ Critical product images

### useDebounce
**Purpose:** Delay function execution until user stops interacting

```typescript
import { useDebounce } from '@/lib/performance-utils';
import { useState, useEffect } from 'react';

function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    // This runs only after user stops typing for 300ms
    const results = searchHostels(debouncedTerm);
    setResults(results);
  }, [debouncedTerm]);

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search hostels..."
    />
  );
}
```

**Key Parameters:**
- `value`: The value to debounce
- `delay`: Milliseconds to wait (default: 300ms)

**Performance Impact:**
- Reduces API calls by 70-90%
- Improves server performance
- Better user experience (feels responsive)

**Best Practices:**
```typescript
// ✅ Good: Use for search/filter inputs
const debouncedSearch = useDebounce(searchTerm, 300);

// ✅ Good: Configurable delay for slow API
const debouncedGeocode = useDebounce(address, 800);

// ❌ Avoid: Debounce delay too low
const badDebounce = useDebounce(term, 50); // Too frequent

// ❌ Avoid: Debounce delay too high
const tooSlow = useDebounce(term, 2000); // Feels laggy
```

### usePreloadImage
**Purpose:** Pre-load images for faster display

```typescript
import { usePreloadImage } from '@/lib/performance-utils';
import { useEffect } from 'react';

function HeroSection() {
  useEffect(() => {
    // Pre-load hero images on component mount
    usePreloadImage('https://example.com/hero-1.jpg');
    usePreloadImage('https://example.com/hero-2.jpg');
    usePreloadImage('https://example.com/hero-3.jpg');
  }, []);

  return (
    <section>
      {/* Images appear instantly */}
    </section>
  );
}
```

**When to use:**
- ✅ Hero section images
- ✅ Above-the-fold images
- ✅ Critical product images
- ✅ Frequently viewed images

### MemoizedListItem (React.memo)
**Purpose:** Prevent list items from unnecessary re-renders

```typescript
import { MemoizedListItem } from '@/lib/performance-utils';
import React from 'react';

// Create memoized item component
const NotificationItem = React.memo(({ notification }) => (
  <div className="p-4 border rounded-lg">
    <h4 className="font-medium">{notification.title}</h4>
    <p className="text-sm text-gray-600">{notification.message}</p>
  </div>
));

// Use in list
function NotificationsList({ notifications }) {
  return (
    <div className="space-y-2">
      {notifications.map((notif) => (
        <NotificationItem key={notif.id} notification={notif} />
      ))}
    </div>
  );
}
```

**Performance Impact:**
- Reduces CPU usage by 40-60% for large lists
- Smoother scrolling
- Better UX for notifications/bookings

**Important:** Set displayName for debugging
```typescript
NotificationItem.displayName = 'NotificationItem';
```

### useIntersectionObserver
**Purpose:** Detect when elements enter/leave viewport

```typescript
import { useIntersectionObserver } from '@/lib/performance-utils';
import { useRef } from 'react';

function LazyLoadSection() {
  const ref = useRef(null);
  const isVisible = useIntersectionObserver(ref);

  return (
    <section ref={ref}>
      {isVisible && <ExpensiveComponent />}
    </section>
  );
}
```

### VirtualizedList
**Purpose:** Efficiently render large lists (1000+ items)

```typescript
import { VirtualizedList } from '@/lib/performance-utils';

<VirtualizedList
  items={hostels}
  itemHeight={200}
  renderItem={(hostel) => <HostelCard hostel={hostel} />}
  height={600}
/>
```

**When to use:**
- ✅ Very large lists (100+ items)
- ✅ Infinite scroll implementations
- ✅ Admin dashboards with many rows

---

## Migration Checklist

### Step 1: Component Replacement

**Before:**
```typescript
<button className="px-4 py-2 bg-blue-600 text-white rounded">
  Save
</button>
```

**After:**
```typescript
<PrimaryButton>Save</PrimaryButton>
```

**Checklist:**
- [ ] Replace all custom buttons with button library
- [ ] Replace form inputs with form-inputs library
- [ ] Add performance utilities to high-impact components
- [ ] Test all replaced components
- [ ] Verify accessibility (aria attributes)

### Step 2: Performance Optimization

```typescript
// Add lazy loading to image-heavy components
<LazyImage 
  src={image} 
  placeholder="https://via.placeholder.com/300x200"
/>

// Add debouncing to search/filter inputs
const debouncedSearch = useDebounce(searchTerm, 300);

// Memoize list items for large lists
const Item = React.memo(({ item }) => (...));
```

**Checklist:**
- [ ] Add LazyImage to image cards
- [ ] Add useDebounce to search inputs
- [ ] Add React.memo to list items
- [ ] Add usePreloadImage to hero section
- [ ] Measure performance improvement

### Step 3: Type Safety

```typescript
// Ensure TypeScript strict mode compatibility
interface Props {
  disabled?: boolean;
  className?: string;
  // No 'any' types allowed
}
```

**Checklist:**
- [ ] Enable TypeScript strict mode (already enabled)
- [ ] Remove all 'any' types
- [ ] Add explicit return types to functions
- [ ] Test with `npm run build`

---

## Troubleshooting

### Issue: Component Not Found

**Error:** `Module not found: Can't resolve '@/components/ui/buttons'`

**Solution:**
1. Verify import path is correct: `@/components/ui`
2. Check file exists: `src/components/ui/index.ts`
3. Verify export in `src/components/ui/index.ts`:
   ```typescript
   export { PrimaryButton, SecondaryButton, ... } from './buttons';
   ```
4. Run `npm run build` to verify

### Issue: TypeScript Error on Component Props

**Error:** `Type 'div' is not assignable to type 'HTMLButtonElement'`

**Solution:** Don't pass size prop to non-button elements:
```typescript
// ❌ Wrong
<div size={20}>Content</div>

// ✅ Correct - use className for sizing
<div className="w-5 h-5">Content</div>
```

### Issue: Button Not Responding

**Error:** Click handler not firing

**Solution:** Check disabled state and wrap in proper element:
```typescript
// ❌ Wrong - disabled prop ignored
<div onClick={handler} disabled>Click</div>

// ✅ Correct
<PrimaryButton onClick={handler} disabled={isDisabled}>
  Click
</PrimaryButton>
```

### Issue: Form Validation Not Working

**Error:** Error state not showing

**Solution:** Pass error prop to input component:
```typescript
// ❌ Wrong - error not passed
<TextInput label="Email" onChange={handleChange} />

// ✅ Correct
<TextInput 
  label="Email" 
  onChange={handleChange}
  error={emailError}
/>
```

### Issue: LazyImage Not Loading

**Error:** Image appears but doesn't load

**Solution:** Verify placeholder URL and src are valid:
```typescript
// ❌ Wrong - missing placeholder
<LazyImage src="https://example.com/image.jpg" alt="Test" />

// ✅ Correct
<LazyImage 
  src="https://example.com/image.jpg"
  placeholder="https://via.placeholder.com/300x200"
  alt="Test"
/>
```

---

## Best Practices

### 1. Use Semantic Button Types

```typescript
// ✅ Primary for main action
<PrimaryButton>Save Changes</PrimaryButton>

// ✅ Secondary for alternative action
<SecondaryButton>Cancel</SecondaryButton>

// ✅ Ghost for less important action
<GhostButton>Delete</GhostButton>

// ✅ Icon for icon-only with aria-label
<IconButton aria-label="Edit" onClick={handleEdit}>
  <Edit size={20} />
</IconButton>
```

### 2. Always Include Labels

```typescript
// ❌ No label
<TextInput placeholder="Email" />

// ✅ With label for accessibility
<TextInput label="Email Address" placeholder="your@email.com" />
```

### 3. Show Error States

```typescript
const [email, setEmail] = useState('');
const [error, setError] = useState('');

const handleBlur = () => {
  if (!email.includes('@')) {
    setError('Please enter a valid email');
  }
};

<TextInput
  label="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  onBlur={handleBlur}
  error={error}
/>
```

### 4. Optimize Images

```typescript
// ✅ Use lazy loading for below-the-fold images
<LazyImage src={image} placeholder={placeholder} />

// ✅ Preload above-the-fold images
useEffect(() => {
  usePreloadImage(heroImage);
}, []);

// ✅ Use meaningful alt text
<LazyImage alt="Cozy downtown hostel with free WiFi" src={...} />
```

### 5. Debounce Expensive Operations

```typescript
// ✅ Debounce search queries
const debouncedSearch = useDebounce(searchTerm, 300);
useEffect(() => {
  const results = searchAPI(debouncedSearch);
  setResults(results);
}, [debouncedSearch]);

// ✅ Use appropriate delay
const debouncedGeocode = useDebounce(address, 500); // For geocoding API
const debouncedSearch = useDebounce(term, 300); // For local search
```

### 6. Memoize List Items

```typescript
// ✅ Memoize expensive list items
const BookingCard = React.memo(({ booking }) => (
  <div>
    <h4>{booking.hostel}</h4>
    <p>{booking.dates}</p>
  </div>
));

BookingCard.displayName = 'BookingCard';

// Use in list
{bookings.map(b => <BookingCard key={b.id} booking={b} />)}
```

---

## Contribution Guidelines

### Adding New Components

1. **Create Component File**
   ```typescript
   // src/components/ui/new-component.tsx
   import React from 'react';
   
   export interface NewComponentProps {
     // Props interface
   }
   
   export const NewComponent = React.forwardRef<
     HTMLDivElement,
     NewComponentProps
   >(({ ...props }, ref) => {
     return <div ref={ref} {...props} />;
   });
   
   NewComponent.displayName = 'NewComponent';
   ```

2. **Export from Index**
   ```typescript
   // src/components/ui/index.ts
   export { NewComponent } from './new-component';
   ```

3. **Create Storybook Story**
   ```typescript
   // src/components/ui/stories/new-component.stories.tsx
   import { NewComponent } from '../new-component';
   
   export const Default = () => <NewComponent />;
   ```

4. **Test**
   - TypeScript: `npm run build`
   - Accessibility: Manual testing
   - Storybook: `npm run storybook`

### Code Style

- **TypeScript:** Strict mode, explicit types
- **React:** Use hooks, forward refs where needed
- **Accessibility:** All interactive elements need aria labels
- **CSS:** Use Tailwind classes, no inline styles
- **Testing:** Include in Storybook with multiple states

---

## Performance Monitoring

### Metrics to Track

```typescript
// Track component render counts
console.time('ComponentRender');
return <Component />;
console.timeEnd('ComponentRender');

// Monitor debounce effectiveness
const debouncedSearch = useDebounce(search, 300);
useEffect(() => {
  console.log('API call with:', debouncedSearch);
}, [debouncedSearch]);

// Track list performance
const Item = React.memo(({ item }) => {
  console.log('Item rendered:', item.id);
  return <div>{item.name}</div>;
});
```

### Lighthouse Monitoring

```bash
# Run Lighthouse audit
npx lighthouse https://hostello.com --view
```

### Bundle Size Monitoring

```bash
# Analyze bundle size
npm install -D @next/bundle-analyzer
# Configure in next.config.ts and run: npm run build
```

---

## Resources

- **Component Library:** `src/components/ui/`
- **Performance Utils:** `src/lib/performance-utils.tsx`
- **Storybook:** `npm run storybook`
- **Build:** `npm run build`
- **Tests:** `npm run build` (type checking)

---

## Support

For issues or questions:
1. Check [STORYBOOK_SETUP.md](./STORYBOOK_SETUP.md) for component stories
2. Review [PERFORMANCE_AUDIT_REPORT.md](./PERFORMANCE_AUDIT_REPORT.md) for metrics
3. Check TypeScript errors: `npm run build`
4. View Storybook examples: `npm run storybook`

---

**Last Updated:** May 6, 2026  
**Version:** 1.0  
**Status:** Production Ready
