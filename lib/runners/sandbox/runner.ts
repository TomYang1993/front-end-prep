import { Sandbox } from '@vercel/sandbox';
import { HARNESSES, type BackendLanguage } from './harnesses';

export interface BackendTestCase {
  name: string;
  args: unknown[];
  expected: unknown;
}

export interface BackendTestResult {
  name: string;
  passed: boolean;
  output: unknown;
  error?: string;
  runtimeMs: number;
}

export interface BackendRunResult {
  passed: boolean;
  results: BackendTestResult[];
  runtimeMs: number;
  logs: string[];
}

export interface BackendRunOptions {
  language: BackendLanguage;
  code: string;
  functionName: string;
  cases: BackendTestCase[];
  /** Max wall-clock for the whole sandbox lifetime, ms. Defaults to 60s. */
  timeoutMs?: number;
}

const SOLUTION_FILES: Record<BackendLanguage, string> = {
  python: 'solution.py',
  go: 'solution.go',
  java: 'Solution.java',
  rust: 'solution.rs',
};

/**
 * Run user code against a list of structured test cases inside a Vercel Sandbox.
 * Each case calls `functionName(...case.args)` and deep-compares output to `case.expected`.
 * Returns one BackendTestResult per case, parsed from harness NDJSON stdout.
 *
 * Sandbox is destroyed in finally regardless of outcome.
 */
export async function runBackendInSandbox(opts: BackendRunOptions): Promise<BackendRunResult> {
  const harness = HARNESSES[opts.language];
  if (!harness) {
    throw new Error(`No harness configured for language: ${opts.language}`);
  }

  const totalStart = Date.now();
  const sandbox = await Sandbox.create({
    runtime: harness.runtime,
    networkPolicy: 'deny-all',
    timeout: opts.timeoutMs ?? 60_000,
  });

  try {
    const filesToWrite = [
      { path: SOLUTION_FILES[opts.language], content: Buffer.from(opts.code) },
      { path: 'cases.json', content: Buffer.from(JSON.stringify(opts.cases)) },
      ...harness.files(opts.functionName).map((f) => ({
        path: f.path,
        content: Buffer.from(f.content),
        mode: f.mode,
      })),
    ];
    await sandbox.writeFiles(filesToWrite);

    const { cmd, args } = harness.command(opts.functionName);
    const result = await sandbox.runCommand(cmd, args);
    const stdout = await result.stdout();
    const stderr = await result.stderr();

    const results: BackendTestResult[] = [];
    for (const line of stdout.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        results.push(JSON.parse(trimmed) as BackendTestResult);
      } catch {
        // Non-JSON harness output goes to logs
      }
    }

    if (result.exitCode !== 0 && results.length === 0) {
      const errorMsg = stderr || `Harness exited with code ${result.exitCode}`;
      return {
        passed: false,
        results: opts.cases.map((c) => ({
          name: c.name,
          passed: false,
          output: null,
          error: errorMsg,
          runtimeMs: 0,
        })),
        runtimeMs: Date.now() - totalStart,
        logs: stderr ? [stderr] : [],
      };
    }

    const passed = results.length > 0 && results.every((r) => r.passed);
    return {
      passed,
      results,
      runtimeMs: Date.now() - totalStart,
      logs: stderr ? [stderr] : [],
    };
  } finally {
    sandbox.stop().catch(() => {});
  }
}
