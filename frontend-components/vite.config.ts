import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        terminal: resolve(__dirname, 'src/terminal/index.ts'),
        tables: resolve(__dirname, 'src/tables/index.ts'),
        plotly: resolve(__dirname, 'src/plotly/index.ts'),
        biotech: resolve(__dirname, 'src/biotech/index.ts'),
      },
      name: 'BiotechTerminalComponents',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});