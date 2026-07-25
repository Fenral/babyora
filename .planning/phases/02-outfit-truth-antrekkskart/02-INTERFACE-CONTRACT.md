# Phase 2 → Phase 3: Outfit truth interface contract

**Status:** FROZEN WITH APPROVED IDENTITY AND WEATHER-OPTIONALITY AMENDMENTS
**Date:** 2026-07-25
**Owner:** Phase 2 owns outfit truth, responsive Antrekkskart, production `PaakledningScreen`, activation flag, Outfit-row registration, the serialized 02-05 Hjem/Uke preservation of full producer inputs after Phase-1 01-18, and the serialized 02-09 `App` current/planned bundle bootstrap. After 02-09 passes, Phase 3 extends `HjemScreen` and `App` for Home atmosphere/source registration, transient DOM measurement and transition orchestration without replacing the producer seed or editing Paakledning.

Identity semantics are amended by
`02-IDENTITY-AMENDMENT.md`. That amendment has precedence only where the
original text implied byte-equivalent IDs across different current, planned or
planned-interval provenance.

Optional weather-symbol preservation is amended by
`02-WEATHER-OPTIONALITY-AMENDMENT.md`. That amendment has precedence only where
the original text required a source `RecommendInput` that omits its optional
`weather.symbolCode` to equal the display-facing context weather shape.

## Purpose

Phase 3 may animate only a Phase-2-owned, already-finalized recommendation. Motion is never allowed to derive, reorder, add, remove or rename garments. `[VERIFIED: docs/BABYORA-UX-MOTION-BIBLE.md:53-60; .planning/REQUIREMENTS.md:78-82]`

Home → Outfit integration must wait until this contract is implemented and its contract tests are green. Independent Phase 2 and Phase 3 foundations may proceed in isolated branches/worktrees before that gate. `[VERIFIED: AGENTS.md:22-29; docs/DECISION-LOG.md:7-29]`

## Ownership boundary

| Capability | Owner | Frozen rule |
|---|---|---|
| Finalized recommendation and exact weather/child/activity context | Existing engine/context producer | One factory-owned snapshot crosses navigation; Outfit does not recompute it. `[VERIFIED: src/lib/planning/planned-outfit-context.ts; docs/CURRENT-HANDOFF.md]` |
| Garment occurrence IDs, dressing order, body region/anchor, canonical avatar coverage/occlusion and verified avatar truth | Phase 2 | These are immutable semantic facts shared by Home and Outfit. |
| Equipment | Phase 2 | Equipment is the semantic union of engine category `utstyr` and canonical `garmentIdFor(label)` → `categoryFor(id) === "utstyr"`. This includes legacy-`ekstra` varmepose, saueskinn, sovepose, regnponcho and ansiktskrem. Equipment is separate, excluded before the 1–10 count, gets no body connector and is not eligible for garment travel. `[VERIFIED: src/data/garment-illustrations.ts; src/data/garment-category.ts; scripts/outfit/inventory-v1.ts]` |
| Responsive node boxes and connector paths | Phase 2 | They are output from `layoutOutfitMap`; they are not persisted in outfit truth. |
| Home and Outfit DOM rectangles | Phase 3 | Rectangles are measured only at activation/mount and never enter domain state. |
| Home → Outfit timeline, cancellation and reduced-motion behavior | Phase 3 | Any mismatch resolves immediately to the complete static Outfit. |
| `PaakledningScreen`, Antrekkskart, Outfit-row forwarding and `OUTFIT_TRUTH_V1_AVAILABLE` | Phase 2 | The final `02-09` candidate wires the reusable panel into the production screen and activates it only after gates. Phase 3 must not edit these files or query internal CSS. |
| `App` current/planned bundle bootstrap | Phase 2 in serialized 02-09 | App calls `produceOutfitBundle` from each exact context seed plus its explicit route discriminant, stores the result in route state, and passes bundle, stable Outfit-row registrar, settled visual state and warm/cold callback to Paakledning. |
| Hjem/Uke exact-context producer handoff | Phase 2 in serialized 02-05, after Phase-1 01-18 | Existing context-producing calls pass the already-computed full normalized `RecommendInput` and full finalized `Recommendation` into the context factory. No recommendation is rerun or flattened for the seed. |
| `HjemScreen` Home sources and transition overlay | Phase 3 after 02-09 | Phase 3 preserves the Phase-2 seed handoff and App bootstrap while adding Home source registration/navigation/transition orchestration. Phase 3 never edits Paakledning; Uke receives no further Phase-3 change. |

