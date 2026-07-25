# Phase 2 identity amendment: route-qualified outfit ownership

**Status:** APPROVED DEVIATION
**Date:** 2026-07-25
**Applies to:** Plans 02-05, 02-06 and the Phase 2 → Phase 3 interface

## Conflict being resolved

The original 02-05 wording preserved byte-equivalent canonical context IDs
when identical raw input crossed the current and planned factories. Plan 02-06
also requires current, planned and planned-interval provenance to never reuse
snapshot, transition or alternative-option ownership.

Those requirements cannot both hold when outfit truth derives its ownership
from `transitionContextId`, input and the finalized recommendation. Keeping
current and planned identities byte-equivalent necessarily reuses the same
snapshot, garment occurrence IDs and option IDs.

## Governing decision

Canonical Phase-2 contexts use a deterministic, route-qualified identity:

- the trusted factory entry point selects `current` or `planned`;
- the caller cannot provide a source-kind flag, brand, derived ID or registry
  entry;
- the factory derives an opaque effective `transitionContextId` from the
  selected kind and the already-validated raw transition identity;
- planned identity additionally binds the exact normalized planning event and
  interval;
- canonical `plannedContextId` / producer `sourceContextId` derive from the
  same route-qualified material;
- the effective transition is stored unchanged in the context and its seed,
  then passed unchanged through navigation to the canonical truth and option
  builders;
- recommendation ID and fingerprint remain content-derived and unchanged.

The same route-qualified input remains byte-equivalent and deterministic.
Different current/planned/interval provenance must produce different context,
transition, snapshot, occurrence and option identities.

Legacy Phase-1 string-only contexts keep their existing identity behavior and
remain explicitly noncanonical for Phase 2.

## Superseded wording

This amendment supersedes only the interpretation of “preserve existing stable
`plannedContextId` and `transitionContextId`” that required equality across
different route provenance. Stability now means deterministic equality for the
same route-qualified input. Public object shapes and field names remain frozen.

## Serialized ownership deviation

The minimal repair may edit:

- `src/lib/planning/planned-outfit-context.ts`
- `src/lib/planning/__tests__/planned-outfit-context.test.ts`
- `src/lib/planning/planned-outfit-resolver.ts`
- `src/lib/planning/__tests__/planned-outfit-resolver.test.ts`
- `src/lib/outfit/__tests__/outfit-bundle-producer.test.ts`

No Hjem, Uke, App, Paakledning, engine, package, media or public result-shape
edit is authorized by this amendment.

## Required proof

- Same raw canonical input through current and planned factories has different
  context, source, transition, snapshot, item and option identities, while the
  recommendation ID/fingerprint remain equal.
- Changing only a planned interval changes those ownership identities.
- Context transition equals seed transition equals supported base transition;
  every option outcome retains that transition.
- The planned resolver matches a trusted route-qualified context to the exact
  raw event, transition and interval without weakening clone/forgery checks.
- Cross-kind, stale-interval, forged and malformed inputs fail closed.
- Existing full-recommendation, no-recompute, 11-item list-only, inventory,
  package/media and clean-scope gates remain green.
