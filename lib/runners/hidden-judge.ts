import { prisma } from '@/lib/db/prisma';
import { getRunner } from '@/lib/runners/registry';
import { RunnerFramework } from '@/lib/runners/types';

/**
 * Server-side hidden judge for frontend (JS/TS/React) submissions that arrive
 * without a pre-computed client result. Backend (python) submissions are
 * graded entirely client-side via Pyodide; the route records their results
 * and never reaches this path.
 */
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
    await prisma.submission.update({
      where: { id: params.submissionId },
      data: { status: 'FAILED', score: 0, runtimeMs: 0 },
    });
    return { passedCount: 0, total: 0, score: 0, status: 'FAILED' as const, runtimeMs: 0, hiddenResults: [] };
  }

  const runner = getRunner(params.framework);
  const result = await runner.run(params.code, question.hiddenTestCode);
  const resultsForPersist = result.results.map((r) => ({
    name: r.name,
    passed: r.passed,
    error: r.error,
  }));
  const runtimeMs = result.runtimeMs;

  const passedCount = resultsForPersist.filter((r) => r.passed).length;
  const total = resultsForPersist.length || 1;
  const score = Math.round((passedCount / total) * 100);
  const status = passedCount === total && resultsForPersist.length > 0 ? 'PASSED' : 'FAILED';

  await prisma.$transaction([
    prisma.submissionResult.deleteMany({ where: { submissionId: params.submissionId } }),
    prisma.submission.update({
      where: { id: params.submissionId },
      data: {
        status,
        score,
        runtimeMs,
        hiddenResult: { passedCount, total },
      },
    }),
    prisma.submissionResult.createMany({
      data: resultsForPersist.map((r) => ({
        submissionId: params.submissionId,
        testName: r.name,
        passed: r.passed,
        runtimeMs,
        error: r.error,
      })),
    }),
  ]);

  return {
    passedCount,
    total,
    score,
    status,
    runtimeMs,
    hiddenResults: resultsForPersist.map((r, i) => ({
      index: i + 1,
      name: r.name,
      passed: r.passed,
      error: r.passed ? undefined : (r.error || 'Wrong answer'),
    })),
  };
}
