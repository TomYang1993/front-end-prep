'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { BookOpen, X } from 'lucide-react';

export function CheatsheetModal() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="ide-sidenav-btn" title="JS Cheatsheet">
          <BookOpen size={24} strokeWidth={1.5} />
        </button>
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content" style={{ maxWidth: '750px', width: '90vw', maxHeight: '85vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'nowrap', gap: '1rem' }}>
            <Dialog.Title style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>JavaScript Cheatsheet</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Close" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', flexShrink: 0, padding: 0 }}>
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <div style={{ display: 'grid', gap: '1.25rem', lineHeight: 1.5 }}>
            {/* Section 1 */}
            <section>
              <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.5rem' }}>
                <code>typeof</code> Operator
              </h2>
              <blockquote style={{ borderLeft: '3px solid var(--brand)', paddingLeft: '1rem', margin: '0 0 0.75rem 0', color: 'var(--muted)', fontStyle: 'italic', fontSize: '0.88rem' }}>
                Good for testing primitive values, not good for reference types.
              </blockquote>
              <pre style={{ background: '#0f172a', color: '#f8fafc', padding: '0.8rem', borderRadius: 'var(--radius-sm)', overflowX: 'auto', fontSize: '12px' }}>
                <code>{`console.log(typeof 1);         // "number"
console.log(typeof "s");       // "string"
console.log(typeof true);      // "boolean"
console.log(typeof null);      // "object" (it's a famous bug!)
console.log(typeof undefined); // "undefined"
console.log(typeof NaN);       // "number"
console.log(typeof Symbol());  // "symbol"`}</code>
              </pre>
            </section>

            {/* Section 2 */}
            <section>
              <blockquote style={{ borderLeft: '3px solid var(--brand)', paddingLeft: '1rem', margin: '0 0 0.75rem 0', color: 'var(--muted)', fontStyle: 'italic', fontSize: '0.88rem' }}>
                Only functions will have a type of <code>'function'</code>, others are all just <code>'object'</code>.
              </blockquote>
              <pre style={{ background: '#0f172a', color: '#f8fafc', padding: '0.8rem', borderRadius: 'var(--radius-sm)', overflowX: 'auto', fontSize: '12px' }}>
                <code>{`console.log(typeof console);      // "object"
console.log(typeof {});           // "object"
console.log(typeof []);           // "object"
console.log(typeof Math);         // "object"
console.log(typeof Date);         // "function"
console.log(typeof RegExp);       // "function"
console.log(typeof console.log);  // "function"

function testTypeOf() {}
console.log(typeof testTypeOf);   // "function"`}</code>
              </pre>
            </section>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
