import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, TOKEN_NAME } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getSession();

    if (session) {
      await prisma.user.update({
        where: { id: session.userId },
        data: { isOnline: false, lastSeen: new Date() },
      });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(TOKEN_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
