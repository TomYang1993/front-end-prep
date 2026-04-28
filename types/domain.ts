export const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: 'Entry',
  MEDIUM: 'Mid',
  HARD: 'Senior+',
};

/** Subtle badge background + matching text color (for table/start-screen pills). */
export const DIFFICULTY_BADGE_CLASS: Record<string, string> = {
  EASY: 'bg-good-subtle text-good',
  MEDIUM: 'bg-caution-subtle text-caution',
  HARD: 'bg-warn-subtle text-warn',
};

/** Text-only color (for inline meta rows). */
export const DIFFICULTY_TEXT_CLASS: Record<string, string> = {
  EASY: 'text-good',
  MEDIUM: 'text-caution',
  HARD: 'text-warn',
};

/** Display label for question type. */
export const TYPE_LABEL: Record<string, string> = {
  REACT_APP: 'UI',
  FUNCTION_PYTHON: 'Backend',
  FUNCTION_JS: 'JS',
};
