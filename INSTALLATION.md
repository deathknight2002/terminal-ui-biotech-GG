# Installation Guide

## Quick Install

```bash
npm install @biotech-terminal/frontend-components
```

## Full Setup

### 1. Install the package

```bash
npm install @biotech-terminal/frontend-components
# or
yarn add @biotech-terminal/frontend-components
# or
pnpm add @biotech-terminal/frontend-components
```

### 2. Import styles in your main file

```tsx
// main.tsx or App.tsx
import '@biotech-terminal/frontend-components/styles';
```

### 3. Start using components

```tsx
import { Button, Panel, Metric } from '@biotech-terminal/frontend-components/terminal';

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
import { Button } from '@biotech-terminal/frontend-components/terminal';
import { Panel } from '@biotech-terminal/frontend-components/terminal';
```

Not recommended (imports everything):

```tsx
import * as TerminalUI from '@biotech-terminal/frontend-components'; // ❌ Large bundle
```

### TypeScript

Types are included automatically. No `@types` package needed.

```tsx
import type { ButtonProps, PanelProps } from '@biotech-terminal/frontend-components/terminal';

const MyButton: React.FC<ButtonProps> = (props) => {
  return <Button {...props} />;
};
```

## Usage with Different Frameworks

### Next.js 13+ (App Router)

```tsx
// app/layout.tsx
import '@biotech-terminal/frontend-components/styles';

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
import '@biotech-terminal/frontend-components/styles';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(<App />);
```

### Create React App

```tsx
// index.tsx
import '@biotech-terminal/frontend-components/styles';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
```

## Troubleshooting

### Styles not loading

Make sure you imported the CSS:

```tsx
import '@biotech-terminal/frontend-components/styles';
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
<link rel="stylesheet" href="https://unpkg.com/@biotech-terminal/frontend-components/dist/terminal-ui.css">
<script src="https://unpkg.com/@biotech-terminal/frontend-components/dist/terminal-ui.umd.cjs"></script>

<script>
  const { Button, Panel } = window.TerminalUI;
</script>
```

## GitHub Installation (Development)

```bash
npm install git+https://github.com/deathknight2002/terminal-ui-biotech-GG.git
```

Or clone and link locally:

```bash
git clone https://github.com/deathknight2002/terminal-ui-biotech-GG.git
cd terminal-ui-biotech-GG/frontend-components
npm install
npm run build
npm link

# In your project
npm link @biotech-terminal/frontend-components
```
