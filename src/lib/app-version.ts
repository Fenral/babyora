/**
 * app-version — sentralt oppslag for appens versjonsnummer.
 *
 * Kilde: `import.meta.env.VITE_APP_VERSION` settes av vite.config.ts ved
 * bygget basert på `package.json#version`. Det betyr at vi har én sannhets-
 * kilde (package.json) som Capacitor sync, App Store og Play også leser.
 *
 * Fallback "0.0.0" brukes kun hvis env-variabelen ikke ble injisert (f.eks.
 * test-miljø uten vite-define) — i produksjon vil dette aldri trigge.
 *
 * Bruk:
 *   import { APP_VERSION } from '../lib/app-version';
 *   <span>versjon {APP_VERSION}</span>
 */
export const APP_VERSION: string =
  (import.meta.env.VITE_APP_VERSION as string | undefined) ?? '0.0.0';
