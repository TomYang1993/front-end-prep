export type RunnerFramework = 'javascript' | 'react';

export type ProblemMode = 'FUNCTION_JS' | 'REACT_APP';

export interface PublicTestCase {
  id: string;
  input: unknown;
  expected: unknown;
  explanation?: string | null;
}

export interface RunnerExecutionResult {
  passed: boolean;
  output: unknown;
  error?: string;
  runtimeMs: number;
}

export interface RunnerAdapter {
  framework: RunnerFramework;
  run(code: string, testInput: unknown, expected: unknown): Promise<RunnerExecutionResult>;
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
