# Contributing to Terminal UI

Thank you for considering contributing to Terminal UI!

## Development Setup

1. **Fork and clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/terminal-ui.git
cd terminal-ui
```

2. **Install dependencies**

```bash
npm install
```

3. **Run the demo**

```bash
npm run demo
```

This starts the development server at `http://localhost:5173`

## Project Structure

```
terminal-ui/
├── src/
│   ├── components/       # Component source code
│   │   ├── atoms/        # Basic components
│   │   ├── molecules/    # Composite components
│   │   └── organisms/    # Complex components
│   ├── visualizations/   # Chart components
│   ├── styles/           # Global styles & CSS variables
│   ├── types/            # TypeScript type definitions
│   └── index.ts          # Main export file
├── examples/             # Demo application
├── dist/                 # Build output (git-ignored)
└── package.json
```

## Making Changes

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Follow existing code style
- Use TypeScript for all components
- Add JSDoc comments for props
- Use CSS Modules for styling
- Follow atomic design principles

### 3. Test Your Changes

```bash
# Run tests
npm test

# Check types
npm run build

# Lint code
npm run lint
```

### 4. Update Documentation

- Update README.md if adding new components
- Add JSDoc comments to new props
- Update examples/ if needed

## Component Guidelines

### File Structure

```tsx
// Button.tsx
import React from 'react';
import clsx from 'clsx';
import styles from './Button.module.css';

export interface ButtonProps {
  /** Button label */
  children: React.ReactNode;
  /** Visual variant */
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
}) => {
  return (
    <button className={clsx(styles.button, styles[variant])}>
      {children}
    </button>
  );
};
```

### CSS Modules

```css
/* Button.module.css */
.button {
  font-family: var(--font-mono);
  padding: var(--space-3);
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.primary {
  background: var(--accent-primary);
}
```

### Export Pattern

```ts
// index.ts
export { Button } from './Button';
export type { ButtonProps } from './Button';
```

## Design System Rules

1. **Use CSS Variables**: Never hardcode colors or spacing
2. **Monospace Fonts**: All text uses `var(--font-mono)`
3. **4px Grid**: All spacing must be multiples of 4px
4. **High Contrast**: Maintain WCAG AAA (7:1) contrast ratios
5. **Terminal Aesthetic**: Sharp edges, minimal decoration

## Color Variables

```css
/* Always use these variables */
--accent-primary
--text-primary
--text-secondary
--bg-primary
--bg-secondary
--status-success
--status-error
--status-warning
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm test -- --watch
```

## Commit Messages

Follow conventional commits:

```
feat: add Tooltip component
fix: correct Button disabled state
docs: update README with new examples
style: format code with prettier
refactor: simplify DataTable logic
test: add tests for Modal component
chore: update dependencies
```

## Pull Request Process

1. Update README.md with component details
2. Add examples to `examples/App.tsx`
3. Ensure all tests pass
4. Update CHANGELOG.md (if exists)
5. Request review from maintainers

## Code Review Checklist

- [ ] Code follows existing style
- [ ] TypeScript types are complete
- [ ] CSS uses design system variables
- [ ] Component is accessible (ARIA labels, keyboard nav)
- [ ] JSDoc comments added
- [ ] Tests added/updated
- [ ] Examples added to demo
- [ ] No console.log() statements
- [ ] Build succeeds (`npm run build`)

## Questions?

Open an issue or discussion on GitHub!

## License

By contributing, you agree that your contributions will be licensed under MIT License.
