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
  padding: 9px 12px;
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
  padding: 9px 20px;
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

const SOLUTION_CSS = `body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f9fafb;
  margin: 0;
}

.card {
  max-width: 480px;
  margin: 40px auto;
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
}

/* Step indicator */
.step-header { display: flex; justify-content: space-between; margin-bottom: 24px; }
.step-item { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; }

.step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  background: #e5e7eb;
  color: #9ca3af;
}
.step-dot--done   { background: #22c55e; color: #fff; }
.step-dot--active { background: #3b82f6; color: #fff; }

.step-label { font-size: 12px; color: #9ca3af; }
.step-label--active { color: #3b82f6; font-weight: 600; }

/* Form */
.form-heading { margin: 0 0 4px; font-size: 20px; font-weight: 700; color: #111827; }
.form-subtext  { margin: 0 0 20px; font-size: 13px; color: #6b7280; }

.fields { display: flex; flex-direction: column; gap: 14px; }
.field-label { display: flex; flex-direction: column; gap: 5px; font-size: 14px; font-weight: 500; color: #374151; }

input {
  width: 100%;
  padding: 9px 12px;
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

/* Review */
.review-grid {
  display: grid;
  grid-template-columns: 90px 1fr;
  row-gap: 10px;
  column-gap: 8px;
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  margin: 0;
}
.review-dt { font-size: 13px; font-weight: 500; color: #6b7280; margin: 0; }
.review-dd { font-size: 14px; color: #111827; margin: 0; font-weight: 500; }

/* Buttons */
.btn-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 28px;
}

button {
  padding: 9px 20px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
}
button:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-primary   { background: #3b82f6; color: #fff; }
.btn-secondary { background: #fff; color: #374151; border-color: #d1d5db; }
.btn-success   { background: #22c55e; color: #fff; }

/* Submitted */
.success-heading { color: #22c55e; margin: 0 0 16px; font-size: 20px; font-weight: 700; }

pre {
  background: #f3f4f6;
  padding: 16px;
  border-radius: 8px;
  font-size: 13px;
  overflow-x: auto;
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

const STEPS = ['Personal Info', 'Address', 'Review'];

export default function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [formState, setFormState] = useState(initialData);
  const [submitted, setSubmitted] = useState(null);

  const update = (field, event) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const canAdvance = validateStep(step, formState);

  const handleNext = () => {
    if (canAdvance && step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    setSubmitted(formState);
  };

  if (submitted) {
    return (
      <div className="card">
        <h2 className="success-heading">All done, {submitted.name}!</h2>
        <pre>{JSON.stringify(submitted, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="step-header">
        {STEPS.map((label, i) => (
          <div key={label} className="step-item">
            <div className={\`step-dot \${i + 1 < step ? 'step-dot--done' : i + 1 === step ? 'step-dot--active' : ''}\`}>
              {i + 1 < step ? '✓' : i + 1}
            </div>
            <span className={\`step-label \${i + 1 === step ? 'step-label--active' : ''}\`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      <h2 className="form-heading">Sign Up</h2>
      <p className="form-subtext">Step {step} of 3</p>

      {step === 1 && (
        <div className="fields">
          <label className="field-label">
            Name
            <input value={formState.name} onChange={(e) => update('name', e)} placeholder="Ada Lovelace" />
          </label>
          <label className="field-label">
            Email
            <input value={formState.email} onChange={(e) => update('email', e)} placeholder="ada@example.com" type="email" />
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="fields">
          <label className="field-label">
            Street
            <input value={formState.street} onChange={(e) => update('street', e)} placeholder="123 Main St" />
          </label>
          <label className="field-label">
            City
            <input value={formState.city} onChange={(e) => update('city', e)} placeholder="Springfield" />
          </label>
          <label className="field-label">
            ZIP
            <input value={formState.zip} onChange={(e) => update('zip', e)} placeholder="12345" maxLength={5} />
          </label>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3 className="form-heading" style={{ fontSize: 15, margin: '0 0 12px' }}>Review your info</h3>
          <dl className="review-grid">
            <dt className="review-dt">Name</dt><dd className="review-dd">{formState.name}</dd>
            <dt className="review-dt">Email</dt><dd className="review-dd">{formState.email}</dd>
            <dt className="review-dt">Street</dt><dd className="review-dd">{formState.street}</dd>
            <dt className="review-dt">City</dt><dd className="review-dd">{formState.city}</dd>
            <dt className="review-dt">ZIP</dt><dd className="review-dd">{formState.zip}</dd>
          </dl>
        </div>
      )}

      <div className="btn-row">
        {step > 1 ? (
          <button onClick={handleBack} className="btn-secondary">Back</button>
        ) : <span />}
        {step < 3 ? (
          <button onClick={handleNext} disabled={!canAdvance} className="btn-primary">Next</button>
        ) : (
          <button onClick={handleSubmit} className="btn-success">Submit</button>
        )}
      </div>
    </div>
  );
}`;

