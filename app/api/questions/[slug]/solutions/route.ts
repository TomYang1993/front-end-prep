import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentServerUser } from '@/lib/auth/current-user-server';
import { canAccessQuestion, getEntitlementContext } from '@/lib/auth/entitlement';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    // Run auth, question lookup, and solutions query in parallel
    const [user, question, solutions] = await Promise.all([
      getCurrentServerUser(),
      prisma.question.findUnique({
        where: { id: slug },
        select: { id: true, accessTier: true }
      }),
      prisma.officialSolution.findMany({
        where: { questionId: slug },
        orderBy: { updatedAt: 'desc' }
      }),
    ]);

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const entitlement = user ? await getEntitlementContext(user.id) : null;
    if (!canAccessQuestion(question.accessTier, question.id, entitlement)) {
      return NextResponse.json({ error: 'Upgrade required' }, { status: 403 });
    }

    const formatted = solutions.map(sol => ({
      id: sol.id,
      language: sol.language,
      framework: sol.framework,
      explanation: sol.explanation,
      code: sol.code,
      complexity: sol.complexity
    }));

    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
