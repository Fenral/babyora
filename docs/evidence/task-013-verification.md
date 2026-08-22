# TASK-013 verification — MET forecast proxy contract

Verdict: **PASS**

Verified: 2026-08-22, Europe/Oslo

Branch: `codex/phase-1/core-recommendation`

## Delivered behavior

- Both client and edge boundaries reject missing, blank, non-finite, and
  out-of-range coordinates before cache or upstream access.
- The edge request has an eight-second timeout and at most two total attempts.
  Network failures plus MET 502/503 responses receive one jittered retry; 429
  never loops and preserves a safe numeric `Retry-After` value.
- Every failure response is explicit no-store. Successful fixed-home responses
  retain the reviewed 15-minute shared cache, while automatic-location traffic
  is no-store at browser, CDN, Vercel CDN, and upstream seams.
- MET JSON is parsed and structurally validated before a 200 response can enter
  the shared cache. Invalid JSON, units, timepoints, ranges, or ordering fail
  closed with a safe typed error.
- The browser client exposes `ForecastClientError` with code, retryability,
  status, and bounded retry delay metadata. Existing valid stale-cache recovery
  remains intact.
- The proxy now identifies as Snudly with the owner-supplied production URL and
  contact-bearing fallback. `METNO_USER_AGENT` can override that identity only
  on the server; the legacy public climate-pack fixture remains unchanged.

## Failure contract

| Condition | HTTP | Client code | Retry behavior |
|---|---:|---|---|
| Invalid coordinates | 400 | `invalid_coordinates` | No retry |
| Rate limit | 429 | `rate_limited` | No loop; expose safe `Retry-After` |
| MET timeout | 504 | `timeout` | One proxy retry, then bounded error |
| Network or MET 502/503 | 502 | `upstream_unavailable` | One proxy retry, then bounded error |
| Malformed MET payload | 502 | `invalid_payload` | Reject before cache/engine |

## Verification

| Command | Result | Evidence |
|---|---:|---|
| Focused proxy and client tests | PASS | 2 files, 112 tests. |
| Climate-pack contract fixture | PASS | 1 file, 9 tests. |
| `npm run lint` | PASS | Full repository lint completed without findings. |
| `npm test` | PASS | 212/212 files; 3,232 passed; 1 todo. |
| `npm run build` | PASS | TypeScript, main Vite build, and bare build completed; existing chunk advisory remains non-blocking. |
| `npm run e2e` | PASS | 2/2 onboarding and root-shell scenarios. |

The first full-suite run found that replacing the legacy
`VITE_METNO_USER_AGENT` fixture violated the checked-in climate-pack contract.
The server-only variable was added alongside that fixture instead; the focused
contract and complete suite then passed.

## Review record

The independent staged-review CLI was not retried because the two immediately
preceding task closeouts both timed out after 184 seconds without output. No
independent verdict is claimed. Manual review removed the edge function's
initial dependency on the browser client by adding a server-safe parser module,
then focused tests and all full quality gates were rerun.

## Preserved worktree

Pre-existing changes in `loop/ARBEIDSLISTE-SNUDLY.md`, `loop/BATON.md`,
`loop/LEDGER.md`, and `loop/evidens/SN-007/g3-test.txt` were not modified or
staged by TASK-013.
