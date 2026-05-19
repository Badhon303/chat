import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const otherUser = await prisma.user.findFirst({
      where: {
        id: { not: session.userId },
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        isOnline: true,
        lastSeen: true,
      },
    });

    if (!otherUser) {
      return NextResponse.json(
        { error: 'Other user not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: otherUser });
  } catch (error) {
    console.error('Other user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
