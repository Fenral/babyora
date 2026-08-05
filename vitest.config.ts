import { defineConfig, mergeConfig } from 'vitest/config';
import { resolve } from 'node:path';
import viteConfig from './vite.config';

/**
 * Vitest-konfig: arver hele vite.config.ts (plugins + define) og legger
 * KUN til alias-oppløsning slik at design-labens kontrakttester
 * (docs/design-lab/lab/__tests__/) kan importere lab-kode som selv bruker
 * @lib/@data/@hooks (samme alias som docs/design-lab/lab/vite.config.ts).
 *
 * src-testene er upåvirket: de bruker relative importer og kjører som før.
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    resolve: {
      alias: {
        '@lib': resolve(__dirname, 'src/lib'),
        '@data': resolve(__dirname, 'src/data'),
        '@hooks': resolve(__dirname, 'src/hooks'),
      },
    },
  }),
);
