import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { badRequest, forbidden, unauthorized } from '@/lib/api';
import { requireAdmin } from '@/lib/auth/current-user';
import { createAuditLog } from '@/lib/audit';

const bodySchema = z.object({
  questionId: z.string().min(1),
  language: z.string().min(1),
  framework: z.string().optional(),
  explanation: z.string().min(10),
  code: z.string().min(1),
  complexity: z.string().optional()
});

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req).catch((error) => {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return 'FORBIDDEN' as const;
    }
    return null;
  });

  if (admin === 'FORBIDDEN') {
    return forbidden();
  }

  if (!admin) {
    return unauthorized();
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message || 'Invalid solution payload');
  }

  const exists = await prisma.question.findUnique({ where: { id: parsed.data.questionId } });
  if (!exists) {
    return badRequest('Question does not exist', 'QUESTION_NOT_FOUND');
  }

  const solution = await prisma.officialSolution.create({
    data: {
      questionId: parsed.data.questionId,
      language: parsed.data.language,
      framework: parsed.data.framework,
      explanation: parsed.data.explanation,
      code: parsed.data.code,
      complexity: parsed.data.complexity
    }
  });

  await createAuditLog({
    actorId: admin.id,
    action: 'admin.solution.create',
    entityType: 'OfficialSolution',
    entityId: solution.id,
    payload: {
      questionId: solution.questionId,
      language: solution.language
    }
  });

  return NextResponse.json({ solution }, { status: 201 });
}