## Frozen semantic types

The names may change only if an adapter preserves this exact behavior.

```ts
type OutfitSnapshotId = string & { readonly __brand: "OutfitSnapshotId" };
type OutfitItemId = string & { readonly __brand: "OutfitItemId" };

type BodyRegion =
  | "head"
  | "neck"
  | "torso"
  | "arms"
  | "hands"
  | "hips"
  | "legs"
  | "feet"
  | "whole_body"
  | "unknown";

type AvatarPose = "sitting" | "standing";

type AvatarVisibleSlot =
  | "head"
  | "neck"
  | "torso"
  | "arms"
  | "hands"
  | "hips"
  | "legs"
  | "feet";

type AvatarVisualCoverage = Readonly<{
  coverageVersion: 1;
  bodyCoverage: readonly AvatarVisibleSlot[];
  visibleSlots: readonly AvatarVisibleSlot[];
  visualLayerRank: number; // finite; higher is visually outer
  occludesSlots: readonly AvatarVisibleSlot[];
}>;

type NormalizedBodyAnchor = Readonly<{
  anchorVersion: 1;
  pose: AvatarPose;
  x: number; // finite, 0..1
  y: number; // finite, 0..1
}>;

type OutfitGarmentTruth = Readonly<{
  itemId: OutfitItemId;
  sourceLabel: string;              // exact finalized legacy-engine item string
  label: string;                    // normalized display label
  catalogGarmentId: string | null;  // null is retained, never filtered
  category: "innerst" | "mellomlag" | "yttertoy" | "ekstra";
  order: number;                    // unique contiguous 1..garments.length
  bodyRegion: BodyRegion;
  bodyAnchor: NormalizedBodyAnchor | null;
  avatarCoverage: AvatarVisualCoverage | null;
  visibleOnAvatar: boolean;
}>;

type OutfitEquipmentTruth = Readonly<{
  itemId: OutfitItemId;
  sourceLabel: string;
  label: string;
  catalogGarmentId: string | null;
  order: number;
}>;

type OutfitAvatarTruth = Readonly<{
  pose: AvatarPose;
  stateKey: string;
  verifiedAssetPath: string | null;
  visibleGarmentIds: readonly OutfitItemId[];
}>;

type OutfitTruthSnapshotV1 = Readonly<{
  contractVersion: 1;
  snapshotId: OutfitSnapshotId;
  recommendationId: string;
  recommendationFingerprint: string;
  transitionContextId: string;
  garments: readonly OutfitGarmentTruth[];
  equipment: readonly OutfitEquipmentTruth[];
  avatar: OutfitAvatarTruth;
}>;

type OutfitTruthBuildResultV1 =
  | Readonly<{
      kind: "supported";
      snapshot: OutfitTruthSnapshotV1; // exactly 1..10 semantic garments
    }>
  | Readonly<{
      kind: "unsupported-cardinality";
      reason: "semantic-garment-count-outside-1-10";
      orderedGarments: readonly Readonly<{
        itemId: OutfitItemId;
        sourceLabel: string;
        label: string;
        order: number;
      }>[];
      equipment: readonly OutfitEquipmentTruth[];
    }>;
```

The build result is intentionally explicit. The read-only finite-domain inventory measured a maximum of 11 semantic garments, with 12,960 branch-representative results above ten. Phase 2 must not normalize those to ten. `unsupported-cardinality` preserves the complete ordered list/equipment for an honest static fallback and makes map, connectors, verified-avatar claim, alternatives and Phase-3 motion ineligible. The locked ROADMAP range remains 1–10 pending an owner/checker decision; a third 11–12 density mode is not silently introduced.

### Semantic invariants

