import { describe, expect, it } from 'vitest';

describe('smoke', () => {
  it('vitest scaffolding wired', () => {
    expect(1 + 1).toBe(2);
  });

  it('setup file applied SESSION_SECRET', () => {
    expect(process.env.SESSION_SECRET).toBeTruthy();
  });
});
