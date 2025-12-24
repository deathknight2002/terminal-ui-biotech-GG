import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const nodeApiTarget = env.VITE_API_URL || 'http://localhost:3001';
  const pythonApiTarget = env.VITE_PYTHON_API_URL || 'http://localhost:8000';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      proxy: {
        '/api': {
          target: nodeApiTarget,
          changeOrigin: true,
        },
        '/api/v1': {
          target: pythonApiTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
      proxy: {
        '/api': {
          target: nodeApiTarget,
          changeOrigin: true,
        },
        '/api/v1': {
          target: pythonApiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
