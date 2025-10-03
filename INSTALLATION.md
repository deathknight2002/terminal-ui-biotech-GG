# Installation Guide

## Quick Install

```bash
npm install @deaxu/terminal-ui
```

## Full Setup

### 1. Install the package

```bash
npm install @deaxu/terminal-ui
# or
yarn add @deaxu/terminal-ui
# or
pnpm add @deaxu/terminal-ui
```

### 2. Import styles in your main file

```tsx
// main.tsx or App.tsx
import '@deaxu/terminal-ui/styles';
```

### 3. Start using components

```tsx
import { Button, Panel, Metric } from '@deaxu/terminal-ui';

function App() {
  return (
    <Panel title="DASHBOARD" cornerBrackets>
      <Metric label="USERS" value={1234} trend="up" change={12.5} />
      <Button variant="primary">LAUNCH</Button>
    </Panel>
  );
}
```

## Advanced Setup

### With Custom Theme

```tsx
// index.html or App.tsx
<html data-theme="cyan" data-cvd="deuteranopia">
  <App />
</html>
```

### Tree-shaking (Recommended)

Import only what you need:

```tsx
import { Button } from '@deaxu/terminal-ui';
import { Panel } from '@deaxu/terminal-ui';
```

Not recommended (imports everything):

```tsx
import * as TerminalUI from '@deaxu/terminal-ui'; // ❌ Large bundle
```

### TypeScript

Types are included automatically. No `@types` package needed.

```tsx
import type { ButtonProps, PanelProps } from '@deaxu/terminal-ui';

const MyButton: React.FC<ButtonProps> = (props) => {
  return <Button {...props} />;
};
```

## Usage with Different Frameworks

### Next.js 13+ (App Router)

```tsx
// app/layout.tsx
import '@deaxu/terminal-ui/styles';

export default function RootLayout({ children }) {
  return (
    <html data-theme="cyan">
      <body>{children}</body>
    </html>
  );
}
```

### Vite

```tsx
// main.tsx
import '@deaxu/terminal-ui/styles';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(<App />);
```

### Create React App

```tsx
// index.tsx
import '@deaxu/terminal-ui/styles';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
```

## Troubleshooting

### Styles not loading

Make sure you imported the CSS:

```tsx
import '@deaxu/terminal-ui/styles';
```

### TypeScript errors

Ensure you have React 18+ types:

```bash
npm install --save-dev @types/react @types/react-dom
```

### Components not rendering

Check that you're using React 18+:

```bash
npm install react@^18.0.0 react-dom@^18.0.0
```

## CDN Usage (Not Recommended for Production)

```html
<link rel="stylesheet" href="https://unpkg.com/@deaxu/terminal-ui/dist/terminal-ui.css">
<script src="https://unpkg.com/@deaxu/terminal-ui/dist/terminal-ui.umd.cjs"></script>

<script>
  const { Button, Panel } = window.TerminalUI;
</script>
```

## GitHub Installation (Development)

```bash
npm install git+https://github.com/deaxu/terminal-ui.git
```

Or clone and link locally:

```bash
git clone https://github.com/deaxu/terminal-ui.git
cd terminal-ui
npm install
npm run build
npm link

# In your project
npm link @deaxu/terminal-ui
```
