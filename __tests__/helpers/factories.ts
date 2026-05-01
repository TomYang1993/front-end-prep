import type {
  AccessTier,
  Difficulty,
  PrismaClient,
  Question,
  QuestionType,
  Submission,
  SubmissionStatus,
  Subscription,
  SubscriptionStatus,
  User
} from '@prisma/client';

let counter = 0;
const uniq = (prefix: string) => `${prefix}-${Date.now()}-${++counter}`;

export async function makeUser(
  prisma: PrismaClient,
  overrides: Partial<User> = {}
): Promise<User> {
  const id = overrides.id ?? uniq('user');
  return prisma.user.create({
    data: {
      id,
      supabaseId: overrides.supabaseId ?? uniq('sb'),
      email: overrides.email ?? `${id}@test.local`,
      ...overrides
    }
  });
}

export async function makeQuestion(
  prisma: PrismaClient,
  overrides: Partial<Question> = {}
): Promise<Question> {
  const id = overrides.id ?? uniq('q');
  return prisma.question.create({
    data: {
      id,
      slug: overrides.slug ?? id,
      title: overrides.title ?? 'Test Question',
      prompt: overrides.prompt ?? 'Solve it.',
      type: overrides.type ?? ('FUNCTION_JS' as QuestionType),
      difficulty: overrides.difficulty ?? ('EASY' as Difficulty),
      accessTier: overrides.accessTier ?? ('FREE' as AccessTier),
      isPublished: overrides.isPublished ?? true,
      ...overrides
    }
  });
}

export async function makeSubmission(
  prisma: PrismaClient,
  args: { userId: string; questionId: string } & Partial<Submission>
): Promise<Submission> {
  return prisma.submission.create({
    data: {
      userId: args.userId,
      questionId: args.questionId,
      framework: args.framework ?? 'js',
      code: args.code ?? '// noop',
      status: args.status ?? ('PASSED' as SubmissionStatus),
      score: args.score ?? 100,
      ...args
    }
  });
}

export async function makeSubscription(
  prisma: PrismaClient,
  args: {
    userId: string;
    planId: string;
  } & Partial<Subscription>
): Promise<Subscription> {
  const now = new Date();
  return prisma.subscription.create({
    data: {
      userId: args.userId,
      planId: args.planId,
      providerCustomerId: args.providerCustomerId ?? uniq('cus'),
      providerSubscriptionId: args.providerSubscriptionId ?? uniq('sub'),
      status: args.status ?? ('ACTIVE' as SubscriptionStatus),
      currentPeriodStart: args.currentPeriodStart ?? now,
      currentPeriodEnd:
        args.currentPeriodEnd ?? new Date(now.getTime() + 30 * 24 * 3600 * 1000),
      ...args
    }
  });
}
