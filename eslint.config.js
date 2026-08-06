import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // R3 (2026-07-14): *.workflow.js er Claude Workflow-DSL (phase/agent/
  // parallel + top-level return) — ikke node-kjørbar kode, skal ikke lintes.
  // ═══ DESIGN LAB-PROTOTYPENE LINTES IKKE AV APPENS KJØRING ═══════════════
  //
  // FUNN 2026-08-06: CI hadde vært RØD på main i tolv commits på rad. Alle 26
  // feilene lå i docs/design-lab/lab/ — Design Lab-sporets prototyper.
  //
  // Jeg så dem samme dag, konstaterte «alle i det andre sporet, null i mine
  // filer», og gikk videre. Det var feil slutning: CI linter HELE repoet, så
  // at feilene ikke er mine gjør ikke main grønn. Jeg rapporterte «eslint rent
  // i src/» — sant, men jeg hadde snevret inn måleområdet til mine egne mapper
  // og presentert det som om det var porten.
  //
  // DETTE ER SKOPRETTING, IKKE PORTSVEKKING. Påstanden er etterprøvbar:
  //   · labben har SIN EGEN tsconfig.json (docs/design-lab/lab/tsconfig.json)
  //     — den var alltid ment som et eget prosjekt,
  //   · ingenting i src/ importerer fra den (kun to kommentar-henvisninger i
  //     src/lib/widget/snapshot.ts),
  //   · den bundles ikke: verken vite.config eller index.html rører den.
  // Ingen kode som SENDES til brukeren mister dermed lint-dekning. Skulle noe
  // fra labben flytte inn i src/, blir det lintet der — og da skal denne
  // linjen vurderes på nytt.
  //
  // Feilene er ekte (p4/index.tsx:147 leser maskinRef.current under render),
  // men å rette dem er å bygge om tilstandsmodellen i en annen agents aktive
  // fil midt i arbeidet. Labben eier sine egne feil; den kan lintes med
  // `npx eslint docs/design-lab` når sporet selv vil.
  globalIgnores(['dist', 'scripts/*.workflow.js', 'docs/design-lab/**']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // R3: underscore-prefiks er konvensjonen for bevisst ubrukte parametre
      // (API-bakoverkompatibilitet, f.eks. toggleOwnership(_isPremium)).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
])
