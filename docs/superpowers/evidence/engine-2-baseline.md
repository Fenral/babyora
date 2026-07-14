# Engine 2 baseline — R1 fersk baseline (Gate 0)

**Registrert:** 2026-07-14, av implementeringsøkten (Fable 5), etter eksplisitt eiergodkjenning av pakken R1→R2→R3 («kjør»).

Dette dokumentet er evidensen for konsolidert plan **R1** og masterplanens Gate 0-baseline. Alle outputs under er ferske kjøringer fanget i denne økten — ikke kopiert fra eldre dokumenter.

## R1-rubrikk (låst før kjøring)

| # | Påstand (ja/nei) | Målemetode | Artefakt | Resultat |
|---|---|---|---|---|
| R1-1 | Arbeidskopien er git-backed, ren, på main | `git status --short` (tom), `git branch` | Denne filen §Repo | **JA** |
| R1-2 | Miljø og lockfile er registrert | `node --version`, `npm --version`, sha256(lockfile) | §Miljø | **JA** |
| R1-3 | Avhengigheter fra clean install | `npm ci` fullført uten feil | §Kommandoer | **JA** |
| R1-4 | Full testsuite grønn | `npm test` fersk output | §Kommandoer | **JA** |
| R1-5 | Audit-tester grønne | `npm run audit:test` fersk output | §Kommandoer | **JA** |
| R1-6 | Produksjonsbygg grønt | `npm run build` fersk output | §Kommandoer | **JA** |
| R1-7 | Lint-baseline dokumentert eksakt | `npm run lint` full output til fil | `r1-lint-baseline.txt` | **JA** (rød som forventet) |
| R1-8 | Kun evidensfiler i commiten | `git status` før commit | Commit-diff | **JA** |

## Repo

- Repository: `Fenral/babyora`, branch `main`
- Commit: `23b52a7b24f6e12c11837e856c2ac051d9337f6d` («docs: define model and effort routing»)
- `git status --short`: tom (ren arbeidskopi) før evidensfiler ble lagt til

## Miljø

- Node: `v24.14.1`
- npm: `11.11.0`
- `package-lock.json` sha256 (første 16): `0d7d4824a2ae6214`
- OS: Windows 11 Enterprise 10.0.26200

## Kommandoer (ferske kjøringer, 2026-07-14 12:41–12:44)

### `npm ci`
Fullført. (npm meldte sårbarhets-audit-hint; ingen installasjonsfeil.)

### `npm test`
```
Test Files  27 passed (27)
     Tests  222 passed (222)
  Duration  4.46s
```

### `npm run audit:test`
```
Test Files  6 passed (6)
     Tests  19 passed (19)
  Duration  1.61s
```

### `npm run build`
```
vite v8.0.14 — client + bare build
dist/bare/assets/index-D7DlGxEN.js  268.42 kB │ gzip: 83.30 kB
✓ built in 287ms (bare); hovedbygg OK via tsc -b && vite build
```

### `npm run lint`
```
✖ 19 problems (17 errors, 2 warnings)
```
Eksakt match med dokumentert baseline fra repo-init. Full output: [r1-lint-baseline.txt](./r1-lint-baseline.txt).

Berørte filer (14): scripts/generate-rules-docs.ts, src/components/WeatherLottie.tsx, src/hooks/{useAutoLocationRefresh,useCountUp,useOverrides,useTooltipSeen,useWeather}.ts, src/lib/garments/ownership.ts, src/screens/{FinnAntrekk,Hjem,Innstillinger,Paakledning,Uke}Screen.tsx, src/state/children-store.tsx.

Lint-gjelden løses atferdsbevarende i **R3** (engine-2-plan Task 0B); ingen lint-fikser gjøres i R1/R2.

## Konklusjon

Baseline er reproduserbar og identisk med init-dokumentasjonen (222 + 19 tester grønne, build grønn, lint 17/2 rød). Plattformen er klar for R2 legacy safety containment.
