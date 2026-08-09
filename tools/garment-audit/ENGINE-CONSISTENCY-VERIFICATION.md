# Babyora engine consistency — verification evidence

Status: PASS / SECURED
Date: 2026-08-09
Baseline: `2dce070038a659486491a521854ce5d820fac79c`
Independently verified implementation: `1a33650890f922d6cd4e735607288dda0b54fa14`

## Outcome

AC-1 through AC-9 in `ENGINE-CONSISTENCY-DOD.md` pass on the immutable
implementation SHA above. The active engine remains `wool-layers`; Motor V2
remains disabled. No temperature, wind, precipitation, age, TOG, material, or
safety threshold was changed.

## Implementer gates

| Gate | Result |
|---|---|
| `npm run verify:engine-consistency` | 6/6 files, 130/130 tests |
| `npm test` | 245/245 files, 3476 passed, 1 existing todo |
| `npm run lint` | PASS |
| `npm run audit:test` | 7/7 files, 28/28 tests |
| `npm run build` | PASS; web and bare builds |
| `npm run e2e` | 2/2 scenarios |
| `npm run e2e:localization` | 3/3 locales |
| `node tools/verify-hjem.mjs` | 12/12 gates |
| generated screen manifest | 15/15 tests; disk equals generator |

## Independent verification

Fresh `gsd-verifier` verdict for the exact implementation SHA: **PASS**.

- Engine consistency: 130/130 in 6.2 seconds.
- Lint: PASS in 33.3 seconds.
- Full suite: 3476 passed and 1 existing todo in 305.5 seconds.
- Build: PASS in 21.8 seconds.
- Smoke: 2/2 on free port 52222.
- Localization: 3/3 on distinct free port 52246.
- Home verifier: 12/12 on free port 52319.
- Manifest: 15/15.
- Final `git diff --check`: PASS.
- Final porcelain status: empty.
- Final HEAD: exact expected implementation SHA.

Fresh `gsd-security-auditor` verdict for the same SHA: **SECURED**.

- 9/9 registered consistency threats closed.
- Trusted HB-1 provenance removal is rejected even when flag, severity, and
  both note representations are stripped.
- Eight locked safety invariants pass through direct overrides, finalized
  session swaps, and occurrence swaps: 24/24 mutation paths.
- Direct, index, alias, helper, new-screen, wrong-adapter, Motor V2, and
  production stroller-sleep bypass probes are rejected.
- Home, Plan, and Find produce one canonical decision for the shared cold
  stroller fixture.
- Negative sentinels prove the parity test detects fleece-to-wool drift and a
  crossing of the existing `-7 °C` boundary.
- No policy-table, Motor V2 flag, clinical threshold, or unsupported-claim
  drift was found.

## Rejection loop

The first candidate, `60f025c3cc5f2eededc5875ede06128878237d6f`, was
rejected for five concrete threats: removable safety flags, empty swap layers,
missing explicit Find stroller context, a bypassable source gate, and an
incomplete mutation matrix.

Subsequent candidates were also rejected instead of being pushed:

- `d3b705a`: AC-3 lacked a behavioral cross-surface parity fixture.
- `6df2ce3`: the first parity fixture did not discriminate material or boundary
  drift.
- `3947ebd`: two out-of-scope verification/documentation files lacked recorded
  reasons in the DoD.

Each rejection became a permanent positive or negative control before the next
immutable candidate was created.

## Current app flow

`docs/CURRENT-APP-FLOW.md` documents the app as implemented at this milestone:

- 19 pages/views;
- 27 overlays/dialogs;
- 12/12 `*Screen` components;
- Mermaid navigation flow and source references;
- known route/reset/deep-link gaps recorded without changing runtime behavior.

## Exclusions

This verification does not claim medically proven or universally correct
clothing advice. Clinician-gated vocabulary or policy expansion, Motor V2
activation, production merge, release tagging, and TestFlight upload remain
outside this change.
