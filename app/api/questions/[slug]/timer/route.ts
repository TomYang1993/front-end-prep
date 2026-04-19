import { NextRequest, NextResponse } from 'next/server';
import { getCurrentServerUser } from '@/lib/auth/current-user-server';
import { prisma } from '@/lib/db/prisma';
import { getDefaultTimeLimitMinutes } from '@/lib/question-timer';
import type { Difficulty, QuestionType } from '@prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const user = await getCurrentServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const question = await prisma.question.findUnique({
    where: { slug },
    select: { id: true, type: true, difficulty: true, timeLimitMinutes: true },
  });

  if (!question) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Delete any expired timer
  const existing = await prisma.questionTimer.findUnique({
    where: { userId_questionId: { userId: user.id, questionId: question.id } },
  });

  if (existing) {
    const expiresAt = new Date(existing.startedAt.getTime() + existing.timeLimitMinutes * 60_000);
    const remainingMs = expiresAt.getTime() - Date.now();
    if (remainingMs > 5_000) {
      // More than 5s left — return active timer
      return NextResponse.json({ expiresAt: expiresAt.toISOString() });
    }
    // Expired or about to expire — delete so user can restart
    await prisma.questionTimer.delete({ where: { id: existing.id } });
  }

  const limit = question.timeLimitMinutes
    ?? getDefaultTimeLimitMinutes(question.type as QuestionType, question.difficulty as Difficulty);

  let reactLanguage: string | null = null;
  try {
    const body = await req.json();
    if (body.reactLanguage === 'js' || body.reactLanguage === 'ts') {
      reactLanguage = body.reactLanguage;
    }
  } catch {
    // No body or invalid JSON — that's fine
  }

  const timer = await prisma.questionTimer.create({
    data: {
      userId: user.id,
      questionId: question.id,
      timeLimitMinutes: limit,
      reactLanguage,
    },
  });

  const expiresAt = new Date(timer.startedAt.getTime() + timer.timeLimitMinutes * 60_000);
  return NextResponse.json({ expiresAt: expiresAt.toISOString() });
}
