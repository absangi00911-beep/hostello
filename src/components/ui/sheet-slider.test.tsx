// Path: src/components/ui/sheet-slider.test.tsx

import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/utils', () => ({
  cn: (...inputs: Array<string | undefined | false>) => inputs.filter(Boolean).join(' '),
}));

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './sheet';
import { Slider } from './slider';

describe('shadcn UI primitives', () => {
  it('exports sheet and slider components used by filter flows', () => {
    expect(Sheet).toBeDefined();
    expect(SheetContent).toBeDefined();
    expect(SheetHeader).toBeDefined();
    expect(SheetTitle).toBeDefined();
    expect(SheetTrigger).toBeDefined();
    expect(Slider).toBeDefined();
  });
});
