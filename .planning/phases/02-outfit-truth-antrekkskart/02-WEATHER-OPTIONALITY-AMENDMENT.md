# Phase 2 weather optionality amendment: exact missing-symbol preservation

**Status:** APPROVED DEVIATION
**Date:** 2026-07-25
**Applies to:** Plans 02-05, 02-06 and the Phase 2 → Phase 3 interface

## Conflict being resolved

`RecommendInput.weather.symbolCode` is optional, and the tracked inventory's
exact maximum-garment case legitimately omits it. The canonical planning
context has a required display-facing `weather.symbolCode`. Requiring those
two shapes to contain the same own field makes it impossible to create a
factory-owned seed from the exact tracked case. Adding a weather symbol to the
seed input is not acceptable because the full engine input must cross the
boundary unchanged.

## Governing decision

Canonical Phase-2 factories preserve the source `RecommendInput` exactly:

- if the source input owns `weather.symbolCode`, the context value must match
  it byte-for-byte;
- if the source input does not own `weather.symbolCode`, the frozen producer
  seed must continue to omit it;
- only the display-facing context weather receives the fixed neutral sentinel
  `unknown`;
- a caller-supplied value other than that sentinel fails closed when the
  source field is absent;
- the sentinel is never inserted into the engine input, never passed through
  `recommend`, and never presented as measured MET data;
- current/planned route identity, recommendation provenance and all legacy
  Phase-1 behavior remain unchanged.

This is a shape adapter for an optional source field, not weather
normalization. It authorizes no forecast, threshold, UI, copy or engine
change.

## Serialized ownership deviation

The minimal dependency repair may edit:

- `src/lib/planning/planned-outfit-context.ts`
- `src/lib/planning/__tests__/planned-outfit-context.test.ts`
- `src/lib/outfit/__tests__/outfit-bundle-producer.test.ts`

No Hjem, Uke, App, Paakledning, resolver, engine, package, media or public
producer-result edit is authorized by this amendment.

## Required proof

- The exact tracked `maxGarmentCase` crosses the planned factory without
  adding `symbolCode` to its producer-seed input.
- Its context weather uses exactly `unknown`, and any other injected context
  symbol fails closed.
- The exact case yields all 11 semantic garments as honest
  `unsupported-cardinality` truth and retains every equipment item.
- Existing source inputs that own a symbol still require byte-exact agreement.
- Current/planned identity, raw/effective substitution, clone/proxy,
  optional-safety, inventory, package/media and clean-scope gates remain
  green.
