import { NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = 'synergy_auth_session';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Paths that are always public
  const isPublicPath =
    pathname.startsWith('/login') ||
    pathname.startsWith('/demo') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/_next') ||
    pathname.includes('/favicon.ico');

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check for authentication cookie
  const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!authToken) {
    // If it's an API route, return 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    // Otherwise redirect browser to login page
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
