export type BackendLanguage = 'python' | 'go' | 'java' | 'rust';

interface HarnessConfig {
  runtime: 'python3.13' | 'node24';
  files: (functionName: string) => { path: string; content: string; mode?: number }[];
  command: (functionName: string) => { cmd: string; args: string[] };
}

/**
 * Each language harness:
 *   - Reads user solution + cases.json (written by the runner)
 *   - For each case, calls the entrypoint with case.args
 *   - Deep-compares result to case.expected
 *   - Prints one NDJSON line per case: {name, passed, output, error?, runtimeMs}
 */
const PYTHON_HARNESS = `
import json, sys, time, traceback, importlib.util

spec = importlib.util.spec_from_file_location("solution", "solution.py")
mod = importlib.util.module_from_spec(spec)
try:
    spec.loader.exec_module(mod)
except Exception as e:
    sys.stderr.write(f"Failed to load solution: {type(e).__name__}: {e}\\n")
    sys.exit(1)

with open("cases.json") as f:
    cases = json.load(f)

fn_name = sys.argv[1]
fn = getattr(mod, fn_name, None)
if fn is None or not callable(fn):
    sys.stderr.write(f"Function {fn_name!r} not found or not callable\\n")
    sys.exit(1)

for case in cases:
    start = time.perf_counter()
    result = {"name": case["name"], "passed": False, "output": None, "runtimeMs": 0}
    try:
        output = fn(*case["args"])
        runtime_ms = int((time.perf_counter() - start) * 1000)
        result["runtimeMs"] = runtime_ms
        try:
            json.dumps(output)
            serializable = True
        except (TypeError, ValueError):
            serializable = False
        if not serializable:
            result["error"] = f"Return value is not JSON-serializable: {type(output).__name__}"
        else:
            result["output"] = output
            result["passed"] = output == case["expected"]
            if not result["passed"]:
                result["error"] = f"Expected {json.dumps(case['expected'])}, got {json.dumps(output)}"
    except Exception as e:
        result["runtimeMs"] = int((time.perf_counter() - start) * 1000)
        result["error"] = f"{type(e).__name__}: {e}"
    print(json.dumps(result), flush=True)
`.trimStart();

export const HARNESSES: Record<BackendLanguage, HarnessConfig | undefined> = {
  python: {
    runtime: 'python3.13',
    files: () => [
      { path: 'harness.py', content: PYTHON_HARNESS },
    ],
    command: (functionName) => ({ cmd: 'python3', args: ['harness.py', functionName] }),
  },
  go: undefined,
  java: undefined,
  rust: undefined,
};
