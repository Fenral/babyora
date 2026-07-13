import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

// FASE 0 byggstempel: injiser VITE_BUILD_SHA + VITE_BUILD_DATE i bygget
// så hvert bygg kan verifiseres mot git på to sekunder via Innstillinger.
function gitSha(): string {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'nogit';
  }
}

// Les versjon fra package.json slik at Innstillinger-skjermen ikke trenger
// å hardkode '0.8.2'. Sannhets-kilde = package.json#version (samme verdi
// som Capacitor sync, App Store og Play henter fra).
function pkgVersion(): string {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const raw = readFileSync(resolve(here, 'package.json'), 'utf8');
    const parsed = JSON.parse(raw) as { version?: string };
    return parsed.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

const BUILD_SHA = gitSha();
const BUILD_DATE = new Date().toISOString().slice(0, 10);
const APP_VERSION = pkgVersion();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_BUILD_SHA': JSON.stringify(BUILD_SHA),
    'import.meta.env.VITE_BUILD_DATE': JSON.stringify(BUILD_DATE),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(APP_VERSION),
  },
})
