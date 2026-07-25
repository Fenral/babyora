# Phase 3 dependency contract with Phase 2

**Status:** IMPORT-ONLY REFERENCE TO THE AUTHORITATIVE PHASE-2 EXPORTS
**Authoritative source:** the exported modules in the exact candidate named by `.planning/phases/02-outfit-truth-antrekkskart/02-09-SUMMARY.md`
**Planning index:** `.planning/phases/02-outfit-truth-antrekkskart/02-INTERFACE-CONTRACT.md`
**Integration gate:** exact `status: PASS`, `feature_flag: true`, and `phase2_candidate_sha: <40hex>`
**Date:** 2026-07-24

This file deliberately does not mirror Phase-2 structural type definitions. Phase 3 compiles against the authoritative exports at the accepted Phase-2 SHA. If an export, property, or meaning differs from this reference, integration stops; Phase 3 never writes a look-alike type or compensates with labels, array positions, CSS, private component state, or independent candidate selection/scanning from `base.garments`.

## Ownership boundary

| Concern | Owner | Frozen boundary |
|---|---|---|
| Finalized recommendation and exact child/weather/activity context | Existing factory-owned flow | The same immutable context crosses Home to Outfit; Outfit does not recompute it. |
| `OutfitTruthSnapshotV1`, occurrence IDs, garment/equipment separation, `AvatarVisibleSlot`, `AvatarVisualCoverage`, `avatarCoverage`, and avatar visibility/occlusion truth | Phase 2 | Phase 3 consumes the exported readonly result and never invents a candidate or layer outcome. |
| Responsive Antrekkskart layout | Phase 2 | It is derived presentation and never supplies Home identity, visibility, or transition geometry. |
| Real Outfit row registration | Phase 2 | Phase 2 exports `RegisterOutfitRow`; it does not register Home nodes. |
| `PaakledningScreen`, activation flag, row forwarding, and `transitionVisualState` | Phase 2 | Phase 3 passes the frozen props from `App` and never edits the screen. |
| Home source registration, transient rectangles, replay, lifecycle, overlay, and App/Hjem wiring | Phase 3 | DOM and geometry state is App-lifetime only and fails closed. |

## Exact import rule

The 03-05 adapter must use type-only imports from the accepted Phase-2 candidate's actual export sites. These names are required and must not be re-declared in Phase 3:

```ts
import type {
  AvatarVisibleSlot,
  AvatarVisualCoverage,
  OutfitItemId,
  OutfitTruthSnapshotV1,
} from "../outfit/outfit-truth";
import type {
  OutfitBundleProducerResult,
} from "../outfit/outfit-bundle-producer";
import type {
  OutfitTransitionVisualState,
  RegisterOutfitRow,
} from "../outfit/outfit-transition-contract";
```

The implementation receives the supported bundle's `base` as the authoritative `OutfitTruthSnapshotV1`, uses its avatar truth exactly as described below, and passes the imported `OutfitTransitionVisualState` through the `transitionVisualState` prop. That prop remains only the scalar `"settled" | "landing"` presentation state; it never selects garments or carries visibility data. The import paths above name the Phase-2-owned planned modules; the exact accepted exports at `phase2_candidate_sha` are the compiler oracle. Phase 3 does not import or model Phase-2 alternative-option internals.

Phase 3 may define only its own internal `RegisterHomeAnchor` and geometry/capture records. It must not re-export, alias by structural duplication, widen, narrow, or reconstruct any Phase-2 domain type.

## Authoritative transition-candidate rule

For a supported `OutfitBundleProducerResult`, Phase 3 derives the intended traveling set only through this exact sequence:

1. Treat `base` as the imported `OutfitTruthSnapshotV1`.
2. Start only from `base.avatar.visibleGarmentIds`, preserving that authoritative ID order. An empty list yields static settlement.
3. Resolve each listed branded `OutfitItemId` exactly once in `base.garments`. A missing match, duplicate match, duplicate visible ID, or any match in `base.equipment` yields static settlement.
4. Require every resolved garment to have `visibleOnAvatar === true` and non-null valid `avatarCoverage: AvatarVisualCoverage`.
5. Validate the coverage using the imported `AvatarVisibleSlot` domain: nonempty valid `bodyCoverage` and `visibleSlots`, finite `visualLayerRank`, and explicit valid `occludesSlots`.
6. Use coverage slots, rank, and explicit occlusion to confirm that every selected garment has surviving visible coverage and that the selected set has no tie, contradictory/partial occlusion, or hidden entry. Any ambiguity yields static settlement.

