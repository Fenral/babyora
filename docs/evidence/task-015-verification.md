# TASK-015 verification — deterministic canonical engine

Verdict: **PASS**

Verified: 2026-08-22, Europe/Oslo

Branch: `codex/phase-1/core-recommendation`

## Delivered behavior

- Hjem, Juster/Finn antrekk, and Uke now call one UI-facing pure function:
  `recommendCanonical` in `clothing-engine-v2/canonical-engine.ts`.
- The canonical version is explicitly `wool-layers-v1-contained`. It continues
  to delegate to the reviewed legacy pipeline with its final safety boundary;
  unreviewed Motor 2.0 display flags remain off.
- The facade returns the byte-exact existing `Recommendation` shape. Engine
  version is separate boundary metadata, so planning, cache, widget, swap, and
  outfit-truth consumers do not receive an accidental schema mutation.
- Named fixtures freeze both sides of every temperature threshold at 28, 22,
  16, 10, 5, 0, −7, and −15 °C.
- Named activity fixtures cover awake/sleeping stroller, carrier outside/under
  the parent's jacket, outdoor play, indoor sleep, and stroller plus car-seat
  context. Each fixture produces byte-identical JSON across 25 repeated runs.
- Boundary tests also prove that recommendation calls do not mutate their input
  and that the three production calculation screens cannot import the legacy
  implementation directly.

## Boundary evidence

| Boundary family | Fixtures | Determinism assertion |
|---|---:|---|
| Exact temperature threshold and 0.001 °C below | 16 | 25 repeated byte comparisons per fixture |
| Activity and sub-context | 7 | 25 repeated byte comparisons per fixture |
| UI engine entry | 3 screens | Canonical import present; direct implementation import absent |

## Verification

| Command | Result | Evidence |
|---|---:|---|
| `npx vitest run src/lib/clothing-engine-v2/boundary.test.ts` | PASS | 1 file, 27 tests. |
| Focused boundary and Uke integration tests | PASS | 2 files, 29 tests. |
| `npx tsc -b --pretty false` | PASS | Canonical facade and screen consumers typecheck. |
| `npm run lint` | PASS | Full repository lint completed without findings. |
| `npm test` | PASS | 214/214 files; 3,286 passed; 1 todo. |
| `npm run build` | PASS | TypeScript, main Vite build, and bare build completed; existing chunk advisory remains non-blocking. |
| `npm run e2e` | PASS | 2/2 onboarding and root-shell scenarios. |

The first focused integration run exposed that adding `engineVersion` inside
the recommendation object violated `PlannedOutfitContext`'s exact canonical
shape. The version marker was moved to a separate exported constant; the
facade now returns exact legacy bytes, and Uke plus every full gate passed.

## Review record

The independent staged-review CLI was not retried because recent local review
commands repeatedly timed out without output. No independent verdict is
claimed. Manual review preserved the unreviewed-V2 release gate, removed the
schema-changing result envelope, and verified all production screen imports
plus the complete repository gates.

## Requirement status

TASK-015 closes deterministic boundary proof and the single calculation seam.
`FR-005` remains **Partial** because current screen catch blocks still collapse
an engine contract error to `null` instead of rendering the bounded recovery
state required by the PRD. TASK-017 owns that user-visible error behavior.

## Preserved worktree

Pre-existing changes in `loop/ARBEIDSLISTE-SNUDLY.md`, `loop/BATON.md`,
`loop/LEDGER.md`, and `loop/evidens/SN-007/g3-test.txt` were not modified or
staged by TASK-015.
