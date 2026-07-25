# Plan 02-08 compatibility amendment

**Status:** LOCKED FOR 02-08 IMPLEMENTATION
**Date:** 2026-07-25
**Reason:** Resolve the protected-Hjem call-site collision without weakening
the Phase-2 avatar-truth boundary.

## Governing result

Plan 02-08 still owns only its four declared implementation paths. This
planning-only amendment records the source-compatible seam required by the
existing protected `HjemScreen` call site.

### Canonical avatar path

- `VerifiedAvatarComposite` receives both a factory-owned
  `OutfitTruthSnapshotV1` and that exact snapshot's `OutfitAvatarTruth`.
- Before rendering an image, it requires
  `isOutfitTruthSnapshot(snapshot) && snapshot.avatar === avatarTruth`.
- The image source may come only from
  `snapshot.avatar.verifiedAssetPath`.
- The component must not import or call `avatarAssetFor`,
  `avatarStateKeyId`, `verifiedAvatarAsset`, or any legacy level/category
  resolver.
- Null, malformed, mismatched, unknown, or untrusted truth renders the
  established neutral avatar.

### Temporary protected-Hjem compatibility path

- The existing legacy `stateKey`, `assetOverride`, and `outfitSummary` props
  remain source-compatible only because Plan 02-08 cannot edit
  `HjemScreen.tsx`.
- This branch always renders the neutral avatar.
- `assetOverride` is always ignored, even when it resembles a valid asset
  path.
- Only `stateKey.pose` may select neutral sitting/standing geometry. No
  garment, headwear, outerwear, filename, or level field may influence a
  visual claim.
- The neutral branch uses neutral accessibility text and never presents the
  legacy `outfitSummary` as verified clothing.
- Phase 3 removes this compatibility branch when it assumes Hjem ownership.

The deliberate result is that legacy Hjem may become visually neutral before
the Phase-2 integration flag is enabled. Showing no garment claim is safer
than preserving an unverified heuristic avatar.

## Selected-outcome synchronization

`OutfitTruthPanel` may subscribe read-only to
`useOutfitSelectionStore.session` only inside its supported branch.
`OutfitExperience` remains the sole owner of `open`, `select`, `reset`, and
`close`.

The active snapshot resolves as follows:

1. A closed session uses the producer result's trusted base.
2. A foreign session whose `base` or `options` references do not exactly
   match uses this panel's trusted base and never leaks the foreign avatar.
3. An exact reset session uses the exact trusted base.
4. An exact selected session uses the option outcome only when one and only
   one registered option matches `selectedOptionId` and that option's
   `outcome === session.current`.
5. Any internally inconsistent matching session renders a neutral avatar.

Unsupported-cardinality and unavailable branches do not subscribe to the
selection store and render no avatar claim.

## Required compatibility evidence

- A real-looking legacy `assetOverride` still produces no image.
- The implementation contains no legacy asset resolver import or call.
- Protected `HjemScreen.tsx` compiles unchanged.
- Initial, selected, reset, foreign-session, and inconsistent-session cases
  prove the rules above.
- Factory-owned manifest outcomes render only their exact verified asset;
  canonical neutral resolver outcomes render no image.
- Mixing canonical snapshot/avatar props with legacy avatar props is rejected
  by the TypeScript contract.
- Plan 02-09 must mount only one active supported panel because the existing
  Zustand selection session is application-global.
