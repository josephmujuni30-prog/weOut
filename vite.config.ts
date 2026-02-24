import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The third parameter '' loads all variables regardless of prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    
    resolve: {
      alias: {
        // Allows for cleaner imports like: import Button from '@/components/Button'
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      port: 3000,
      host: true, // Same as '0.0.0.0', makes it accessible on your local network
      open: true, // Bonus: opens the browser automatically
    },

    define: {
      // Fixed the hyphenated key access using bracket notation
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env['GEMINI-API-KEY']),
    },

    build: {
      outDir: 'dist',
      sourcemap: mode === 'development', // Useful for debugging
    },
  };
});