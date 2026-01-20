import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
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
      // Increase the warning limit to 1000kb (1MB) to silence the warning regarding large libraries
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // Smartly separate large libraries into their own chunks for better browser caching
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-pdf': ['jspdf', 'html2canvas'],
            'vendor-genai': ['@google/genai'],
            'vendor-icons': ['lucide-react']
          }
        }
      }
    },
    define: {
      // Expose the API key safely to the client bundle
      // We check for both API_KEY (system) and VITE_API_KEY (standard vite)
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY),
    },
  };
});