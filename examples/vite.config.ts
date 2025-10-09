import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@biotech-terminal/frontend-components': path.resolve(__dirname, '../frontend-components/src/index.ts'),
      '@biotech-terminal/frontend-components/styles': path.resolve(__dirname, '../frontend-components/src/styles/index.ts'),
    },
  },
});
