import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {
      OR: [
        { senderId: session.userId },
        { receiverId: session.userId },
      ],
    };

    if (search) {
      where.AND = [
        {
          content: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const messages = await prisma.message.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            isOnline: true,
            lastSeen: true,
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            isOnline: true,
            lastSeen: true,
          },
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                isOnline: true,
                lastSeen: true,
              },
            },
            receiver: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                isOnline: true,
                lastSeen: true,
              },
            },
            reactions: {
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
            },
          },
        },
        reactions: {
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
        },
      },
    });

    let nextCursor: string | null = null;
    if (messages.length > limit) {
      const nextItem = messages.pop();
      nextCursor = nextItem!.id;
    }

    return NextResponse.json({
      messages: messages.reverse(),
      nextCursor,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { content, type, receiverId, replyToId, fileUrl, fileName, fileSize, fileType } = body;

    const message = await prisma.message.create({
      data: {
        content,
        type: type || 'TEXT',
        senderId: session.userId,
        receiverId,
        replyToId,
        fileUrl,
        fileName,
        fileSize,
        fileType,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            isOnline: true,
            lastSeen: true,
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            isOnline: true,
            lastSeen: true,
          },
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                isOnline: true,
                lastSeen: true,
              },
            },
            receiver: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                isOnline: true,
                lastSeen: true,
              },
            },
            reactions: {
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
            },
          },
        },
        reactions: true,
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
