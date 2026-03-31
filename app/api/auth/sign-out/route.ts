import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session-cookie';

export async function POST() {
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
