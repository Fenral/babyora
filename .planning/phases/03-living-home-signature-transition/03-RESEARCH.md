# Phase 3 Research: Living Home and signature transition

**Phase:** 03-living-home-signature-transition
**Date:** 2026-07-24
**Requirements:** HOME-01, MOTION-01
**Research status:** READY FOR PLANNING

## Context decisions acknowledged

`03-CONTEXT.md` is authoritative. Research narrows implementation choices but does not reopen its decisions:

| Decision | Research consequence |
|---|---|
| D-01 | Atmosphere resolves synchronously from the same current recommendation snapshot and never gates the answer or CTA. |
| D-02 | Use existing React, CSS/DOM, `motion/react`, `motion-grammar.ts`, settings, and haptics. Add no package or parallel design system. |
| D-03 | Semantic Outfit is present and focused at T0; the transition layer is `aria-hidden`, non-focusable, and pointer-transparent. |
| D-04 | Exact triple, factory provenance, branded occurrence IDs, complete registrations, and finite positive rectangles are mandatory. |
| D-05 | Only Phase-2-verified visible transition entries may travel; null/unknown/hidden/occluded truth and structured equipment remain static. |
| D-06 | Explanatory motion finishes in 900–1400 ms; ordinary UI remains 180–250 ms. |
| D-07 | The first deliberate activation consumes one exact triple for the App lifetime, including static fallback. |
| D-08 | Phase 3 evidence is deterministic text, DOM, ARIA, rectangle, and timing output. Hardware and optional media evidence belong to Phase 4 and are not Phase 3 gates. |
| D-09 | New-file foundations proceed independently; shared Home/App/Outfit wiring waits for the exact Phase-2 candidate. |
| D-10 | Isolated worktrees and serialized shared-file ownership are mandatory. |
| D-11 | Cost is NOK 0; no new service or dependency is needed. |
| D-12 | Every promoted candidate is immutable and independently reviewed at its exact SHA with candidate/review/log evidence under an orchestrator-created external root. |

## Primary recommendation

Build two independent new-file foundations, then one serialized integration:

1. A pure atmosphere resolver plus a decorative CSS/DOM component driven by one caller-provided snapshot.
2. Pure timeline, replay, immutable capture, and fail-closed eligibility modules.
3. After Phase 2 records `status: PASS`, `feature_flag: true`, and `phase2_candidate_sha`, import its exact `OutfitTruthSnapshotV1`, `AvatarVisibleSlot`, `AvatarVisualCoverage`, `OutfitBundleProducerResult`, `RegisterOutfitRow`, and visual-state exports. Start motion selection only from `base.avatar.visibleGarmentIds`, resolve each ID exactly once in `base.garments`, and validate `visibleOnAvatar` plus `avatarCoverage` slots/rank/occlusion; wire only `HjemScreen` and `App`.
4. Render the explanation with the already-installed Motion API and the active shared motion grammar.
5. Validate through deterministic unit/component output and a Playwright-driven `tsx` browser harness; retain only text/DOM/ARIA/rectangle/timing logs.

This structure preserves useful parallel work without exposing shared screens to concurrent ownership.

## Existing stack and verified patterns

| Concern | Existing source | Phase 3 use |
|---|---|---|
| React animation | `motion/react` is already imported by `App.tsx`, `HjemScreen.tsx`, `PaakledningScreen.tsx`, and `BottomTabBar.tsx` | Use `motion` components, explicit transform/opacity targets, `MotionConfig`, `AnimatePresence`, and completion callbacks. |
| Timing source | `src/styles/motion-grammar.ts` | Add the canonical 220 ms normal and 1250 ms explanatory values only after shared-file gates clear. Pure foundation math accepts an injected timing contract. |
| Temperature | `src/lib/temp-axis.ts` | Perceived temperature chooses `kald/mild/varm`; actual temperature remains a separate atmosphere input. |
| Weather theme | `src/lib/weather-theme/symbolToTheme.ts` | Normalize known condition families; explicit provider suffixes determine daylight. Unknown input becomes neutral. |
| Motion preference | `src/hooks/useNativeSettings.ts` plus OS preference | Effective reduction is strict: OS reduce OR app reduce. App allow never overrides OS reduce. |
| Haptics | Existing Phase-1 haptic system | Reuse unchanged. Motion preference does not silently alter verified haptic policy. |
| Browser validation | Existing `tsx` scripts using Playwright | Add `e2e/home-outfit-motion.ts` with deterministic case selection and server/browser cleanup matching repository patterns. |

