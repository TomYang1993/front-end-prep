import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

const pythonState = { ready: false, loading: false };
vi.mock('@/hooks/use-python-runner', () => ({
  usePythonRunner: () => ({
    ready: pythonState.ready,
    loading: pythonState.loading,
    runTests: vi.fn().mockResolvedValue([])
  })
}));

vi.mock('@monaco-editor/react', () => ({
  default: () => <div data-testid="monaco-stub" />
}));
vi.mock('@/components/bottom-panel', () => ({
  BottomPanel: () => <div data-testid="bottom-panel-stub" />
}));
vi.mock('@/components/tabs/description-tab', () => ({
  DescriptionTab: () => <div />
}));
vi.mock('@/components/tabs/solutions-tab', () => ({
  SolutionsTab: () => <div />
}));
vi.mock('@/components/tabs/submissions-tab', () => ({
  SubmissionsTab: () => <div />
}));
vi.mock('@/components/cheatsheet-modal', () => ({
  CheatsheetModal: () => <div />
}));
vi.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => <div />
}));
vi.mock('@/components/countdown-timer', () => ({
  CountdownTimer: () => <div />
}));
vi.mock('@/components/toast-provider', () => ({
  useToast: () => ({ toast: vi.fn() })
}));
vi.mock('@/lib/hooks/use-debounce', () => ({
  useDebounce: <T,>(v: T) => v
}));

const baseProps = {
  questionId: 'q1',
  slug: 'two-sum',
  title: 'Two Sum',
  prompt: 'Solve it',
  difficulty: 'EASY',
  tags: ['arrays'],
  starterCode: { javascript: '// js', typescript: '// ts', python: '# py' },
  publicTestCode: 'expect(1).toBe(1)'
};

beforeEach(() => {
  pythonState.ready = false;
  pythonState.loading = false;
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [], logs: [] })
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('<EditorWorkspace />', () => {
  it('renders Run + Submit buttons enabled by default (JS mode)', async () => {
    const { EditorWorkspace } = await import('@/components/editor-workspace');
    render(<EditorWorkspace {...baseProps} />);
    const run = screen.getByRole('button', { name: /run/i });
    const submit = screen.getByRole('button', { name: /submit/i });
    expect((run as HTMLButtonElement).disabled).toBe(false);
    expect((submit as HTMLButtonElement).disabled).toBe(false);
  });

  it('Run disables itself while running, then re-enables', async () => {
    let resolveFetch!: (v: unknown) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        () =>
          new Promise(res => {
            resolveFetch = () =>
              res({ ok: true, json: async () => ({ results: [], logs: [] }) });
          })
      )
    );
    const { EditorWorkspace } = await import('@/components/editor-workspace');
    render(<EditorWorkspace {...baseProps} />);
    const run = screen.getByRole('button', { name: /run/i }) as HTMLButtonElement;
    fireEvent.click(run);
    await waitFor(() => expect(run.disabled).toBe(true));
    expect(run.textContent).toMatch(/Running/);
    resolveFetch(null);
    await waitFor(() => expect(run.disabled).toBe(false));
  });

  it('Submit disables itself while judging, then re-enables', async () => {
    let resolveFetch!: (v: unknown) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        () =>
          new Promise(res => {
            resolveFetch = () =>
              res({
                ok: true,
                json: async () => ({ passedCount: 0, total: 0, hiddenResults: [] })
              });
          })
      )
    );
    const { EditorWorkspace } = await import('@/components/editor-workspace');
    render(<EditorWorkspace {...baseProps} />);
    const submit = screen.getByRole('button', { name: /submit/i }) as HTMLButtonElement;
    fireEvent.click(submit);
    await waitFor(() => expect(submit.disabled).toBe(true));
    expect(submit.textContent).toMatch(/Judging/);
    resolveFetch(null);
    await waitFor(() => expect(submit.disabled).toBe(false));
  });

  it('Python mode: Run + Submit disabled while runtime loading', async () => {
    pythonState.loading = true;
    const { EditorWorkspace } = await import('@/components/editor-workspace');
    render(<EditorWorkspace {...baseProps} questionType="FUNCTION_PYTHON" />);
    expect(
      (screen.getByRole('button', { name: /run/i }) as HTMLButtonElement).disabled
    ).toBe(true);
    expect(
      (screen.getByRole('button', { name: /submit/i }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
    expect(screen.getByText(/Loading Python runtime/i)).toBeTruthy();
  });

  it('Python mode: buttons enabled once runtime ready', async () => {
    pythonState.ready = true;
    pythonState.loading = false;
    const { EditorWorkspace } = await import('@/components/editor-workspace');
    render(<EditorWorkspace {...baseProps} questionType="FUNCTION_PYTHON" />);
    expect(
      (screen.getByRole('button', { name: /run/i }) as HTMLButtonElement).disabled
    ).toBe(false);
    expect(
      (screen.getByRole('button', { name: /submit/i }) as HTMLButtonElement)
        .disabled
    ).toBe(false);
  });

  it('Python mode shows "Python 3.11" badge instead of language selector', async () => {
    const { EditorWorkspace } = await import('@/components/editor-workspace');
    render(<EditorWorkspace {...baseProps} questionType="FUNCTION_PYTHON" />);
    expect(screen.getByText(/Python 3.11/)).toBeTruthy();
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('JS mode shows JavaScript/TypeScript language selector', async () => {
    const { EditorWorkspace } = await import('@/components/editor-workspace');
    render(<EditorWorkspace {...baseProps} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('javascript');
    expect(screen.queryByText(/Python 3.11/)).toBeNull();
  });
});
