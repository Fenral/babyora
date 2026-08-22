# Phase 0 verification

Verdict: **PASS with accepted exceptions**

Verified: 2026-08-22, Europe/Oslo

Branch: `codex/phase-0/baseline-and-design-exploration`

Candidate start: `0cdfc86` — TASK-009 verification closeout

Scope: TASK-010 closes Phase 0 by reproducing the technical baseline, opening
the built application shell, exercising root navigation, and recording the
known exceptions and Phase 1 blockers. It does not change product behavior.

## Reproduced baseline

The TASK-001 command sequence was rerun from the repository root.

| Command | Result | Duration | Evidence |
|---|---:|---:|---|
| `npm ci` | PASS | 18.8 s | 608 packages installed; 610 audited. |
| `npx playwright install chromium` | PASS | 1.8 s | Chromium runtime available. |
| `npm test` | PASS | 134.9 s | 211 files; 3,189 passed; 1 todo. |
| `npm run lint` | PASS | 35.5 s | ESLint completed without findings. |
| `npm run build` | PASS | 12.4 s | TypeScript, main Vite build, and bare-shell build completed. |
| `npm run e2e` | PASS | 9.7 s | Onboarding plus automated Hjem/Planlegg/Familie/Hjem navigation passed, 2/2. |

The test increase from TASK-001's 210 files / 3,168 passing tests to 211 files /
3,189 passing tests is explained by the 21 release-gate tests added in
TASK-009. The same two smoke scenarios still pass.

## Automated built-shell navigation exercise

The durable verifier is `e2e/smoke.ts`. It serves the production build, opens
the demo shell, and checks the complete root sequence below. A separate browser
cross-check served the build locally with
`npm run preview -- --host 127.0.0.1 --port 4173` and opened at
`/?seed=demo`. The temporary browser tab and preview process were closed after
verification.

| Action | Result | Observable evidence |
|---|---:|---|
| Open demo shell | PASS | Hjem rendered; title `Hjem · Babyora`; Hjem had `aria-current="page"`. |
| Select Planlegg | PASS | Plan content rendered; title `Planlegg · Babyora`; Planlegg became current. |
| Select Familie | PASS | Settings and child content rendered; title `Familie · Babyora`; Familie became current. |
| Return to Hjem | PASS | Title returned to `Hjem · Babyora`; root buttons remained Hjem, Planlegg, Familie. |

This proves the current three-root application shell opens and changes screens.
It does not resolve the separate product-document request to preserve the live
reference's four-slot layout; that decision is recorded below as a later UI
integration blocker.

## No product behavior lost

- Phase 0 tasks are documentation, design exploration, configuration inventory,
  and one standalone release-gate policy module.
- The release-gate module has no runtime consumer yet and therefore does not
  alter the current shell.
- The full unit, lint, production-build, and smoke baselines remain green.
- Root navigation opens all three implemented source tabs and returns to Hjem.

## Accepted exceptions

1. `npm ci` still reports 16 dependency findings: 1 low, 3 moderate, 11 high,
   and 1 critical. Dependency changes are not safe to bundle into Phase 0
   closeout; TASK-052 owns production dependency audit, remediation, and any
   evidence-based exception before release-candidate regression.
2. The main and `UkeScreen` bundles still trigger Vite's non-blocking 500 kB
   chunk advisory. TASK-052 owns launch performance budgets.
3. Local static Vite preview cannot serve the deployed `/api/forecast` proxy,
   so Hjem and Planlegg exercised their bounded weather-unavailable states.
   The shell/navigation result is valid; TASK-013 owns proxy behavior.
4. Familie currently exposes two nested `main` landmarks (`#main` plus an
   inner settings main). Navigation works, but TASK-050 must reduce this to one
   unambiguous primary landmark.
5. TASK-006 was waived with 0/5 target-dad participants. Snudly Ro v0.1 is
   provisional and reversible, never described as user-validated.

## Phase 1 blockers and owners

| Blocker | Owner / next gate |
|---|---|
| Product documents say Snudly while current source titles and repository instructions say Babyora. | Owner decision before identity-facing UI copy is changed. |
| The live reference has a four-slot bottom layout while current source implements Hjem, Planlegg, and Familie as three root tabs. | Owner confirmation before TASK-017 changes root navigation; TASK-011–016 can proceed independently. |
| Automatic coordinates can leak into persistent scan/widget cache paths. | TASK-012. |
| Vercel production domain and MET client/proxy identity differ across checked-in references. | TASK-013 plus owner-console confirmation only when external state is required. |
| Current Home exposes only outdoor play and stroller although the engine supports four activities. | TASK-014. |
| Safety source/version review and rolling-child input are incomplete in the current recommendation path. | TASK-016 before recommendation-facing release claims. |

## Preserved worktree

Pre-existing changes in `loop/ARBEIDSLISTE-SNUDLY.md`, `loop/BATON.md`,
`loop/LEDGER.md`, and `loop/evidens/SN-007/g3-test.txt` were not modified or
staged by TASK-010.
