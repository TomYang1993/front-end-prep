import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/current-user';
import { forbidden, unauthorized } from '@/lib/api';

/**
 * Returns hidden test code for client-side execution (frontend JS/React questions only).
 * The slug param here is actually the question ID (passed from the client).
 * Backend questions (`language` set) are evaluated server-side — refuse to leak their hidden tests.
 * Requires authentication.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const user = await requireUser(req).catch(() => null);
  if (!user) {
    return unauthorized();
  }

  const question = await prisma.question.findUnique({
    where: { id: slug },
    select: { hiddenTestCode: true, language: true },
  });

  if (question?.language) {
    return forbidden('Hidden tests for backend questions are evaluated server-side');
  }

  return NextResponse.json({ testCode: question?.hiddenTestCode || '' });
}