`base.garments` may be indexed only to resolve and validate IDs already selected by `base.avatar.visibleGarmentIds`; scanning, filtering, or mapping it must never independently add a candidate. Labels, categories, avatar asset paths, Antrekkskart nodes, and DOM order are not alternate selectors. `transitionVisualState` remains unrelated scalar presentation state.

Any of these conditions yields immediate static settlement:

- unsupported-cardinality, unavailable, absent, or provenance-invalid bundle;
- absent, null, unknown, malformed, or duplicate avatar-visible ID;
- no matching garment, more than one matching garment, `visibleOnAvatar !== true`, or an ID that resolves to equipment;
- null/invalid `avatarCoverage`, unknown/empty/duplicate slot data, non-finite rank, unresolved/tied/partial/contradictory occlusion, or an entry determined hidden;
- missing/duplicate Home source or Outfit row, non-positive geometry, stale identity, reduced motion, or lifecycle instability.

Static settlement preserves the complete semantic Outfit and heading focus. It never reports a user-facing animation error and never partially animates a subset.

## Registration boundary

Phase 2's `RegisterOutfitRow` is consumed by type-only import and forwarded unchanged to the frozen Phase-2 screen. Phase 2 registers only real semantic Outfit rows and unregisters with `null`.

Phase 3 owns a distinct internal callback:

```ts
type RegisterHomeAnchor = (
  itemId: OutfitItemId,
  element: HTMLElement | null,
) => void;
```

Home and Outfit registries meet only inside the App-lifetime coordinator. Elements and rectangles never enter storage, URLs, analytics, application logs, network state, or Phase-2 truth.

## Motion-readiness predicate

Motion is eligible only when all conditions are true:

1. The user deliberately activated today's Home Outfit CTA.
2. Effective reduced motion is false.
3. The exact snapshot/recommendation/transition identity matches.
4. The bundle is the accepted supported `OutfitBundleProducerResult`.
5. The complete intended set starts only from `base.avatar.visibleGarmentIds`; every ID resolves exactly once in `base.garments` and passes `visibleOnAvatar`, `avatarCoverage`, slot/rank, occlusion, and non-equipment checks above.
6. Every intended ID has exactly one Phase-3 Home source and exactly one Phase-2 Outfit row.
7. Every rectangle is finite and positive.
8. Viewport, scroll, orientation, document visibility, and recommendation identity remain stable.
9. The exact context has not already been consumed or cancelled.

The first failed predicate settles statically. Phase 3 never promotes an unlisted `base.garments` entry, equipment, an unknown/null/hidden item, a partial set, a guessed anchor, or Antrekkskart geometry. `transitionVisualState` changes only scalar landing/settled presentation.

## Integration gate

Plans that touch `HjemScreen.tsx` or `App.tsx` must:

1. read exact `status`, `feature_flag`, and `phase2_candidate_sha` labels from `02-09-SUMMARY.md`;
2. require `status: PASS` and `feature_flag: true`;
3. verify the 40-character Phase-2 commit exists and is an ancestor;
4. compile against the accepted exported `AvatarVisibleSlot`, `AvatarVisualCoverage`, `OutfitTruthSnapshotV1`, `avatarCoverage`, `OutfitBundleProducerResult`, `RegisterOutfitRow`, and scalar `transitionVisualState` surface without local structural mirrors;
5. run the complete visibility/occlusion adapter matrix;
6. start from a clean isolated worktree;
7. pass frozen Phase-2 props without editing `PaakledningScreen.tsx`;
8. stop on any variance rather than guessing an adapter or editing Phase 2.

The separate Phase-1 gate reads exact `candidate_sha` from `.planning/phases/01-planlegg-dagslinjen/01-18-SUMMARY.md`; the verifier may normalize that accepted value to an internal `phase1CandidateSha` variable only after strict single-value 40-hex parsing.
