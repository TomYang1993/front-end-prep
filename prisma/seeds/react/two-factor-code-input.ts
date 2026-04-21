/**
 * Seed: "Two-Factor Code Input" React question.
 * Run with: npx tsx prisma/seeds/react/two-factor-code-input.ts
 */
import {
  PrismaClient,
  QuestionType,
  Difficulty,
  AccessTier,
  QuestionVersionStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

const SLUG = 'two-factor-code-input';

const STARTER_CODE_REACT = `import React, { useState } from 'react';

const CODE_LENGTH = 6;

export default function TwoFactorInput() {
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 80 }}>
      <h2>Enter verification code</h2>
      <p style={{ color: '#6b7280', fontSize: 14 }}>
        We sent a {CODE_LENGTH}-digit code to your device
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        {code.map((digit, i) => (
          <input
            key={i}
            type="text"
            maxLength={1}
            value={digit}
            style={{
              width: 48,
              height: 56,
              textAlign: 'center',
              fontSize: 24,
              fontWeight: 700,
              border: '2px solid #d1d5db',
              borderRadius: 8,
            }}
          />
        ))}
      </div>
      {/* TODO: implement focus management, keyboard handling, and paste support */}
    </div>
  );
}`;

const STARTER_CODE_REACT_TS = `import React, { useState } from 'react';

const CODE_LENGTH = 6;

export default function TwoFactorInput(): JSX.Element {
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 80 }}>
      <h2>Enter verification code</h2>
      <p style={{ color: '#6b7280', fontSize: 14 }}>
        We sent a {CODE_LENGTH}-digit code to your device
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        {code.map((digit, i) => (
          <input
            key={i}
            type="text"
            maxLength={1}
            value={digit}
            style={{
              width: 48,
              height: 56,
              textAlign: 'center',
              fontSize: 24,
              fontWeight: 700,
              border: '2px solid #d1d5db',
              borderRadius: 8,
            }}
          />
        ))}
      </div>
      {/* TODO: implement focus management, keyboard handling, and paste support */}
    </div>
  );
}`;

const STARTER_CSS = `/* Two-Factor Input Styles */

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f9fafb;
  margin: 0;
}

input:focus {
  outline: none;
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}
`;

const SOLUTION_CODE = `import React, { useState, useRef, useCallback } from 'react';

const CODE_LENGTH = 6;

export default function TwoFactorInput() {
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));
  const [status, setStatus] = useState('idle'); // idle | verifying | success | error
  const inputsRef = useRef([]);

  const focusInput = (index) => {
    const clamped = Math.max(0, Math.min(index, CODE_LENGTH - 1));
    inputsRef.current[clamped]?.focus();
    inputsRef.current[clamped]?.select();
  };

  const submitCode = useCallback((finalCode) => {
    setStatus('verifying');
    // Simulate verification — accept "123456" as valid
    setTimeout(() => {
      if (finalCode.join('') === '123456') {
        setStatus('success');
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 1500);
      }
    }, 800);
  }, []);

  const handleChange = (index, value) => {
    // Only allow single digit
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);

    if (digit && index < CODE_LENGTH - 1) {
      focusInput(index + 1);
    }

    // Auto-submit when all digits filled
    if (digit && next.every((d) => d !== '')) {
      submitCode(next);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = [...code];
      if (code[index]) {
        // Clear current digit
        next[index] = '';
        setCode(next);
      } else if (index > 0) {
        // Move to previous and clear it
        next[index - 1] = '';
        setCode(next);
        focusInput(index - 1);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusInput(index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;

    const next = [...code];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setCode(next);

    // Focus the next empty slot, or the last filled one
    const nextEmpty = next.findIndex((d) => d === '');
    focusInput(nextEmpty >= 0 ? nextEmpty : CODE_LENGTH - 1);

    // Auto-submit if paste completed the code
    if (next.every((d) => d !== '')) {
      submitCode(next);
    }
  };

  const borderColor =
    status === 'success' ? '#22c55e' :
    status === 'error' ? '#ef4444' :
    '#d1d5db';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 80 }}>
      <h2>Enter verification code</h2>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
        We sent a {CODE_LENGTH}-digit code to your device
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        {code.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputsRef.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            disabled={status === 'verifying' || status === 'success'}
            autoFocus={i === 0}
            style={{
              width: 48,
              height: 56,
              textAlign: 'center',
              fontSize: 24,
              fontWeight: 700,
              border: \`2px solid \${borderColor}\`,
              borderRadius: 8,
              transition: 'border-color 0.2s, box-shadow 0.2s',
              background: status === 'success' ? '#f0fdf4' : '#fff',
            }}
          />
        ))}
      </div>
      <div style={{ marginTop: 16, height: 20, fontSize: 14, fontWeight: 500 }}>
        {status === 'verifying' && <span style={{ color: '#6b7280' }}>Verifying…</span>}
        {status === 'success' && <span style={{ color: '#22c55e' }}>✓ Verified</span>}
        {status === 'error' && <span style={{ color: '#ef4444' }}>Invalid code, try again</span>}
      </div>
    </div>
  );
}`;

const SOLUTION_EXPLANATION = `## Focus Management with refs

The trickiest part of a multi-digit input is moving focus between fields. We use a \`useRef\` array to hold references to each \`<input>\` element and a \`focusInput(index)\` helper that clamps the index and calls \`.focus()\` + \`.select()\`:

\`\`\`jsx
const inputsRef = useRef([]);

const focusInput = (index) => {
  const clamped = Math.max(0, Math.min(index, CODE_LENGTH - 1));
  inputsRef.current[clamped]?.focus();
  inputsRef.current[clamped]?.select();
};
\`\`\`

## Input Handling

Each input's \`onChange\` strips non-digits, takes the last character (handles mobile keyboards that sometimes prepend), writes it to state, and auto-advances focus:

\`\`\`jsx
const digit = value.replace(/[^0-9]/g, '').slice(-1);
next[index] = digit;
if (digit && index < CODE_LENGTH - 1) focusInput(index + 1);
\`\`\`

## Backspace Behavior

Backspace has two modes:
1. **Current field has a digit** → clear it, stay in place
2. **Current field is empty** → move to the previous field and clear that

This "jump back" UX matches what users expect from SMS code inputs.

## Paste Support

Users often paste a 6-digit code copied from SMS. The \`onPaste\` handler intercepts the clipboard, strips non-digits, distributes across inputs, and auto-submits if complete:

\`\`\`jsx
const pasted = e.clipboardData.getData('text')
  .replace(/[^0-9]/g, '')
  .slice(0, CODE_LENGTH);
\`\`\`

## Auto-Submit & Status Feedback

When all 6 digits are filled (via typing or paste), the component auto-submits. A simple state machine (\`idle → verifying → success | error\`) drives border colors and a status message. Inputs are disabled during verification to prevent editing mid-flight.

## Accessibility

- \`inputMode="numeric"\` hints mobile keyboards to show a number pad
- \`autoFocus\` on the first input gets users typing immediately
- Each input has \`type="text"\` (not \`type="number"\`) to avoid spinner buttons and allow full keyboard control
- Arrow keys navigate between fields`;

const PROMPT = `Build a **two-factor authentication code input** — the 6-digit verification code UI you see after logging in to a secure service.

### Requirements

1. **Six separate input fields**, one per digit, displayed in a horizontal row
2. **Auto-focus advancing** — typing a digit automatically moves focus to the next input
3. **Backspace behavior** — pressing Backspace on an empty field moves focus to the previous field and clears it
4. **Arrow key navigation** — Left/Right arrow keys move focus between fields
5. **Paste support** — pasting a 6-digit string (e.g. copied from SMS) fills all fields at once
6. **Digit-only input** — reject any non-numeric characters
7. **Auto-submit** — when all 6 digits are filled, automatically trigger verification
8. **Visual feedback** — show distinct states for idle, verifying, success, and error (border colors + status text)

### Behavior Details

- Only single digits (0–9) should be accepted per field
- Pasting "123456" into any field should distribute the digits across all 6 inputs
- After auto-submit, inputs should be disabled during verification
- For testing, the code \`123456\` should verify successfully; anything else should show an error state that auto-clears after 1.5 seconds

### Hints

- Use a \`useRef\` array to hold references to each input element
- \`inputMode="numeric"\` gives mobile users a number pad
- Handle \`onPaste\` by reading from \`e.clipboardData.getData('text')\``;

async function main() {
  // 1. Upsert tags
  const tagReact = await prisma.questionTag.upsert({ where: { name: 'react' }, update: {}, create: { name: 'react' } });
  const tagForms = await prisma.questionTag.upsert({ where: { name: 'forms' }, update: {}, create: { name: 'forms' } });
  const tagA11y = await prisma.questionTag.upsert({ where: { name: 'accessibility' }, update: {}, create: { name: 'accessibility' } });
  const tagDom = await prisma.questionTag.upsert({ where: { name: 'dom-api' }, update: {}, create: { name: 'dom-api' } });

  // 2. Get admin user
  const adminUser = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!adminUser) {
    throw new Error('No user found. Run `npx prisma db seed` first.');
  }

  // 3. Upsert the question
  const question = await prisma.question.upsert({
    where: { slug: SLUG },
    update: {
      title: 'Two-Factor Code Input',
      prompt: PROMPT,
      type: QuestionType.REACT_APP,
      difficulty: Difficulty.MEDIUM,
      accessTier: AccessTier.FREE,
      isPublished: true,
    },
    create: {
      slug: SLUG,
      title: 'Two-Factor Code Input',
      prompt: PROMPT,
      type: QuestionType.REACT_APP,
      difficulty: Difficulty.MEDIUM,
      accessTier: AccessTier.FREE,
      isPublished: true,
      createdById: adminUser.id,
    },
  });

  console.log(`Question upserted: ${question.id} (${question.slug})`);

  // 4. Tags
  for (const tag of [tagReact, tagForms, tagA11y, tagDom]) {
    await prisma.questionTagOnQuestion.upsert({
      where: { questionId_tagId: { questionId: question.id, tagId: tag.id } },
      update: {},
      create: { questionId: question.id, tagId: tag.id },
    });
  }

  // 5. Version with starter code
  await prisma.questionVersion.upsert({
    where: { questionId_version: { questionId: question.id, version: 1 } },
    update: {
      starterCode: { react: STARTER_CODE_REACT, reactTypescript: STARTER_CODE_REACT_TS, css: STARTER_CSS },
      content: {
        description: 'Build a 6-digit 2FA code input with auto-focus advancing, paste support, arrow key navigation, and visual verification feedback.',
      },
    },
    create: {
      questionId: question.id,
      version: 1,
      status: QuestionVersionStatus.PUBLISHED,
      content: {
        description: 'Build a 6-digit 2FA code input with auto-focus advancing, paste support, arrow key navigation, and visual verification feedback.',
      },
      starterCode: { react: STARTER_CODE_REACT, reactTypescript: STARTER_CODE_REACT_TS, css: STARTER_CSS },
      publishedAt: new Date(),
    },
  });

  // 6. Test code (RTL tests for React questions)
  await prisma.question.update({
    where: { id: question.id },
    data: {
      publicTestCode: `test('six input fields render', () => {
  render(<UserComponent />);
  const inputs = document.querySelectorAll('input');
  expect(inputs.length).toBe(6);
});

test('typing a digit advances focus to next field', () => {
  render(<UserComponent />);
  const inputs = document.querySelectorAll('input');
  fireEvent.change(inputs[0], { target: { value: '1' } });
  expect(document.activeElement).toBe(inputs[1]);
});

test('backspace on empty field moves to previous', () => {
  render(<UserComponent />);
  const inputs = document.querySelectorAll('input');
  fireEvent.change(inputs[0], { target: { value: '1' } });
  fireEvent.change(inputs[1], { target: { value: '2' } });
  fireEvent.change(inputs[1], { target: { value: '' } });
  fireEvent.keyDown(inputs[1], { key: 'Backspace' });
  expect(document.activeElement).toBe(inputs[0]);
});

test('only digits accepted', () => {
  render(<UserComponent />);
  const inputs = document.querySelectorAll('input');
  fireEvent.change(inputs[0], { target: { value: 'a' } });
  expect(inputs[0].value).toBe('');
});`,
    },
  });

  // 7. Official solution
  await prisma.officialSolution.upsert({
    where: { id: `${question.id}-official-react` },
    update: {
      explanation: SOLUTION_EXPLANATION,
      code: SOLUTION_CODE,
      complexity: null,
    },
    create: {
      id: `${question.id}-official-react`,
      questionId: question.id,
      language: 'typescript',
      explanation: SOLUTION_EXPLANATION,
      code: SOLUTION_CODE,
      complexity: null,
    },
  });

  // 8. Refresh renderData
  const { refreshQuestionRenderData } = await import('../../../lib/questions-snapshot');
  await refreshQuestionRenderData(question.id);

  console.log(`✓ Question seeded: "${question.title}" (${SLUG})`);
  console.log(`  - 4 tags: react, forms, accessibility, dom-api`);
  console.log(`  - 7 public acceptance criteria`);
  console.log(`  - 1 official solution with explanation`);
  console.log(`  - renderData refreshed`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
