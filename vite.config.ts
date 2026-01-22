
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, path.resolve(), '');

  return {
    base: '/',
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      // Increase limit to silence warning (1MB)
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // Smart splitting of large libraries
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-utils': ['jspdf', 'html2canvas'],
            'vendor-ai': ['@google/genai'],
            'vendor-ui': ['lucide-react']
          }
        }
      }
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY)
    }
  };
});
