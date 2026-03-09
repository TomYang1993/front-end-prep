import { JSDOM } from 'jsdom';
import { RunnerAdapter, RunnerExecutionResult } from '@/lib/runners/types';


/**
 * React runner that renders user components in a JSDOM environment
 * and asserts against expected DOM output.
 *
 * Test case format:
 *   input: { props?: Record<string, unknown> }
 *   expected: {
 *     containsText?: string[];        // text content assertions
 *     querySelector?: string;          // CSS selector that must exist
 *     querySelectorAll?: { selector: string; count: number };
 *     containsTag?: string;            // tag name that must exist (e.g. 'button')
 *     snapshot?: string;               // exact innerHTML match
 *   }
 */
export class ReactPreviewRunner implements RunnerAdapter {
  framework = 'react' as const;

  async run(code: string, input: unknown, expected: unknown): Promise<RunnerExecutionResult> {
    const started = Date.now();

    // Basic validation
    if (!code.includes('export default') && !code.includes('export {')) {
      return {
        passed: false,
        output: null,
        runtimeMs: Date.now() - started,
        error: 'React code must have a default export (component function)',
      };
    }

    try {
      // Set up JSDOM with a root element
      const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
        url: 'http://localhost',
        pretendToBeVisual: true,
        runScripts: 'dangerously',
        resources: 'usable',
      });

      const { window } = dom;
      const { document } = window;

      // Import React to inject into the user code context
      const React = await import('react');

      // Parse test input for props
      const inputData = (input as { props?: Record<string, unknown> }) || {};
      const props = inputData.props || {};

      // Instead of using esbuild bundling (which requires resolving node_modules
      // in complex ways), we use React's server-side rendering capabilities
      // with a simpler eval approach:

      // Extract the component function from user code
      // We use a Function constructor approach with React in scope
      const wrappedCode = `
        const React = __injectedReact;
        const { useState, useEffect, useRef, useMemo, useCallback, useContext, useReducer, createContext, Fragment } = React;
        ${code.replace(/export\s+default\s+/g, 'const __UserComponent = ')}
        return __UserComponent;
      `;

      const componentFactory = new Function('__injectedReact', wrappedCode);
      const UserComponent = componentFactory(React);

      if (typeof UserComponent !== 'function') {
        return {
          passed: false,
          output: null,
          runtimeMs: Date.now() - started,
          error: 'Default export must be a React component function',
        };
      }

      // Render using React's test utilities via JSDOM
      // We use ReactDOM createRoot which works with our JSDOM document
      const container = document.getElementById('root')!;

      // Use React's flushSync-like approach: render synchronously
      const { renderToString } = await import('react-dom/server');
      const element = React.createElement(UserComponent, props);
      const html = renderToString(element);
      container.innerHTML = html;

      // Now assert against expected output
      const exp = (expected as {
        containsText?: string[];
        querySelector?: string;
        querySelectorAll?: { selector: string; count: number };
        containsTag?: string;
        snapshot?: string;
        preview?: boolean;
      }) || {};

      const errors: string[] = [];
      const rootHtml = container.innerHTML;

      // Simple preview mode — just check it renders without crashing
      if (exp.preview) {
        dom.window.close();
        return {
          passed: true,
          output: { rendered: true, html: rootHtml.slice(0, 500) },
          runtimeMs: Date.now() - started,
        };
      }

      // containsText assertions
      if (exp.containsText) {
        const textContent = container.textContent || '';
        for (const text of exp.containsText) {
          if (!textContent.includes(text)) {
            errors.push(`Expected text "${text}" not found in rendered output`);
          }
        }
      }

      // querySelector assertion
      if (exp.querySelector) {
        const found = container.querySelector(exp.querySelector);
        if (!found) {
          errors.push(`Element matching "${exp.querySelector}" not found`);
        }
      }

      // querySelectorAll assertion
      if (exp.querySelectorAll) {
        const { selector, count } = exp.querySelectorAll;
        const found = container.querySelectorAll(selector);
        if (found.length !== count) {
          errors.push(`Expected ${count} elements matching "${selector}", found ${found.length}`);
        }
      }

      // containsTag assertion
      if (exp.containsTag) {
        const found = container.getElementsByTagName(exp.containsTag);
        if (found.length === 0) {
          errors.push(`Expected <${exp.containsTag}> element not found`);
        }
      }

      // snapshot assertion
      if (exp.snapshot) {
        const normalizedActual = rootHtml.replace(/\s+/g, ' ').trim();
        const normalizedExpected = exp.snapshot.replace(/\s+/g, ' ').trim();
        if (normalizedActual !== normalizedExpected) {
          errors.push(`HTML mismatch.\nExpected: ${normalizedExpected}\nActual: ${normalizedActual}`);
        }
      }

      dom.window.close();

      const passed = errors.length === 0;
      return {
        passed,
        output: {
          html: rootHtml.slice(0, 1000),
          assertions: exp,
        },
        runtimeMs: Date.now() - started,
        error: passed ? undefined : errors.join('\n'),
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : JSON.stringify(error);

      return {
        passed: false,
        output: null,
        runtimeMs: Date.now() - started,
        error: `React render error: ${message}`,
      };
    }
  }
}
