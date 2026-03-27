export interface PublicTest {
  id: string;
  input: unknown;
  expected: unknown;
  explanation?: string | null;
}

export interface RunResult {
  id: string;
  passed: boolean;
  output: unknown;
  runtimeMs: number;
  error?: string;
  explanation?: string | null;
}

export interface SpecificPlaygroundProps {
  questionId: string;
  starterCode?: Record<string, string>;
  publicTests: PublicTest[];
}