No install task is required. `package.json` and lockfiles must remain unchanged.

## Authoritative Phase 2 contract

The exact exported modules at the accepted Phase-2 SHA are authoritative. `02-INTERFACE-CONTRACT.md` is the planning index; `03-DEPENDENCY-CONTRACT.md` intentionally references imports and does not mirror structural shapes.

Critical facts:

- Phase 3 type-imports the accepted `OutfitTruthSnapshotV1`, `AvatarVisibleSlot`, `AvatarVisualCoverage`, branded identity, `OutfitBundleProducerResult`, `RegisterOutfitRow`, and visual-state exports; it copies none of their structures.
- `base.avatar.visibleGarmentIds` is the sole selector. Each ID must resolve exactly once in `base.garments`, have `visibleOnAvatar === true`, and have valid non-null `avatarCoverage` whose slots/rank/occlusion confirm surviving visibility.
- `base.garments` may resolve already-selected IDs but cannot add candidates. Labels, categories, avatar assets, array positions, and DOM order never supplement the motion set.
- `transitionVisualState` remains only scalar `"settled" | "landing"` presentation and never carries visibility truth.
- Unknown/null/hidden/occluded/ambiguous entries and equipment remain readable static truth and never travel.
- Unsupported/unavailable bundles remain complete static outcomes.
- Phase 3 owns a separate internal `RegisterHomeAnchor`.
- Phase 3 never edits `PaakledningScreen.tsx`; `App` passes the frozen Phase-2 props.
- Responsive map coordinates are not truth and are never used as Home source identity.

Integration stops on any mismatch rather than querying labels, CSS classes, component internals, or Antrekkskart nodes.

## Architecture

### Living Home foundation

`resolveHomeAtmosphere(input)` is pure and exhaustive over:

- perceived-temperature axis: cold/mild/warm;
- actual temperature detail;
- normalized weather condition;
- explicit day/night/polar-twilight/neutral evidence.

The output is a small semantic presentation model. A new `LivingHomeAtmosphere` composition renders two or three decorative layers with existing tokens, no pointer events, and `aria-hidden="true"`. Before the Phase-2 gate, only new files are created; `HjemScreen.tsx` and shared tokens are untouched.

Post-gate wiring passes the exact current Home context into the new composition. Recommendation text, explanation, and CTA are already present regardless of atmosphere state.

### Identity and capture

Phase 3 stores one transient candidate:

```ts
type TransitionIdentity = Readonly<{
  snapshotId: string;
  recommendationFingerprint: string;
  transitionContextId: string;
}>;

type MeasuredItem = Readonly<{
  itemId: OutfitItemId;
  source: Readonly<{ x: number; y: number; width: number; height: number }>;
  target: Readonly<{ x: number; y: number; width: number; height: number }>;
}>;
```

The production type imports the branded Phase-2 ID; the excerpt shows only shape. Capture occurs synchronously on deliberate CTA activation for Phase-3-owned Home registrations. Target rectangles come only from Phase-2-owned real Outfit row registrations after semantic Outfit mounts.

No DOM element, rectangle, replay key, or lifecycle state enters persistent storage, URL, analytics, application logs, network state, or outfit truth.

### Fail-closed eligibility

Eligibility is one pure discriminated decision. Animation requires:

- deliberate current Home activation;
- effective motion allowed;
- exact identity triple;
- factory-owned supported truth;
- every intended traveling garment mapped by the same branded ID;
- no equipment, unknown body region, or null body anchor in the travel set;
- exactly one positive finite source and target rectangle per intended item;
- stable viewport, scroll, orientation, visibility, and lifecycle;
- replay not consumed or cancelled.

Every failure returns settled static Outfit immediately. It does not retry, partially match, infer an item, or display an error.

### Motion implementation

Use only the existing `motion/react` surface:

