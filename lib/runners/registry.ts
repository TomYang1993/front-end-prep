import { FunctionJsRunner } from '@/lib/runners/adapters/function-js';
import { ReactPreviewRunner } from '@/lib/runners/adapters/react';
import { RunnerAdapter, RunnerFramework } from '@/lib/runners/types';

const runners: Partial<Record<RunnerFramework, RunnerAdapter>> = {
  javascript: new FunctionJsRunner(),
  react: new ReactPreviewRunner(),
};

export function getRunner(framework: RunnerFramework): RunnerAdapter {
  const runner = runners[framework];
  if (!runner) {
    throw new Error(
      `No frontend runner registered for framework "${framework}". Backend languages run via Vercel Sandbox.`,
    );
  }
  return runner;
}
