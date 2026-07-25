# Plan 02-08 producer-result provenance amendment

**Status:** LOCKED FOR 02-08 REPAIR
**Date:** 2026-07-25
**Trigger candidate:** `6eecf4d7a0f9fb51fb21ff7a3759cc50c0782b2d`
**Trigger verdict:** FAIL, unresolved P1

## Reason

The repaired four-file candidate validated the frozen public shape of an
`OutfitBundleProducerResult`, but shape alone did not prove that the top-level
result had actually been returned by `produceOutfitBundle`.

Independent review demonstrated that a caller could wrap an authentic
factory snapshot in a manually frozen `supported` object and replace its
source or weather, proxy that wrapper, or construct a syntactically valid
`unsupported-cardinality` result containing arbitrary garment labels. Those
objects reached authoritative panel branches despite never being emitted by
the producer.

Plan 02-08 therefore remains open. Candidate `6eecf4d...` is retained only as
failed repair evidence and must never be activated or accepted as PASS.

## Approved scope expansion

This amendment adds exactly these two implementation paths to the original
four-path Plan 02-08 scope:

- `src/lib/outfit/outfit-bundle-producer.ts`
- `src/lib/outfit/__tests__/outfit-bundle-producer.test.ts`

The cumulative Plan 02-08 implementation surface is therefore:

- `src/lib/outfit/feature-flags.ts`
- `src/lib/outfit/outfit-bundle-producer.ts`
- `src/lib/outfit/__tests__/outfit-bundle-producer.test.ts`
- `src/components/outfit/OutfitTruthPanel.tsx`
- `src/components/outfit/VerifiedAvatarComposite.tsx`
- `src/components/outfit/__tests__/OutfitTruthPanel.test.tsx`

No App, Hjem, Uke, Paakledning, navigation, package, engine, global token,
media, storage, network, or entitlement path is unlocked by this amendment.
The feature flag remains compile-time false.

## Required producer-owned boundary

- `outfit-bundle-producer.ts` owns a module-private `WeakSet<object>` for
  top-level public results.
- Every result returned by the public `produceOutfitBundle` entry point is
  recursively frozen first and then registered in that set, including every
  supported, unsupported-cardinality, and unavailable result.
- The module exports a getter-free
  `isOutfitBundleProducerResult(value: unknown)` guard.
- The guard checks object identity membership before any prototype,
  descriptor, property, freeze, iteration, or nested-value read. A transparent
  proxy and a deep-equal clone must therefore fail without invoking traps.
- The guard may additionally confirm the registered value remains frozen, but
  it must not reconstruct trust from public fields.
- `OutfitTruthPanel` requires this provenance guard before its existing
  structural and branch validation. No hook, store subscription, row
  registration, image, map, guide action, motion marker, weather copy, or
  garment advice may occur for an unregistered wrapper.

Factory ownership is process-local by design. Results are not persisted or
serialized. A development hot-module replacement may invalidate an old
in-memory result and render neutral until the route is reopened; that is the
correct fail-closed behavior and does not weaken production.

## Required repair evidence

Producer tests must prove that the guard:

- accepts real supported, unsupported-cardinality, and unavailable outputs;
- rejects a frozen deep-equal clone of each branch;
- rejects a transparent top-level proxy around a real output;
- rejects accessor and throwing-proxy inputs with zero getter/trap calls;
- does not accept nested factory truth or an authentic option as a top-level
  producer result.

Panel tests must build accepted branch fixtures through the real producer and
prove neutral output for:

- a valid-looking frozen supported wrapper around an authentic base;
- individually substituted valid source and finite weather values;
- option grafting, duplicate options, and a transparent proxy;
- an exact-shape frozen unsupported wrapper with contiguous unique IDs and
  arbitrary labels;
- a cloned real unavailable result;
- every previously covered malformed, avatar, selection, registration, and
  hidden-middle case.

After repair, all focused/full tests, typecheck, lint, main and bare builds,
inventory, diff/scope/protected-path checks, and clean-worktree checks must
pass. Both independent review lanes must bind to the new exact candidate SHA
and rerun from clean detached worktrees. Any later edit invalidates both
reviews.
