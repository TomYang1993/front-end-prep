/* eslint-disable no-undef */
let pyodide = null;

async function initPyodide() {
  if (pyodide) return pyodide;
  importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');
  pyodide = await loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
  });
  return pyodide;
}

self.onmessage = async function (e) {
  const { type, code, args, testId } = e.data;

  if (type === 'INIT') {
    try {
      await initPyodide();
      self.postMessage({ type: 'READY' });
    } catch (err) {
      self.postMessage({ type: 'INIT_ERROR', error: err.message });
    }
    return;
  }

  if (type === 'RUN') {
    const start = performance.now();
    const logs = [];

    try {
      const py = await initPyodide();

      py.setStdout({ batched: (text) => logs.push(text) });
      py.setStderr({ batched: (text) => logs.push('[stderr] ' + text) });

      // Clear user-defined globals between runs
      py.runPython(`
for __n in list(globals()):
    if not __n.startswith('_'):
        del globals()[__n]
`);

      const argsJson = JSON.stringify(args);

      const wrappedCode = `
import json as __json

${code}

# Find the first user-defined callable
__user_fn = None
for __name in list(globals()):
    if not __name.startswith('_') and callable(globals()[__name]):
        __user_fn = globals()[__name]
        break

if __user_fn is None:
    raise RuntimeError("No function found. Define a function (e.g., def solve(...):)")

__args = __json.loads('''${argsJson}''')
__result = __user_fn(*__args)
__json.dumps(__result)
`;
      const resultJson = py.runPython(wrappedCode);
      const output = JSON.parse(resultJson);

      self.postMessage({
        type: 'RESULT',
        testId,
        output,
        logs,
        runtimeMs: Math.round(performance.now() - start),
      });
    } catch (err) {
      self.postMessage({
        type: 'RESULT',
        testId,
        output: null,
        error: err.message || String(err),
        logs,
        runtimeMs: Math.round(performance.now() - start),
      });
    }
  }
};
