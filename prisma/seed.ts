import { PrismaClient, AccessTier, Difficulty, QuestionType, QuestionVersionStatus, TestVisibility, SubscriptionStatus, PackPurchaseStatus, EntitlementSource, SubmissionStatus } from '@prisma/client';

const prisma = new PrismaClient();

function defaultTimeLimit(type: QuestionType, difficulty: Difficulty): number {
  if (type === 'REACT_APP') return 60;
  if (difficulty === 'EASY') return 30;
  if (difficulty === 'HARD') return 60;
  return 45;
}

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
      timeLimitMinutes: defaultTimeLimit(QuestionType.FUNCTION_JS, Difficulty.EASY),
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
      // complexity field removed
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

  // ─── Additional seed questions for a realistic table ───

  const tagReact = await prisma.questionTag.upsert({ where: { name: 'react' }, update: {}, create: { name: 'react' } });
  const tagCss = await prisma.questionTag.upsert({ where: { name: 'css' }, update: {}, create: { name: 'css' } });
  const tagA11y = await prisma.questionTag.upsert({ where: { name: 'a11y' }, update: {}, create: { name: 'a11y' } });
  const tagUtility = await prisma.questionTag.upsert({ where: { name: 'utility' }, update: {}, create: { name: 'utility' } });
  const tagPerf = await prisma.questionTag.upsert({ where: { name: 'performance' }, update: {}, create: { name: 'performance' } });
  const tagDesign = await prisma.questionTag.upsert({ where: { name: 'system-design' }, update: {}, create: { name: 'system-design' } });
  const tagHooks = await prisma.questionTag.upsert({ where: { name: 'hooks' }, update: {}, create: { name: 'hooks' } });

  const extraQuestions = [
    {
      slug: 'accordion-component',
      title: 'Accordion Component',
      prompt: 'Build an accessible accordion component that expands and collapses sections. Handle keyboard navigation and ARIA attributes.',
      description: 'Build an accessible expand/collapse accordion with keyboard nav and ARIA support.',
      type: QuestionType.REACT_APP,
      difficulty: Difficulty.EASY,
      accessTier: AccessTier.FREE,
      tags: [tagReact.id, tagA11y.id],
      starterCode: { react: 'export default function Accordion() {\n  return <div>Accordion</div>;\n}' },
    },
    {
      slug: 'debounce-function',
      title: 'Debounce Function',
      prompt: 'Implement a debounce utility function that delays invoking the provided function until after the specified wait time has elapsed since the last invocation.',
      description: 'Implement a debounce utility that delays function calls until a wait period has elapsed since the last invocation.',
      type: QuestionType.FUNCTION_JS,
      difficulty: Difficulty.MEDIUM,
      accessTier: AccessTier.FREE,
      tags: [tagUtility.id],
      starterCode: {
        javascript: 'function debounce(fn, delay) {\n  // your code here\n}',
        typescript: 'function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {\n  // your code here\n}'
      },
    },
    {
      slug: 'virtual-list',
      title: 'Virtual List Implementation',
      prompt: 'Build a virtualized list component that efficiently renders only the visible items in a large dataset. Support dynamic row heights.',
      description: 'Build a virtualized list that renders only visible items from a large dataset with dynamic row heights.',
      type: QuestionType.REACT_APP,
      difficulty: Difficulty.HARD,
      accessTier: AccessTier.FREE,
      tags: [tagReact.id, tagPerf.id],
      starterCode: { react: 'export default function VirtualList({ items }) {\n  return <div>{/* render visible items */}</div>;\n}' },
    },
    {
      slug: 'use-previous-hook',
      title: 'usePrevious Hook',
      prompt: 'Implement a custom React hook that returns the previous value of a given state or prop.',
      description: 'Create a custom React hook that tracks and returns the previous value of any state or prop.',
      type: QuestionType.FUNCTION_JS,
      difficulty: Difficulty.EASY,
      accessTier: AccessTier.FREE,
      tags: [tagReact.id, tagHooks.id],
      starterCode: {
        javascript: 'function usePrevious(value) {\n  // your code here\n}',
        typescript: 'function usePrevious<T>(value: T): T | undefined {\n  // your code here\n  return undefined;\n}'
      },
    },
    {
      slug: 'css-grid-layout',
      title: 'Responsive Dashboard Grid',
      prompt: 'Create a responsive dashboard layout using CSS Grid that adapts from 1 to 3 columns based on viewport width.',
      description: 'Create a responsive CSS Grid dashboard layout that adapts from 1 to 3 columns based on viewport width.',
      type: QuestionType.REACT_APP,
      difficulty: Difficulty.MEDIUM,
      accessTier: AccessTier.FREE,
      tags: [tagCss.id, tagReact.id],
      starterCode: { react: 'export default function Dashboard() {\n  return <div className="dashboard-grid">{/* widgets */}</div>;\n}' },
    },
    {
      slug: 'design-component-library',
      title: 'Design System Architecture',
      prompt: 'Design a scalable component library architecture. Explain how you would structure themes, tokens, variants, and composability.',
      description: 'Design a scalable component library with themes, design tokens, variants, and composable primitives.',
      type: QuestionType.REACT_APP,
      difficulty: Difficulty.HARD,
      accessTier: AccessTier.FREE,
      tags: [tagDesign.id, tagReact.id],
      starterCode: { react: '// Outline your component library architecture\nexport default function ThemeProvider({ children }) {\n  return <>{children}</>;\n}' },
    },
    {
      slug: 'promise-all-implementation',
      title: 'Promise.all Implementation',
      prompt: 'Implement your own version of Promise.all that takes an array of promises and resolves when all promises resolve, or rejects if any promise rejects.',
      description: 'Implement Promise.all from scratch — resolve when all promises settle, reject on the first failure.',
      type: QuestionType.FUNCTION_JS,
      difficulty: Difficulty.MEDIUM,
      accessTier: AccessTier.FREE,
      tags: [tagUtility.id],
      starterCode: {
        javascript: 'function promiseAll(promises) {\n  // your code here\n}',
        typescript: 'function promiseAll<T>(promises: Iterable<T | PromiseLike<T>>): Promise<T[]> {\n  // your code here\n  return Promise.resolve([]);\n}'
      },
    },
    {
      slug: 'rate-limiter-button',
      title: 'Rate Limiter Button',
      prompt: 'Build a React component with a button that limits how often it can be clicked. Implement a simple rate limiter that disables the button after N clicks within a time window, re-enabling it once the window resets. Display the remaining clicks and cooldown timer.',
      description: 'Build a button with a rate limiter that caps clicks per time window and shows a cooldown timer.',
      type: QuestionType.REACT_APP,
      difficulty: Difficulty.MEDIUM,
      accessTier: AccessTier.FREE,
      tags: [tagReact.id, tagHooks.id],
      starterCode: {
        react: 'export default function RateLimiterButton() {\n  return <button>Click me</button>;\n}'
      },
    },
    {
      slug: 'autocomplete-search',
      title: 'Autocomplete Search',
      prompt: 'Build an autocomplete search input that fetches and displays suggestions as the user types. Handle debounced API calls, keyboard navigation through results (arrow keys + enter), loading and empty states, and click-outside to dismiss. Use a provided mock fetch function for data.',
      description: 'Build a search input with autocomplete suggestions, debounced fetching, and keyboard navigation.',
      type: QuestionType.REACT_APP,
      difficulty: Difficulty.MEDIUM,
      accessTier: AccessTier.FREE,
      tags: [tagReact.id, tagA11y.id, tagPerf.id],
      starterCode: {
        react: 'const mockFetch = (query) =>\n  new Promise((resolve) =>\n    setTimeout(() => resolve(\n      ["Apple", "Banana", "Cherry", "Date", "Elderberry", "Fig", "Grape"]\n        .filter((item) => item.toLowerCase().includes(query.toLowerCase()))\n    ), 200)\n  );\n\nexport default function AutocompleteSearch() {\n  return <input type="text" placeholder="Search..." />;\n}'
      },
    },
  ];

  for (const eq of extraQuestions) {
    const q = await prisma.question.upsert({
      where: { slug: eq.slug },
      update: {
        title: eq.title,
        prompt: eq.prompt,
        type: eq.type,
        difficulty: eq.difficulty,
        accessTier: eq.accessTier,
        timeLimitMinutes: defaultTimeLimit(eq.type, eq.difficulty),
      },
      create: {
        slug: eq.slug,
        title: eq.title,
        prompt: eq.prompt,
        type: eq.type,
        difficulty: eq.difficulty,
        accessTier: eq.accessTier,
        timeLimitMinutes: defaultTimeLimit(eq.type, eq.difficulty),
        isPublished: true,
        createdById: starterUser.id,
      },
    });

    // Link tags
    for (const tagId of eq.tags) {
      await prisma.questionTagOnQuestion.upsert({
        where: { questionId_tagId: { questionId: q.id, tagId } },
        update: {},
        create: { questionId: q.id, tagId },
      });
    }

    // Create version
    await prisma.questionVersion.upsert({
      where: { questionId_version: { questionId: q.id, version: 1 } },
      update: { starterCode: eq.starterCode },
      create: {
        questionId: q.id,
        version: 1,
        status: QuestionVersionStatus.PUBLISHED,
        content: { description: eq.description },
        starterCode: eq.starterCode,
        publishedAt: new Date(),
      },
    });
  }

  // Add some mock submissions for testing Statuses (Solved, Attempted)
  const qTwoSum = await prisma.question.findUniqueOrThrow({ where: { slug: 'two-sum' } });
  const qAccordion = await prisma.question.findUniqueOrThrow({ where: { slug: 'accordion-component' } });
  const qDebounce = await prisma.question.findUniqueOrThrow({ where: { slug: 'debounce-function' } });
  
  await prisma.submission.upsert({
    where: { id: 'mock_sub_twosum' },
    update: { status: SubmissionStatus.PASSED, score: 100, framework: 'javascript' },
    create: {
      id: 'mock_sub_twosum',
      userId: starterUser.id,
      questionId: qTwoSum.id,
      framework: 'javascript',
      code: 'function solve(nums, target) { return [0, 1]; }',
      status: SubmissionStatus.PASSED,
      score: 100
    }
  });

  await prisma.submission.upsert({
    where: { id: 'mock_sub_accordion' },
    update: { status: SubmissionStatus.PASSED, score: 100, framework: 'react' },
    create: {
      id: 'mock_sub_accordion',
      userId: starterUser.id,
      questionId: qAccordion.id,
      framework: 'react',
      code: 'export default function Accordion() { return <div />; }',
      status: SubmissionStatus.PASSED,
      score: 100
    }
  });

  await prisma.submission.upsert({
    where: { id: 'mock_sub_debounce' },
    update: { status: SubmissionStatus.FAILED, score: 50, framework: 'javascript' },
    create: {
      id: 'mock_sub_debounce',
      userId: starterUser.id,
      questionId: qDebounce.id,
      framework: 'javascript',
      code: 'function debounce() { console.log("wip"); }',
      status: SubmissionStatus.FAILED,
      score: 50
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
