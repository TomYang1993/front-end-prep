import { QuestionType, Difficulty, AccessTier } from '@prisma/client';

export interface SeedSolution {
  language: string;
  code: string;
  explanation: string;
  complexity?: string;
}

export interface SeedQuestion {
  slug: string;
  title: string;
  prompt: string;
  description: string;
  type: QuestionType;
  difficulty: Difficulty;
  accessTier: AccessTier;
  /** Tag names — resolved to IDs in seed.ts */
  tags: string[];
  starterCode: Record<string, string>;
  timeLimitMinutes?: number;
  publicTestCode: string;
  hiddenTestCode?: string;
  solutions?: SeedSolution[];
}
