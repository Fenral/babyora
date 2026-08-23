import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  publicDir: resolve(__dirname, '../../public'),
  build: {
    // Capacitor packages `dist`, so the approved Snudly product app must be
    // the default production artifact instead of the legacy shell.
    outDir: resolve(__dirname, '../../dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
    },
  },
});
