import { NextResponse } from 'next/server';

export function badRequest(message: string, code = 'BAD_REQUEST') {
  return NextResponse.json({ error: message, code }, { status: 400 });
}

export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message, code: 'UNAUTHENTICATED' }, { status: 401 });
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message, code: 'FORBIDDEN' }, { status: 403 });
}

export function notFound(message = 'Not found') {
  return NextResponse.json({ error: message, code: 'NOT_FOUND' }, { status: 404 });
}

export function serverError(message = 'Internal server error') {
  return NextResponse.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 });
}
