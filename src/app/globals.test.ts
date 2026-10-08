import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
import { describe, expect, it } from 'vitest';

const readGlobalsCss = () => readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');
const tailwindTransformTimeoutMs = 15_000;

const readThemeTokens = (css: string, selector: string) => {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const block = css.match(new RegExp(`${escapedSelector}\\s*\\{([^{}]*)\\}`))?.[1];

  if (!block) throw new Error(`Missing theme token block for ${selector}`);

  return Object.fromEntries(
    [...block.matchAll(/(--[\w-]+):\s*(#[\da-fA-F]{6})\s*;/g)].map(([, name, value]) => [name, value]),
  ) as Record<string, string>;
};

const getToken = (tokens: Record<string, string>, name: string) => {
  const value = tokens[name];

  if (!value) throw new Error(`Missing CSS token ${name}`);

  return value;
};

const relativeLuminance = (hex: string) => {
  const channels = [1, 3, 5].map((offset) => {
    const channel = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const contrastRatio = (foreground: string, background: string) => {
  const luminances = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (luminances[0] + 0.05) / (luminances[1] + 0.05);
};

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

  it('keeps accent controls, links, and placeholders readable in both color schemes', () => {
    const css = readGlobalsCss();
    const themes = [readThemeTokens(css, ':root'), readThemeTokens(css, '.dark')];

    for (const tokens of themes) {
      const inverse = getToken(tokens, '--color-text-inverse');
      const primary = getToken(tokens, '--color-primary');
      const shadcnPrimary = getToken(tokens, '--primary');
      const shadcnPrimaryForeground = getToken(tokens, '--primary-foreground');
      const action = getToken(tokens, '--color-action');
      const ring = getToken(tokens, '--ring');
      const link = getToken(tokens, '--color-text-link');
      const placeholder = getToken(tokens, '--color-text-placeholder');
      const surface = getToken(tokens, '--color-bg-card');
      const sidebar = getToken(tokens, '--color-bg-sidebar');

      for (const background of [
        primary,
        action,
        getToken(tokens, '--color-primary-dark'),
        getToken(tokens, '--color-primary-deep'),
        getToken(tokens, '--color-action-dark'),
        getToken(tokens, '--color-action-pressed'),
        getToken(tokens, '--color-error'),
        getToken(tokens, '--color-success'),
        getToken(tokens, '--color-warning'),
      ]) {
        expect(contrastRatio(inverse, background)).toBeGreaterThanOrEqual(4.5);
      }

      expect(contrastRatio(primary, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(shadcnPrimaryForeground, shadcnPrimary)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(ring, surface)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(link, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(placeholder, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(placeholder, sidebar)).toBeGreaterThanOrEqual(4.5);
    }
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
  }, tailwindTransformTimeoutMs);

  it('does not emit empty selectors after the Tailwind transform', async () => {
    const transformed = await transformGlobalsCss();
    const emptySelectorLines = transformed
      .split(/\r?\n/)
      .flatMap((line, index) => (/^\s*\{\s*$/.test(line) ? [index + 1] : []));

    expect(emptySelectorLines).toEqual([]);
    expect(transformed).toContain('animation-duration: 0.01ms !important;');
  }, tailwindTransformTimeoutMs);
});
