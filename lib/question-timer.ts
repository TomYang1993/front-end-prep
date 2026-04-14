import type { Difficulty, QuestionType } from '@prisma/client';

const DEFAULTS: Record<string, number> = {
  'FUNCTION_JS:EASY': 30,
  'FUNCTION_JS:MEDIUM': 45,
  'FUNCTION_JS:HARD': 60,
  'FUNCTION_PYTHON:EASY': 30,
  'FUNCTION_PYTHON:MEDIUM': 45,
  'FUNCTION_PYTHON:HARD': 60,
  'REACT_APP:EASY': 60,
  'REACT_APP:MEDIUM': 60,
  'REACT_APP:HARD': 60,
};

export function getDefaultTimeLimitMinutes(type: QuestionType, difficulty: Difficulty): number {
  return DEFAULTS[`${type}:${difficulty}`] ?? 45;
}
