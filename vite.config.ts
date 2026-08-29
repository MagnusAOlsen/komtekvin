import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The client is served standalone by Vite in dev (port 5173) and proxies
// /api calls to the Express server (port 3000). In production the Express
// server serves the built client from dist/, so no proxy is involved.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    outDir: 'dist',
  },
});
