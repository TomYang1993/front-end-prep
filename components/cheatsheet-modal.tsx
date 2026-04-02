'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { BookOpen, X } from 'lucide-react';
import styles from './cheatsheet-modal.module.css';

type CheatsheetType = 'js' | 'react';

interface CheatsheetModalProps {
  type?: CheatsheetType;
}

function JSCheatsheet() {
  return (
    <>
      <section>
        <h2 className={styles.sectionHeading}><code>typeof</code> Operator</h2>
        <blockquote className={styles.quoteBlock}>Good for testing primitive values, not good for reference types.</blockquote>
        <pre className={styles.codeBlock}><code>{`typeof 1           // "number"
typeof "s"         // "string"
typeof true        // "boolean"
typeof null        // "object" (famous bug!)
typeof undefined   // "undefined"
typeof Symbol()    // "symbol"
typeof {}          // "object"
typeof []          // "object"
typeof Date        // "function"`}</code></pre>
      </section>

      <section>
        <h2 className={styles.sectionHeading}>Equality & Coercion</h2>
        <blockquote className={styles.quoteBlock}>Always use <code>===</code> unless you intentionally want coercion.</blockquote>
        <pre className={styles.codeBlock}><code>{`0 == ""       // true  (coercion)
0 === ""      // false (strict)
null == undefined   // true
null === undefined  // false
NaN === NaN         // false — use Number.isNaN()`}</code></pre>
      </section>

      <section>
        <h2 className={styles.sectionHeading}>Array Methods</h2>
        <pre className={styles.codeBlock}><code>{`// Transform
arr.map(x => x * 2)         // new array
arr.filter(x => x > 0)      // new array
arr.reduce((acc, x) => acc + x, 0)

// Search
arr.find(x => x > 3)        // first match or undefined
arr.findIndex(x => x > 3)   // index or -1
arr.includes(val)            // boolean

// Mutate
arr.push(x) / arr.pop()
arr.unshift(x) / arr.shift()
arr.splice(i, count, ...items)
arr.sort((a, b) => a - b)   // in-place, returns arr`}</code></pre>
      </section>

      <section>
        <h2 className={styles.sectionHeading}>Closures & Scope</h2>
        <pre className={styles.codeBlock}><code>{`function counter() {
  let count = 0;
  return {
    inc: () => ++count,
    get: () => count,
  };
}

// Classic loop trap
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0); // 3, 3, 3
}
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0); // 0, 1, 2
}`}</code></pre>
      </section>

      <section>
        <h2 className={styles.sectionHeading}>Promises & Async</h2>
        <pre className={styles.codeBlock}><code>{`// Promise combinators
Promise.all([p1, p2])      // rejects on first failure
Promise.allSettled([p1,p2]) // always resolves
Promise.race([p1, p2])     // first to settle
Promise.any([p1, p2])      // first to fulfill

// async/await
async function fetchData() {
  try {
    const res = await fetch(url);
    return await res.json();
  } catch (err) {
    console.error(err);
  }
}`}</code></pre>
      </section>

      <section>
        <h2 className={styles.sectionHeading}>Destructuring & Spread</h2>
        <pre className={styles.codeBlock}><code>{`const { a, b, ...rest } = obj;
const [first, , third] = arr;
const merged = { ...obj1, ...obj2 };
const copy = [...arr1, ...arr2];

// Default values
const { x = 10, y = 20 } = {};
function fn({ name = "anon" } = {}) {}`}</code></pre>
      </section>
    </>
  );
}

function ReactCheatsheet() {
  return (
    <>
      <section>
        <h2 className={styles.sectionHeading}>Component Patterns</h2>
        <pre className={styles.codeBlock}><code>{`// Function component
function Card({ title, children }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

// Conditional rendering
{isLoading ? <Spinner /> : <Content />}
{error && <ErrorBanner msg={error} />}
{items.length > 0 && <List items={items} />}`}</code></pre>
      </section>

      <section>
        <h2 className={styles.sectionHeading}>Hooks</h2>
        <pre className={styles.codeBlock}><code>{`// State
const [count, setCount] = useState(0);
setCount(prev => prev + 1);  // functional update

// Side effects
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);  // cleanup
}, [dep]);  // runs when dep changes

// Refs (mutable box, no re-render)
const ref = useRef(null);
ref.current = someValue;

// Memoization
const expensive = useMemo(() => calc(a, b), [a, b]);
const handler = useCallback((e) => {}, [dep]);`}</code></pre>
      </section>

      <section>
        <h2 className={styles.sectionHeading}>Custom Hooks</h2>
        <blockquote className={styles.quoteBlock}>Extract reusable logic into <code>use*</code> functions. Must call hooks at the top level.</blockquote>
        <pre className={styles.codeBlock}><code>{`function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initial;
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(val));
  }, [key, val]);
  return [val, setVal];
}`}</code></pre>
      </section>

      <section>
        <h2 className={styles.sectionHeading}>Event Handling & Forms</h2>
        <pre className={styles.codeBlock}><code>{`function Form() {
  const [value, setValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit">Send</button>
    </form>
  );
}`}</code></pre>
      </section>

      <section>
        <h2 className={styles.sectionHeading}>Keys & Lists</h2>
        <blockquote className={styles.quoteBlock}>Keys must be stable, unique, and not array indices (when order can change).</blockquote>
        <pre className={styles.codeBlock}><code>{`// Good — stable unique id
{items.map(item => (
  <li key={item.id}>{item.name}</li>
))}

// Bad — index as key (breaks on reorder/delete)
{items.map((item, i) => (
  <li key={i}>{item.name}</li>
))}`}</code></pre>
      </section>

      <section>
        <h2 className={styles.sectionHeading}>Performance</h2>
        <pre className={styles.codeBlock}><code>{`// Prevent unnecessary re-renders
const MemoChild = React.memo(function Child({ data }) {
  return <div>{data}</div>;
});

// Lazy load heavy components
const HeavyChart = React.lazy(() => import('./Chart'));
<Suspense fallback={<Spinner />}>
  <HeavyChart />
</Suspense>`}</code></pre>
      </section>
    </>
  );
}

export function CheatsheetModal({ type = 'js' }: CheatsheetModalProps) {
  const title = type === 'react' ? 'React Cheatsheet' : 'JavaScript Cheatsheet';
  const btnTitle = type === 'react' ? 'React Cheatsheet' : 'JS Cheatsheet';

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="ide-sidenav-btn" title={btnTitle}>
          <BookOpen size={24} strokeWidth={1.5} />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content" style={{ maxWidth: '750px', width: '90vw', maxHeight: '85vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'nowrap', gap: '1rem' }}>
            <Dialog.Title style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Close" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', flexShrink: 0, padding: 0 }}>
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <div style={{ display: 'grid', gap: '1.25rem', lineHeight: 1.5 }}>
            {type === 'react' ? <ReactCheatsheet /> : <JSCheatsheet />}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
