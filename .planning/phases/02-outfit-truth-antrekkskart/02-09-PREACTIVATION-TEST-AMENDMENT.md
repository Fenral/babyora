# Plan 02-09 pre-activation contract-test amendment

**Status:** LOCKED FOR 02-09 PRE-ACTIVATION REPAIR
**Date:** 2026-07-25
**Execution amendment:** `02-09-EXECUTION-AMENDMENT.md`

## Reason

The integrated false-flag implementation passed every focused production,
browser, build, lint and inventory gate, but the full suite exposed one stale
Phase-1 source-contract assertion. The test required `plannedContext` and
`origin` to be textually adjacent in the `Drill` union. Plan 02-09 correctly
adds the exact process-owned `outfitBundle` between those fields, so the old
adjacency expression rejects the intended additive contract even though the
trusted planned-context boundary remains unchanged.

This amendment authorizes a narrow contract-test repair. It does not authorize
any production behavior change.

## Approved scope correction

The eleven implementation paths approved by
`02-09-EXECUTION-AMENDMENT.md` remain authorized. Add exactly one existing
test path:

- `src/lib/planning/__tests__/planned-outfit-resolver.test.ts`

The assertion must require the exact ordered planned drill fields:

1. `source: 'planned'`
2. `plannedContext: PlannedOutfitContext`
3. `outfitBundle?: OutfitBundleProducerResult`
4. `origin: HTMLElement`

It may not be weakened to a broad wildcard or omit any of those fields.
All existing negative assertions protecting Uke, persistence, analytics and
the trusted live callback remain unchanged.

The final evidence verifier and its tests must attest an exact twelve-path
implementation scope. The planning amendment itself is an allowed governance
artifact outside that twelve-path implementation count; every other planning,
source, package, media, Hjem, Uke, token, threshold, storage, network or
entitlement drift remains rejected.

## Activation sequence remains unchanged

This repair belongs to the false-flag pre-activation candidate `P`. After the
repair, every pre-activation command and the full suite must be rerun on the
new clean `P`.

The final activation candidate `C` must still be the exact child of `P`, and
its entire delta remains limited to:

- `src/lib/outfit/feature-flags.ts`
- `src/components/outfit/__tests__/OutfitTruthPanel.test.tsx`

Any other `P`-to-`C` change invalidates the candidate and restarts the
activation sequence.
