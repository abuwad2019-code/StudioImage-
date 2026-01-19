import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // Solution 2: Set base path to root to ensure assets load correctly
    base: '/',
    plugins: [react()],
    resolve: {
      // Solution 1: Fix module resolution for @ imports
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    },
    define: {
      // This allows the code to use process.env.API_KEY as required
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  };
});