import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { unauthorized } from '@/lib/api';
import { requireUser } from '@/lib/auth/current-user';

export async function GET(req: NextRequest) {
  const user = await requireUser(req).catch(() => null);
  if (!user) {
    return unauthorized();
  }

  const questionId = req.nextUrl.searchParams.get('questionId');
  const limit = Number(req.nextUrl.searchParams.get('limit') || 25);

  const submissions = await prisma.submission.findMany({
    where: {
      userId: user.id,
      ...(questionId ? { questionId } : {})
    },
    include: {
      question: {
        select: {
          slug: true,
          title: true
        }
      },
      results: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: Math.min(limit, 100)
  });

  return NextResponse.json({
    submissions: submissions.map((submission) => ({
      id: submission.id,
      status: submission.status,
      score: submission.score,
      runtimeMs: submission.runtimeMs,
      framework: submission.framework,
      createdAt: submission.createdAt,
      question: submission.question,
      passedHidden: submission.results.filter((result) => result.passed).length,
      totalHidden: submission.results.length
    }))
  });
}
