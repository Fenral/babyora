import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

/**
 * Bare-app: standalone Vite-build for naken-versjon.
 *
 * - Re-bruker src/lib + src/hooks + src/data fra hoved-Babyora-repo
 * - Output: ../../dist-bare → kopieres til dist/bare/ ved hoved-build
 * - Live: https://wool-app.vercel.app/bare/
 * - 0 design-arv: ingen import fra src/styles/, src/screens/, src/components/
 */
export default defineConfig({
  plugins: [react()],
  root: __dirname,
  base: '/bare/',
  build: {
    outDir: resolve(__dirname, '../../dist/bare'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
    },
  },
});