- fixed-position `motion.div` clones;
- explicit source rectangle in `initial`;
- explicit transform/scale/opacity target in `animate`;
- timing values from `motion-grammar.ts`;
- overlapping delays computed by the pure timeline;
- `MotionConfig` for effective reduction;
- `AnimatePresence` and idempotent completion/abort cleanup.

Do not add a second animation mechanism. Do not read layout during playback. Target rows and all semantic controls exist at T0; clones are decorative.

## Timing contract

| Interaction | Contract |
|---|---|
| Normal UI feedback | Canonical 220 ms, always inside 180–250 ms |
| Explanation total | Canonical 1250 ms, always inside 900–1400 ms |
| Item scheduling | Overlapped within the one total, never serial duration multiplication |
| Interruption/reduced motion | Immediate semantic settled state |
| Idle | No clone, coordinator deadline, or Phase-3 continuous loop remains |

The timeline foundation accepts timing values as input so it does not create a competing token table before the shared-file gate.

## Accessibility and visual validation

The deterministic matrix must include:

- 320 and 390 CSS-pixel widths;
- 200% text/zoom;
- forced-colors mode;
- light/dark crossed with cold/mild/warm;
- representative condition/daylight pairs plus neutral input;
- Enter and Space CTA activation;
- heading focus and complete semantic Outfit at T0;
- explicit landing-before-explanation assertion;
- ordered rows never inert or accessibility-hidden;
- close/back origin-focus restoration;
- app reduce, OS reduce, and app allow plus OS reduce;
- missing/zero/duplicate rectangles, identity mismatch, hidden document, resize, scroll, orientation, close, back, and unmount;
- 1–10 unit cases and browser cases for 1, 4, 5, and 10 garments;
- structured equipment present but never traveling;
- valid one/many/disjoint visible slots plus explicit occlusion;
- hidden, tied, partial, contradictory, null, empty, duplicate, and unknown coverage plus equipment and verified-state/base mismatch;
- empty/duplicate/missing avatar-visible IDs, duplicate/missing garment resolution, `visibleOnAvatar: false`, and equipment collisions;
- proof that unlisted `base.garments` entries cannot become candidates and array order cannot replace avatar-visible-ID order;
- unknown/null body truth retained textually with static outcome.

Evidence consists only of assertions and text/DOM/ARIA/rectangle/timing logs. No Phase-3 acceptance claim depends on hardware or optional media evidence.

## Test architecture

| Capability | File | Fast command |
|---|---|---|
| Atmosphere resolver | `src/lib/__tests__/home-atmosphere.test.ts` | `npm test -- src/lib/__tests__/home-atmosphere.test.ts` |
| Atmosphere components | `src/components/__tests__/LivingHomeBackground.test.tsx`, `src/components/__tests__/LivingHomeAtmosphere.test.tsx` | `npm test -- src/components/__tests__/LivingHomeBackground.test.tsx src/components/__tests__/LivingHomeAtmosphere.test.tsx` |
| Timeline/replay | `src/lib/outfit-transition/timeline.test.ts`, `replay-policy.test.ts` | `npm test -- src/lib/outfit-transition/timeline.test.ts src/lib/outfit-transition/replay-policy.test.ts` |
| Snapshot/eligibility | `transition-snapshot.test.ts`, `eligibility.test.ts` | `npm test -- src/lib/outfit-transition/transition-snapshot.test.ts src/lib/outfit-transition/eligibility.test.ts` |
| Adapter | `phase2-adapter.test.ts` plus Phase-2 contract suite | `npm test -- src/lib/outfit-transition/phase2-adapter.test.ts src/lib/outfit/__tests__/outfit-transition-contract.test.ts` |
| Coordinator | `coordinator.test.ts`, `src/hooks/__tests__/useOutfitTransitionCoordinator.test.tsx` | `npm test -- src/lib/outfit-transition/coordinator.test.ts src/hooks/__tests__/useOutfitTransitionCoordinator.test.tsx` |
| Overlay | `OutfitTransitionOverlay.test.tsx` | `npm test -- src/components/outfit-transition/OutfitTransitionOverlay.test.tsx` |
| Browser | `e2e/home-outfit-motion.ts` | `npx tsx e2e/home-outfit-motion.ts --case all` |
| Existing E2E | package script | `npm run e2e` |
| Final runner / real Windows process launch | `scripts/verify-phase3-final.mjs`, `scripts/__tests__/verify-phase3-final.test.ts` | `npm test -- scripts/__tests__/verify-phase3-final.test.ts` |
| Detached external evidence collection | checked-in final runner | `powershell.exe -NoLogo -NoProfile -NonInteractive -Command 'node scripts/verify-phase3-final.mjs collect'` |
| Full deterministic gate | repository + phase suite | `npm test && npm run lint && npm run build && npx tsx e2e/home-outfit-motion.ts --case all && npm run e2e` |

