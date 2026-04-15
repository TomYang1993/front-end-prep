export type RunnerFramework = 'javascript' | 'react' | 'python';

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export interface RunnerExecutionResult {
  passed: boolean;
  results: TestResult[];
  runtimeMs: number;
  logs: string[];
}

export interface RunnerAdapter {
  framework: RunnerFramework;
  run(code: string, testCode: string): Promise<RunnerExecutionResult>;
}
