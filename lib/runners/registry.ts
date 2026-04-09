import { FunctionJsRunner } from '@/lib/runners/adapters/function-js';
import { ReactPreviewRunner } from '@/lib/runners/adapters/react';
import { PythonStubRunner } from '@/lib/runners/adapters/function-python';
import { RunnerAdapter, RunnerFramework } from '@/lib/runners/types';

const runners: Record<RunnerFramework, RunnerAdapter> = {
  javascript: new FunctionJsRunner(),
  react: new ReactPreviewRunner(),
  python: new PythonStubRunner(),
};

export function getRunner(framework: RunnerFramework): RunnerAdapter {
  return runners[framework];
}
