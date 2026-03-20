import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { badRequest } from '@/lib/api';
import { getRunner } from '@/lib/runners/registry';

const payloadSchema = z.object({
  questionId: z.string().min(1),
  framework: z.enum(['javascript', 'react']),
  code: z.string().min(1)
});

export async function POST(req: NextRequest) {
  const parsed = payloadSchema.safeParse(await req.json());
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message || 'Invalid payload');
  }

  const { questionId, framework, code } = parsed.data;

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      testCases: {
        where: { visibility: 'PUBLIC' },
        orderBy: { sortOrder: 'asc' }
      }
    }
  });

  if (!question) {
    return badRequest('Question does not exist', 'QUESTION_NOT_FOUND');
  }

  const runner = getRunner(framework);
  const tests = question.testCases;

  if (framework === 'react') {
    const single = await runner.run(code, {}, { preview: true });
    return NextResponse.json({
      summary: {
        passedCount: single.passed ? 1 : 0,
        total: 1
      },
      results: [
        {
          id: 'react-preview',
          passed: single.passed,
          output: single.output,
          runtimeMs: single.runtimeMs,
          error: single.error
        }
      ]
    });
  }

  const results = [];
  for (const testCase of tests) {
    const runResult = await runner.run(code, testCase.input, testCase.expected);
    results.push({
      id: testCase.id,
      passed: runResult.passed,
      output: runResult.output,
      runtimeMs: runResult.runtimeMs,
      error: runResult.error,
      explanation: testCase.explanation,
      logs: runResult.logs
    });
  }

  const passedCount = results.filter((item) => item.passed).length;

  return NextResponse.json({
    summary: {
      passedCount,
      total: tests.length
    },
    results
  });
}
