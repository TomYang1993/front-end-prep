export type RunnerFramework = 'javascript' | 'react';

export type ProblemMode = 'FUNCTION_JS' | 'REACT_APP';

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

export const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: 'Entry',
  MEDIUM: 'Mid',
  HARD: 'Senior+',
};

export interface QuestionListItem {
  id: string;
  slug: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  accessTier: 'FREE' | 'PREMIUM';
  type: ProblemMode;
  tags: string[];
}

export interface EntitlementContext {
  hasPro: boolean;
  unlockedPackQuestionIds: string[];
}

export interface ApiErrorShape {
  error: string;
  code?: string;
}
