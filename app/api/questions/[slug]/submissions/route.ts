import { NextRequest, NextResponse } from 'next/server';
import { getCurrentServerUser } from '@/lib/auth/current-user-server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const user = await getCurrentServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const submissions = await prisma.submission.findMany({
    where: { userId: user.id, questionId: slug },
    orderBy: { createdAt: 'desc' },
    take: 25,
    select: {
      id: true,
      status: true,
      score: true,
      framework: true,
      code: true,
      createdAt: true,
    },
  });

  return NextResponse.json(submissions);
}
