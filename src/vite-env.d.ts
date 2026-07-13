/// <reference types="vite/client" />

// Build-time env-variabler injisert av vite.config.ts#define
interface ImportMetaEnv {
  readonly VITE_BUILD_SHA?: string;
  readonly VITE_BUILD_DATE?: string;
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Side-effect imports for font/style-only packages som ikke har egne types
declare module '@fontsource-variable/inter';
declare module '@fontsource-variable/schibsted-grotesk';
declare module '@fontsource/dm-serif-display/400.css';
declare module '@fontsource/dm-serif-display/400-italic.css';
