# TASK-014 verification — explicit activity input

Verdict: **PASS**

Verified: 2026-08-22, Europe/Oslo

Branch: `codex/phase-1/core-recommendation`

## Delivered behavior

- Motor 2.0 now has a public, discriminated `ActivityRecommendInputV2`
  contract for `vogn`, `baeresele`, `utelek`, and `soevn`.
- `normalizeActivityInputV2` maps those parent-facing choices to precise engine
  situations. Vogn supports awake/sleeping modes and optional car-seat context;
  carrier supports the under-parent-jacket context.
- Stroller sleep is represented as an outdoor situation. It keeps wind, rain,
  stroller cover, and pouch behavior separate from indoor sleep, which ignores
  outdoor-only modifiers.
- Impossible fields are rejected both by TypeScript and runtime validation:
  stroller mode outside stroller, jacket context outside carrier, car-seat
  context outside awake stroller, sleeping stroller plus car seat, unknown
  context keys, and unknown activities.
- Every validated recommendation now carries its four-way activity explicitly,
  and activity is an explicit input to the semantic fingerprint. Existing
  reviewed situation fixtures remain compatible but must agree if they provide
  an activity themselves.
- The legacy adapter and review export consume the same centralized
  situation-to-activity mapping, including sleeping-stroller preservation.

## Activity contract

| Parent-facing activity | Internal situation | Allowed sub-context |
|---|---|---|
| `vogn` | `stroller_awake` / `stroller_sleeping` | `vognMode`; awake mode may add `context.bilstol` |
| `baeresele` | `carrier` | `innerJakke` |
| `utelek` | `active_play` | None; age/situation matrix still applies |
| `soevn` | `indoor_sleep` | None; outdoor modifiers are ignored |

## Verification

| Command | Result | Evidence |
|---|---:|---|
| `npx vitest run src/lib/clothing-engine-v2/input.test.ts` | PASS | 1 file, 24 tests. |
| Focused engine, analytics, and selector tests | PASS | 18 files, 275 tests. |
| `npx tsc -b --pretty false` | PASS | Public union and `@ts-expect-error` impossible-combination fixtures compile as intended. |
| `npm run lint` | PASS | Full repository lint completed without findings. |
| `npm run engine:v2:review` | PASS | Checked-in review JSON regenerated; parser and 5 export tests pass. |
| `npm test` | PASS | 213/213 files; 3,259 passed; 1 todo. |
| `npm run build` | PASS | TypeScript, main Vite build, and bare build completed; existing chunk advisory remains non-blocking. |
| `npm run e2e` | PASS | 2/2 onboarding and root-shell scenarios. |

The first TypeScript pass found the expected exhaustive analytics fixture did
not yet include `stroller_sleeping`; that type assertion was extended. A later
test initially expected HB-9 at +3 °C, where no thick garment existed to
remove. The fixture was corrected to −5 °C so it proves the actual car-seat
safety path rather than manufacturing a warning.

## Review record

The independent staged-review CLI was not retried because the recent local
review commands repeatedly timed out without output. No independent verdict is
claimed. Manual review added runtime rejection of unknown stroller-context
keys, kept the new sleeping mode out of the old generic situation picker, and
reran the focused and complete quality gates.

## Requirement status

TASK-014 closes the engine-input contract. `FR-004` remains **Conflicting**
because the current Home UI still exposes only stroller and outdoor play, and
the production-visible legacy route has not yet adopted this V2 boundary.
TASK-017 owns the visible four-activity control.

## Preserved worktree

Pre-existing changes in `loop/ARBEIDSLISTE-SNUDLY.md`, `loop/BATON.md`,
`loop/LEDGER.md`, and `loop/evidens/SN-007/g3-test.txt` were not modified or
staged by TASK-014.
