import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/current-user';
import { unauthorized } from '@/lib/api';

/**
 * Returns hidden test cases for client-side execution (Python/Pyodide).
 * The slug param here is actually the question ID (passed from the client).
 * Requires authentication.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const user = await requireUser(req).catch(() => null);
  if (!user) {
    return unauthorized();
  }

  const tests = await prisma.testCase.findMany({
    where: { questionId: params.slug, visibility: 'HIDDEN' },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, input: true, expected: true },
  });

  return NextResponse.json(tests);
}
