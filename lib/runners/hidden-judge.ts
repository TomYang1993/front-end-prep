import { prisma } from '@/lib/db/prisma';
import { getRunner } from '@/lib/runners/registry';
import { RunnerFramework } from '@/lib/runners/types';

export async function judgeHiddenSubmission(params: {
  submissionId: string;
  questionId: string;
  code: string;
  framework: RunnerFramework;
}) {
  const question = await prisma.question.findUniqueOrThrow({
    where: { id: params.questionId },
    select: { hiddenTestCode: true },
  });

  if (!question.hiddenTestCode) {
    // No hidden tests configured — can't evaluate, mark as attempted
    await prisma.submission.update({
      where: { id: params.submissionId },
      data: { status: 'FAILED', score: 0, runtimeMs: 0 },
    });
    return { passedCount: 0, total: 0, score: 0, status: 'FAILED' as const, runtimeMs: 0, hiddenResults: [] };
  }

  const runner = getRunner(params.framework);
  const result = await runner.run(params.code, question.hiddenTestCode);

  const passedCount = result.results.filter((r) => r.passed).length;
  const total = result.results.length || 1;
  const score = Math.round((passedCount / total) * 100);
  const status = passedCount === total ? 'PASSED' : 'FAILED';

  await prisma.$transaction([
    prisma.submissionResult.deleteMany({ where: { submissionId: params.submissionId } }),
    prisma.submission.update({
      where: { id: params.submissionId },
      data: {
        status,
        score,
        runtimeMs: result.runtimeMs,
        hiddenResult: { passedCount, total },
      },
    }),
    prisma.submissionResult.createMany({
      data: result.results.map((r) => ({
        submissionId: params.submissionId,
        testName: r.name,
        passed: r.passed,
        runtimeMs: result.runtimeMs,
        error: r.error,
      })),
    }),
  ]);

  return {
    passedCount,
    total,
    score,
    status,
    runtimeMs: result.runtimeMs,
    hiddenResults: result.results.map((r, i) => ({
      index: i + 1,
      name: r.name,
      passed: r.passed,
      error: r.passed ? undefined : (r.error || 'Wrong answer'),
    })),
  };
}
