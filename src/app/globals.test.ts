import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
import { describe, expect, it } from 'vitest';

const readGlobalsCss = () => readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');

const transformCss = async (css: string) => {
  const result = await postcss([
    tailwindcss({ base: process.cwd() }),
    autoprefixer,
  ]).process(css, { from: 'src/app/globals.css' });

  return result.css;
};

const transformGlobalsCss = () => transformCss(readGlobalsCss());

describe('globals.css', () => {
  it('uses the Tailwind v4 CSS entrypoint', () => {
    const css = readGlobalsCss();

    expect(css).toContain('@import "tailwindcss";');
    expect(css).not.toContain('@tailwind base');
    expect(css).not.toContain('@tailwind components');
    expect(css).not.toContain('@tailwind utilities');
  });

  it('exposes Hostello and shadcn design tokens as Tailwind utilities', async () => {
    const transformed = await transformCss(`${readGlobalsCss()}\n@source inline("bg-action text-action border-default rounded-lg font-heading shadow-app-sm bg-background text-foreground border-border text-muted-foreground");`);

    expect(transformed).toContain('.bg-action');
    expect(transformed).toContain('.text-action');
    expect(transformed).toContain('.border-default');
    expect(transformed).toContain('.rounded-lg');
    expect(transformed).toContain('.font-heading');
    expect(transformed).toContain('.shadow-app-sm');
    expect(transformed).toContain('.bg-background');
    expect(transformed).toContain('.text-foreground');
    expect(transformed).toContain('.border-border');
    expect(transformed).toContain('.text-muted-foreground');
  });

  it('does not emit empty selectors after the Tailwind transform', async () => {
    const transformed = await transformGlobalsCss();
    const emptySelectorLines = transformed
      .split(/\r?\n/)
      .flatMap((line, index) => (/^\s*\{\s*$/.test(line) ? [index + 1] : []));

    expect(emptySelectorLines).toEqual([]);
    expect(transformed).toContain('animation-duration: 0.01ms !important;');
  });
});
