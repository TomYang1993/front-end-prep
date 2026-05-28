import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { badRequest, notFound } from '@/lib/api';
import { authorizeAdmin } from '@/lib/auth/current-user';
import { createAuditLog } from '@/lib/audit';

interface Params {
  params: Promise<{ id: string }>;
}

const patchSchema = z.object({
  language: z.string().min(1).optional(),
  framework: z.string().nullable().optional(),
  explanation: z.string().min(10).optional(),
  code: z.string().min(1).optional(),
  complexity: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const admin = await authorizeAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message || 'Invalid solution payload');
  }

  const existing = await prisma.officialSolution.findUnique({ where: { id } });
  if (!existing) return notFound('Solution not found');

  const data = parsed.data;
  const solution = await prisma.officialSolution.update({
    where: { id },
    data: {
      ...(data.language !== undefined && { language: data.language }),
      ...(data.framework !== undefined && { framework: data.framework }),
      ...(data.explanation !== undefined && { explanation: data.explanation }),
      ...(data.code !== undefined && { code: data.code }),
      ...(data.complexity !== undefined && { complexity: data.complexity }),
    },
  });

  await createAuditLog({
    actorId: admin.id,
    action: 'admin.solution.update',
    entityType: 'OfficialSolution',
    entityId: solution.id,
    payload: { questionId: solution.questionId },
  });

  return NextResponse.json({ solution });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const admin = await authorizeAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const existing = await prisma.officialSolution.findUnique({ where: { id } });
  if (!existing) return notFound('Solution not found');

  await prisma.officialSolution.delete({ where: { id } });

  await createAuditLog({
    actorId: admin.id,
    action: 'admin.solution.delete',
    entityType: 'OfficialSolution',
    entityId: id,
    payload: { questionId: existing.questionId },
  });

  return NextResponse.json({ ok: true });
}
