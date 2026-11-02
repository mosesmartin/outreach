import { NextResponse } from 'next/server';
import { verifyAuthToken, AUTH_COOKIE_NAME } from './auth';

export function requestAccess(req, mutate = false) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? verifyAuthToken(token) : null;
  if (!session || session.role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Please sign in to manage website requests.' }, { status: 401 }) };
  }
  if (mutate && req.headers.get('origin') && req.headers.get('origin') !== new URL(req.url).origin) {
    return { error: NextResponse.json({ error: 'This request must come from your dashboard.' }, { status: 403 }) };
  }
  return { session };
}

export function requestApiError(error) {
  return NextResponse.json({ error: error.message || 'Website request operation failed.', code: error.code || 'REQUEST_ERROR' }, { status: error.status || 502 });
}
