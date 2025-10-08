import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@deaxu/terminal-ui': path.resolve(__dirname, '../frontend-components/src/index.ts'),
      '@deaxu/terminal-ui/styles': path.resolve(__dirname, '../frontend-components/src/styles/index.ts'),
    },
  },
});
