import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

const STARTER_CODE_REACT = `import React, { useState } from 'react';

export default function MultiStepForm() {
  const [step, setStep] = useState(1);

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Sign Up</h2>
      <p>Step {step} of 3</p>

      {/* TODO: render the current step's fields */}
      {/* TODO: render Back / Next / Submit buttons with validation */}
    </div>
  );
}`;

const STARTER_CODE_REACT_TS = `import React, { useState } from 'react';

interface FormData {
  name: string;
  email: string;
  street: string;
  city: string;
  zip: string;
}

export default function MultiStepForm(): JSX.Element {
  const [step, setStep] = useState<number>(1);

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Sign Up</h2>
      <p>Step {step} of 3</p>

      {/* TODO: render the current step's fields */}
      {/* TODO: render Back / Next / Submit buttons with validation */}
    </div>
  );
}`;

const STARTER_CSS = `body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f9fafb;
  margin: 0;
}

input {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

button {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`;

const SOLUTION_CODE = `import React, { useState } from 'react';

const initialData = {
  name: '',
  email: '',
  street: '',
  city: '',
  zip: '',
};

const isValidEmail = (s) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(s);
const isValidZip = (s) => /^\\d{5}$/.test(s);

function validateStep(step, data) {
  if (step === 1) {
    return data.name.trim().length > 0 && isValidEmail(data.email);
  }
  if (step === 2) {
    return (
      data.street.trim().length > 0 &&
      data.city.trim().length > 0 &&
      isValidZip(data.zip)
    );
  }
  return true;
}

export default function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(initialData);
  const [submitted, setSubmitted] = useState(null);

  const update = (field) => (e) =>
    setData((prev) => ({ ...prev, [field]: e.target.value }));

  const canAdvance = validateStep(step, data);

  const handleNext = () => {
    if (canAdvance && step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    setSubmitted(data);
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: 480, margin: '40px auto' }}>
        <h2>Thanks, {submitted.name}!</h2>
        <p>Submitted payload:</p>
        <pre style={{ background: '#f3f4f6', padding: 12, borderRadius: 6 }}>
          {JSON.stringify(submitted, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '40px auto' }}>
      <h2>Sign Up</h2>
      <p style={{ color: '#6b7280' }}>Step {step} of 3</p>

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label>
            Name
            <input value={data.name} onChange={update('name')} />
          </label>
          <label>
            Email
            <input value={data.email} onChange={update('email')} />
          </label>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label>
            Street
            <input value={data.street} onChange={update('street')} />
          </label>
          <label>
            City
            <input value={data.city} onChange={update('city')} />
          </label>
          <label>
            ZIP (5 digits)
            <input value={data.zip} onChange={update('zip')} />
          </label>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3>Review</h3>
          <dl style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 6 }}>
            <dt>Name</dt><dd>{data.name}</dd>
            <dt>Email</dt><dd>{data.email}</dd>
            <dt>Street</dt><dd>{data.street}</dd>
            <dt>City</dt><dd>{data.city}</dd>
            <dt>ZIP</dt><dd>{data.zip}</dd>
          </dl>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <button
          onClick={handleBack}
          disabled={step === 1}
          style={{ background: '#fff', borderColor: '#d1d5db' }}
        >
          Back
        </button>
        {step < 3 ? (
          <button
            onClick={handleNext}
            disabled={!canAdvance}
            style={{ background: '#3b82f6', color: '#fff' }}
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            style={{ background: '#22c55e', color: '#fff' }}
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
}`;

const SOLUTION_EXPLANATION = `## One source of truth for form data

All five fields live in a single \`data\` object in \`useState\`. Each step renders a subset, but the values persist across step transitions because we never unmount the data — only the UI:

\`\`\`jsx
const [data, setData] = useState({ name: '', email: '', street: '', city: '', zip: '' });
\`\`\`

This is the key insight that makes "Back preserves values" free — there's nothing to preserve, the data was never lost.

## Per-step validation as a pure function

\`validateStep(step, data)\` takes the current step + form data and returns a boolean. It's pure (no state, no side effects), so it's easy to reason about and test:

\`\`\`jsx
function validateStep(step, data) {
  if (step === 1) return data.name.trim().length > 0 && isValidEmail(data.email);
  if (step === 2) return data.street.trim() && data.city.trim() && isValidZip(data.zip);
  return true;
}
\`\`\`

The Next button's \`disabled\` derives from \`validateStep(step, data)\` directly — no need to track a separate \`isValid\` flag.

## Curried update handler

A single \`update(field)\` factory generates an onChange handler per field, keeping JSX terse:

\`\`\`jsx
const update = (field) => (e) =>
  setData((prev) => ({ ...prev, [field]: e.target.value }));
\`\`\`

## Submit only on the final step

The button that triggers submit is conditionally rendered — when \`step < 3\` it's a "Next" button, when \`step === 3\` it's "Submit". This makes it impossible to submit early, and means there's no shared handler with mode-switching logic.

## What to push on in interview

- Where does form state live? (one object, not per-step)
- How do you preserve values across Back navigation? (free — state outlives the rendered step)
- How would you add async validation (e.g. "email already taken")? (per-step \`useEffect\` keyed on the field, or a debounced check)
- How would you persist progress across refresh? (\`sessionStorage\` sync or URL-sync the step)

## Full Implementation`;

