import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

/**
 * Design-lab (fase 9): standalone Vite-build for de fire prototypene P1–P4.
 *
 * - Bor i docs/design-lab/lab/ — UTENFOR src/ slik at doktrinetestene
 *   (som kun skanner src/) ikke treffer lab-koden (lab-fritaket, spec §2.7).
 * - Re-bruker motor/data via alias: @lib → src/lib, @data → src/data,
 *   @hooks → src/hooks. Ingen import fra src/styles/, src/screens/,
 *   src/components/ — null design-arv (samme regel som apps/bare).
 * - Output: dist/lab. Kjør: npm run dev:lab / npm run build:lab.
 */
export default defineConfig({
  plugins: [react()],
  root: __dirname,
  base: '/lab/',
  resolve: {
    alias: {
      '@lib': resolve(__dirname, '../../../src/lib'),
      '@data': resolve(__dirname, '../../../src/data'),
      '@hooks': resolve(__dirname, '../../../src/hooks'),
    },
  },
  build: {
    outDir: resolve(__dirname, '../../../dist/lab'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
    },
  },
});
