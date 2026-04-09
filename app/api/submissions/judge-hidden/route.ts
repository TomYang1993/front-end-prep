import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { badRequest, forbidden, unauthorized } from '@/lib/api';
import { requireUser } from '@/lib/auth/current-user';
import { canAccessQuestion, getEntitlementContext } from '@/lib/auth/entitlement';
import { judgeHiddenSubmission } from '@/lib/runners/hidden-judge';
import { enqueueJob } from '@/lib/jobs';

const bodySchema = z.object({
  questionId: z.string().min(1),
  framework: z.enum(['javascript', 'react', 'python']),
  code: z.string().min(1),
  publicResult: z.unknown().optional(),
  clientResults: z.object({
    passedCount: z.number(),
    total: z.number(),
    score: z.number(),
    runtimeMs: z.number(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  const user = await requireUser(req).catch(() => null);
  if (!user) {
    return unauthorized();
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message || 'Invalid payload');
  }

  const { questionId, framework, code, publicResult, clientResults } = parsed.data;

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) {
    return badRequest('Question not found');
  }

  const entitlement = await getEntitlementContext(user.id);
  if (!canAccessQuestion(question.accessTier, question.id, entitlement)) {
    return forbidden('Premium content is locked for this account');
  }

  // Python questions run client-side — record pre-computed results
  if (framework === 'python' && clientResults) {
    const status = clientResults.passedCount === clientResults.total ? 'PASSED' : 'FAILED';
    const submission = await prisma.submission.create({
      data: {
        userId: user.id,
        questionId,
        code,
        framework,
        status,
        score: clientResults.score,
        runtimeMs: clientResults.runtimeMs,
        publicResult:
          publicResult === undefined ? undefined : (publicResult as Prisma.InputJsonValue),
      },
    });

    return NextResponse.json({
      submissionId: submission.id,
      score: clientResults.score,
      status,
      passedCount: clientResults.passedCount,
      total: clientResults.total,
    });
  }

  const submission = await prisma.submission.create({
    data: {
      userId: user.id,
      questionId,
      code,
      framework,
      status: 'RUNNING',
      publicResult:
        publicResult === undefined ? undefined : (publicResult as Prisma.InputJsonValue)
    }
  });

  const hiddenResult = await enqueueJob({
    name: 'hidden-judge',
    run: async () =>
      judgeHiddenSubmission({
        submissionId: submission.id,
        questionId,
        framework,
        code
      })
  });

  return NextResponse.json({
    submissionId: submission.id,
    ...hiddenResult
  });
}
