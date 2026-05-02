import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(rootDir, '.')
    }
  },
  test: {
    environment: 'node',
    setupFiles: ['./__tests__/setup.ts'],
    include: ['__tests__/integration/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    pool: 'forks',
    maxWorkers: 1
  }
});
