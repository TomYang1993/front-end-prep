import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const SESSION_COOKIE_NAME = 'app-session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24 hours

export interface SessionPayload {
  id: string;
  email: string;
  roles: string[];
}

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET env var is required in production');
  }
  return new TextEncoder().encode(secret ?? 'dev-session-secret-not-for-prod');
}

/** Decode and verify a raw session JWT string. Works anywhere (middleware, route handlers, etc). */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      id: payload.id as string,
      email: payload.email as string,
      roles: payload.roles as string[],
    };
  } catch {
    return null;
  }
}

/** Sign a session payload into a JWT string. Works anywhere. */
export async function signSessionToken(user: SessionPayload): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    roles: user.roles,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

// ── Convenience wrappers using next/headers (Server Components, Route Handlers) ──

/** Read the session cookie via next/headers. */
export async function readSessionCookie(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Write session cookie via next/headers. Only works in Route Handlers / Server Actions. */
export async function writeSessionCookie(user: SessionPayload) {
  const token = await signSessionToken(user);
  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** Clear the session cookie. Only works in Route Handlers / Server Actions. */
export function clearSessionCookie() {
  cookies().set(SESSION_COOKIE_NAME, '', { path: '/', maxAge: 0 });
}
