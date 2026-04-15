import { PrismaClient, SubscriptionStatus, PackPurchaseStatus, EntitlementSource, SubmissionStatus } from '@prisma/client';
import {
  seedAllQuestions,
  twoSum,
  debounceFunction,
  usePreviousHook,
  promiseAllImplementation,
  classHierarchy,
  accordionComponent,
  virtualList,
  cssGridLayout,
  designComponentLibrary,
  rateLimiterButton,
  autocompleteSearch,
} from './seeds';

const prisma = new PrismaClient();

const allQuestions = [
  twoSum,
  debounceFunction,
  usePreviousHook,
  promiseAllImplementation,
  classHierarchy,
  accordionComponent,
  virtualList,
  cssGridLayout,
  designComponentLibrary,
  rateLimiterButton,
  autocompleteSearch,
];

async function main() {
  // ─── Roles ───

  await prisma.role.upsert({
    where: { key: 'USER' },
    update: { name: 'User' },
    create: { key: 'USER', name: 'User' },
  });

  await prisma.role.upsert({
    where: { key: 'ADMIN' },
    update: { name: 'Admin' },
    create: { key: 'ADMIN', name: 'Admin' },
  });

  // ─── Demo user ───

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@interview.dev' },
    update: {},
    create: {
      email: 'demo@interview.dev',
      supabaseId: 'demo-supabase-id',
      profile: { create: { displayName: 'Demo User' } },
    },
  });

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { key: 'ADMIN' } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: demoUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: demoUser.id, roleId: adminRole.id },
  });

  // ─── Questions (tags, versions, solutions all handled inside) ───

  const questions = await seedAllQuestions(prisma, allQuestions, demoUser.id);

  // ─── Commerce: plans & packs ───

  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { code: 'pro-monthly' },
    update: {},
    create: {
      code: 'pro-monthly',
      name: 'Pro Monthly',
      amountCents: 2900,
      interval: 'month',
      providerPriceId: process.env.PRO_PLAN_PRICE_ID || process.env.STRIPE_PRO_PLAN_PRICE_ID || 'price_placeholder',
    },
  });

  const starterPack = await prisma.contentPack.upsert({
    where: { code: 'react-core-pack' },
    update: {},
    create: {
      code: 'react-core-pack',
      name: 'React Core Pack',
      description: 'Premium React app interview questions.',
      providerPriceId: 'price_pack_placeholder',
    },
  });

  await prisma.contentPackQuestion.upsert({
    where: { packId_questionId: { packId: starterPack.id, questionId: questions.get('two-sum')!.id } },
    update: {},
    create: { packId: starterPack.id, questionId: questions.get('two-sum')!.id },
  });

  // ─── Mock submissions ───

  await prisma.submission.upsert({
    where: { id: 'mock_sub_twosum' },
    update: { status: SubmissionStatus.PASSED, score: 100, framework: 'javascript' },
    create: {
      id: 'mock_sub_twosum',
      userId: demoUser.id,
      questionId: questions.get('two-sum')!.id,
      framework: 'javascript',
      code: 'function twoSum(nums, target) { return [0, 1]; }',
      status: SubmissionStatus.PASSED,
      score: 100,
    },
  });

  await prisma.submission.upsert({
    where: { id: 'mock_sub_accordion' },
    update: { status: SubmissionStatus.PASSED, score: 100, framework: 'react' },
    create: {
      id: 'mock_sub_accordion',
      userId: demoUser.id,
      questionId: questions.get('accordion-component')!.id,
      framework: 'react',
      code: 'export default function Accordion() { return <div />; }',
      status: SubmissionStatus.PASSED,
      score: 100,
    },
  });

  await prisma.submission.upsert({
    where: { id: 'mock_sub_debounce' },
    update: { status: SubmissionStatus.FAILED, score: 50, framework: 'javascript' },
    create: {
      id: 'mock_sub_debounce',
      userId: demoUser.id,
      questionId: questions.get('debounce-function')!.id,
      framework: 'javascript',
      code: 'function debounce() { console.log("wip"); }',
      status: SubmissionStatus.FAILED,
      score: 50,
    },
  });

  // ─── Demo subscription & entitlements ───

  const subscription = await prisma.subscription.upsert({
    where: { providerSubscriptionId: 'sub_demo_active' },
    update: {},
    create: {
      userId: demoUser.id,
      planId: proPlan.id,
      providerCustomerId: 'cus_demo',
      providerSubscriptionId: 'sub_demo_active',
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(Date.now() - 24 * 60 * 60 * 1000),
      currentPeriodEnd: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.invoiceEvent.upsert({
    where: { providerEventId: 'evt_demo_invoice_paid' },
    update: {},
    create: {
      subscriptionId: subscription.id,
      providerEventId: 'evt_demo_invoice_paid',
      eventType: 'invoice.paid',
      payload: { demo: true },
    },
  });

  await prisma.packPurchase.upsert({
    where: { providerCheckoutSessionId: 'cs_demo_pack' },
    update: {},
    create: {
      userId: demoUser.id,
      packId: starterPack.id,
      status: PackPurchaseStatus.COMPLETED,
      providerCheckoutSessionId: 'cs_demo_pack',
      amountCents: 990,
      currency: 'usd',
    },
  });

  const entitlementStarts = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const entitlementEnds = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000);

  await prisma.entitlement.upsert({
    where: { id: 'ent_sub_demo' },
    update: { active: true, endsAt: entitlementEnds },
    create: {
      id: 'ent_sub_demo',
      userId: demoUser.id,
      source: EntitlementSource.SUBSCRIPTION,
      sourceId: subscription.id,
      planId: proPlan.id,
      startsAt: entitlementStarts,
      endsAt: entitlementEnds,
      active: true,
    },
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
