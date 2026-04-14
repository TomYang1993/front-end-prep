'use client';

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useSyntaxTheme } from '@/lib/hooks/use-syntax-theme';

interface MarkdownProseProps {
  children: string;
  className?: string;
}

/**
 * Renders markdown content with prose-like typography and syntax-highlighted code blocks.
 * Used for question descriptions and solution explanations.
 */
export function MarkdownProse({ children, className = '' }: MarkdownProseProps) {
  const syntaxTheme = useSyntaxTheme();
  return (
    <div className={`markdown-prose ${className}`}>
      <ReactMarkdown
        components={{
          code({ children, className: codeClassName, ...props }) {
            const match = /language-(\w+)/.exec(codeClassName || '');
            // Fenced code block (rendered inside <pre> by ReactMarkdown)
            if (match) {
              return (
                <SyntaxHighlighter
                  style={syntaxTheme}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.375rem',
                    fontSize: '0.82rem',
                    lineHeight: '1.6',
                  }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              );
            }
            // Inline code
            return (
              <code
                className="bg-surface-raised border border-line px-1.5 py-0.5 rounded text-[0.85em] font-mono text-brand"
                {...props}
              >
                {children}
              </code>
            );
          },
          // Fenced code blocks — let the code component handle rendering
          pre({ children }) {
            return <div className="my-4">{children}</div>;
          },
          // Paragraphs
          p({ children }) {
            return <p className="mb-4 last:mb-0">{children}</p>;
          },
          // Lists
          ul({ children }) {
            return <ul className="list-disc pl-5 mb-4 flex flex-col gap-1.5">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-5 mb-4 flex flex-col gap-1.5">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-[1.6]">{children}</li>;
          },
          // Headings
          h1({ children }) {
            return <h1 className="text-xl font-bold mb-3 mt-6 first:mt-0">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-lg font-bold mb-2 mt-5 first:mt-0">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-base font-bold mb-2 mt-4 first:mt-0">{children}</h3>;
          },
          // Strong / Em
          strong({ children }) {
            return <strong className="font-bold text-ink">{children}</strong>;
          },
          // Blockquote
          blockquote({ children }) {
            return (
              <blockquote className="border-l-[3px] border-brand pl-4 my-4 text-ink-secondary italic">
                {children}
              </blockquote>
            );
          },
          // Horizontal rule
          hr() {
            return <hr className="border-line my-6" />;
          },
          // Links
          a({ children, href }) {
            return (
              <a href={href} className="text-brand underline underline-offset-2 hover:text-brand-hover transition-colors" target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
