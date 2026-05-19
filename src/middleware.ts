import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('chat-session')?.value;
  const { pathname } = request.nextUrl;

  if (pathname === '/login' || pathname.startsWith('/api/auth/login')) {
    if (token) {
      return NextResponse.redirect(new URL('/chat', request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/login')) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname === '/chat' || pathname === '/') {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/chat', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/chat', '/login', '/api/:path*'],
};
