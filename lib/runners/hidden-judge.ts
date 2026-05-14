import { prisma } from '@/lib/db/prisma';
import { getRunner } from '@/lib/runners/registry';
import { RunnerFramework } from '@/lib/runners/types';
import { runBackendInSandbox, type BackendTestCase } from '@/lib/runners/sandbox/runner';
import type { BackendLanguage } from '@/lib/runners/sandbox/harnesses';

export async function judgeHiddenSubmission(params: {
  submissionId: string;
  questionId: string;
  code: string;
  framework: RunnerFramework;
}) {
  const question = await prisma.question.findUniqueOrThrow({
    where: { id: params.questionId },
    select: {
      hiddenTestCode: true,
      hiddenTestCases: true,
      language: true,
      functionName: true,
    },
  });

  const isBackend = !!(question.language && question.functionName && question.hiddenTestCases);
  const hasContent = isBackend || question.hiddenTestCode;

  if (!hasContent) {
    await prisma.submission.update({
      where: { id: params.submissionId },
      data: { status: 'FAILED', score: 0, runtimeMs: 0 },
    });
    return { passedCount: 0, total: 0, score: 0, status: 'FAILED' as const, runtimeMs: 0, hiddenResults: [] };
  }

  let resultsForPersist: { name: string; passed: boolean; error?: string }[];
  let runtimeMs: number;

  if (isBackend) {
    const cases = question.hiddenTestCases as unknown as BackendTestCase[];
    const sandboxResult = await runBackendInSandbox({
      language: question.language as BackendLanguage,
      functionName: question.functionName!,
      code: params.code,
      cases,
    });
    resultsForPersist = sandboxResult.results.map((r) => ({
      name: r.name,
      passed: r.passed,
      error: r.error,
    }));
    runtimeMs = sandboxResult.runtimeMs;
  } else {
    const runner = getRunner(params.framework);
    const result = await runner.run(params.code, question.hiddenTestCode!);
    resultsForPersist = result.results.map((r) => ({
      name: r.name,
      passed: r.passed,
      error: r.error,
    }));
    runtimeMs = result.runtimeMs;
  }

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
