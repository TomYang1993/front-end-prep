import nextConfig from 'eslint-config-next';
import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...nextConfig,
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
];
