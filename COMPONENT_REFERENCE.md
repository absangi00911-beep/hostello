# Quick Reference: Component Library API

## Imports

```tsx
// UI Components
import { 
  PrimaryButton, 
  SecondaryButton, 
  GhostButton, 
  IconButton, 
  LinkButton 
} from '@/components/ui';

import {
  TextInput,
  NumberInput,
  Checkbox,
  Radio,
  Select,
  TextArea,
} from '@/components/ui';

// Styling Constants
import { 
  BUTTON_STYLES,
  INPUT_STYLES, 
  FORM_STYLES,
  FOCUS_RINGS,
  TRANSITIONS,
  HOVER_EFFECTS,
} from '@/lib/styling-constants';

// Performance Utilities
import {
  LazyImage,
  useIntersectionObserver,
  useDebounce,
  MemoizedListItem,
  VirtualizedList,
  usePreloadImage,
} from '@/lib/performance-utils';
```

## Button Component Props

| Component | Props | Example |
|-----------|-------|---------|
| `PrimaryButton` | `children`, `onClick`, `disabled`, `isLoading`, `className` | `<PrimaryButton onClick={fn}>Submit</PrimaryButton>` |
| `SecondaryButton` | `children`, `onClick`, `disabled`, `className` | `<SecondaryButton>Cancel</SecondaryButton>` |
| `GhostButton` | `children`, `onClick`, `className` | `<GhostButton>Learn More</GhostButton>` |
| `IconButton` | `icon`, `label`, `onClick`, `disabled` | `<IconButton icon={<Heart />} label="Save" />` |
| `LinkButton` | `children`, `underline`, `onClick`, `className` | `<LinkButton underline>View</LinkButton>` |

## Form Input Props

| Component | Key Props | Example |
|-----------|-----------|---------|
| `TextInput` | `label`, `error`, `value`, `onChange`, `placeholder` | `<TextInput label="Name" error={err} />` |
| `NumberInput` | `label`, `min`, `max`, `value`, `onChange` | `<NumberInput label="Price" min={0} />` |
| `Checkbox` | `label`, `checked`, `onChange` | `<Checkbox label="Agree" checked={c} />` |
| `Radio` | `label`, `value`, `checked`, `name`, `onChange` | `<Radio label="Yes" value="yes" />` |
| `Select` | `label`, `options`, `value`, `onChange` | `<Select label="City" options={opts} />` |
| `TextArea` | `label`, `rows`, `value`, `onChange`, `error` | `<TextArea label="Comment" rows={4} />` |

## Performance Utilities

| Utility | Purpose | Usage |
|---------|---------|-------|
| `LazyImage` | Lazy-load images | `<LazyImage src="..." alt="..." />` |
| `useIntersectionObserver` | Detect viewport entry | `const { ref, isVisible } = useIntersectionObserver()` |
| `useDebounce` | Debounce values | `const debounced = useDebounce(value, 300)` |
| `MemoizedListItem` | Memoized list item | `<MemoizedListItem item={i} renderItem={r} />` |
| `VirtualizedList` | Virtual list rendering | `<VirtualizedList items={arr} itemHeight={50} />` |
| `usePreloadImage` | Preload image | `const loaded = usePreloadImage(src)` |

## Common Patterns

### Search with Debounce
```tsx
const [search, setSearch] = useState('');
const debounced = useDebounce(search, 300);

useEffect(() => {
  if (debounced) fetchResults(debounced);
}, [debounced]);

return <TextInput value={search} onChange={e => setSearch(e.target.value)} />;
```

### List with Memoization
```tsx
{items.map(item => (
  <MemoizedListItem 
    key={item.id}
    item={item}
    renderItem={i => <Card {...i} />}
  />
))}
```

### Virtualized Long List
```tsx
<VirtualizedList
  items={items}
  itemHeight={200}
  visibleCount={5}
  renderItem={(item, idx) => <Item key={item.id} {...item} />}
/>
```

### Image with Lazy Loading
```tsx
<LazyImage 
  src={imageUrl}
  alt="Hostel"
  placeholder="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
  width={300}
  height={200}
/>
```

## Color System Reference

Primary colors use CSS custom properties defined in `globals.css`:

```css
--color-primary          /* Main brand color */
--color-primary-light    /* Lighter variant */
--color-primary-dark     /* Darker variant */
--color-secondary        /* Alternative color */
--color-error            /* Error/destructive action */
--color-success          /* Success state */
--color-warning          /* Warning state */
--color-info             /* Informational state */
--color-ink              /* Text color */
--color-dust             /* Borders/dividers */
```

Usage: `className="text-[var(--color-ink)]"` or use Tailwind's color system.

## Accessibility Checklist

- [ ] All interactive elements have accessible labels
- [ ] Form inputs have associated labels
- [ ] Error states linked via aria-describedby
- [ ] Keyboard navigation works
- [ ] Focus visible on all interactive elements
- [ ] Images have alt text
- [ ] Color contrast ≥ 4.5:1 for text
- [ ] No color-only information conveyed

---

**Tip:** Use `npm run build` to catch TypeScript errors before deployment!