const SOLUTION_EXPLANATION = `## One source of truth for form data

All five fields live in a single \`formState\` object in \`useState\`. Each step renders a subset, but values persist across step transitions because the state is never unmounted — only the UI is:

\`\`\`jsx
const [formState, setFormState] = useState({ name: '', email: '', street: '', city: '', zip: '' });
\`\`\`

This is the key insight that makes "Back preserves values" free — there's nothing to restore, the data was never lost.

## Per-step validation as a pure function

\`validateStep(step, data)\` takes the current step + form data and returns a boolean. It's pure (no state, no side effects), so it's easy to reason about and test in isolation:

\`\`\`jsx
function validateStep(step, data) {
  if (step === 1) return data.name.trim().length > 0 && isValidEmail(data.email);
  if (step === 2) return data.street.trim() && data.city.trim() && isValidZip(data.zip);
  return true;
}
\`\`\`

The Next button's \`disabled\` derives from \`validateStep\` directly — no separate \`isValid\` flag needed.

## Two-arg update handler

A single \`update(field, event)\` helper merges changes into state, called with an inline arrow on each input:

\`\`\`jsx
const update = (field, event) => {
  setFormState((prev) => ({ ...prev, [field]: event.target.value }));
};
// usage:
<input onChange={(e) => update('name', e)} />
\`\`\`

The explicit two-arg call makes the field name easy to see at a glance. An alternative is a curried factory (\`update('name')\` as a direct onChange prop), which is terser but slightly harder to scan.


## CSS (styles.css)

\`\`\`css
${SOLUTION_CSS.trim()}
\`\`\`

## Full Implementation`;

const PROMPT = `Build a **multi-step sign-up form** with three steps and a review screen.

### Steps

**Personal info** — Name, Email
**Address** — Street, City, ZIP (5 digits)
**Review** — read-only summary of all entered values, with a Submit button

### Requirements

1. Show "Step X of 3" at the top.
2. Next button advances to the next step, **disabled until the current step is valid**.
3. Back button returns to the previous step, **values entered earlier must persist**.
4. Clicking on Submit button displays the full form payload, no need to do an actual POST.
5. **Per-step validation:**
   - Step 1: name is non-empty, email matches a basic \`x@y.z\` pattern
   - Step 2: street and city are non-empty, ZIP is exactly 5 digits`;

export const multiStepForm: SeedQuestion = {
  slug: 'multi-step-form',
  title: 'Multi-Step Form',
  prompt: PROMPT,
  description: 'Build a 3-step sign-up wizard.',
  type: QuestionType.REACT_APP,
  difficulty: Difficulty.HARD,
  accessTier: AccessTier.FREE,
  timeLimitMinutes: 60,
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
      language: 'javascript',
      code: SOLUTION_CODE,
      explanation: SOLUTION_EXPLANATION,
    },
  ],
};
