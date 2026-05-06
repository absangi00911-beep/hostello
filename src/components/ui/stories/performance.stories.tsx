import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { LazyImage, useDebounce, MemoizedListItem } from '../../../lib/performance-utils';

const meta = {
  title: 'Utilities/Performance',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ====== LAZY IMAGE ======
export const LazyImageBasic: Story = {
  render: () => (
    <div className="max-w-md">
      <LazyImage
        src="https://images.unsplash.com/photo-1631049307038-da31500d0d32?w=400&h=300&fit=crop"
        alt="Sample hostel"
        placeholder="https://via.placeholder.com/400x300?text=Loading..."
        className="rounded-lg w-full"
      />
    </div>
  ),
};

export const LazyImageMultiple: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 max-w-2xl">
      <LazyImage
        src="https://images.unsplash.com/photo-1631049307038-da31500d0d32?w=300&h=200&fit=crop"
        alt="Hostel 1"
        placeholder="https://via.placeholder.com/300x200?text=Loading..."
        className="rounded-lg w-full h-48 object-cover"
      />
      <LazyImage
        src="https://images.unsplash.com/photo-1585399168485-f9a7a27b5eaf?w=300&h=200&fit=crop"
        alt="Hostel 2"
        placeholder="https://via.placeholder.com/300x200?text=Loading..."
        className="rounded-lg w-full h-48 object-cover"
      />
      <LazyImage
        src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300&h=200&fit=crop"
        alt="Hostel 3"
        placeholder="https://via.placeholder.com/300x200?text=Loading..."
        className="rounded-lg w-full h-48 object-cover"
      />
    </div>
  ),
};

// ====== DEBOUNCE HOOK ======
const DebounceDemo = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedTerm = useDebounce(searchTerm, 300);
  const [searchCount, setSearchCount] = useState(0);

  React.useEffect(() => {
    if (debouncedTerm) {
      setSearchCount((c) => c + 1);
    }
  }, [debouncedTerm]);

  return (
    <div className="w-96 flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">Search:</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Type to search..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="bg-gray-100 p-4 rounded-md">
        <p className="text-sm">Raw input: <strong>{searchTerm}</strong></p>
        <p className="text-sm mt-2">Debounced (300ms): <strong>{debouncedTerm}</strong></p>
        <p className="text-sm mt-2">Searches triggered: <strong>{searchCount}</strong></p>
        <p className="text-xs text-gray-600 mt-4">
          The debounced value updates after you stop typing for 300ms. This reduces unnecessary API calls.
        </p>
      </div>
    </div>
  );
};

export const DebounceHook: Story = {
  render: () => <DebounceDemo />,
};

// ====== MEMOIZED LIST ITEM ======
interface ListItem {
  id: string;
  title: string;
  description: string;
}

const SampleMemoizedItem = React.memo(({ item }: { item: ListItem }) => (
  <div className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition">
    <h4 className="font-medium">{item.title}</h4>
    <p className="text-sm text-gray-600">{item.description}</p>
  </div>
));

SampleMemoizedItem.displayName = 'SampleMemoizedItem';

export const MemoizedListItemDemo: Story = {
  render: () => {
    const [items] = useState<ListItem[]>([
      { id: '1', title: 'Cozy Downtown Hostel', description: 'Central location, WiFi included' },
      { id: '2', title: 'Beach View Hostel', description: 'Oceanside location with activities' },
      { id: '3', title: 'Budget Hostel', description: 'Affordable dorm beds' },
    ]);

    return (
      <div className="w-96 flex flex-col gap-3">
        <p className="text-sm text-gray-600 mb-2">
          List items are memoized to prevent unnecessary re-renders.
        </p>
        {items.map((item) => (
          <SampleMemoizedItem key={item.id} item={item} />
        ))}
      </div>
    );
  },
};

// ====== PERFORMANCE BENEFITS ======
export const PerformanceBenefits: Story = {
  render: () => (
    <div className="max-w-2xl">
      <div className="space-y-6">
        <div className="border-l-4 border-blue-500 pl-4">
          <h3 className="font-semibold text-blue-600 mb-1">LazyImage</h3>
          <p className="text-sm text-gray-700 mb-2">
            Images load only when visible in viewport using IntersectionObserver API
          </p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>✓ Reduces initial page load time</li>
            <li>✓ Saves bandwidth for offscreen images</li>
            <li>✓ Smooth loading with placeholder support</li>
          </ul>
        </div>

        <div className="border-l-4 border-green-500 pl-4">
          <h3 className="font-semibold text-green-600 mb-1">useDebounce</h3>
          <p className="text-sm text-gray-700 mb-2">
            Delays function execution until user stops interacting
          </p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>✓ Reduces API calls during search/filter</li>
            <li>✓ Configurable delay (default 300ms)</li>
            <li>✓ Improves server performance</li>
          </ul>
        </div>

        <div className="border-l-4 border-purple-500 pl-4">
          <h3 className="font-semibold text-purple-600 mb-1">MemoizedListItem (React.memo)</h3>
          <p className="text-sm text-gray-700 mb-2">
            Prevents list items from re-rendering unnecessarily
          </p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>✓ Only re-renders when props change</li>
            <li>✓ Improves large list performance</li>
            <li>✓ Reduces CPU usage</li>
          </ul>
        </div>

        <div className="border-l-4 border-orange-500 pl-4">
          <h3 className="font-semibold text-orange-600 mb-1">usePreloadImage</h3>
          <p className="text-sm text-gray-700 mb-2">
            Pre-loads images in background for faster display
          </p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>✓ Smooth hero image display</li>
            <li>✓ Improves perceived performance</li>
            <li>✓ Better user experience</li>
          </ul>
        </div>
      </div>
    </div>
  ),
};

// ====== USAGE PATTERNS ======
export const UsagePatterns: Story = {
  render: () => (
    <div className="max-w-2xl text-sm bg-gray-50 p-6 rounded-lg">
      <h3 className="font-semibold mb-4">Common Usage Patterns</h3>
      
      <div className="space-y-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">LazyImage in Search Results:</h4>
          <pre className="bg-white p-3 rounded text-xs overflow-auto">
{`<LazyImage
  src={hostel.image}
  alt={hostel.name}
  placeholder="https://via.placeholder.com/160x160"
  className="w-40 h-40 object-cover rounded"
/>`}
          </pre>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">useDebounce in Filters:</h4>
          <pre className="bg-white p-3 rounded text-xs overflow-auto">
{`const [searchTerm, setSearchTerm] = useState('');
const debouncedTerm = useDebounce(searchTerm, 300);

useEffect(() => {
  const results = search(debouncedTerm);
  setFilteredResults(results);
}, [debouncedTerm]);`}
          </pre>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">MemoizedListItem:</h4>
          <pre className="bg-white p-3 rounded text-xs overflow-auto">
{`const Item = React.memo(({ item }) => (
  &lt;div&gt;{item.name}&lt;/div&gt;
));

notifications.map(n =&gt; (
  &lt;Item key={n.id} item={n} /&gt;
))`}
          </pre>
        </div>
      </div>
    </div>
  ),
};
