import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/current-user';
import { forbidden, notFound, unauthorized } from '@/lib/api';

interface Params {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin(req);
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') return forbidden();
    return unauthorized();
  }

  const question = await prisma.question.findUnique({
    where: { id: params.id },
    include: {
      tags: { include: { tag: true } },
      versions: { orderBy: { version: 'desc' } },
      testCases: { orderBy: { sortOrder: 'asc' } },
      officialSolutions: { orderBy: { updatedAt: 'desc' } }
    }
  });

  if (!question) {
    return notFound('Question not found');
  }

  return NextResponse.json({ question });
}
