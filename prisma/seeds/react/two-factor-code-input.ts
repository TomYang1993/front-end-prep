import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

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
    </div>
  );
}`;

const STARTER_CSS = `/* Write your component styles here */

.single-input {
  width: 48px;
  height: 56px;
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  border: 2px solid #d1d5db;
  border-radius: 8px;
}
`;

const SOLUTION_CODE = `import React, { useState, useRef, useCallback } from 'react';

const CODE_LENGTH = 6;

export default function TwoFactorInput() {
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));
  const [status, setStatus] = useState('idle'); // idle | verifying | success | error


  const inputsRef = useRef([])

  const focusInput = (index) => {
    inputsRef.current[index]?.focus();
    inputsRef.current[index]?.select();
  }

  const handleChange = (index, val) => {
    const digit = val.replace(/[^0-9]/g, '');
    const updatedCode = [...code]
    updatedCode[index] = digit
    setCode(updatedCode)

    if(digit && index < CODE_LENGTH-1){
      focusInput(index+1)
    }

    if(digit && updatedCode.every((d) => d)){
      submitCode(updatedCode)
    }
  }

  const handleKeyDown = (index, e) => {
    if(e.key === 'Backspace'){
      e.preventDefault();
      const curCode= [...code]
      if(code[index]){
        curCode[index] = ''
        setCode(curCode)
        focusInput(index - 1);
      }else if(index>0){
        focusInput(index - 1);
      }
    }else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusInput(index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusInput(index + 1);
    }
  }

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text')
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

  const submitCode = useCallback((finalCode) => {
    setStatus('verifying');
    // Simulate verification — accept "123456" as valid
    setTimeout(() => {
      if (finalCode.join('') === '123456') {
        setStatus('success');
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 2000);
      }
    }, 1500);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 80 }}>
      <h2>Enter verification code</h2>
      <p style={{ color: '#6b7280', fontSize: 14 }}>
        We sent a {CODE_LENGTH}-digit code to your device
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        {code.map((digit, i) => (
          <input
            className="single-input"
            key={i}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            type="text"
            maxLength={1}
            value={digit}
            ref = {(ele) => inputsRef.current[i] = ele}
            disabled={status === 'verifying' || status === 'success'}
            autoFocus={i === 0}
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

The trickiest part of a multi-digit input is moving focus between fields. We use a \`useRef\` array to hold references to each \`<input>\` element and a \`focusInput(index)\` helper that calls \`.focus()\` + \`.select()\` on the target input. Optional chaining (\`?.\`) makes out-of-range indices a no-op:

\`\`\`jsx
const inputsRef = useRef([]);

const focusInput = (index) => {
  inputsRef.current[index]?.focus();
  inputsRef.current[index]?.select();
};
\`\`\`

## Input Handling

Each input's \`onChange\` strips non-digits, writes the result to state, and auto-advances focus when a digit was entered. The native \`maxLength={1}\` on the input caps the field to one character:

\`\`\`jsx
const digit = val.replace(/[^0-9]/g, '');
updatedCode[index] = digit;
if (digit && index < CODE_LENGTH - 1) focusInput(index + 1);
\`\`\`

When the array is fully populated after the change, \`submitCode\` fires automatically.

## Backspace Behavior

Backspace has two branches:
1. **Current field has a digit** → clear it, then move focus to the previous field
2. **Current field is empty** → move focus to the previous field

This "jump back" UX matches what users expect from SMS code inputs.

## Paste Support

Users often paste a 6-digit code copied from SMS. The \`onPaste\` handler reads the clipboard, distributes the characters across inputs starting at index 0, then focuses the next empty slot. If the paste completes the code, it auto-submits:

\`\`\`jsx
const pasted = e.clipboardData.getData('text');
for (let i = 0; i < pasted.length; i++) {
  next[i] = pasted[i];
}
\`\`\`

## Auto-Submit & Status Feedback

When all 6 digits are filled (via typing or paste), the component auto-submits. A simple state machine (\`idle → verifying → success | error\`) drives a status message below the inputs. Inputs are disabled during verification and on success to prevent editing mid-flight. On error, the status resets to \`idle\` after 2 seconds so the user can retry.

## CSS (styles.css)

\`\`\`css
${STARTER_CSS.trim()}
\`\`\`

## Full Implementation`;

const PROMPT = `Build a **two-factor authentication code input**, you are allowed to modify the starter code completely.

### Requirements

1. **Auto-focus advancing** — typing a digit automatically moves focus to the next input
2. **Backspace behavior** — pressing Backspace on an empty field moves focus to the previous field and clears it
3. **Arrow key navigation** — Left/Right arrow keys move focus between fields
4. **Paste support** — pasting a 6-digit string (e.g. copied from SMS) fills all fields at once
5. **Digit-only input** — reject any non-numeric characters
6. **Auto-submit** — when all 6 digits are filled, automatically trigger verification
7. **Validation feedback** — show distinct states for idle, verifying, success, and error

### Details hint

- Only single digits (0–9) should be accepted per field
- Pasting "123456" into any field should distribute the digits across all 6 inputs
- After auto-submit, inputs should be disabled during verification
- For testing, the code \`123456\` should verify successfully, anything else should show an error state that auto-clears after certain seconds
`;

export const twoFactorCodeInput: SeedQuestion = {
  slug: 'two-factor-code-input',
  title: 'Two-Factor Code Input',
  prompt: PROMPT,
  description: 'Build a 6-digit 2FA code input with auto-focus, paste support, arrow key navigation, and validation etc.',
  type: QuestionType.REACT_APP,
  difficulty: Difficulty.HARD,
  accessTier: AccessTier.FREE,
  timeLimitMinutes: 60,
  tags: ['react', 'forms', 'accessibility', 'dom-api', 'coding taste'],
  starterCode: {
    react: STARTER_CODE_REACT,
    reactTypescript: STARTER_CODE_REACT_TS,
    css: STARTER_CSS,
  },
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
});

test('ArrowRight moves focus to next field', () => {
  render(<UserComponent />);
  const inputs = document.querySelectorAll('input');
  inputs[0].focus();
  fireEvent.keyDown(inputs[0], { key: 'ArrowRight' });
  expect(document.activeElement).toBe(inputs[1]);
});

test('ArrowLeft moves focus to previous field', () => {
  render(<UserComponent />);
  const inputs = document.querySelectorAll('input');
  inputs[2].focus();
  fireEvent.keyDown(inputs[2], { key: 'ArrowLeft' });
  expect(document.activeElement).toBe(inputs[1]);
});

test('paste distributes 6 digits across all fields', () => {
  render(<UserComponent />);
  const inputs = document.querySelectorAll('input');
  fireEvent.paste(inputs[0], {
    clipboardData: { getData: () => '123456' },
  });
  const values = Array.from(inputs).map((i) => i.value);
  expect(values.join('')).toBe('123456');
});

describe('with fake timers', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('valid code 123456 transitions to Verified status', async () => {
    render(<UserComponent />);
    const inputs = document.querySelectorAll('input');
    ['1', '2', '3', '4', '5', '6'].forEach((d, i) => {
      fireEvent.change(inputs[i], { target: { value: d } });
    });
    await act(async () => {
      jest.advanceTimersByTime(1600);
    });
    expect(screen.getByText(/Verified/i)).toBeTruthy();
  });

  test('wrong code shows Invalid status', async () => {
    render(<UserComponent />);
    const inputs = document.querySelectorAll('input');
    ['9', '9', '9', '9', '9', '9'].forEach((d, i) => {
      fireEvent.change(inputs[i], { target: { value: d } });
    });
    await act(async () => {
      jest.advanceTimersByTime(1600);
    });
    expect(screen.getByText(/Invalid/i)).toBeTruthy();
  });
});`,
  solutions: [
    {
      language: 'typescript',
      code: SOLUTION_CODE,
      explanation: SOLUTION_EXPLANATION,
    },
  ],
};
