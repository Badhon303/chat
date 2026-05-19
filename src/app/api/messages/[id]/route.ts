import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { content, isPinned } = body;

    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Only sender can edit content
    if (content !== undefined && message.senderId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.message.update({
      where: { id },
      data: {
        ...(content !== undefined ? { content, isEdited: true } : {}),
        ...(isPinned !== undefined ? { isPinned } : {}),
      },
      include: {
        sender: {
          select: { id: true, email: true, name: true, avatar: true, isOnline: true, lastSeen: true },
        },
        receiver: {
          select: { id: true, email: true, name: true, avatar: true, isOnline: true, lastSeen: true },
        },
        reactions: {
          include: {
            user: {
              select: { id: true, email: true, name: true, avatar: true, isOnline: true, lastSeen: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ message: updated });
  } catch (error) {
    console.error('Update message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.senderId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.message.update({
      where: { id },
      data: {
        isDeleted: true,
        content: 'This message was deleted',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
