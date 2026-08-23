import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor-konfig for Snudly (iOS + Android).
 * App-ID låst 2026-05-26 — IKKE endre uten ny app-record i App Store Connect
 * og Play Console.
 */
const config: CapacitorConfig = {
  appId: 'no.klemeg.app',
  appName: 'Snudly',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
    scheme: 'Babyora',
  },
  android: {
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
