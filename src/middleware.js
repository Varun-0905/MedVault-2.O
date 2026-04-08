import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const TOKEN_NAME = 'session';
const ADMIN_PATHS = ['/admin', '/api/admin'];
const PROTECTED_PATHS = ['/dashboard', '/api/protected', '/profile'];

async function verifyToken(token) {
  if (!process.env.JWT_SECRET) return null;

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const cookie = req.cookies.get(TOKEN_NAME)?.value;

  const needsAuth =
    PROTECTED_PATHS.some((path) => pathname.startsWith(path)) ||
    ADMIN_PATHS.some((path) => pathname.startsWith(path));

  if (!needsAuth) {
    return NextResponse.next();
  }

  const payload = cookie ? await verifyToken(cookie) : null;

  if (!payload) {
    const url = new URL('/login', req.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (ADMIN_PATHS.some((path) => pathname.startsWith(path))) {
    if (payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/403', req.url));
    }
  }

  const response = NextResponse.next();
  response.headers.set('x-user-id', String(payload.sub || ''));
  response.headers.set('x-user-role', String(payload.role || ''));
  response.headers.set('x-user-email', String(payload.email || ''));

  return response;
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/api/admin',
    '/api/admin/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/api/protected',
    '/api/protected/:path*',
    '/profile',
    '/profile/:path*',
  ],
};
