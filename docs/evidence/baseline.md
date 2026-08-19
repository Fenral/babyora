# TASK-001 Technical Baseline

**Captured:** 2026-08-19 11:38 Europe/Oslo

**Repository:** `C:\Users\siver\Documents\Snudly-bygg\snudly`

**Branch:** `codex/phase-0/baseline-and-design-exploration`

**Starting commit:** `cdcdbae` — `SN-007: f1 roedt-lag-fix, tre funn adressert`

**Scope:** Observation and documentation only. No product behavior, dependencies, scripts, snapshots, or application code were changed.

## Environment

| Tool | Captured value |
|---|---|
| Operating system | Microsoft Windows NT 10.0.19045.0 |
| Node.js | v24.14.1 |
| npm | 11.11.0 |
| Git | 2.53.0.windows.2 |
| Package | `babyora@0.1.0` |
| Package manager source | Committed `package-lock.json`, installed with `npm ci` |

## Reproduction

Open PowerShell in the repository root and run these commands in order:

```powershell
npm ci
npx playwright install chromium
npm test
npm run lint
npm run build
npm run e2e
```

The npm commands are defined by the committed `package.json`. Playwright's Chromium binary is an external runtime prerequisite and is not installed by `npm ci`, so install or confirm it with the recorded `npx` command. No environment variable or external credential was needed for this baseline. `npm test`, `npm run lint`, and `npm run build` may run independently after dependency installation; the smoke command should run after both the Chromium installation and production build.

## Captured Results

| Command | Result | Duration | Evidence summary |
|---|---:|---:|---|
| `npm ci` | PASS | 15.8 s | Added 608 packages and audited 610 packages. Reported 16 dependency audit findings: 1 low, 3 moderate, 11 high, 1 critical. |
| `npx playwright install chromium` | PASS | 1.7 s | Confirmed the Playwright Chromium runtime required by `e2e/smoke.ts`; removed only unused older Playwright browser caches. |
| `npm test` | PASS | 112.6 s | 210 test files passed; 3,168 tests passed; 1 todo; 3,169 total. |
| `npm run lint` | PASS | 39.3 s | ESLint completed with exit code 0 and no reported findings. |
| `npm run build` | PASS | 18.9 s | TypeScript, main Vite build, and bare-app Vite build completed. |
| `npm run e2e` | PASS | 3.4 s | 2/2 smoke scenarios passed: onboarding rendered and demo app shell rendered. Preview server stopped normally. |

## Baseline Warnings and Accepted Exceptions

1. `npm ci` reports 16 dependency vulnerabilities, including one critical finding. TASK-001 does not update dependencies; investigate them in a separate scoped security/dependency task before public release.
2. npm reports several deprecated transitive packages. They are recorded but not changed here because an automatic upgrade could alter the working baseline.
3. The production build warns that `UkeScreen` and the main index JavaScript chunks exceed 500 kB after minification. The build still passes; performance work belongs to the launch performance task.
4. Running Vitest touched the filesystem metadata of two snapshot files. Their normalized working hashes exactly matched the committed blobs, `git diff` was empty, and refreshing them staged no change.
5. Authoritative repository instructions approve the public name **Babyora**, while the new product-planning documents use **Snudly**. This is a documentation/product-decision conflict, not a TASK-001 code issue; neither name was changed.

## Pre-existing Working Tree State

The following changes existed before TASK-001 and were preserved without edits by this task:

```text
 M loop/ARBEIDSLISTE-SNUDLY.md
 M loop/BATON.md
 M loop/LEDGER.md
 M loop/evidens/SN-007/g3-test.txt
?? docs/VISION.md
?? docs/prd.md
?? docs/product-idea.md
?? docs/product-roadmap.md
?? docs/product-vision.md
?? docs/validation-report.md
```

`package.json` was inspected as the command source and remains unchanged.

## Verification Contract

TASK-001 is reproducible when a second session can:

1. Use the recorded repository, commit, runtime versions, and command order.
2. Obtain successful exit codes for dependency/browser install, test, lint, build, and smoke.
3. Reconcile test and smoke totals with this capture or explain a later intentional change.
4. Observe no application-code diff attributable to TASK-001.

**Baseline verdict:** PASS with recorded dependency, bundle-size, naming, and snapshot-metadata exceptions. The app installs, tests, lints, builds, and completes both smoke scenarios on the captured Windows environment.
