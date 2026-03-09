import { FunctionJsRunner } from '@/lib/runners/adapters/function-js';
import { ReactPreviewRunner } from '@/lib/runners/adapters/react';
import { RunnerAdapter, RunnerFramework } from '@/lib/runners/types';

const runners: Record<RunnerFramework, RunnerAdapter> = {
  javascript: new FunctionJsRunner(),
  react: new ReactPreviewRunner()
};

export function getRunner(framework: RunnerFramework): RunnerAdapter {
  return runners[framework];
}
