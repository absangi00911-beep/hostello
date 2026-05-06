import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TextInput, NumberInput, Checkbox, Radio, Select, TextArea } from '../form-inputs';

const meta = {
  title: 'UI/Form Inputs',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ====== TEXT INPUT ======
export const TextInputDefault: Story = {
  render: () => (
    <div className="w-80">
      <TextInput label="Full Name" placeholder="Enter your full name" />
    </div>
  ),
};

export const TextInputWithValue: Story = {
  render: () => (
    <div className="w-80">
      <TextInput label="Email" placeholder="you@example.com" defaultValue="john@example.com" />
    </div>
  ),
};

export const TextInputWithError: Story = {
  render: () => (
    <div className="w-80">
      <TextInput 
        label="Email" 
        placeholder="you@example.com"
        error="Please enter a valid email address"
      />
    </div>
  ),
};

export const TextInputDisabled: Story = {
  render: () => (
    <div className="w-80">
      <TextInput 
        label="Disabled Field" 
        placeholder="Cannot edit"
        disabled
      />
    </div>
  ),
};

// ====== NUMBER INPUT ======
export const NumberInputDefault: Story = {
  render: () => (
    <div className="w-80">
      <NumberInput label="Age" placeholder="Enter your age" />
    </div>
  ),
};

export const NumberInputWithRange: Story = {
  render: () => (
    <div className="w-80">
      <NumberInput 
        label="Price" 
        placeholder="0.00"
        min="0"
        max="10000"
        step="0.01"
      />
    </div>
  ),
};

export const NumberInputWithError: Story = {
  render: () => (
    <div className="w-80">
      <NumberInput 
        label="Quantity" 
        placeholder="Enter quantity"
        error="Must be greater than 0"
      />
    </div>
  ),
};

// ====== CHECKBOX ======
export const CheckboxDefault: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Checkbox label="I agree to terms" />
      <Checkbox label="Subscribe to newsletter" defaultChecked />
    </div>
  ),
};

export const CheckboxDisabled: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Checkbox label="Disabled unchecked" disabled />
      <Checkbox label="Disabled checked" disabled defaultChecked />
    </div>
  ),
};

export const CheckboxGroup: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <h3 className="font-semibold">Select amenities:</h3>
      <Checkbox label="Wi-Fi" />
      <Checkbox label="Parking" />
      <Checkbox label="Pool" defaultChecked />
      <Checkbox label="Gym" defaultChecked />
    </div>
  ),
};

// ====== RADIO ======
export const RadioDefault: Story = {
  render: () => {
    const [selected, setSelected] = useState('option1');
    return (
      <div className="flex flex-col gap-3">
        <Radio 
          label="Option 1" 
          value="option1" 
          checked={selected === 'option1'}
          onChange={(e) => setSelected(e.target.value)}
        />
        <Radio 
          label="Option 2" 
          value="option2"
          checked={selected === 'option2'}
          onChange={(e) => setSelected(e.target.value)}
        />
        <Radio 
          label="Option 3" 
          value="option3"
          checked={selected === 'option3'}
          onChange={(e) => setSelected(e.target.value)}
        />
      </div>
    );
  },
};

export const RadioDisabled: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Radio label="Enabled" value="enabled" />
      <Radio label="Disabled" value="disabled" disabled />
      <Radio label="Disabled checked" value="checked" disabled defaultChecked />
    </div>
  ),
};

// ====== SELECT ======
export const SelectDefault: Story = {
  render: () => (
    <div className="w-80">
      <Select label="Choose an option">
        <option value="">-- Select --</option>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
        <option value="option3">Option 3</option>
      </Select>
    </div>
  ),
};

export const SelectWithValue: Story = {
  render: () => (
    <div className="w-80">
      <Select label="Choose a country" defaultValue="usa">
        <option value="">-- Select --</option>
        <option value="usa">United States</option>
        <option value="canada">Canada</option>
        <option value="uk">United Kingdom</option>
      </Select>
    </div>
  ),
};

export const SelectDisabled: Story = {
  render: () => (
    <div className="w-80">
      <Select label="Disabled select" disabled>
        <option value="">-- Select --</option>
        <option value="option1">Option 1</option>
      </Select>
    </div>
  ),
};

export const SelectWithError: Story = {
  render: () => (
    <div className="w-80">
      <Select label="Category" error="Please select a category">
        <option value="">-- Select --</option>
        <option value="cat1">Category 1</option>
        <option value="cat2">Category 2</option>
      </Select>
    </div>
  ),
};

// ====== TEXTAREA ======
export const TextAreaDefault: Story = {
  render: () => (
    <div className="w-96">
      <TextArea label="Message" placeholder="Enter your message here..." />
    </div>
  ),
};

export const TextAreaWithValue: Story = {
  render: () => (
    <div className="w-96">
      <TextArea 
        label="Review" 
        placeholder="Share your experience..."
        defaultValue="This is a great place to stay!"
        rows={5}
      />
    </div>
  ),
};

export const TextAreaWithError: Story = {
  render: () => (
    <div className="w-96">
      <TextArea 
        label="Description" 
        placeholder="Describe the issue..."
        error="Description must be at least 20 characters"
      />
    </div>
  ),
};

export const TextAreaDisabled: Story = {
  render: () => (
    <div className="w-96">
      <TextArea 
        label="Read-only notes" 
        placeholder="Cannot edit"
        disabled
        defaultValue="This is a read-only message."
      />
    </div>
  ),
};

// ====== FORM COMBINATIONS ======
export const CompleteForm: Story = {
  render: () => (
    <form className="w-96 flex flex-col gap-4">
      <TextInput 
        label="Full Name" 
        placeholder="Enter your name"
        required
      />
      <TextInput 
        label="Email" 
        placeholder="your@email.com"
        type="email"
        required
      />
      <NumberInput 
        label="Age" 
        placeholder="18+"
        min="18"
        required
      />
      <Select label="Room Type">
        <option value="">-- Select --</option>
        <option value="single">Single</option>
        <option value="double">Double</option>
        <option value="dorm">Dorm</option>
      </Select>
      <TextArea 
        label="Special Requests" 
        placeholder="Any special requests?"
        rows={4}
      />
      <Checkbox label="I agree to the terms and conditions" required />
      <button 
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700"
      >
        Submit
      </button>
    </form>
  ),
};

export const AllInputTypes: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6 max-w-4xl">
      <div className="w-full">
        <h3 className="font-semibold mb-4">Text Input</h3>
        <TextInput label="Name" placeholder="Enter name" />
      </div>
      <div className="w-full">
        <h3 className="font-semibold mb-4">Number Input</h3>
        <NumberInput label="Price" placeholder="0.00" />
      </div>
      <div className="w-full">
        <h3 className="font-semibold mb-4">Checkbox</h3>
        <Checkbox label="Accept terms" />
      </div>
      <div className="w-full">
        <h3 className="font-semibold mb-4">Radio</h3>
        <Radio label="Option 1" value="opt1" />
      </div>
      <div className="w-full">
        <h3 className="font-semibold mb-4">Select</h3>
        <Select label="Choose">
          <option>Option 1</option>
          <option>Option 2</option>
        </Select>
      </div>
      <div className="w-full">
        <h3 className="font-semibold mb-4">Text Area</h3>
        <TextArea label="Message" placeholder="Enter message" rows={3} />
      </div>
    </div>
  ),
};
