import { QuestionType, Difficulty, AccessTier } from '@prisma/client';
import type { SeedQuestion } from '../types';

export const classHierarchy: SeedQuestion = {
  slug: 'class-hierarchy',
  title: 'Implement Class Hierarchy',
  prompt: `The starter code provides broken \`Animal\` and \`Mammal\` classes. Fix the broken classes and implement a \`Human\` class.

\`Human\` should inherit from \`Mammal\`.
\`Human\` extends \`Mammal\` with an additional languageSpoken property.
It should have a \`speak()\` method that returns a string which includes languageSpoken info.

### Example

\`\`\`js
const m = new Mammal(10, "black");
m.age;      // 10 (inherited from Animal)
m.furColor; // "black"
m.move();   // "move" (inherited from Animal)

const h = new Human(25, "English");
h.age;      // 25 (inherited through Mammal → Animal)
h.speak();  // "speaking English"
h.move();   // "move"
h.lifeBirth(); // "lifeBirth"
\`\`\`

> [!note] Note (JavaScript only)
> Remember to add a \`new\` keyword check in each constructor function. Without it, calling \`Human(25, "English")\` without \`new\` silently attaches properties to the global object instead of creating a new instance. TypeScript classes handle this automatically.

> [!tip] Interview Tip
> This question is typically asked in vanilla JavaScript not in Typescript. It tests your understanding of core concepts, detailed syntax, and JavaScript-specific inheritance mechanics.
>
> It's rarely required to write this in real interviews, maybe only asked to explain verbally — this is to help you understand the behind-the-scenes of JS inheritance.
`,
  description: 'Fix broken inheritance and implement a new Human class',
  type: QuestionType.FUNCTION_JS,
  difficulty: Difficulty.MEDIUM,
  accessTier: AccessTier.FREE,
  tags: ['prototypes', 'inheritance', 'oop'],
  timeLimitMinutes: 20,
  starterCode: {
    javascript: `function Animal(age) {
  this.age = age;
}

Animal.prototype.move = function move() {
  return 'move';
};

function Mammal(age, furColor) {
  this.furColor = furColor;
}

Mammal.prototype.lifeBirth = function lifeBirth() {
  return 'lifeBirth';
};

// Implement Human below.
`,
    typescript: `class Animal {
  age: number;

  constructor(age: number) {
    this.age = age;
  }

  move(): string {
    return 'move';
  }
}

class Mammal extends Animal {
  furColor: string;

  constructor(age: number, furColor: string) {
    this.furColor = furColor;
  }

  lifeBirth(): string {
    return 'lifeBirth';
  }
}

// Implement Human below.
`,
  },
  publicTestCode: `test('Mammal class properly inherits from Animal class', () => {
  const m = new Mammal(10, "black");
  expect(m.age).toBe(10);
  expect(m.furColor).toBe("black");
  expect(m.move()).toBe("move");
});

test('Human class creates a human instance', () => {
  const h = new Human(25, "English");
  expect(h.age).toBe(25);
  expect(h.languageSpoken).toBe("English");
});

test('Human instance calls parent methods', () => {
  const h = new Human(25, "English");
  expect(h.move()).toBe("move");
  expect(h.lifeBirth()).toBe("lifeBirth");
  expect(h.speak()).toBe("speaking English");
});
`,
  hiddenTestCode: `test('Mammal instance passes instanceof check for Animal', () => {
  const m = new Mammal(10, "black");
  expect(m instanceof Mammal).toBe(true);
  expect(m instanceof Animal).toBe(true);
});

test('Human instance passes instanceof check for all ancestors', () => {
  const h = new Human(25, "English");
  expect(h instanceof Human).toBe(true);
  expect(h instanceof Mammal).toBe(true);
  expect(h instanceof Animal).toBe(true);
});

test('Human() without new keyword throws an error', () => {
  let humanError = null;
  try { Human(25, "English"); } catch(e) { humanError = e; }
  expect(humanError instanceof Error).toBe(true);
});

test('Human instance clones correctly via new obj.constructor()', () => {
  const original = new Human(25, "English");
  const cloned = new original.constructor(30, "Spanish");
  expect(cloned instanceof Human).toBe(true);
  expect(cloned.age).toBe(30);
  expect(cloned.speak()).toBe("speaking Spanish");
});

test('Multiple instances do not share state', () => {
  const h1 = new Human(20, "English");
  const h2 = new Human(30, "Spanish");
  expect(h1.age).toBe(20);
  expect(h2.age).toBe(30);
  expect(h1.speak()).toBe("speaking English");
  expect(h2.speak()).toBe("speaking Spanish");
});

test('Prototype methods do not leak across inheritance levels', () => {
  const animals = [new Animal(5), new Mammal(10, "black"), new Human(25, "English")];
  const canLifeBirth = animals.filter(a => typeof a.lifeBirth === "function");
  const canSpeak = animals.filter(a => typeof a.speak === "function");
  expect(canLifeBirth.length).toBe(2);
  expect(canSpeak.length).toBe(1);
});`,
  solutions: [
    {
      language: 'javascript',
      explanation: `## What's broken

\`Mammal\` doesn't call \`Animal.call(this, age)\` so the \`age\` property is never set. Its prototype also isn't linked to \`Animal.prototype\`, so inherited methods like \`move()\` are missing.

## Three fixes needed for Mammal

1. \`Animal.call(this, age)\` inside the constructor — propagate parent properties
2. \`Mammal.prototype = Object.create(Animal.prototype)\` — link the prototype chain
3. \`Mammal.prototype.constructor = Mammal\` — restore the constructor reference

## Implementing Human

\`Human\` follows the same pattern inheriting from \`Mammal\`:
- Call \`Mammal.call(this, age)\` to inherit age and furColor setup
- Set \`Human.prototype = Object.create(Mammal.prototype)\` for the prototype chain
- Restore \`Human.prototype.constructor = Human\`
- Add \`languageSpoken\` property and \`speak()\` method

## \`new\` keyword guard

Add an \`instanceof\` check at the top of each constructor. Without \`new\`, \`this\` points to the global object and properties leak into global scope. The guard throws a clear error instead:

\`\`\`js
if (!(this instanceof Animal)) {
  throw new TypeError("Cannot be invoked without 'new'");
}
\`\`\``,
      code: `function Animal(age) {
  if (!(this instanceof Animal)) {
    throw new TypeError("Class constructor Animal cannot be invoked without 'new'");
  }
  this.age = age;
}

Animal.prototype.move = function move() {
  return 'move';
};

function Mammal(age, furColor) {
  if (!(this instanceof Mammal)) {
    throw new TypeError("Class constructor Mammal cannot be invoked without 'new'");
  }
  Animal.call(this, age);
  this.furColor = furColor;
}

Mammal.prototype = Object.create(Animal.prototype);
Mammal.prototype.constructor = Mammal;
Mammal.prototype.lifeBirth = function lifeBirth() {
  return 'lifeBirth';
};

function Human(age, languageSpoken) {
  if (!(this instanceof Human)) {
    throw new TypeError("Class constructor Human cannot be invoked without 'new'");
  }
  Mammal.call(this, age);
  this.languageSpoken = languageSpoken;
}

Human.prototype = Object.create(Mammal.prototype);
Human.prototype.constructor = Human;

Human.prototype.speak = function speak() {
  return 'speaking ' + this.languageSpoken;
};`,
    },
    {
      language: 'typescript',
      explanation: `## What's broken

\`Mammal\`'s constructor is missing \`super(age)\`, so the parent \`Animal\` constructor never runs and \`age\` is never set.

## Fix

Add \`super(age)\` as the first line in \`Mammal\`'s constructor.

## Implementing Human

Extend \`Mammal\`, call \`super(age, '')\` (passing empty string for furColor since humans don't need it), add \`languageSpoken\` property and \`speak()\` method.`,
      code: `class Animal {
  age: number;

  constructor(age: number) {
    this.age = age;
  }

  move(): string {
    return 'move';
  }
}

class Mammal extends Animal {
  furColor: string;

  constructor(age: number, furColor: string) {
    super(age);
    this.furColor = furColor;
  }

  lifeBirth(): string {
    return 'lifeBirth';
  }
}

class Human extends Mammal {
  languageSpoken: string;

  constructor(age: number, languageSpoken: string) {
    super(age, '');
    this.languageSpoken = languageSpoken;
  }

  speak(): string {
    return 'speaking ' + this.languageSpoken;
  }
}`,
    },
  ],
};
