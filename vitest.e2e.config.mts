import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
  test: {
    environment: 'node',
    include: ['test/e2e/**/*.test.ts'],
    setupFiles: ['test/setup-e2e.ts'],
    fileParallelism: false,
    testTimeout: 15_000,
    hookTimeout: 30_000,
  },
});