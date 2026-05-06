import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PrimaryButton, SecondaryButton, GhostButton, IconButton, LinkButton } from '../buttons';
import { ChevronRight, Plus, Trash2, ExternalLink } from 'lucide-react';

const meta = {
  title: 'UI/Buttons',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ====== PRIMARY BUTTON ======
export const Primary: Story = {
  render: () => <PrimaryButton>Primary Button</PrimaryButton>,
};

export const PrimaryHover: Story = {
  render: () => (
    <div className="hover:bg-gray-100 p-4 rounded">
      <PrimaryButton>Hover State</PrimaryButton>
    </div>
  ),
};

export const PrimaryDisabled: Story = {
  render: () => <PrimaryButton disabled>Disabled Button</PrimaryButton>,
};

export const PrimaryWithIcon: Story = {
  render: () => (
    <PrimaryButton className="flex items-center gap-2">
      <Plus size={18} />
      Add New Item
    </PrimaryButton>
  ),
};

export const PrimaryLoading: Story = {
  render: () => (
    <PrimaryButton disabled>
      <span className="inline-block animate-spin mr-2">⌛</span>
      Loading...
    </PrimaryButton>
  ),
};

// ====== SECONDARY BUTTON ======
export const Secondary: Story = {
  render: () => <SecondaryButton>Secondary Button</SecondaryButton>,
};

export const SecondaryDisabled: Story = {
  render: () => <SecondaryButton disabled>Disabled</SecondaryButton>,
};

export const SecondaryWithIcon: Story = {
  render: () => (
    <SecondaryButton className="flex items-center gap-2">
      Cancel
      <ChevronRight size={18} />
    </SecondaryButton>
  ),
};

// ====== GHOST BUTTON ======
export const Ghost: Story = {
  render: () => <GhostButton>Ghost Button</GhostButton>,
};

export const GhostDisabled: Story = {
  render: () => <GhostButton disabled>Disabled</GhostButton>,
};

export const GhostWithLink: Story = {
  render: () => (
    <GhostButton className="flex items-center gap-2">
      View Details
      <ExternalLink size={16} />
    </GhostButton>
  ),
};

// ====== ICON BUTTON ======
export const Icon: Story = {
  render: () => <IconButton aria-label="Delete item"><Trash2 size={20} /></IconButton>,
};

export const IconDisabled: Story = {
  render: () => (
    <IconButton disabled aria-label="Delete item">
      <Trash2 size={20} />
    </IconButton>
  ),
};

export const IconSmall: Story = {
  render: () => (
    <IconButton aria-label="Add item">
      <Plus size={18} />
    </IconButton>
  ),
};

// ====== LINK BUTTON ======
export const Link: Story = {
  render: () => <LinkButton>Link Button</LinkButton>,
};

export const LinkDisabled: Story = {
  render: () => <LinkButton disabled>Disabled Link</LinkButton>,
};

export const LinkWithIcon: Story = {
  render: () => (
    <LinkButton className="flex items-center gap-1">
      Learn More
      <ExternalLink size={14} />
    </LinkButton>
  ),
};

// ====== COMBINATIONS ======
export const AllButtonTypes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 justify-center">
      <PrimaryButton>Primary</PrimaryButton>
      <SecondaryButton>Secondary</SecondaryButton>
      <GhostButton>Ghost</GhostButton>
      <IconButton aria-label="Icon"><Plus size={20} /></IconButton>
      <LinkButton>Link</LinkButton>
    </div>
  ),
};

export const ButtonSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 items-center">
        <label className="w-20 text-sm font-medium">Small:</label>
        <PrimaryButton className="px-3 py-1.5 text-sm">Small</PrimaryButton>
      </div>
      <div className="flex gap-4 items-center">
        <label className="w-20 text-sm font-medium">Medium:</label>
        <PrimaryButton className="px-4 py-2">Medium</PrimaryButton>
      </div>
      <div className="flex gap-4 items-center">
        <label className="w-20 text-sm font-medium">Large:</label>
        <PrimaryButton className="px-6 py-3 text-lg">Large</PrimaryButton>
      </div>
    </div>
  ),
};

export const ButtonStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-semibold mb-2">Primary States</h3>
        <div className="flex gap-2 flex-wrap">
          <PrimaryButton>Normal</PrimaryButton>
          <PrimaryButton disabled>Disabled</PrimaryButton>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-2">Secondary States</h3>
        <div className="flex gap-2 flex-wrap">
          <SecondaryButton>Normal</SecondaryButton>
          <SecondaryButton disabled>Disabled</SecondaryButton>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-2">Ghost States</h3>
        <div className="flex gap-2 flex-wrap">
          <GhostButton>Normal</GhostButton>
          <GhostButton disabled>Disabled</GhostButton>
        </div>
      </div>
    </div>
  ),
};
