import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authorizeAdmin } from '@/lib/auth/current-user';
import { notFound } from '@/lib/api';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const admin = await authorizeAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const question = await prisma.question.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
      versions: { orderBy: { version: 'desc' } },
      officialSolutions: { orderBy: { updatedAt: 'desc' } }
    }
  });

  if (!question) {
    return notFound('Question not found');
  }

  return NextResponse.json({ question });
}
