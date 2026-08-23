import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  publicDir: resolve(__dirname, '../../public'),
  build: {
    outDir: resolve(__dirname, '../../dist-snudly-2-home-review'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'home-review.html'),
    },
  },
});
