import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Example/Test',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Test: Story = {
  render: () => <div>Test Story</div>,
};
