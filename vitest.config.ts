import { defineConfig } from 'vitest/config';
import path from 'path';

const SHARED_ROOT = path.resolve(__dirname, './packages/shared/src');

export default defineConfig({
  plugins: [
    {
      name: 'resolve-shared-package',
      resolveId(id) {
        if (id === '@hostello/shared')              return path.join(SHARED_ROOT, 'index.ts');
        if (id === '@hostello/shared/validations')  return path.join(SHARED_ROOT, 'validations/index.ts');
        if (id === '@hostello/shared/types')        return path.join(SHARED_ROOT, 'types/index.ts');
        return undefined;
      },
    },
  ],
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});