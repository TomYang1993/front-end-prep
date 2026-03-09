import { PrismaClient, AccessTier, Difficulty, QuestionType, QuestionVersionStatus, TestVisibility, SubscriptionStatus, PackPurchaseStatus, EntitlementSource } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.role.upsert({
    where: { key: 'USER' },
    update: { name: 'User' },
    create: { key: 'USER', name: 'User' }
  });

  await prisma.role.upsert({
    where: { key: 'ADMIN' },
    update: { name: 'Admin' },
    create: { key: 'ADMIN', name: 'Admin' }
  });

  const starterUser = await prisma.user.upsert({
    where: { email: 'demo@interview.dev' },
    update: {},
    create: {
      email: 'demo@interview.dev',
      supabaseId: 'demo-supabase-id',
      profile: {
        create: {
          displayName: 'Demo User'
        }
      }
    }
  });

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { key: 'ADMIN' } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: starterUser.id, roleId: adminRole.id } },
    update: {},
    create: {
      userId: starterUser.id,
      roleId: adminRole.id
    }
  });

  const tagArray = await prisma.questionTag.upsert({
    where: { name: 'array' },
    update: {},
    create: { name: 'array' }
  });

  const question = await prisma.question.upsert({
    where: { slug: 'two-sum' },
    update: {},
    create: {
      slug: 'two-sum',
      title: 'Two Sum',
      prompt: 'Return indices of the two numbers that add up to target.',
      type: QuestionType.FUNCTION_JS,
      difficulty: Difficulty.EASY,
      accessTier: AccessTier.FREE,
      isPublished: true,
      createdById: starterUser.id
    }
  });

  await prisma.questionTagOnQuestion.upsert({
    where: { questionId_tagId: { questionId: question.id, tagId: tagArray.id } },
    update: {},
    create: {
      questionId: question.id,
      tagId: tagArray.id
    }
  });

  await prisma.questionVersion.upsert({
    where: { questionId_version: { questionId: question.id, version: 1 } },
    update: {},
    create: {
      questionId: question.id,
      version: 1,
      status: QuestionVersionStatus.PUBLISHED,
      content: {
        description: 'Find two indexes with sum equal to target'
      },
      starterCode: {
        javascript: 'function solve(nums, target) {\n  return [];\n}'
      },
      publishedAt: new Date()
    }
  });

  const existingPublic = await prisma.testCase.count({
    where: { questionId: question.id, visibility: TestVisibility.PUBLIC }
  });

  if (existingPublic === 0) {
    await prisma.testCase.createMany({
      data: [
        {
          questionId: question.id,
          visibility: TestVisibility.PUBLIC,
          input: { args: [[2, 7, 11, 15], 9] },
          expected: [0, 1],
          sortOrder: 1,
          explanation: 'Basic case'
        },
        {
          questionId: question.id,
          visibility: TestVisibility.HIDDEN,
          input: { args: [[3, 2, 4], 6] },
          expected: [1, 2],
          sortOrder: 2
        }
      ]
    });
  }

  await prisma.officialSolution.upsert({
    where: { id: `${question.id}-official-js` },
    update: {
      explanation: 'Use a hash map to track complements in O(n).'
    },
    create: {
      id: `${question.id}-official-js`,
      questionId: question.id,
      language: 'javascript',
      explanation: 'Use a hash map to track complements in O(n).',
      code: 'function solve(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i += 1) {\n    const need = target - nums[i];\n    if (map.has(need)) return [map.get(need), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}',
      complexity: 'Time O(n), Space O(n)'
    }
  });

  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { code: 'pro-monthly' },
    update: {},
    create: {
      code: 'pro-monthly',
      name: 'Pro Monthly',
      amountCents: 2900,
      interval: 'month',
      providerPriceId: process.env.PRO_PLAN_PRICE_ID || process.env.STRIPE_PRO_PLAN_PRICE_ID || 'price_placeholder'
    }
  });

  const starterPack = await prisma.contentPack.upsert({
    where: { code: 'react-core-pack' },
    update: {},
    create: {
      code: 'react-core-pack',
      name: 'React Core Pack',
      description: 'Premium React app interview questions.',
      providerPriceId: 'price_pack_placeholder'
    }
  });

  await prisma.contentPackQuestion.upsert({
    where: { packId_questionId: { packId: starterPack.id, questionId: question.id } },
    update: {},
    create: {
      packId: starterPack.id,
      questionId: question.id
    }
  });

  const subscription = await prisma.subscription.upsert({
    where: { providerSubscriptionId: 'sub_demo_active' },
    update: {},
    create: {
      userId: starterUser.id,
      planId: proPlan.id,
      providerCustomerId: 'cus_demo',
      providerSubscriptionId: 'sub_demo_active',
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(Date.now() - 24 * 60 * 60 * 1000),
      currentPeriodEnd: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000)
    }
  });

  await prisma.invoiceEvent.upsert({
    where: { providerEventId: 'evt_demo_invoice_paid' },
    update: {},
    create: {
      subscriptionId: subscription.id,
      providerEventId: 'evt_demo_invoice_paid',
      eventType: 'invoice.paid',
      payload: { demo: true }
    }
  });

  await prisma.packPurchase.upsert({
    where: { providerCheckoutSessionId: 'cs_demo_pack' },
    update: {},
    create: {
      userId: starterUser.id,
      packId: starterPack.id,
      status: PackPurchaseStatus.COMPLETED,
      providerCheckoutSessionId: 'cs_demo_pack',
      amountCents: 990,
      currency: 'usd'
    }
  });

  const entitlementStarts = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const entitlementEnds = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000);

  await prisma.entitlement.upsert({
    where: { id: 'ent_sub_demo' },
    update: {
      active: true,
      endsAt: entitlementEnds
    },
    create: {
      id: 'ent_sub_demo',
      userId: starterUser.id,
      source: EntitlementSource.SUBSCRIPTION,
      sourceId: subscription.id,
      planId: proPlan.id,
      startsAt: entitlementStarts,
      endsAt: entitlementEnds,
      active: true
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
