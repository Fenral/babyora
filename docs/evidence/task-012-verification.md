# TASK-012 verification — privacy-bounded location

Verdict: **PASS**

Verified: 2026-08-22, Europe/Oslo

Branch: `codex/phase-1/core-recommendation`

## Delivered behavior

- The durable location preference contains only `mode`. Automatic child ID,
  label, coordinates, and request generation remain in the Zustand runtime and
  are discarded on hydration.
- Manual/fixed-home coordinates validate before weather work. Automatic GPS
  and reverse-geocode results validate before commit, use memory-only/no-store
  clients, and late or superseded generations cannot commit.
- Hjem now passes the effective cache scope to both its scan cache and widget
  source. A memory-only recommendation neither reads nor writes persistent
  scan slots and never creates or sends widget data.
- Scan-cache schema version 1 purges every legacy coordinate-bearing version-0
  slot once. Version 0 did not record its location source, so clearing all old
  slots is the only privacy-safe migration; the non-location choreography flag
  is retained.
- `commitSlot` requires an explicit `persistent` or `memory-only` scope at
  compile time, preventing a future caller from silently selecting durable
  storage.

## Storage inspection

| Surface | Automatic-location result |
|---|---|
| `babyora.location-pref` partialized state | Exactly `{ "mode": "auto" }`; no child ID, generation, label, latitude, or longitude. |
| MET/geocode clients | `memory-only`/`no-store`; existing focused client tests assert no local-storage reads or writes. |
| `babyora.scan-cache` | Memory-only commits are rejected; existing memory-only slots are ignored; version-0 coordinate slots are purged. |
| `babyora:widget:lastSnapshot` and native widget bridge | Automatic-location source returns `mangler-data`; no snapshot is built or sent. |

## Verification

| Command | Result | Evidence |
|---|---:|---|
| Focused location/cache/widget/Hjem tests | PASS | 9 files, 133 tests before final source-anchor addition. |
| `npx tsc -b --pretty false` | PASS | No type errors. |
| `npm run lint` | PASS | Full repository lint completed without findings. |
| `npm test -- --run --reporter=dot --silent` | PASS | 212/212 files; 3,214 passed; 1 todo. |
| `npm run build` | PASS | TypeScript, main Vite build, and bare build completed; existing chunk advisory remains non-blocking. |
| `npm run e2e` | PASS | 2/2 onboarding and root-shell scenarios. |
| `git diff --cached --check` | PASS | No whitespace errors before closeout. |

The first full-suite run exposed one source-reading test that required the old
variable name `slots`. It was updated to require the new privacy-filtered
`scopedSlots`; the isolated test passed 7/7 and the complete suite then passed.

## Review record

The final independent staged review command timed out after 184 seconds
without output, matching the known local CLI failure. No review verdict is
claimed. Manual staged review tightened the cache API so scope is mandatory,
then the full type, lint, unit, build, and E2E gates above were rerun.

## Preserved worktree

Pre-existing changes in `loop/ARBEIDSLISTE-SNUDLY.md`, `loop/BATON.md`,
`loop/LEDGER.md`, and `loop/evidens/SN-007/g3-test.txt` were not modified or
staged by TASK-012.
