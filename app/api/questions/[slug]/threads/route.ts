import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const question = await prisma.question.findUnique({
      where: { id: params.slug },
      select: { id: true }
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const threads = await prisma.discussionThread.findMany({
      where: { questionId: params.slug, status: 'ACTIVE' },
      include: {
        _count: { select: { comments: true, likes: true } },
        user: {
          include: { profile: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const formatted = threads.map(thread => ({
      id: thread.id,
      title: thread.title,
      body: thread.body,
      author: thread.user.profile?.displayName || thread.user.email,
      commentsCount: thread._count.comments,
      likesCount: thread._count.likes,
    }));

    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
