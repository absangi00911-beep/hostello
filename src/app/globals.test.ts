import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import { describe, expect, it } from 'vitest';

const readGlobalsCss = () => readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');

const transformGlobalsCss = async () => {
  const result = await postcss([
    tailwindcss({
      content: [
        {
          raw: '<div class="skeleton !skeleton dark !dark ref-id container-app"></div>',
          extension: 'html',
        },
      ],
      theme: { extend: {} },
      plugins: [],
    }),
    autoprefixer,
  ]).process(readGlobalsCss(), { from: 'src/app/globals.css' });

  return result.css;
};

describe('globals.css', () => {
  it('does not emit empty selectors after the Tailwind transform', async () => {
    const transformed = await transformGlobalsCss();
    const emptySelectorLines = transformed
      .split(/\r?\n/)
      .flatMap((line, index) => (/^\s*\{\s*$/.test(line) ? [index + 1] : []));

    expect(emptySelectorLines).toEqual([]);
    expect(transformed).toContain('animation-duration: 0.01ms !important;');
  });
});
