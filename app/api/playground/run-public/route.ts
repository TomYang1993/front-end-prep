import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { badRequest } from '@/lib/api';
import { getRunner } from '@/lib/runners/registry';

const payloadSchema = z.object({
  questionId: z.string().min(1),
  framework: z.enum(['javascript', 'react', 'python']),
  code: z.string().min(1)
});

export async function POST(req: NextRequest) {
  try {
    const parsed = payloadSchema.safeParse(await req.json());
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || 'Invalid payload');
    }

    const { questionId, framework, code } = parsed.data;

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { publicTestCode: true }
    });

    if (!question) {
      return badRequest('Question does not exist', 'QUESTION_NOT_FOUND');
    }

    if (!question.publicTestCode) {
      return badRequest('No public test code configured for this question');
    }

    const runner = getRunner(framework);
    const result = await runner.run(code, question.publicTestCode);

    const passedCount = result.results.filter((r) => r.passed).length;

    return NextResponse.json({
      summary: {
        passedCount,
        total: result.results.length
      },
      results: result.results,
      logs: result.logs,
    });
  } catch (error) {
    console.error('Playground execution error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