## Performance and failure boundaries

- Read all source rectangles in one pre-navigation batch and all target rectangles in one post-mount batch.
- Animate only transform and opacity through Motion.
- No layout read occurs during playback.
- Total cleanup is at most 1400 ms.
- Timing logs record activation, semantic Outfit mount, explanation start, each landing, cleanup, and abort reason.
- The semantic Outfit mount timestamp must not follow explanation start; this proves landing-before-explanation and semantic T0.
- Failure removes transient clones/state and preserves normal navigation/focus.
- On Windows, the final runner resolves an absolute existing npm CLI JavaScript entrypoint (`npm_execpath` first, then the validated Node-adjacent `node_modules/npm/bin/npm-cli.js`) and invokes it only through `process.execPath` argument arrays with `shell: false`; Git is invoked directly with arguments.
- A non-mocked Windows test actually runs npm `--version` from a repository path and writes evidence under a sibling path containing spaces/metacharacters, preventing `.cmd` plus `shell: false` EINVAL regressions.

## Security and privacy

| Threat | Mitigation |
|---|---|
| Stale snapshot visually maps to wrong row | Exact triple, branded IDs, factory provenance, full readiness predicate. |
| Unknown/null truth receives invented geometry | Explicit static outcome; no guessed anchor or partial map. |
| DOM/rectangle data escapes App lifetime | Refs and normalized rectangles remain transient and are never persisted or emitted. |
| Dynamic label becomes markup/selector | React text binding; labels never establish identity or selectors. |
| Unbounded clones or callbacks | Supported 1–10 range, one candidate, one cleanup owner, bounded Motion timeline. |
| Evidence-root characters alter commands | The constant PowerShell payload contains no path; Node path APIs plus shell-free npm-CLI/Git argument arrays preserve each value. |
| Supply-chain drift | No installs; manifests and lockfiles unchanged. |

## Package legitimacy audit

No package-manager install task exists. The only animation dependency used is the repository-pinned `motion` package already present in `package.json` and lockfile. The phase gate fails if dependency files change.

## Open Questions

All former questions are resolved:

| Former question | Resolution |
|---|---|
| Replay frequency | **RESOLVED by D-07:** one attempt per exact triple in the current App lifetime, consumed on first deliberate activation including static fallback. |
| Snapshot/registration API | **RESOLVED by Phase 2:** Phase 3 imports the accepted exported visibility, bundle, visual-state, identity, and `RegisterOutfitRow` types; no planning-file structural mirror is used. |
| Hardware/optional-media acceptance | **RESOLVED by D-08:** Phase 3 uses deterministic text/DOM/ARIA/rectangle/timing evidence only. Phase 4 owns hardware and optional media evidence; neither is a Phase-3 gate. |

No unresolved question blocks planning.

## Sources

Primary repository sources:

- `03-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/phases/02-outfit-truth-antrekkskart/02-INTERFACE-CONTRACT.md`
- `docs/BABYORA-UX-MOTION-BIBLE.md`
- `docs/motion-system.md`
- `src/App.tsx`
- `src/screens/HjemScreen.tsx`
- `src/styles/motion-grammar.ts`
- `src/lib/temp-axis.ts`
- `src/lib/weather-theme/symbolToTheme.ts`
- `e2e/planlegg.ts`

External primary documentation:

- [Motion React animation](https://motion.dev/docs/react-animation)
- [Motion accessibility](https://motion.dev/docs/react-accessibility)
- [WCAG animation from interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions)
- [WCAG reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow)
- [WCAG focus not obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum)

**Confidence:** High for architecture, interfaces, stack, and deterministic validation because each is tied to current repository contracts.
**Valid until:** 2026-08-07 or an authoritative Phase-2 contract change.
