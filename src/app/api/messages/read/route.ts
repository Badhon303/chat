import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { messageIds } = body;

    await prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        receiverId: session.userId,
        status: { not: 'SEEN' },
      },
      data: { status: 'SEEN' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Read messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
