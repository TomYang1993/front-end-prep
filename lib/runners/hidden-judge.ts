import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { getRunner } from '@/lib/runners/registry';
import { RunnerFramework } from '@/lib/runners/types';

export async function judgeHiddenSubmission(params: {
  submissionId: string;
  questionId: string;
  code: string;
  framework: RunnerFramework;
}) {
  const hiddenTests = await prisma.testCase.findMany({
    where: {
      questionId: params.questionId,
      visibility: 'HIDDEN'
    },
    orderBy: {
      sortOrder: 'asc'
    }
  });

  const runner = getRunner(params.framework);
  const results = [];

  for (const testCase of hiddenTests) {
    const result = await runner.run(params.code, testCase.input, testCase.expected);
    results.push({ testCase, result });
  }

  const passedCount = results.filter((item) => item.result.passed).length;
  const total = results.length || 1;
  const runtimeMs = results.reduce((sum, item) => sum + item.result.runtimeMs, 0);
  const score = Math.round((passedCount / total) * 100);
  const status = passedCount === total ? 'PASSED' : 'FAILED';

  await prisma.$transaction([
    prisma.submissionResult.deleteMany({ where: { submissionId: params.submissionId } }),
    prisma.submission.update({
      where: { id: params.submissionId },
      data: {
        status,
        score,
        runtimeMs,
        hiddenResult: {
          passedCount,
          total
        }
      }
    }),
    prisma.submissionResult.createMany({
      data: results.map((item) => ({
        submissionId: params.submissionId,
        testCaseId: item.testCase.id,
        passed: item.result.passed,
        runtimeMs: item.result.runtimeMs,
        output: item.result.output as Prisma.InputJsonValue,
        error: item.result.error
      }))
    })
  ]);

  return {
    passedCount,
    total,
    score,
    status,
    runtimeMs
  };
}
