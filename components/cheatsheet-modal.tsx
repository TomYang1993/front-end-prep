'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { BookOpen, X } from 'lucide-react';
import type { ReactNode } from 'react';

type CheatsheetType = 'js' | 'react' | 'python';

interface CheatsheetModalProps {
  type?: CheatsheetType;
}

function Section({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base mb-2 border-b border-line pb-2 font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Quote({ children }: { children: ReactNode }) {
  return (
    <blockquote className="border-l-[3px] border-brand pl-4 mb-3 text-muted italic text-[0.88rem]">
      {children}
    </blockquote>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-[#0f172a] text-[#f8fafc] p-3 rounded-sm overflow-x-auto text-[12px]">
      <code>{children}</code>
    </pre>
  );
}

function JSCheatsheet() {
  return (
    <>
      <Section title={<><code>typeof</code> Operator</>}>
        <Quote>Good for testing primitive values, not good for reference types.</Quote>
        <CodeBlock>{`typeof 1           // "number"
typeof "s"         // "string"
typeof true        // "boolean"
typeof null        // "object" (famous bug!)
typeof undefined   // "undefined"
typeof Symbol()    // "symbol"
typeof {}          // "object"
typeof []          // "object"
typeof Date        // "function"`}</CodeBlock>
      </Section>

      <Section title="Equality & Coercion">
        <Quote>Always use <code>===</code> unless you intentionally want coercion.</Quote>
        <CodeBlock>{`0 == ""       // true  (coercion)
0 === ""      // false (strict)
null == undefined   // true
null === undefined  // false
NaN === NaN         // false — use Number.isNaN()`}</CodeBlock>
      </Section>

      <Section title="Array Methods">
        <CodeBlock>{`// Transform
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
arr.sort((a, b) => a - b)   // in-place, returns arr`}</CodeBlock>
      </Section>

      <Section title="Closures & Scope">
        <CodeBlock>{`function counter() {
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
}`}</CodeBlock>
      </Section>

      <Section title="Promises & Async">
        <CodeBlock>{`// Promise combinators
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
}`}</CodeBlock>
      </Section>

      <Section title="Destructuring & Spread">
        <CodeBlock>{`const { a, b, ...rest } = obj;
const [first, , third] = arr;
const merged = { ...obj1, ...obj2 };
const copy = [...arr1, ...arr2];

// Default values
const { x = 10, y = 20 } = {};
function fn({ name = "anon" } = {}) {}`}</CodeBlock>
      </Section>
    </>
  );
}

function ReactCheatsheet() {
  return (
    <>
      <Section title="Component Patterns">
        <CodeBlock>{`// Function component
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
{items.length > 0 && <List items={items} />}`}</CodeBlock>
      </Section>

      <Section title="Hooks">
        <CodeBlock>{`// State
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
const handler = useCallback((e) => {}, [dep]);`}</CodeBlock>
      </Section>

      <Section title="Custom Hooks">
        <Quote>Extract reusable logic into <code>use*</code> functions. Must call hooks at the top level.</Quote>
        <CodeBlock>{`function useDebounce(value, delay) {
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
}`}</CodeBlock>
      </Section>

      <Section title="Event Handling & Forms">
        <CodeBlock>{`function Form() {
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
}`}</CodeBlock>
      </Section>

      <Section title="Keys & Lists">
        <Quote>Keys must be stable, unique, and not array indices (when order can change).</Quote>
        <CodeBlock>{`// Good — stable unique id
{items.map(item => (
  <li key={item.id}>{item.name}</li>
))}

// Bad — index as key (breaks on reorder/delete)
{items.map((item, i) => (
  <li key={i}>{item.name}</li>
))}`}</CodeBlock>
      </Section>

      <Section title="Performance">
        <CodeBlock>{`// Prevent unnecessary re-renders
const MemoChild = React.memo(function Child({ data }) {
  return <div>{data}</div>;
});

// Lazy load heavy components
const HeavyChart = React.lazy(() => import('./Chart'));
<Suspense fallback={<Spinner />}>
  <HeavyChart />
</Suspense>`}</CodeBlock>
      </Section>
    </>
  );
}

function PythonCheatsheet() {
  return (
    <>
      <Section title="Data Structures">
        <CodeBlock>{`# Lists
nums = [1, 2, 3]
nums.append(4)          # [1, 2, 3, 4]
nums.pop()              # removes last
nums.insert(0, 0)       # insert at index

# Dictionaries
d = {"a": 1, "b": 2}
d.get("c", 0)           # default value
d.keys(), d.values(), d.items()

# Sets
s = {1, 2, 3}
s.add(4)
s.discard(2)            # no error if missing
s1 & s2                 # intersection
s1 | s2                 # union

# Deque (double-ended queue)
from collections import deque
q = deque([1, 2, 3])
q.appendleft(0)
q.popleft()

# DefaultDict
from collections import defaultdict
dd = defaultdict(list)
dd["key"].append("val")`}</CodeBlock>
      </Section>

      <Section title="Common Patterns">
        <CodeBlock>{`# List comprehension
squares = [x**2 for x in range(10)]
evens = [x for x in nums if x % 2 == 0]

# Dictionary comprehension
freq = {ch: s.count(ch) for ch in set(s)}

# Sorting
sorted(nums)                       # returns new list
nums.sort(key=lambda x: -x)       # in-place, descending
sorted(pairs, key=lambda p: p[1]) # sort by second element

# Enumerate & Zip
for i, val in enumerate(nums):
    print(i, val)

for a, b in zip(list1, list2):
    print(a, b)

# Unpacking
first, *rest = [1, 2, 3, 4]   # first=1, rest=[2,3,4]`}</CodeBlock>
      </Section>

      <Section title="String Operations">
        <CodeBlock>{`s = "hello world"
s.split()              # ["hello", "world"]
" ".join(["a", "b"])   # "a b"
s.strip()              # remove whitespace
s.replace("l", "r")    # "herro worrd"
s[::-1]                # reverse: "dlrow olleh"
s.startswith("he")     # True
s.isdigit()            # False
f"value is {x:.2f}"    # f-string formatting`}</CodeBlock>
      </Section>

      <Section title="Classes & OOP">
        <CodeBlock>{`class BankAccount:
    def __init__(self, owner: str, balance: float = 0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount: float):
        self.balance += amount
        return self.balance

    def withdraw(self, amount: float):
        if amount > self.balance:
            raise ValueError("Insufficient funds")
        self.balance -= amount
        return self.balance

    def __repr__(self):
        return f"BankAccount({self.owner}, {self.balance})"

# Inheritance
class SavingsAccount(BankAccount):
    def __init__(self, owner, balance=0, rate=0.02):
        super().__init__(owner, balance)
        self.rate = rate

    def add_interest(self):
        self.balance *= (1 + self.rate)`}</CodeBlock>
      </Section>
    </>
  );
}

const META: Record<CheatsheetType, { title: string; btnTitle: string; render: () => ReactNode }> = {
  js:     { title: 'JavaScript Cheatsheet', btnTitle: 'JS Cheatsheet',     render: () => <JSCheatsheet /> },
  react:  { title: 'React Cheatsheet',      btnTitle: 'React Cheatsheet',  render: () => <ReactCheatsheet /> },
  python: { title: 'Python Cheatsheet',     btnTitle: 'Python Cheatsheet', render: () => <PythonCheatsheet /> },
};

export function CheatsheetModal({ type = 'js' }: CheatsheetModalProps) {
  const meta = META[type];

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="ide-sidenav-btn" title={meta.btnTitle}>
          <BookOpen size={24} strokeWidth={1.5} />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content max-w-[750px] w-[90vw] max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4 flex-nowrap gap-4">
            <Dialog.Title className="text-[1.15rem] font-semibold m-0">{meta.title}</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Close" className="bg-transparent border-none cursor-pointer text-muted shrink-0 p-0 hover:text-ink transition-colors">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <div className="grid gap-5 leading-relaxed">{meta.render()}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
