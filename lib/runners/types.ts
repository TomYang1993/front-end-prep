export type RunnerFramework = 'javascript' | 'react' | 'python';

export interface RunnerExecutionResult {
  passed: boolean;
  output: unknown;
  runtimeMs: number;
  error?: string;
  logs?: string[];
}

export interface RunnerAdapter {
  framework: RunnerFramework;
  run(code: string, input: unknown, expected: unknown): Promise<RunnerExecutionResult>;
}