1. The factory consumes a finalized recommendation and exact context. Callers cannot construct a trusted snapshot with a type assertion. This extends the existing factory-owned `PlannedOutfitContext` pattern. `[VERIFIED: src/lib/planning/planned-outfit-context.ts]`
2. `snapshotId`, `recommendationFingerprint` and the factory-derived route-qualified `transitionContextId` must all match across Home, navigation and Outfit. A mismatch disables motion but never blocks the static screen. Identical route-qualified input is deterministic; different current/planned/interval provenance cannot reuse transition, snapshot, occurrence or option ownership.
3. `itemId` is opaque, deterministic inside the exact snapshot and unique per occurrence. It is derived from the snapshot/context identity, engine category, exact `sourceLabel` and duplicate occurrence ordinal — never from display label, catalog ID or render index alone.
4. Duplicate labels and duplicate catalog IDs remain distinct occurrences with distinct `itemId` values.
5. Garments preserve finalized engine order exactly. Phase 2 does not re-sort by body region, visual position or catalog category.
6. Semantic classification runs before counting. `equipment` contains every engine-`utstyr` item plus every canonical catalog-`utstyr` item even when legacy placed it under `ekstra`; `garments` contains every remaining occurrence. Varmepose, saueskinn and sovepose are mandatory classifier regressions. Neither collection is truncated, collapsed or converted to `+N`. `[VERIFIED: src/data/garment-category.ts; scripts/outfit/inventory-v1.ts]`
7. The release-supported map range is exactly 1–10 semantic garments after equipment separation. The factory returns `unsupported-cardinality` outside that range, preserving all ordered text/equipment without constructing graphical/alternative/avatar/motion truth. The measured 11-garment representative is recorded in `02-RESEARCH.md`; it cannot be normalized without changing finalized advice.
8. Unknown catalog mappings remain visible with `catalogGarmentId: null`, `bodyRegion: "unknown"` and `bodyAnchor: null`. They disable body-map/transition eligibility rather than receiving a guessed anchor.
9. `bodyAnchor` is normalized to the selected sitting/standing avatar coordinate space. It is semantic body truth; responsive node position is not.
10. Avatar visibility is derived only from candidate-versioned canonical per-item `AvatarVisualCoverage`. Every garment must have valid non-null body coverage, visible slots, finite layer rank and explicit occlusion. For each slot, a unique highest rank establishes outer precedence. A higher occurrence hides lower coverage only where `occludesSlots` explicitly permits it; a tie, null/unknown slot, missing coverage or unresolved partial conflict is ambiguous and returns neutral.
11. The derived surviving occurrence set is representable only when its catalog IDs are unique. Duplicate surviving catalog IDs/occurrences return neutral because the manifest cannot encode multiplicity. Equipment never participates.
12. `avatar.verifiedAssetPath` is resolved only from `public/avatars/verified/index.json` when exactly one row has the same pose and exact complete derived visible catalog-ID set. Missing, extra, duplicate, unknown, ambiguous, null-coverage or differently posed items return `null`; no level/nearest-neighbor path synthesis is trusted. Every manifest row must be covered by tests, including a hidden-inner-layer case. `[VERIFIED: public/avatars/verified/index.json; src/components/outfit/VerifiedAvatarComposite.tsx]`
13. `visibleOnAvatar` and `visibleGarmentIds` are populated only after that exact match and only for the surviving occurrence IDs. Hidden base/middle layers remain in `garments`. Any mismatch clears the entire visible set and uses neutral rather than partially claiming an asset.
14. All arrays and nested records are recursively frozen and validated as own data properties; labels are rendered as text, never `innerHTML`. `[VERIFIED: src/lib/planning/planned-outfit-context.ts; CITED: https://owasp.org/www-project-application-security-verification-standard/]`

## Responsive layout output

`nodeAnchor` is intentionally not part of `OutfitTruthSnapshotV1`. It changes with garment count, container width, text scale and avatar pose.

```ts
type OutfitMapMode = "spacious" | "compact-rails";

type OutfitMapNodeLayout = Readonly<{
  itemId: OutfitItemId;
  side: "left" | "right";
  box: Readonly<{ x: number; y: number; width: number; height: number }>;
  connector: readonly Readonly<{ x: number; y: number }>[];
}>;

type OutfitMapLayoutV1 = Readonly<{
  layoutVersion: 1;
  snapshotId: OutfitSnapshotId;
  mode: OutfitMapMode;
  width: number;
  height: number;
  nodes: readonly OutfitMapNodeLayout[];
}>;

function layoutOutfitMap(
  snapshot: OutfitTruthSnapshotV1,
  availableWidth: number,
): OutfitMapLayoutV1;
```

