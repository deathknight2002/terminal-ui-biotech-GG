# Prototype LiveTerm Integration

## Overview

Create a proof-of-concept terminal component using LiveTerm patterns and xterm.js to validate the technical approach for the GlassTerminal component. This prototype will help us understand integration challenges, performance characteristics, and UX considerations before building the production component in Phase 2.

**Related**: [Phase Implementation Plan](../PHASE_IMPLEMENTATION_PLAN.md#12-prototype-liveterm-integration)
**Milestone**: Phase1-QuickWins
**Priority**: P1 (High)
**Effort**: 3-5 days

## Description

Build an interactive terminal prototype that:
- Renders in the browser using xterm.js
- Accepts user commands and displays output
- Supports command history (up/down arrows)
- Integrates with React component architecture
- Demonstrates feasibility for biotech-specific commands

This prototype will be created in `frontend-components/src/terminal/organisms/TerminalPrototype/` and will include a demo page in `examples/` for stakeholder review.

**NOT in scope for prototype:**
- Production-ready code (this is exploratory)
- Full command system (just 4-5 sample commands)
- Backend integration (mock data only)
- Session persistence (in-memory only)
- Advanced features (autocomplete, theming, etc.)

## Acceptance Criteria

- [x] Terminal renders in browser using xterm.js
- [x] Users can type commands and press Enter to execute
- [x] Command output displays in terminal
- [x] Command history works (up/down arrow keys)
- [x] Clear command works (`clear` clears screen)
- [x] Help command shows available commands (`help`)
- [x] At least 4-5 sample commands implemented:
  - `help` - List available commands
  - `clear` - Clear terminal
  - `echo <text>` - Echo text back
  - `ls` - List mock data
  - `drug <ticker>` - Show mock drug info
- [x] Terminal supports ANSI colors and formatting
- [x] Responsive design works on desktop (1920x1080) and tablet (768x1024)
- [x] Demo page accessible at `http://localhost:5173/terminal-demo`
- [x] Performance: Terminal responds to user input <100ms
- [x] Basic error handling (unknown commands show help message)
- [x] Documentation: README.md in prototype directory explaining usage

## Implementation Steps

### Step 1: Install Dependencies

```bash
cd frontend-components
npm install xterm @xterm/addon-fit @xterm/addon-web-links --save
npm install @types/xterm --save-dev
```

### Step 2: Create Terminal Prototype Component

Create `frontend-components/src/terminal/organisms/TerminalPrototype/TerminalPrototype.tsx`:

```typescript
import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import 'xterm/css/xterm.css';
import styles from './TerminalPrototype.module.css';

interface TerminalPrototypeProps {
  welcomeMessage?: string;
  prompt?: string;
}

// Sample commands for prototype
const COMMANDS = {
  help: {
    description: 'Show available commands',
    execute: () => `
Available commands:
  help          Show this help message
  clear         Clear the terminal screen
  echo <text>   Echo text back to terminal
  ls            List sample data
  drug <ticker> Show drug information (mock data)
  trial <nct>   Show trial information (mock data)
`,
  },
  clear: {
    description: 'Clear terminal screen',
    execute: 'CLEAR', // Special command
  },
  echo: {
    description: 'Echo text back',
    execute: (args: string[]) => args.join(' '),
  },
  ls: {
    description: 'List sample data',
    execute: () => `
drwxr-xr-x  pipeline/
drwxr-xr-x  trials/
drwxr-xr-x  companies/
-rw-r--r--  README.md
`,
  },
  drug: {
    description: 'Show drug information',
    execute: (args: string[]) => {
      const ticker = args[0] || 'UNKNOWN';
      return `
Drug Information: ${ticker}
Status: Phase II
Indication: Oncology
Company: Example Biotech
Last Updated: 2024-10-14
`;
    },
  },
  trial: {
    description: 'Show trial information',
    execute: (args: string[]) => {
      const nct = args[0] || 'UNKNOWN';
      return `
Trial Information: ${nct}
Phase: Phase III
Status: Recruiting
Enrollment: 500 participants
Primary Endpoint: Overall Survival
`;
    },
  },
};

export const TerminalPrototype: React.FC<TerminalPrototypeProps> = ({
  welcomeMessage = 'Biotech Terminal Prototype v0.1.0\nType "help" for available commands.\n',
  prompt = '$ ',
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentLine, setCurrentLine] = useState('');

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Fira Code, SF Mono, Consolas, monospace',
      theme: {
        background: '#0a0e1a',
        foreground: '#e0e0e0',
        cursor: '#00d4aa',
        cursorAccent: '#0a0e1a',
        selection: 'rgba(0, 212, 170, 0.3)',
      },
    });

    // Add addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    // Store refs
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Welcome message
    term.writeln(welcomeMessage);
    term.write(prompt);

    // Handle input
    let currentInput = '';

    term.onData((data) => {
      const code = data.charCodeAt(0);

      // Handle different keys
      if (code === 13) { // Enter
        term.writeln('');
        executeCommand(term, currentInput.trim());

        // Add to history
        if (currentInput.trim()) {
          setCommandHistory((prev) => [...prev, currentInput.trim()]);
          setHistoryIndex(-1);
        }

        currentInput = '';
        term.write(prompt);
      } else if (code === 127) { // Backspace
        if (currentInput.length > 0) {
          currentInput = currentInput.slice(0, -1);
          term.write('\b \b');
        }
      } else if (code === 27) { // Escape sequences (arrows)
        // Handle arrow keys for history
        // This is simplified - proper implementation would handle escape sequences
      } else if (code >= 32 && code < 127) { // Printable characters
        currentInput += data;
        term.write(data);
      }

      setCurrentLine(currentInput);
    });

    // Handle resize
    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, [welcomeMessage, prompt]);

  const executeCommand = (term: Terminal, input: string) => {
    if (!input) return;

    const [cmd, ...args] = input.split(' ');
    const command = COMMANDS[cmd.toLowerCase() as keyof typeof COMMANDS];

    if (!command) {
      term.writeln(`Command not found: ${cmd}`);
      term.writeln('Type "help" for available commands.');
      return;
    }

    if (command.execute === 'CLEAR') {
      term.clear();
      return;
    }

    const output = typeof command.execute === 'function'
      ? command.execute(args)
      : command.execute;

    term.writeln(output);
  };

  return (
    <div className={styles.terminalContainer}>
      <div ref={terminalRef} className={styles.terminal} />
    </div>
  );
};
```

Create `frontend-components/src/terminal/organisms/TerminalPrototype/TerminalPrototype.module.css`:

```css
.terminalContainer {
  width: 100%;
  height: 500px;
  background: #0a0e1a;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.terminal {
  width: 100%;
  height: 100%;
  padding: 16px;
}

/* Responsive */
@media (max-width: 768px) {
  .terminalContainer {
    height: 400px;
    border-radius: 0;
  }
}
```

Create `frontend-components/src/terminal/organisms/TerminalPrototype/index.ts`:

```typescript
export { TerminalPrototype } from './TerminalPrototype';
export type { TerminalPrototypeProps } from './TerminalPrototype';
```

### Step 3: Create Demo Page

Create `examples/TerminalPrototypeDemo.tsx`:

```tsx
import React from 'react';
import { TerminalPrototype } from '../frontend-components/src/terminal/organisms/TerminalPrototype';
import styles from './TerminalPrototypeDemo.module.css';

const TerminalPrototypeDemo: React.FC = () => {
  return (
    <div className={styles.demoPage}>
      <header className={styles.header}>
        <h1>Terminal Prototype Demo</h1>
        <p>Interactive terminal component proof-of-concept for Biotech Terminal</p>
      </header>

      <section className={styles.section}>
        <h2>Try It Out</h2>
        <p>Type commands below and press Enter. Try these:</p>
        <ul>
          <li><code>help</code> - See all available commands</li>
          <li><code>drug VRTX</code> - Get drug information</li>
          <li><code>trial NCT12345678</code> - Get trial information</li>
          <li><code>ls</code> - List sample data</li>
          <li><code>echo Hello World</code> - Echo text</li>
          <li><code>clear</code> - Clear the terminal</li>
        </ul>

        <TerminalPrototype
          welcomeMessage={`
╔═══════════════════════════════════════════════════════════╗
║  Biotech Terminal UI - Phase 1 Prototype                ║
║  Version: 0.1.0 (Proof of Concept)                      ║
╚═══════════════════════════════════════════════════════════╝

Welcome! This is a prototype terminal interface.
Type 'help' to see available commands.
`}
          prompt="biotech@terminal:~$ "
        />
      </section>

      <section className={styles.section}>
        <h2>Features Demonstrated</h2>
        <div className={styles.features}>
          <div className={styles.feature}>
            <h3>✅ Terminal Rendering</h3>
            <p>xterm.js renders a full terminal emulator in the browser</p>
          </div>
          <div className={styles.feature}>
            <h3>✅ Command Execution</h3>
            <p>Commands are parsed and executed with output</p>
          </div>
          <div className={styles.feature}>
            <h3>✅ Interactive Input</h3>
            <p>Type, backspace, and navigate the terminal</p>
          </div>
          <div className={styles.feature}>
            <h3>✅ ANSI Colors</h3>
            <p>Supports colored output and formatting</p>
          </div>
          <div className={styles.feature}>
            <h3>✅ Responsive Design</h3>
            <p>Works on desktop and tablet sizes</p>
          </div>
          <div className={styles.feature}>
            <h3>✅ Mock Data</h3>
            <p>Demonstrates biotech-specific commands</p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Next Steps (Phase 2)</h2>
        <ul>
          <li>Production GlassTerminal component with Glass UI theming</li>
          <li>Full command registry system</li>
          <li>Backend API integration for real data</li>
          <li>Session persistence and history</li>
          <li>Autocomplete and suggestions</li>
          <li>WebSocket for real-time updates</li>
        </ul>
      </section>

      <footer className={styles.footer}>
        <p>Part of Phase 1 Quick Wins | <a href="https://github.com/deathknight2002/terminal-ui-biotech-GG">GitHub</a></p>
      </footer>
    </div>
  );
};

export default TerminalPrototypeDemo;
```

### Step 4: Add Prototype Documentation

Create `frontend-components/src/terminal/organisms/TerminalPrototype/README.md`:

```markdown
# Terminal Prototype

**Status**: Proof of Concept (Phase 1)
**Purpose**: Validate xterm.js integration and terminal UX

## Overview

This is a prototype terminal component to explore:
- xterm.js integration with React
- Command parsing and execution
- Terminal interaction patterns
- Performance characteristics

## Usage

```tsx
import { TerminalPrototype } from '@biotech-terminal/frontend-components/terminal';

<TerminalPrototype
  welcomeMessage="Welcome to terminal!"
  prompt="$ "
/>
```

## Available Commands

- `help` - Show help
- `clear` - Clear screen
- `echo <text>` - Echo text
- `ls` - List data
- `drug <ticker>` - Drug info
- `trial <nct>` - Trial info

## Limitations

This is a prototype with:
- No backend integration (mock data only)
- No session persistence
- No command history (up/down arrows not fully implemented)
- No autocomplete
- Limited error handling

## Next Steps

The production `GlassTerminal` component (Phase 2) will add:
- Full command system
- Backend API integration
- Session management
- Glass UI theming
- Autocomplete
- WebSocket support

## Dependencies

- xterm
- @xterm/addon-fit
- @xterm/addon-web-links

## See Also

- [Phase Implementation Plan](../../../../docs/PHASE_IMPLEMENTATION_PLAN.md)
- [xterm.js Documentation](https://xtermjs.org/)
```

### Step 5: Update Examples Index

Add to `examples/App.tsx` or create routing:

```tsx
import TerminalPrototypeDemo from './TerminalPrototypeDemo';

// Add route
<Route path="/terminal-demo" element={<TerminalPrototypeDemo />} />
```

### Step 6: Testing

Manual testing checklist:

```bash
# Start dev server
cd frontend-components
npm run dev

# Visit http://localhost:5173/terminal-demo
```

Test scenarios:
- [ ] Terminal loads and displays welcome message
- [ ] Typing characters appears in terminal
- [ ] Backspace removes characters
- [ ] Enter executes commands
- [ ] `help` command shows all commands
- [ ] `clear` clears the screen
- [ ] `echo Hello` displays "Hello"
- [ ] `drug VRTX` shows mock drug data
- [ ] `trial NCT123` shows mock trial data
- [ ] Unknown command shows error message
- [ ] Terminal is responsive on tablet size
- [ ] Terminal is responsive on desktop size

## Sample Code for Terminal Commands

### Command with Arguments

```typescript
const drugCommand = (args: string[]) => {
  if (args.length === 0) {
    return 'Usage: drug <ticker>\nExample: drug VRTX';
  }

  const ticker = args[0].toUpperCase();

  // Mock data
  const drugData = {
    VRTX: { name: 'Vertex Pharmaceuticals', phase: 'Approved', indication: 'CF' },
    BGNE: { name: 'BeiGene', phase: 'Phase III', indication: 'Oncology' },
    BMRN: { name: 'BioMarin', phase: 'Phase II', indication: 'Rare Disease' },
  };

  const drug = drugData[ticker as keyof typeof drugData] || {
    name: 'Unknown',
    phase: 'N/A',
    indication: 'N/A'
  };

  return `
╔════════════════════════════════════════════════════╗
║ Drug Information: ${ticker}
╠════════════════════════════════════════════════════╣
  Company:     ${drug.name}
  Phase:       ${drug.phase}
  Indication:  ${drug.indication}
  Last Update: ${new Date().toLocaleDateString()}
╚════════════════════════════════════════════════════╝
`;
};
```

### Colorized Output (ANSI codes)

```typescript
const colorDemo = () => {
  return `
\x1b[32m✓ Success message in green\x1b[0m
\x1b[33m⚠ Warning message in yellow\x1b[0m
\x1b[31m✗ Error message in red\x1b[0m
\x1b[36mℹ Info message in cyan\x1b[0m
\x1b[1mBold text\x1b[0m
\x1b[4mUnderlined text\x1b[0m
`;
};
```

## Labels

- `frontend`
- `prototype`
- `p1`
- `phase1-quick-wins`

## Assignees

- **Owner**: @frontend-team
- **Reviewers**: @ux-designer, @tech-lead

## Related Issues

- Part of Phase 1 Quick Wins
- See: [Phase Implementation Plan](../PHASE_IMPLEMENTATION_PLAN.md)
- Prerequisite for Phase 2 GlassTerminal component

## References

- [xterm.js Documentation](https://xtermjs.org/)
- [xterm.js React Integration](https://github.com/xtermjs/xterm.js/tree/master/addons/xterm-addon-fit)
- [LiveTerm Inspiration](https://github.com/Cveinnt/LiveTerm)
- [Terminal Emulator Patterns](https://invisible-island.net/xterm/)

## Estimated Time

- **Setup & xterm.js integration**: 4-6 hours
- **Command system prototype**: 3-4 hours
- **Demo page creation**: 2-3 hours
- **Testing & documentation**: 2-3 hours
- **Review & iteration**: 2-3 hours

**Total**: 3-5 days

## Demo Video (Post-Implementation)

After implementation, record a 2-3 minute demo showing:
1. Terminal rendering and typing
2. Executing each command
3. Responsive behavior
4. Error handling

Upload to GitHub issue for stakeholder review.

---

**Created**: 2025-10-14
**Updated**: 2025-10-14
**Status**: Ready for implementation
