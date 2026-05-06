# Performance Optimization Guidelines

## 1. Image Optimization

### Use LazyImage Component
Lazy-load images to improve initial page load:

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

### Image Best Practices
- Always provide `alt` text (accessibility + SEO)
- Use appropriate image formats (WebP with JPEG fallback)
- Provide multiple image sizes via `srcSet` for responsive images
- Use CDN URLs for faster delivery
- Compress images before upload (< 100KB for thumbnails, < 300KB for full images)

## 2. Component Memoization

### Use React.memo for List Items
Prevent unnecessary re-renders of list items:

```tsx
import { MemoizedListItem } from '@/lib/performance-utils';

{items.map((item) => (
  <MemoizedListItem 
    key={item.id}
    item={item}
    renderItem={(item) => <HostelCard hostel={item} />}
  />
))}
```

### Use useMemo for Expensive Calculations
```tsx
const filteredHostels = useMemo(
  () => hostels.filter(h => h.price >= minPrice && h.price <= maxPrice),
  [hostels, minPrice, maxPrice]
);
```

### Use useCallback for Event Handlers
```tsx
const handleSave = useCallback((hostelId: string) => {
  setSavedHostels(prev => [...prev, hostelId]);
}, []);
```

## 3. List Performance

### Use VirtualizedList for Long Lists (100+ items)
Only render visible items in viewport:

```tsx
import { VirtualizedList } from '@/lib/performance-utils';

<VirtualizedList
  items={hostels}
  itemHeight={200}
  visibleCount={5}
  renderItem={(hostel, index) => (
    <HostelCard key={hostel.id} hostel={hostel} />
  )}
/>
```

### Pagination Alternative
For search results, use pagination instead of rendering all items:

```tsx
const [page, setPage] = useState(1);
const itemsPerPage = 20;
const paginatedItems = items.slice(
  (page - 1) * itemsPerPage,
  page * itemsPerPage
);
```

## 4. Network Optimization

### Debounce Search Inputs
```tsx
import { useDebounce } from '@/lib/performance-utils';

const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearch) {
    // Call API
    fetchResults(debouncedSearch);
  }
}, [debouncedSearch]);
```

### API Response Caching
Consider SWR or React Query for automatic caching:
```tsx
import useSWR from 'swr';

const { data: hostels } = useSWR('/api/hostels', fetcher);
```

## 5. Bundle Size

### Code Splitting with dynamic imports
```tsx
const SearchFilters = dynamic(() => import('./search-filters'), {
  loading: () => <div>Loading...</div>,
});
```

### Tree Shaking
- Import only needed functions: `import { PrimaryButton } from '@/components/ui'`
- Avoid wildcard imports: ~~`import * as UI from '@/components/ui'`~~

## 6. CSS Optimization

### Avoid inline styles in loops
❌ BAD:
```tsx
{items.map(item => (
  <div style={{ width: `${item.width}px` }}>
))}
```

✅ GOOD:
```tsx
<div style={{ width: itemWidth }}>
```

### Use CSS classes instead
```tsx
<div className={`w-${width}`}> // Better with Tailwind
```

## 7. Monitoring & Metrics

### Use Web Vitals
```tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getLCP(console.log);
```

### Target Metrics
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FCP (First Contentful Paint)**: < 1.8s

## 8. Component Patterns

### Extract complex renders to separate components
```tsx
// ❌ BAD: Complex JSX in main component
function HostelCard({ hostel }) {
  return (
    <div>
      {hostel.reviews.map(review => (
        // Complex review render
      ))}
    </div>
  );
}

// ✅ GOOD: Separate ReviewList component
function ReviewList({ reviews }) {
  return reviews.map(review => <Review key={review.id} {...review} />);
}

function HostelCard({ hostel }) {
  return <ReviewList reviews={hostel.reviews} />;
}
```

## 9. Common Performance Issues to Avoid

| Issue | Impact | Solution |
|-------|--------|----------|
| Inline styles in loops | High re-render cost | Use useMemo or extract constants |
| Missing keys in lists | Incorrect renders | Always use stable, unique keys |
| Direct state mutations | Stale renders | Use spread operator or immer |
| Unbound functions | New reference every render | Use useCallback |
| Missing dependency arrays | Memory leaks | Always specify dependencies |
| Too many DOM nodes | Memory + layout thrashing | Virtualize or paginate |

## 10. Quick Performance Checklist

- [ ] Images use `<LazyImage />` or have explicit width/height
- [ ] Long lists (100+) use `VirtualizedList` or pagination
- [ ] Search inputs use `useDebounce`
- [ ] List items wrapped with `React.memo` when needed
- [ ] Expensive calculations wrapped with `useMemo`
- [ ] Event handlers wrapped with `useCallback`
- [ ] No inline styles in loops
- [ ] All images have `alt` text
- [ ] Bundle size analyzed and optimized
- [ ] Web Vitals tracked and < target thresholds

---

**Last Updated:** May 6, 2026
**Next Review:** May 13, 2026