The layout function is pure and deterministic. It returns `spacious` for 1–4 garments and `compact-rails` for 5–10. Nodes on each side are sorted monotonically by body-anchor Y (then dressing order) and routed through side-specific lanes; selection/focus never changes geometry.

## Executable presentation contract

- The ordered-list heading is exactly `Ta på innerst først`.
- `spacious` is the only graphical mode for 1–4; `compact-rails` is the only graphical mode for 5–10. Unsupported cardinality is complete list-only output, never a squeezed third mode, `+N`, truncation or overlap.
- The active garment's full caption remains in normal document flow outside absolute/SVG geometry at every width and 200% text.
- The screen root reuses `.ba-temp-root` plus `data-temp="kald|mild|varm"` from the existing `tempAxisFor(feelsLikeC, tempC)` perceived-temperature contract. It adds no threshold and uses the existing light/dark temperature tokens.
- Paired state has three independent fields: persistent `selectedId`, transient `focusId`, and transient `hoverId`; `highlightedId = focusId ?? hoverId ?? selectedId`. Pointer entry/leave and focus/blur never change `selectedId`. Click/Enter/Space changes `selectedId`, exposes `aria-pressed`, and never programmatically moves focus to the paired control.
- Every inactive informational connector remains at least 3:1 against its adjacent actual background in light/dark × kald/mild/varm. Active/focused connectors add width and/or dash/pattern plus the row/node text/outline cue, so state never depends on color. Forced colors uses system colors rather than preserving authored low-emphasis color.

## Alternative outcome contract

The static `alternatives.ts` table is candidate data, not proof that an option is valid for the active child/weather/activity scenario. `[VERIFIED: src/lib/wool-layers/alternatives.ts; src/lib/wool-layers/finalize-safety.ts]`

```ts
type OutfitAlternativeOptionV1 = Readonly<{
  optionId: string;
  sourceItemId: OutfitItemId;
  targetCatalogGarmentId: string | null;
  targetLabel: string;
  comparison: Readonly<{
    advantages: readonly string[];
    tradeoffs: readonly string[];
  }>;
  outcome: OutfitTruthSnapshotV1; // produced after final safety containment
}>;
```

An option is exposed only when the producer still has the complete normalized `RecommendInput` and complete finalized `Recommendation` with original categories/finalizer data, applies the exact source occurrence, reruns `applySwapsFinalized`, verifies that the target survives finalization and constructs a new factory-owned outcome snapshot. A flattened string projection is rejected. Selecting the option replaces all avatar/node/row data from `outcome`; the UI never patches one label locally.

## Phase-2-owned DOM registration surface

```ts
type RegisterOutfitRow = (
  itemId: OutfitItemId,
  element: HTMLElement | null,
) => void;

// Phase-3-owned internal surface, shown here only to freeze non-conflation.
// Phase 2 neither exports nor calls it.
type RegisterHomeAnchor = (
  itemId: OutfitItemId,
  element: HTMLElement | null,
) => void;

type OutfitBundleSourceV1 =
  | Readonly<{ kind: "current"; sourceContextId: string }>
  | Readonly<{
      kind: "planned";
      sourceContextId: string;
      planningEventId: string;
      plannedForIso: string;
    }>;

type OutfitBundleWeatherV1 = Readonly<{
  tempC: number;
  feelsLikeC: number;
}>;

type DeepReadonly<T> =
  T extends (...args: never[]) => unknown ? T
    : T extends readonly (infer U)[] ? readonly DeepReadonly<U>[]
      : T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
        : T;

type OutfitBundleProducerSeedV1 = Readonly<{
  seedVersion: 1;
  sourceContextId: string;
  transitionContextId: string;
  recommendationId: string;
  recommendationFingerprint: string;
  input: DeepReadonly<RecommendInput>;
  finalizedRecommendation: DeepReadonly<Recommendation>;
}>;

type ProduceOutfitBundleArgsV1 = Readonly<{
  seed: OutfitBundleProducerSeedV1;
  source: OutfitBundleSourceV1;
}>;

function produceOutfitBundle(
  args: ProduceOutfitBundleArgsV1,
): OutfitBundleProducerResult;

type OutfitBundleProducerResult =
  | Readonly<{
      kind: "supported";
      bundleVersion: 1;
      source: OutfitBundleSourceV1;
      weather: OutfitBundleWeatherV1;
      base: OutfitTruthSnapshotV1;
      options: readonly OutfitAlternativeOptionV1[];
    }>
  | Readonly<{
      kind: "unsupported-cardinality";
      bundleVersion: 1;
      source: OutfitBundleSourceV1;
      weather: OutfitBundleWeatherV1;
      truth: Extract<OutfitTruthBuildResultV1, { kind: "unsupported-cardinality" }>;
    }>
  | Readonly<{
      kind: "unavailable";
      bundleVersion: 1;
      reason:
        | "invalid-input"
        | "input-result-mismatch"
        | "invalid-provenance"
        | "truth-build-failed";
    }>;

type OutfitTransitionVisualState = "settled" | "landing";

type PaakledningOutfitIntegrationProps = Readonly<{
  onBack: () => void;
  outfitBundle?: OutfitBundleProducerResult; // absent preserves the safe Phase-1 text fallback
  registerOutfitRow?: RegisterOutfitRow;
  transitionVisualState?: OutfitTransitionVisualState; // default "settled"
  onOpenWarmColdGuide: () => void;
}>;
```

