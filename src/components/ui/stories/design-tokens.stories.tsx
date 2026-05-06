import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Design/Design Tokens',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ====== COLOR TOKENS ======
export const Colors: Story = {
  render: () => (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Color System</h2>
      
      <div className="space-y-8">
        <div>
          <h3 className="font-semibold text-lg mb-4">Primary Colors</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-24 h-24 bg-blue-600 rounded-lg mb-2 mx-auto"></div>
              <p className="text-xs font-medium">Primary</p>
              <p className="text-xs text-gray-600">#2563eb</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-blue-700 rounded-lg mb-2 mx-auto"></div>
              <p className="text-xs font-medium">Primary Dark</p>
              <p className="text-xs text-gray-600">#1d4ed8</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-blue-50 rounded-lg mb-2 mx-auto border border-gray-200"></div>
              <p className="text-xs font-medium">Primary Light</p>
              <p className="text-xs text-gray-600">#eff6ff</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-4">Semantic Colors</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500 rounded-lg mb-2 mx-auto"></div>
              <p className="text-xs font-medium">Success</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-red-500 rounded-lg mb-2 mx-auto"></div>
              <p className="text-xs font-medium">Error</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-500 rounded-lg mb-2 mx-auto"></div>
              <p className="text-xs font-medium">Warning</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-500 rounded-lg mb-2 mx-auto"></div>
              <p className="text-xs font-medium">Info</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-4">Neutral Colors</h3>
          <div className="grid grid-cols-6 gap-3">
            {[
              { name: '900', value: '#111827' },
              { name: '700', value: '#374151' },
              { name: '500', value: '#6b7280' },
              { name: '300', value: '#d1d5db' },
              { name: '200', value: '#e5e7eb' },
              { name: '50', value: '#f9fafb' },
            ].map((color) => (
              <div key={color.name} className="text-center">
                <div
                  className="w-16 h-16 rounded-lg mb-2 mx-auto border border-gray-300"
                  style={{ backgroundColor: color.value }}
                ></div>
                <p className="text-xs font-medium">{color.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
};

// ====== TYPOGRAPHY ======
export const Typography: Story = {
  render: () => (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Typography</h2>
      
      <div className="space-y-8">
        <div>
          <h3 className="text-3xl font-bold text-gray-900">Heading 1 (32px, Bold)</h3>
          <p className="text-sm text-gray-600 mt-1">Used for page titles and main headings</p>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-gray-900">Heading 2 (24px, Bold)</h3>
          <p className="text-sm text-gray-600 mt-1">Used for section headings</p>
        </div>

        <div>
          <h3 className="text-xl font-bold text-gray-900">Heading 3 (20px, Bold)</h3>
          <p className="text-sm text-gray-600 mt-1">Used for subsection headings</p>
        </div>

        <div>
          <p className="text-base text-gray-900">Body Text (16px, Regular)</p>
          <p className="text-sm text-gray-600 mt-1">Default body text for regular content</p>
        </div>

        <div>
          <p className="text-sm text-gray-900">Small Text (14px, Regular)</p>
          <p className="text-sm text-gray-600 mt-1">Used for helper text and labels</p>
        </div>

        <div>
          <p className="text-xs text-gray-900 uppercase tracking-wide">Overline (12px, Bold, Uppercase)</p>
          <p className="text-sm text-gray-600 mt-1">Used for labels and tags</p>
        </div>
      </div>
    </div>
  ),
};

// ====== SPACING SCALE ======
export const Spacing: Story = {
  render: () => (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Spacing Scale (8px base)</h2>
      
      <div className="space-y-6">
        {[
          { name: 'space-0.5', size: '4px' },
          { name: 'space-1', size: '8px' },
          { name: 'space-2', size: '16px' },
          { name: 'space-3', size: '24px' },
          { name: 'space-4', size: '32px' },
          { name: 'space-6', size: '48px' },
          { name: 'space-8', size: '64px' },
        ].map((space) => (
          <div key={space.name} className="flex items-center gap-4">
            <div className="w-24 text-sm font-mono font-medium text-gray-600">{space.name}</div>
            <div className="bg-blue-200 rounded" style={{ width: space.size, height: '24px' }}></div>
            <div className="text-sm text-gray-600">{space.size}</div>
          </div>
        ))}
      </div>
    </div>
  ),
};

// ====== BORDER RADIUS ======
export const BorderRadius: Story = {
  render: () => (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Border Radius</h2>
      
      <div className="grid grid-cols-4 gap-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-500 rounded mb-2 mx-auto"></div>
          <p className="text-xs font-medium">rounded (4px)</p>
        </div>
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-500 rounded-lg mb-2 mx-auto"></div>
          <p className="text-xs font-medium">rounded-lg (8px)</p>
        </div>
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-500 rounded-xl mb-2 mx-auto"></div>
          <p className="text-xs font-medium">rounded-xl (12px)</p>
        </div>
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-500 rounded-full mb-2 mx-auto"></div>
          <p className="text-xs font-medium">rounded-full</p>
        </div>
      </div>
    </div>
  ),
};

// ====== SHADOWS ======
export const Shadows: Story = {
  render: () => (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Shadows</h2>
      
      <div className="space-y-8">
        <div className="flex gap-8">
          <div className="flex-1">
            <div className="h-32 bg-white rounded-lg shadow-sm"></div>
            <p className="text-sm font-medium mt-2 text-center">Shadow SM</p>
          </div>
          <div className="flex-1">
            <div className="h-32 bg-white rounded-lg shadow-md"></div>
            <p className="text-sm font-medium mt-2 text-center">Shadow MD</p>
          </div>
          <div className="flex-1">
            <div className="h-32 bg-white rounded-lg shadow-lg"></div>
            <p className="text-sm font-medium mt-2 text-center">Shadow LG</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

// ====== BREAKPOINTS ======
export const Breakpoints: Story = {
  render: () => (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Responsive Breakpoints</h2>
      
      <div className="space-y-4">
        {[
          { name: 'sm', size: '640px', desc: 'Small tablets and up' },
          { name: 'md', size: '768px', desc: 'Medium tablets and up' },
          { name: 'lg', size: '1024px', desc: 'Laptops and desktops' },
          { name: 'xl', size: '1280px', desc: 'Large desktops' },
          { name: '2xl', size: '1536px', desc: 'Extra large displays' },
        ].map((bp) => (
          <div key={bp.name} className="border border-gray-200 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-mono font-semibold text-gray-900">{bp.name}</p>
                <p className="text-sm text-gray-600">{bp.desc}</p>
              </div>
              <p className="font-mono text-gray-600">{bp.size}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};

// ====== COMPLETE DESIGN SYSTEM ======
export const CompleteSystem: Story = {
  render: () => (
    <div className="max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Complete Design System</h1>
      
      <div className="grid grid-cols-2 gap-8">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Light Mode</h2>
          <div className="space-y-3">
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <p className="font-medium text-gray-900">Primary Button</p>
              <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Click me
              </button>
            </div>
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-900 mb-2">Input Field</label>
              <input 
                type="text" 
                placeholder="Enter text..." 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-white">Dark Mode (Preview)</h2>
          <div className="space-y-3">
            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <p className="font-medium text-gray-100">Primary Button</p>
              <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Click me
              </button>
            </div>
            <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-100 mb-2">Input Field</label>
              <input 
                type="text" 
                placeholder="Enter text..." 
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};
