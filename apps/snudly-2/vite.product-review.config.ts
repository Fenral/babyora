import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

const productReviewRoot: Plugin = {
  name: 'snudly-product-review-root',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'vercel.json',
      source: `${JSON.stringify({
        rewrites: [{ source: '/', destination: '/product-review.html' }],
      }, null, 2)}\n`,
    });
  },
};

export default defineConfig({
  plugins: [react(), productReviewRoot],
  root: __dirname,
  publicDir: resolve(__dirname, '../../public'),
  build: {
    outDir: resolve(__dirname, '../../dist-snudly-2-product-review'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'product-review.html'),
    },
  },
});
