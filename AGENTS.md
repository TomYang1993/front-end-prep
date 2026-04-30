# Project Conventions

## CSS & Styling

- **Tailwind CSS is the default** for all styling. Use utility classes inline on elements.
- Only use custom CSS classes in `globals.css` for:
  - `@keyframes` animations
  - Pseudo-element tricks (`:before`, `:after`)
  - Complex selectors (`:nth-child`, `:has`)
  - Third-party component overrides (Monaco Editor, Sandpack)

### Sharing repeated styles — pick the right tool:

1. **`const` in component file** — for a short class string repeated 2-3 times *within the same file*. Don't export or share across files.
2. **Extract a component** — when the same styles + structure repeat across files, make a `<Button>`, `<Badge>`, `<SelectDropdown>`, etc. This is the default choice for cross-file reuse.
3. **`@apply` in CSS** — last resort for truly global, structure-free patterns (e.g. a `.prose` style) where a component doesn't make sense. Keep these rare.

### Conditional classes

Use `clsx()` or a `cn()` helper for conditional class merging:
```ts
import clsx from 'clsx';
className={clsx('base-classes', isActive && 'active-classes')}
```