- Phase 2 registers only the real `outfit-row` target element by `itemId`, never an Antrekkskart node as a Home source.
- `null` unregisters on unmount.
- `PaakledningScreen` accepts `registerOutfitRow?: RegisterOutfitRow` and forwards the same function unchanged to `OutfitTruthPanel` → `OutfitGarmentList`; it neither rewrites IDs nor falls back to labels/selectors.
- `outfitBundle` is additive/optional for cross-phase atomicity. Present valid bundles use the enabled Phase-2 panel; absent bundles preserve the existing safe Phase-1 text fallback without recomputation. Invalid/unavailable present bundles are neutral, never silently treated as absent.
- `HjemScreen` and `UkeScreen` pass their already-computed `RecommendInput` and already-finalized full `Recommendation` to the separate current/planned factory entry points in serialized 02-05 after Phase-1 01-18. The factory accepts those two source objects, but callers cannot inject `outfitProducerSeed`, seed IDs, source kind, provenance or a flattened substitute.
- The current/planned entry points share one canonicalizer that validates plain own-data objects, normalizes and deep-clones every optional/nested input field plus every full Recommendation field (activity, tempBand, categorized layers, notes, structured notes, summary, optional safety flags and optional severity), preserves presence/absence, recursively freezes them, and derives stable route-qualified IDs/provenance itself. Accessors, custom prototypes, cycles, mutation, missing required Recommendation data, malformed optional finalizer data or caller-supplied provenance fail closed.
- The full finalized Recommendation must agree with the exact input/activity and its category-preserving flattened garment/equipment projection must equal the context's existing recommendation projection and fingerprint basis. This check preserves the content-derived recommendation identity while the factory deterministically qualifies context/transition ownership by current/planned/interval provenance; it never rebuilds layer categories from strings or calls `recommend`.
- App supplies only the explicit `current`/`planned` source from its `Drill` discriminant and must not infer source from access capability.
- In 02-09, both real App open handlers call `produceOutfitBundle` once, store that exact result in route state, and pass it to both Paakledning branches. Production routes never omit or directly inject the bundle; optional absence remains only for atomic legacy/fixture fallback.
- `transitionVisualState` is visual-only. `"landing"` cannot delay mount, heading focus, content, controls, registration or accessibility; it cannot use `hidden`, `display:none`, `visibility:hidden`, `inert` or accessibility-tree suppression. Default is `"settled"`.
- Phase 2 does not export or call a Home-source registration from Outfit components. Phase 3 owns the separate internal `RegisterHomeAnchor`, its Hjem source lifecycle, and the coordinator combining Home sources with Phase-2 rows.
- Phase 2's 02-09 App bootstrap owns the stable Outfit-row callback and exact `() => setDrill({ kind: "guide", target: "varm-kald" })` recovery callback. Phase 3 later preserves/extends App after the 02-09 handoff; there is no generic anchor-kind callback and Phase 3 does not edit `PaakledningScreen`.
- The registry lives only in the current App lifetime; it is not written to storage, URL, analytics, logs or network.
- Outfit rows are fully rendered, focusable and semantically complete before Phase 3 measures them.
- The transition layer is `aria-hidden`, non-focusable and never delays access to the static content.

