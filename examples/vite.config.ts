import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@deaxu/terminal-ui': path.resolve(__dirname, '../src/index.ts'),
      '@deaxu/terminal-ui/styles': path.resolve(__dirname, '../src/styles/global.css'),
    },
  },
});
