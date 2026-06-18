import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SignJWT } from 'jose';

const SECRET = 'unit-test-session-secret-32-bytes!!';

const cookieStore = new Map<string, { value: string; opts?: unknown }>();
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieStore.has(name) ? { value: cookieStore.get(name)!.value } : undefined,
    set: (name: string, value: string, opts?: unknown) =>
      cookieStore.set(name, { value, opts })
  })
}));

describe('session-cookie', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.SESSION_SECRET = SECRET;
    cookieStore.clear();
    vi.resetModules();
  });

  afterEach(() => {
    cookieStore.clear();
  });

  it('sign + verify roundtrip preserves payload', async () => {
    const { signSessionToken, verifySessionToken } = await import(
      '@/lib/auth/session-cookie'
    );
    const token = await signSessionToken({
      id: 'u1',
      email: 'a@b.com',
      roles: ['admin']
    });
    const payload = await verifySessionToken(token);
    expect(payload).toEqual({ id: 'u1', email: 'a@b.com', roles: ['admin'] });
  });

  it('verifySessionToken returns null for tampered token', async () => {
    const { signSessionToken, verifySessionToken } = await import(
      '@/lib/auth/session-cookie'
    );
    const token = await signSessionToken({ id: 'u1', email: 'a@b.com', roles: [] });
    const tampered = token.slice(0, -2) + 'xx';
    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it('verifySessionToken returns null for token signed with wrong secret', async () => {
    const wrong = new TextEncoder().encode('a-different-secret-32-bytes-long!!');
    const foreignToken = await new SignJWT({ id: 'u1', email: 'x', roles: [] })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(wrong);
    const { verifySessionToken } = await import('@/lib/auth/session-cookie');
    expect(await verifySessionToken(foreignToken)).toBeNull();
  });

  it('verifySessionToken returns null for expired token', async () => {
    const secret = new TextEncoder().encode(SECRET);
    const expired = await new SignJWT({ id: 'u1', email: 'x', roles: [] })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
      .sign(secret);
    const { verifySessionToken } = await import('@/lib/auth/session-cookie');
    expect(await verifySessionToken(expired)).toBeNull();
  });

  it('verifySessionToken returns null for garbage', async () => {
    const { verifySessionToken } = await import('@/lib/auth/session-cookie');
    expect(await verifySessionToken('not-a-jwt')).toBeNull();
    expect(await verifySessionToken('')).toBeNull();
  });

  it('throws when SESSION_SECRET missing in production', async () => {
    delete process.env.SESSION_SECRET;
    process.env.NODE_ENV = 'production';
    const { signSessionToken } = await import('@/lib/auth/session-cookie');
    await expect(
      signSessionToken({ id: 'u1', email: 'x', roles: [] })
    ).rejects.toThrow(/SESSION_SECRET/);
  });

  it('throws when SESSION_SECRET missing outside production', async () => {
    delete process.env.SESSION_SECRET;
    process.env.NODE_ENV = 'development';
    const { signSessionToken } = await import('@/lib/auth/session-cookie');
    await expect(
      signSessionToken({ id: 'u1', email: 'x', roles: [] })
    ).rejects.toThrow(/SESSION_SECRET/);
  });

  it('readSessionCookie returns null when cookie absent', async () => {
    const { readSessionCookie } = await import('@/lib/auth/session-cookie');
    expect(await readSessionCookie()).toBeNull();
  });

  it('writeSessionCookie stores signed token; readSessionCookie verifies it', async () => {
    const { writeSessionCookie, readSessionCookie, SESSION_COOKIE_NAME } =
      await import('@/lib/auth/session-cookie');
    await writeSessionCookie({ id: 'u9', email: 'z@z.com', roles: ['user'] });
    expect(cookieStore.has(SESSION_COOKIE_NAME)).toBe(true);
    expect(await readSessionCookie()).toEqual({
      id: 'u9',
      email: 'z@z.com',
      roles: ['user']
    });
  });

  it('clearSessionCookie writes maxAge: 0', async () => {
    const { clearSessionCookie, SESSION_COOKIE_NAME } = await import(
      '@/lib/auth/session-cookie'
    );
    await clearSessionCookie();
    const entry = cookieStore.get(SESSION_COOKIE_NAME);
    expect(entry?.value).toBe('');
    expect((entry?.opts as { maxAge: number }).maxAge).toBe(0);
  });
});
