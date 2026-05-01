import { afterEach, beforeAll, vi } from 'vitest';

beforeAll(() => {
  process.env.SESSION_SECRET ??= 'test-session-secret-32-bytes-long-xx';
  process.env.NODE_ENV = 'test';
});

afterEach(async () => {
  vi.restoreAllMocks();
  if (typeof window !== 'undefined') {
    const { cleanup } = await import('@testing-library/react');
    cleanup();
  }
});
