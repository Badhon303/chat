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
    const { messageId, emoji } = body;

    // Check if reaction already exists
    const existing = await prisma.reaction.findFirst({
      where: {
        userId: session.userId,
        messageId,
        emoji,
      },
    });

    if (existing) {
      // Remove reaction
      await prisma.reaction.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ action: 'removed', reaction: existing });
    }

    // Add reaction
    const reaction = await prisma.reaction.create({
      data: {
        emoji,
        userId: session.userId,
        messageId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            isOnline: true,
            lastSeen: true,
          },
        },
      },
    });

    return NextResponse.json({ action: 'added', reaction });
  } catch (error) {
    console.error('Reaction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