## Phase-3 readiness predicate

Motion is eligible only when every condition below is true:

1. the user deliberately activated today's Home Outfit CTA;
2. effective reduced motion is false;
3. `snapshotId`, `recommendationFingerprint` and `transitionContextId` match exactly;
4. the truth snapshot passes every invariant;
5. Phase 3 has exactly one explicitly registered Home source for each intended traveling garment and Phase 2 has exactly one registered target row; Antrekkskart nodes are never substituted for Home sources;
6. every measured rectangle is finite and positive;
7. viewport, scroll position, orientation and document visibility stay stable during measurement;
8. the transition has not already been consumed or cancelled.

On the first failure, Phase 3 removes any clones/timers, shows the complete static Outfit immediately and puts focus on the Outfit heading. No user-facing error is shown for a skipped explanatory animation. `[VERIFIED: .planning/REQUIREMENTS.md:89-103; docs/BABYORA-UX-MOTION-BIBLE.md]`

## Contract tests required before Home → Outfit integration

| Test | Required result |
|---|---|
| 1, 4, 5 and 10 garments | Contiguous order, unique occurrence IDs, no truncation and matching Home/Outfit IDs |
| Duplicate source labels | Distinct stable IDs and correct row match |
| Unknown catalog/body mapping | Complete textual row retained; map and motion fail closed |
| Engine-`utstyr` plus catalog-`utstyr` (varmepose/saueskinn/sovepose included) | Excluded before garment count; appears only in equipment collection/list; no connector, avatar claim or garment travel |
| Measured 11-garment representative | Complete ordered list/equipment retained through `unsupported-cardinality`; no map, alternative, avatar claim or motion and no truth-normalization |
| Avatar visibility catalog and all manifest rows | Canonical body/visible slots, layer rank and explicit occlusion derive a unique set; all 24 rows match; hidden inner layer is excluded; duplicate/tie/null/unknown/ambiguous/missing/extra/pose mismatch is neutral |
| Same exact context rendered twice | Identical snapshot and item IDs |
| Changed fingerprint/context | Different snapshot identity; motion rejected |
| Missing/duplicate/zero-size DOM anchor | Navigation succeeds; no clones or waiting |
| Reduced motion | No detach/travel/land; identical content, order and focus |
| ESC/back/unmount during transition | All transient state is removed and focus returns correctly |

## Integration gate

Home → Outfit integration is blocked until:

- the Phase-2 factory and layout contract tests are green;
- Phase-1 01-18 is accepted first, then `02-05-SUMMARY.md` records the exact Hjem/Uke full-input/full-finalized-Recommendation preservation signatures, recursive-freeze tests and no-second-`recommend` audit;
- the Phase-2 planner/checker confirms the semantic invariants above;
- `02-09-SUMMARY.md` records `status: PASS`, exact `phase2_candidate_sha`, and `feature_flag: true` for the production `PaakledningScreen` integration;
- Phase 3 has adapted its dependency contract to separate equipment and semantic body truth from responsive layout;
- Phase 2 is the sole owner of `PaakledningScreen.tsx`, `OUTFIT_TRUTH_V1_AVAILABLE`, Outfit-row forwarding and the semantic-preserving visual-state prop;
- only after Phase-1 01-18 PASS, Phase 2's serialized 02-05 worker may edit the existing Hjem/Uke context-producing call sites solely to pass preserved full input/finalized Recommendation objects into the factory;
- Phase 2's serialized 02-09 worker is the sole initial owner of the minimal `App.tsx` current/planned producer/prop bootstrap and makes no further Hjem/Uke edit;
- only after accepting 02-09, the Phase-3 integration worker owns `HjemScreen.tsx` and post-handoff `App.tsx` Home source/navigation/transition extensions while preserving the baseline producer/prop flow;
- no new cost commitment above NOK 1,000 is incurred without explicit owner approval. Free sources and included quotas remain allowed. `[VERIFIED: AGENTS.md:22-29]`