const PROMPT = `Build a **multi-step sign-up form** with three steps and a review screen.

### Steps

1. **Personal info** — Name, Email
2. **Address** — Street, City, ZIP (5 digits)
3. **Review** — read-only summary of all entered values, with a Submit button

### Requirements

1. **Step indicator** — show "Step X of 3" at the top
2. **Next button** — advances to the next step, **disabled until the current step is valid**
3. **Back button** — returns to the previous step; **values entered earlier must persist** (don't reset on navigation)
4. **Submit button** — only appears on step 3; clicking it logs/displays the full form payload
5. **Per-step validation:**
   - Step 1: name is non-empty, email matches a basic \`x@y.z\` pattern
   - Step 2: street and city are non-empty, ZIP is exactly 5 digits
   - Step 3: always valid (review only)

### Behavior Details

- The Back button on step 1 should be disabled (or hidden).
- After Submit, show a confirmation view with the submitted data (e.g. \`<pre>{JSON.stringify(data, null, 2)}</pre>\`).
- Validation runs on every keystroke — Next becomes enabled the moment input is valid.

### Hints

- Keep **all form fields in a single state object** at the top of the component, not per-step. This makes "Back preserves values" trivial.
- A small \`validateStep(step, data)\` pure function keeps the Next-disabled logic readable.
- Conditionally render the Next vs Submit button based on the current step — don't try to share one handler.`;

export const multiStepForm: SeedQuestion = {
  slug: 'multi-step-form',
  title: 'Multi-Step Form',
  prompt: PROMPT,
  description: 'Build a 3-step sign-up wizard with per-step validation, Back/Next navigation that preserves values, and a final review + submit screen.',
  type: QuestionType.REACT_APP,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  timeLimitMinutes: 45,
  tags: ['react', 'forms', 'state', 'validation'],
  starterCode: {
    react: STARTER_CODE_REACT,
    reactTypescript: STARTER_CODE_REACT_TS,
    css: STARTER_CSS,
  },
  publicTestCode: `test('renders step 1 with name and email inputs', () => {
  render(<UserComponent />);
  expect(screen.getByText(/Step 1 of 3/i)).toBeTruthy();
  const inputs = document.querySelectorAll('input');
  expect(inputs.length).toBe(2);
});

test('Next is disabled when step 1 is invalid', () => {
  render(<UserComponent />);
  const next = screen.getByRole('button', { name: /next/i });
  expect(next.disabled).toBe(true);
});

test('Next enables and advances when step 1 is valid', () => {
  render(<UserComponent />);
  const inputs = document.querySelectorAll('input');
  fireEvent.change(inputs[0], { target: { value: 'Ada' } });
  fireEvent.change(inputs[1], { target: { value: 'ada@example.com' } });
  const next = screen.getByRole('button', { name: /next/i });
  expect(next.disabled).toBe(false);
  fireEvent.click(next);
  expect(screen.getByText(/Step 2 of 3/i)).toBeTruthy();
});

test('Back from step 2 preserves step 1 values', () => {
  render(<UserComponent />);
  const inputs = document.querySelectorAll('input');
  fireEvent.change(inputs[0], { target: { value: 'Ada' } });
  fireEvent.change(inputs[1], { target: { value: 'ada@example.com' } });
  fireEvent.click(screen.getByRole('button', { name: /next/i }));
  fireEvent.click(screen.getByRole('button', { name: /back/i }));
  const restored = document.querySelectorAll('input');
  expect(restored[0].value).toBe('Ada');
  expect(restored[1].value).toBe('ada@example.com');
});`,
  solutions: [
    {
      language: 'typescript',
      code: SOLUTION_CODE,
      explanation: SOLUTION_EXPLANATION,
    },
  ],
};
