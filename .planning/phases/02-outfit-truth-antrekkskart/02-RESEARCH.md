# Phase 2: Outfit truth and Antrekkskart — Research

**Researched:** 2026-07-24
**Domain:** Canonical recommendation projection, body-connected responsive UI, accessible paired interaction and safety-contained alternatives
**Confidence:** HIGH for codebase/locked decisions; MEDIUM for the proposed responsive geometry until rendered browser evidence exists

## User Constraints

### Locked product and truth decisions

- Antrekkskart replaces the partial/decorative orbit. Every recommended garment is simultaneously a numbered node and an ordered row, inner layer first; every node has a visible line to the correct body region. No `+N`, collapsed or hidden garment is allowed. `[VERIFIED: docs/DECISION-LOG.md:132-160; .planning/REQUIREMENTS.md:78-82]`
- For 1–4 garments, use spacious nodes that may show image, number and short name. For 5–10, use two collision-safe compact rails around the avatar; all nodes, numbers and body connections remain visible, while only the active node needs its full name in the map. `[VERIFIED: docs/DECISION-LOG.md:140-147; .planning/REQUIREMENTS.md:78-82]`
- Node and corresponding row cross-highlight for pointer, keyboard and assistive-technology use. Color is secondary to number, shape, text, line weight and accessible name. `[VERIFIED: docs/DECISION-LOG.md:144-147; .planning/REQUIREMENTS.md:81-82]`
- The avatar may show only an exact verified visible outer state. Hidden inner/middle layers remain explicit in map and list and are never animated through outerwear. `[VERIFIED: docs/DECISION-LOG.md:149-151; docs/BABYORA-UX-MOTION-BIBLE.md:53-60]`
- `Se alternativ` appears only for a real engine-backed option and must lead to a working comparison/swap. Warm/cold recovery must be explicit and cautious without changing recommendation thresholds or activating Motor V2; changed health/safety copy requires professional evidence. `[VERIFIED: .planning/ROADMAP.md:76-89; .planning/REQUIREMENTS.md:81-82]`
- Evolve the existing Babyora/Morgennatt design system; do not replace it. `[VERIFIED: .planning/ROADMAP.md:3-5; docs/DECISION-LOG.md]`

### Execution, parallelism and cost

- The approved GSD worklist may proceed autonomously through planning, implementation, testing, independent review, documentation, commits and green pushes. A failed technical gate must be corrected, not replaced by an owner confirmation. `[VERIFIED: AGENTS.md:22-29; docs/DECISION-LOG.md:7-41]`
- Phase 2 and the independent Phase-3 foundation may run in isolated branches/worktrees while Phase 1 finishes. Home → Outfit integration waits for the frozen Phase-2 interface contract. `[VERIFIED: AGENTS.md:22-24; docs/DECISION-LOG.md:19-22]`
- No single expense or aggregate new cost commitment above NOK 1,000 may be incurred without explicit owner approval. Free sources and already-included quotas may be used; extra paid credits cannot be assumed. `[VERIFIED: AGENTS.md:29; docs/DECISION-LOG.md:24-29]`
- This research task changes planning artifacts only: no application code and no commit. `[VERIFIED: orchestrator assignment]`

<phase_requirements>

## Phase Requirements

| ID | Description | Research support |
|---|---|---|
| OUTFIT-01 | Antrekkskart shows every recommended garment as a numbered, body-connected node and scales truthfully from 1–10 without `+N`. | Immutable occurrence model, body-anchor catalog, fixed two-mode layout, truthful avatar policy and geometry tests below. `[VERIFIED: .planning/REQUIREMENTS.md:78-79]` |
| OUTFIT-02 | Map, list, explanation, real alternatives and warm/cold recovery form one accessible decision flow. | Paired-control state model, pre-finalized alternative outcomes, unchanged shared recovery copy and browser/a11y test matrix below. `[VERIFIED: .planning/REQUIREMENTS.md:81-82]` |

</phase_requirements>

## Summary

The first task is not a visual rewrite; it is a truth-boundary upgrade. The current exact context carries only string arrays for `orderedGarments` and `equipment`, so it cannot identify duplicate occurrences, body regions, verified visible garments or scenario-valid alternatives. The normal current/planned path now enters `PlannedPaakledningScreen`, which renders an ordered text list but not the legacy ring/detail system. The old branch, when reached, uses a decorative `aria-hidden` ellipse and a staged avatar that can imply hidden layers. `[VERIFIED: src/lib/planning/planned-outfit-context.ts:63-74; src/screens/PaakledningScreen.tsx:230-461,462-963]`

The planner should introduce one recursively frozen `OutfitTruthSnapshotV1`, derived once from the already-finalized legacy recommendation and exact context. Each garment occurrence gets an opaque stable ID, exact engine source label, canonical display/catalog identity, dressing order, semantic body region/normalized pose anchor and verified-avatar visibility. Equipment is classified semantically through both the engine's `utstyr` category and the canonical `garmentIdFor` → `categoryFor` catalog path. This is required because legacy emits varmepose, saueskinn, sovepose, regnponcho and ansiktskrem under `ekstra` even though the canonical catalog classifies them as `utstyr`; none may receive a body connector. The complete revised contract is frozen for planning in [02-INTERFACE-CONTRACT.md](./02-INTERFACE-CONTRACT.md).

The present alternative action is not real. `PlaggDetailSheet` writes a swap under kebab-case `GarmentId`, while `applySwapsFinalized` looks up the original engine item string; the keys do not match. In addition, the exact planned context contains neither full `RecommendInput` nor pre-evaluated alternative outcomes, and `PaakledningScreen` does not subscribe to the swap store. Static `alternatives.ts` data can nominate candidates, but only a producer with the complete scenario may rerun final safety and expose a candidate that survives. `[VERIFIED: src/components/PlaggDetailSheet.tsx:155-179; src/lib/wool-layers/finalize-safety.ts:84-106; src/lib/planning/planned-outfit-context.ts:63-74; src/lib/wool-layers/alternatives.ts]`

**Primary recommendation:** freeze and test the canonical full-Recommendation snapshot first, then build the deterministic map and finalized alternatives. After Phase-1 01-18 is green, serialized Phase-2 02-05 changes only the existing Hjem/Uke context-producing calls to preserve their already-computed full normalized `RecommendInput` and full finalized `Recommendation` in a factory-owned deeply immutable seed. Phase 2 then exposes the pure producer and in 02-09 wires both real App boundaries into Paakledning. Phase 3 starts afterward and preserves both handoffs while extending Hjem/App transition orchestration.

## Architectural Responsibility Map

| Capability | Primary tier | Secondary tier | Rationale |
|---|---|---|---|
| Finalized recommendation | Client domain engine | — | Existing pure legacy engine and final safety boundary own inclusion/exclusion; UI must not mutate arrays locally. `[VERIFIED: src/lib/wool-layers/recommend.ts; src/lib/wool-layers/finalize-safety.ts]` |
| Outfit truth snapshot | Client domain adapter | Screen producer | Factory validates and freezes semantic facts once; Home and Outfit consume the same object. |
| Body region and pose anchors | Client catalog/domain | UI layout | Region/anchor is garment truth; node placement is responsive presentation. |
| 1–4 / 5–10 node layout | Browser/client UI | CSS/SVG | Container width and text scale determine node geometry; connectors render as an SVG overlay. |
| Avatar | Client truth adapter | UI component | Canonical per-item body/visible slots, visual layer rank and explicit occlusion derive the complete visible set; exact manifest pose/set or neutral. Rendering cannot infer layers. `[VERIFIED: public/avatars/verified/index.json; src/lib/recommendation/avatar-state.ts]` |
| Alternative eligibility | Client domain engine | Candidate catalog | Complete `RecommendInput` plus final safety determines whether the option is real; static prose cannot. |
| Warm/cold recovery | Shared approved copy/domain | Outfit UI | The screen reuses one unchanged source and links to the existing guide; it does not create thresholds/calibration. |
| Home → Outfit motion | Phase-3 client orchestration | Phase-2 registry | Phase 3 measures transient rectangles; Phase 2 supplies IDs and targets. `[VERIFIED: docs/DECISION-LOG.md:19-22]` |
| Persistence/analytics | None for this phase | — | Outfit snapshot, alternative outcome and transition geometry remain in memory and are not new analytics payloads. |

## Project Constraints (from AGENTS.md)

- GitHub is the durable source of truth; follow `docs/CLAUDE-START-HERE.md` precedence and do not infer approval from archived analysis. `[VERIFIED: AGENTS.md:3-8]`
- Product scope remains Babyora, ages 0–24, with the existing Free/Plus boundary. `[VERIFIED: AGENTS.md:10-18]`
- Use the risk-scaled plan→code process in `docs/PROSESS-PLAN-TIL-KODE.md`; implement one scoped task and intentional commit at a time. `[VERIFIED: AGENTS.md:19-24]`
- Never push secrets, credentials, `.env` files, dependency folders or build output; never claim completion without required evidence. `[VERIFIED: AGENTS.md:24-26]`
- Do not fabricate professional approval, provenance, test results or physical-device evidence. Disable or narrow dependent behavior when evidence is absent. `[VERIFIED: docs/DECISION-LOG.md:31-36]`
- Motor V2 display flags remain off until their separate evidence gate. `[VERIFIED: src/lib/clothing-engine-v2/feature-flags.ts:22-33; .planning/REQUIREMENTS.md:75-76]`
- The NOK 1,000 cost gate applies to each new expense and aggregate commitment. `[VERIFIED: AGENTS.md:29]`

## Current-State Findings

### Truth flow

1. `HjemScreen` creates one `RecommendInput`, runs `recommend`, applies session swaps through `applySwapsFinalized`, and freezes current weather plus string arrays into `PlannedOutfitContext`. `[VERIFIED: src/screens/HjemScreen.tsx:277-400]`
2. `UkeScreen` does the equivalent for future phases and creates exact contexts from finalized string arrays. `[VERIFIED: src/screens/UkeScreen.tsx:166-224,431-536]`
3. `App` already has explicit current/planned `Drill` variants and real open handlers, but it is only transport: its current context contains flattened ordered garments/equipment, not the complete `RecommendInput` or full engine `Recommendation`. The canonical builder and alternative finalizer require original layer categories plus note/safety fields; those cannot be reconstructed safely from strings. Therefore serialized 02-05 must pass Hjem's existing `engineInput`/`resolvedRecommendation` and Uke's existing phase `engineInput`/resolved `recommendation` into the context factory, which validates, deep-clones, freezes and owns the seed. App must only consume it. `[VERIFIED: src/App.tsx:116-129,228-245,477-494,554-566; src/lib/planning/planned-outfit-context.ts:69-111; src/screens/HjemScreen.tsx:278-400; src/screens/UkeScreen.tsx:66-68,430-539]`
4. The existing App guide route already accepts `target: "varm-kald"`, so the production callback is exactly `() => setDrill({ kind: "guide", target: "varm-kald" })`; no new guide or threshold is required. `[VERIFIED: src/App.tsx:461-463]`
5. `PlannedOutfitContext` currently validates own properties, normalizes text, forbids duplicate strings, computes a content ID and recursively freezes the object. Plan 02-05 extends that factory with the full seed while keeping responsive/body/runtime truth out. `[VERIFIED: src/lib/planning/planned-outfit-context.ts]`
6. `PaakledningScreen` chooses `PlannedPaakledningScreen` whenever an exact current or future context is present; the richer legacy branch is therefore not the canonical Phase-1 route. `[VERIFIED: src/screens/PaakledningScreen.tsx:230-461,952-963]`

### Why the current alternative action fails

| Step | Current behavior | Defect |
|---|---|---|
| Candidate lookup | Detail sheet converts kebab ID back to a database label, then reads static `getAlternatives`. `[VERIFIED: src/components/PlaggDetailSheet.tsx:155-163]` | Existence in a prose table is not scenario/engine eligibility. |
| Store write | `setSwap(garmentId, alternativeName)` writes a kebab-case key. `[VERIFIED: src/components/PlaggDetailSheet.tsx:175-179]` | The source occurrence and exact engine string are lost. |
| Finalized lookup | `applySwapsFinalized` maps with `swaps[item]`, where `item` is the raw engine label. `[VERIFIED: src/lib/wool-layers/finalize-safety.ts:84-106]` | The kebab key normally cannot match, so the output remains unchanged. |
| Outfit update | Hjem/Uke subscribe to the store; `PaakledningScreen` does not. `[VERIFIED: src/screens/HjemScreen.tsx:228-316; src/screens/UkeScreen.tsx:255-440; codebase grep]` | Even a corrected store does not make the open exact snapshot update safely. |
| Planned scenario | Exact context contains finalized strings but not the complete input or outcomes. `[VERIFIED: src/lib/planning/planned-outfit-context.ts:63-87]` | The drawer cannot safely recompute a future alternative. |

**Required fix:** evaluate candidates at the producer while full input exists, bind them to an occurrence ID, rerun the final safety chain, and embed a complete immutable outcome snapshot. The button exists only for accepted outcomes.

### Other blockers

- The ring is explicitly decorative/`aria-hidden`, positions nodes on a fixed ellipse and provides no body connectors; it cannot satisfy keyboard or assistive cross-highlight. `[VERIFIED: src/screens/PaakledningScreen.tsx:686-691,842-917]`
- Existing anchors are category-level only: every `ekstra` shares a head/shoulder point, even though the category contains headwear, mittens, neckwear and footwear. `[VERIFIED: src/lib/anchors.ts:12-27; src/data/garment-category.ts]`
- The approved HTML prototype draws 13 px ticks from one shoulder-height point, not a line from each garment to its correct body region. It is a style reference, not valid topology. `[VERIFIED: public/design-2026/f79-paakledning-a/index.html:1151-1153,1331-1402]`
- `whyText` independently invents `<5` and `>18` branches and health-adjacent explanations. Phase 2 must remove this parallel threshold logic from the canonical path. `[VERIFIED: src/screens/PaakledningScreen.tsx:197-220]`
- The old branch uses `stageSrc` for a dressed stage; this conflicts with the locked rule that hidden layers are never depicted through outerwear. `[VERIFIED: src/screens/PaakledningScreen.tsx:50,565; docs/DECISION-LOG.md:149-151]`

## Standard Stack

### Core

| Library/tool | Declared version | Purpose | Prescription |
|---|---:|---|---|
| React | `^19.2.6` | Components, semantic buttons, refs | Keep; use native elements and one shared selection/highlight reducer. `[VERIFIED: package.json]` |
| TypeScript | `~6.0.2` | Branded IDs and readonly contracts | Keep; factory validation remains the runtime trust boundary. `[VERIFIED: package.json]` |
| Vite | `^8.0.12` | Existing build/runtime | Keep; no bundler change. `[VERIFIED: package.json]` |
| Existing CSS tokens + SVG | repository-owned | Layout, connector paths, forced-colors | Use existing Morgennatt tokens and a non-interactive SVG overlay. `[VERIFIED: src/styles/design-tokens.css; docs/DECISION-LOG.md:149-155]` |

### Supporting

| Library/tool | Declared version | Purpose | When to use |
|---|---:|---|---|
| Zustand | `^5.0.14` | Existing session state | Replace the untyped raw map with typed occurrence/outcome selection; no persistence. `[VERIFIED: package.json; src/state/swap-override-store.ts]` |
| Motion | `^12.40.0` | Existing micro-transitions | Only opacity/transform state polish; geometry and truth never depend on it. `[VERIFIED: package.json; docs/BABYORA-UX-MOTION-BIBLE.md]` |
| Vitest | `^4.1.8` | Pure contract/layout/engine tests | Wave 0 onward. `[VERIFIED: package.json]` |
| Playwright | `^1.60.0` | Real-browser accessibility/reflow checks | Use the repository's direct browser-harness pattern, not jsdom-only assertions. `[VERIFIED: package.json; e2e/planlegg.ts; .planning/phases/01-planlegg-dagslinjen/01-UI-SPEC.md]` |

### Alternatives considered

| Instead of | Could use | Decision |
|---|---|---|
| Fixed rails | Force/orbit/graph-layout package | Reject: geometry is bounded to 1–10 and must be deterministic, testable and stable under focus. |
| Native buttons | Custom ARIA grid/listbox | Reject: nodes and rows are independent action controls; native buttons already provide Enter/Space semantics. `[CITED: https://www.w3.org/WAI/ARIA/apg/patterns/button/]` |
| Existing SVG/CSS | Canvas/WebGL | Reject: text, focus and forced-colors would need needless custom infrastructure. |

**Installation:** none. This phase needs no new package.

## Package Legitimacy Audit

Not applicable: the prescribed stack is already declared in `package.json`, and the plan adds no external dependency. Therefore the package-legitimacy install gate is not triggered. `[VERIFIED: package.json; research recommendation]`

## Architecture Patterns

### System architecture diagram

```text
RecommendInput + exact context
          |
          v
legacy recommend() ---> finalized Recommendation
          |                    |
          | candidate swap     | exact items/notes/flags
          |                    v
          +----------> applySwapsFinalized()
                               |
                               v
 Hjem/Uke context factory deep-clones/freezes
 (full normalized input + full finalized Recommendation)
                               |
                               v
                   OutfitBundleProducerSeedV1
                               |
                     App current/planned source
                               |
                               v
                  createOutfitTruthSnapshot()
                    |        |          |
                    |        |          +--> verified avatar asset OR neutral
                    |        +-------------> separate equipment list
                    +----------------------> ordered garment occurrences
                                               |
                         +---------------------+--------------------+
                         v                                          v
              layoutOutfitMap(width)                       ordered row model
             /                     \                              |
     1–4 spacious             5–10 rails                         |
             \                     /                              |
              +---- nodes + body connectors <---- shared itemId --+
                                               |
                                      paired highlight/detail

Alternative candidate --final safety survives?--> immutable outcome snapshot
                      \--no----------------------> no button
```

### Recommended project structure

```text
src/
├── lib/outfit/
│   ├── outfit-truth.ts              # factory, branded IDs, invariants
│   ├── body-anchor-catalog.ts        # garment → semantic pose anchors
│   ├── outfit-map-layout.ts          # pure 1–4 / 5–10 layout
│   ├── alternative-options.ts        # producer-side finalized outcomes
│   └── __tests__/
├── components/outfit/
│   ├── Antrekkskart.tsx
│   ├── Antrekkskart.css
│   ├── OutfitGarmentList.tsx
│   └── VerifiedAvatarComposite.tsx   # reuse, do not fork
├── lib/planning/
│   └── planned-outfit-context.ts     # schema upgrade/embedding after Phase 1
└── e2e/
    └── outfit-truth.ts               # real-browser contract
```

### Pattern 1: One immutable occurrence snapshot

Create one factory-owned snapshot from the finalized result; render nodes, rows, avatar summary and Phase-3 IDs directly from it. Do not reconstruct items inside the screen.

```ts
// Source: repository planned-context factory pattern
const snapshot = createOutfitTruthSnapshot({
  exactContext,
  finalizedRecommendation,
  pose,
  verifiedAvatar,
});

const rows = snapshot.garments.map((item) => ({
  key: item.itemId,
  order: item.order,
  label: item.label,
}));
```

Stable IDs must disambiguate duplicate occurrences. A deterministic seed is:

```text
hash(snapshotId | engineCategory | exactSourceLabel | occurrenceWithinSameCategoryAndLabel)
```

Do not include display label or current render position as the sole identity.

### Pattern 1b: Canonical avatar coverage and explicit occlusion

Avatar truth cannot start with a desired manifest row. Each semantic garment first resolves to candidate-versioned `bodyCoverage`, `visibleSlots`, finite `visualLayerRank` and explicit `occludesSlots`. Resolve every slot with unique outer-rank precedence; a higher occurrence hides a lower one only for explicitly declared occluded slots. Null/unknown coverage, equal-rank winners, unresolved partial overlap or duplicate surviving catalog IDs are unrepresentable and therefore neutral. Only the resulting complete unique catalog-ID set may be compared with `public/avatars/verified/index.json`, and exactly one same-pose row must match. Tests enumerate all 24 rows plus hidden inner layer, duplicate, ambiguity, missing/extra and pose mismatch.

### Pattern 2: Semantic body truth, responsive visual geometry

The snapshot owns `bodyRegion` plus a normalized sitting/standing `bodyAnchor`. `layoutOutfitMap` owns node boxes and connector polylines. Unknown anchors are retained in the list and make the map ineligible; they are never guessed.

For 1–4, place larger nodes around the avatar with image/number and an optional short label. For 5–10, use two narrow side rails with up to five nodes each. Sort each rail monotonically by `(bodyAnchor.y, dressingOrder)`, then route through side-specific ports/lanes. This prevents same-side connector crossing without a force solver.

At narrow widths/200% text, nodes retain only number plus garment image/shape; the active full name sits in a separate caption, and the full ordered list remains normal-flow text below. No essential text is trapped inside absolute geometry. WCAG requires reflow without lost information/functionality at 320 CSS px, while a meaningful diagram may remain internally two-dimensional. `[CITED: https://www.w3.org/TR/WCAG22/#reflow]`

### Pattern 3: One paired-control state machine

Use native `<button>` for every node and row. Maintain:

```ts
type PairState = Readonly<{
  selectedId: OutfitItemId | null; // persistent activation/detail
  focusId: OutfitItemId | null;    // transient keyboard highlight
  hoverId: OutfitItemId | null;    // transient pointer highlight
}>;

const highlightedId = focusId ?? hoverId ?? selectedId;
```

- Both paired controls receive `data-highlighted` from the same `highlightedId`.
- `aria-pressed` represents persistent `selectedId`, not hover.
- Activation with Enter/Space leaves focus on the button unless a detail dialog opens; a dialog moves focus inside and returns it to its triggering control. `[CITED: https://www.w3.org/WAI/ARIA/apg/patterns/button/]`
- Accessible node name includes order, count, garment and body region, for example: `Plagg 3 av 7: ullbody, overkropp, innerst`.
- Connector SVG is `aria-hidden`; the equivalent relationship is in the node name and ordered row text.
- Do not use an `aria-live` region for hover/focus churn.

Selected/focused state must use at least border/outline, line weight/style, number and explicit row marker in addition to color. Required UI states/graphics need at least 3:1 contrast against adjacent colors, so “low contrast” means lower emphasis than selected, not sub-threshold invisibility. `[CITED: https://www.w3.org/TR/WCAG22/#non-text-contrast]`

### Pattern 4: Pre-finalized alternatives

Treat `getAlternatives` only as a candidate source. For each candidate:

1. bind to exact `itemId` and `sourceLabel`;
2. run the candidate through `applySwapsFinalized` with the complete original `RecommendInput`;
3. verify the candidate survives and compute the full result/diff;
4. build a new immutable snapshot;
5. expose the button only for that outcome.

Selection replaces the whole snapshot. It never patches one visible label, and it never calls `setSwap(garmentId, ...)`.

### Pattern 5: Warm/cold recovery without a second motor

Extract the currently shipped `VarmEllerKaldScreen` strings into one shared copy module without changing wording, render a short cautious recovery block after the garment list, and link to the complete guide. `[VERIFIED: src/screens/VarmEllerKaldScreen.tsx:52-101,544-571]`

Phase 2 must not:

- add new numeric temperature/TOG thresholds;
- write `childCalibration`;
- activate any Motor V2 flag;
- silently mutate the current snapshot based on “warm/cold” feedback;
- duplicate safety copy in a second component.

Any wording change or new recommendation action is a high-risk safety-copy change and requires documented professional evidence before enablement. `[VERIFIED: .planning/REQUIREMENTS.md:81-82; docs/DECISION-LOG.md:31-36]`

### Anti-patterns to avoid

- **Label as identity:** duplicate labels or renamed copy target the wrong row/swap.
- **Category anchor as body truth:** mittens, neckwear and shoes cannot all point to the head.
- **Selected layout reflow:** expanding a node must not move nodes or reroute every connector.
- **Local UI swap:** a label/image patch bypasses final safety and desynchronizes avatar/list.
- **Equipment as garment:** a vognpose/regntrekk must not be connected to the child's body.
- **Animation as information:** reduced motion/static state must contain the same mapping and order.
- **Threshold copy in the screen:** this creates an unreviewed second recommendation system.
- **Generic force layout:** nondeterminism makes 1–10 collision guarantees and visual regression tests fragile.

## Layout Contract

| Count | Mode | Node content | Geometry | Required checks |
|---:|---|---|---|---|
| 1–4 | `spacious` | Image/shape, number, optional short name; active caption always available | Larger nodes around avatar, balanced left/right, monotonic by body Y | No node/label/connector overlap; every connector reaches its semantic anchor |
| 5–10 | `compact-rails` | Image/shape + number; only active full name in map caption | Two fixed side rails, at most five per side, avatar centered | All nodes visible; no `+N`; no same-side connector crossing |

Additional rules:

- Connector paths begin at the node edge, stay outside node/text hit areas, end at the item's pose-specific body anchor and use `pointer-events: none`.
- Inactive lines remain visible and meet required graphical contrast; active/focused line is thicker and/or differently patterned.
- Body regions with bilateral meaning use side-specific ports; repeated items use small deterministic anchor offsets, not random jitter.
- Focus/selection changes styling only, never node position.
- At 200% text, the page keeps one vertical document scroll, no horizontal page scroll and no nested scroll trap. `[CITED: https://www.w3.org/TR/WCAG22/#reflow]`
- Forced colors maps inactive strokes to `CanvasText`, active strokes/outlines to `Highlight`, and preserves a non-color shape/width difference.
- Reduced motion removes connector/node transitions but leaves complete static connectors and state cues.

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---|---|---|---|
| Final safety after swap | A UI-level filter or copied safety rules | `applySwapsFinalized` and the existing finalized pipeline | It is the repository's single containment boundary. `[VERIFIED: src/lib/wool-layers/finalize-safety.ts]` |
| Avatar approximation | Nearest-looking composite or staged layer sequence | `VerifiedAvatarComposite` with exact approved asset or neutral fallback | Prevents overstated visible clothing. `[VERIFIED: src/components/outfit/VerifiedAvatarComposite.tsx]` |
| Keyboard button behavior | Clickable `div`, custom key handlers | Native `<button>` | Native Enter/Space/focus semantics match the APG button pattern. `[CITED: https://www.w3.org/WAI/ARIA/apg/patterns/button/]` |
| Generic graph layout | Force simulation/orbit library | Fixed deterministic rails + pure layout function | Bounded 1–10 requirement does not need a solver. |
| Body inference at render time | Regex on Norwegian labels | Versioned body-anchor catalog with coverage tests | Copy changes must not move garments to another body region. |
| Recovery thresholds | New screen-specific temperature logic | Shared unchanged recovery copy + existing guide | Avoids a second safety model. |

**Key insight:** Phase 2 can hand-roll only the bounded Babyora-specific rail geometry; it must reuse existing safety, avatar, button and token foundations.

## Runtime State Inventory

This phase replaces/refactors a live screen, so runtime state was checked explicitly.

| Category | Items found | Action required |
|---|---|---|
| Stored data | Legacy `sessionStorage["babyora.takeover.played"]`; session-only Zustand swap map. `[VERIFIED: src/screens/PaakledningScreen.tsx:224,598-650; src/state/swap-override-store.ts]` | Stop reading/writing the global takeover key; stale data expires with the tab. Replace the untyped in-memory swap representation; no persistent data migration. |
| Live service config | No Phase-2-specific remote configuration is referenced by the inspected Outfit files. External provider consoles were not inspected. `[ASSUMED]` | No migration planned; do not add analytics of child/place/outfit or transition geometry. |
| OS-registered state | No Windows scheduled task matching Babyora/Paakledning/Antrekkskart/takeover was found in the read-only audit. `[VERIFIED: PowerShell Get-ScheduledTask, 2026-07-24]` | None. |
| Secrets/env vars | No environment variable name matching Babyora/Paakledning/Outfit/Engine V2 was found; secret values were not read. `[VERIFIED: PowerShell Env name audit, 2026-07-24]` | None; do not introduce a service/key for this phase. |
| Build artifacts/installed packages | `node_modules` exists but is incomplete: local React/Vitest executables were absent during research. Vite temporary content exists. `[VERIFIED: filesystem audit, 2026-07-24]` | Run `npm ci` before implementation/tests; normal rebuild refreshes Vite artifacts. No package rename/reinstall migration. |

## Common Pitfalls

### Pitfall 1: Two sources of truth

**What goes wrong:** nodes use the live recommendation while rows use frozen context strings, or an alternative patches only one surface.
**Why it happens:** today's screen contains legacy and exact-context branches. `[VERIFIED: src/screens/PaakledningScreen.tsx]`
**How to avoid:** one snapshot object feeds avatar, node, row, equipment, detail and Phase-3 IDs.
**Warning sign:** counts/fingerprints differ or a swap changes Hjem but not the open Outfit.

### Pitfall 2: “Correct body region” implemented as category

**What goes wrong:** shoes, mittens and neckwear share the same `ekstra` anchor.
**Why it happens:** the existing anchor table is keyed by five layer categories. `[VERIFIED: src/lib/anchors.ts]`
**How to avoid:** a garment-level semantic anchor catalog with sitting/standing coordinates and complete legacy-output coverage.
**Warning sign:** any runtime regex or default head/torso point for a known garment.

### Pitfall 3: Compact mode hides truth

**What goes wrong:** labels or nodes are collapsed to `+N`, clipped by a fixed-height sheet or covered at 200%.
**How to avoid:** fixed rails, computed map height, normal-flow active caption and complete list; browser assertions for 1/4/5/10 at 320 and 390 CSS px.
**Warning sign:** overflow hidden, array `slice`, count badge or horizontal page scroll.

### Pitfall 4: Cross-highlight steals focus

**What goes wrong:** focusing a node programmatically moves focus to its row, creating a loop and unexpected scroll.
**How to avoid:** share visual state but leave DOM focus on the user's control; move focus only into an opened dialog. `[CITED: https://www.w3.org/WAI/ARIA/apg/patterns/button/]`
**Warning sign:** `rowRef.current.focus()` inside node focus/hover handlers.

### Pitfall 5: Low-emphasis lines become inaccessible

**What goes wrong:** inactive connectors disappear in light/dark/forced-colors.
**How to avoid:** maintain at least 3:1 required graphical contrast and reduce emphasis by width/opacity within that bound. `[CITED: https://www.w3.org/TR/WCAG22/#non-text-contrast]`
**Warning sign:** connector meaning exists only in pale color or fails forced-colors screenshots.

### Pitfall 6: Candidate equals real alternative

**What goes wrong:** a static option is shown even though final safety removes it or it changes another layer.
**How to avoid:** expose only a complete post-finalization outcome and show its actual diff.
**Warning sign:** a `Se alternativ` button exists without a stored result fingerprint.

### Pitfall 7: New warm/cold engine by accident

**What goes wrong:** a screen threshold, feedback bias or TOG claim changes recommendation behavior without the required evidence.
**How to avoid:** reuse unchanged shared copy, link to the existing guide and keep Motor V2/calibration untouched.
**Warning sign:** numeric comparisons in Outfit UI or writes to feedback/calibration stores.

## Code Examples

### Native paired controls

```tsx
// Source: WAI-ARIA APG Button Pattern + repository native-button convention
<button
  type="button"
  aria-label={`Plagg ${item.order} av ${count}: ${item.label}, ${regionLabel}`}
  aria-pressed={selectedId === item.itemId}
  aria-controls={`outfit-detail-${item.itemId}`}
  data-highlighted={highlightedId === item.itemId || undefined}
  onFocus={() => setFocusId(item.itemId)}
  onBlur={() => setFocusId(null)}
  onPointerEnter={() => setHoverId(item.itemId)}
  onPointerLeave={() => setHoverId(null)}
  onClick={() => setSelectedId(item.itemId)}
>
  <span aria-hidden="true">{item.order}</span>
</button>
```

### Fail-closed map eligibility

```ts
// Source: recommended Phase-2 contract
const mapEligible =
  snapshot.garments.length >= 1
  && snapshot.garments.length <= 10
  && snapshot.garments.every(
    (item) => item.bodyRegion !== "unknown" && item.bodyAnchor !== null,
  );

// Always render all rows. Only the graphical map is conditional.
```

### Finalized alternative gate

```ts
// Source: existing applySwapsFinalized containment boundary
const finalized = applySwapsFinalized(input, recommendation, {
  [source.sourceLabel]: candidate.targetLabel,
});

if (!finalized.layers.some((layer) => layer.items.includes(candidate.targetLabel))) {
  return null; // no action rendered
}

return createAlternativeOutcome(exactContext, finalized, source.itemId);
```

The implementation must additionally disambiguate duplicate raw labels by occurrence; the existing record-shaped `SwapMap` cannot do that and must not be the final API.

## State of the Art

| Old approach | Current Phase-2 approach | Impact |
|---|---|---|
| Decorative ellipse, partial visible ring | Deterministic body-connected rails for every occurrence | Truth and scale become testable. `[VERIFIED: locked decision]` |
| Strings and render indices | Branded occurrence IDs inside immutable snapshot | Duplicate labels and Phase-3 matching are safe. |
| One anchor per layer category | Garment/pose semantic body-anchor catalog | “Correct body region” is explicit. |
| Static candidate button | Pre-finalized engine-backed outcome | No dead or safety-invalid alternative action. |
| Local staged avatar | Canonical slot/rank/explicit-occlusion derivation, then exact manifest composite or neutral | Avatar cannot overstate hidden layers or guess outer precedence. |
| Screen-local `<5`/`>18` explanation | Engine facts plus unchanged shared recovery copy | No parallel thresholds. |
| Global `babyora.takeover.played` | Phase-3 in-memory, context-bound transition eligibility | Motion cannot contaminate outfit truth. |

## Parallelization and File Ownership

### Safe before Phase 1 completes

- Research/planning and the new pure contract/layout modules/tests may proceed in an isolated branch/worktree after interface freeze. `[VERIFIED: docs/DECISION-LOG.md:19-22]`
- Phase 2 owns new `src/lib/outfit/**`, new Phase-2 tests and the eventual `PaakledningScreen`/Antrekkskart internals.
- Phase 3 owns independent Home atmosphere/transition coordinator work against the frozen adapter, but not Outfit internals.

### Must wait for Phase 1/integration serialization

| File/area | Collision | Ownership rule |
|---|---|---|
| `src/screens/UkeScreen.tsx` | Phase-1 owns future/planning integration through 01-18. `[VERIFIED: Phase-1 plan files]` | After exact 01-18 PASS, serialized Phase-2 02-05 may only pass each already-existing phase input/full resolved Recommendation into the factory; no UI/engine change and no later Phase-3 edit. |
| `src/App.tsx` | Phase-1 Plan 17 and Phase-3 navigation both touch it. `[VERIFIED: Phase-1 plan files; Phase-3 contract]` | Ownership is serialized: Phase-2 02-09 first owns producer calls/propagation; after its PASS, Phase 3 preserves those lines while extending App for Home transition orchestration. |
| `src/screens/HjemScreen.tsx` | Phase-1 completes the current exact-context producer before Phase 2; Phase 3 later owns Living Home anchors. | Serialized Phase-2 02-05 first preserves the already-existing engineInput/full resolved Recommendation in the seed without behavior change; only after 02-09 may Phase 3 add Home sources. |
| `e2e/smoke.ts` / shared harness | Phase-1 Plan 18 and later Phase 3 may modify shared flow. `[VERIFIED: Phase-1 plan files]` | Add separate `e2e/outfit-truth.ts`; merge shared smoke in one integration task. |
| `src/lib/haptics/**` / `BottomTabBar` | Phase-1 Plan 18 owns them. `[VERIFIED: Phase-1 plan files]` | Consume existing API only; no Phase-2 edit. |

## Recommended Waves

### Wave 0 — Freeze truth and tests

- Implement `OutfitTruthSnapshotV1`, occurrence IDs, strict factory validation and equipment separation.
- Add body-region/pose catalog, per-item avatar body/visible-slot coverage, layer rank, explicit occlusion and candidate-versioned inventory script/test.
- Add contract tests for duplicate labels, unknown mappings, exact repeat identity, changed fingerprints and 1–10 range.
- Freeze `02-INTERFACE-CONTRACT.md` in code/types before Phase-3 integration.

### Wave 1 — Deterministic map and paired interaction

- Implement pure 1–4/5–10 layout.
- Replace legacy exact-context list/ring with `Antrekkskart` + ordered rows from the same snapshot.
- Derive exact avatar truth from canonical coverage/occlusion and reuse neutral fallback; remove staged avatar and screen-local `whyText` from the canonical path.
- Add pointer, keyboard, forced-colors, screen-reader and reduced-motion browser tests.

### Wave 2 — Real alternatives and recovery

- Replace raw swap map with occurrence-bound producer evaluation.
- Build comparison from accepted finalized outcome; remove all dead actions.
- Extract existing warm/cold strings unchanged into one shared module and add the accessible recovery block/link.
- Add regression test for the current kebab-ID/raw-label mismatch and safety-removal cases.

### Wave 3 — Exact-context and navigation integration

- After Phase 1: expose the pure exact-boundary producer and wire the Phase-2 result into Phase-2-owned Paakledning without recomputation.
- With serialized ownership: Phase-1 01-18 completes Hjem/Uke first; Phase-2 02-05 preserves their full input/Recommendation objects in factory-owned seeds; Phase-2 02-09 activates Paakledning and connects producer/bundle/row/guide propagation at both App boundaries. Phase 3 later adds Hjem/Home transition orchestration while preserving both Phase-2 contracts.
- Flat orderedGarments/equipment are presentation compatibility only. They cannot be used to recreate `Recommendation.layers`, `notes`, `structuredNotes`, `summary`, `safetyFlags` or `severity`, and therefore cannot drive the canonical builder or finalized alternatives.
- The 02-09 ten-file scope warning is accepted as one cohesive vertical bootstrap plus evidence, divided into tasks touching 3/5/3 files with only the E2E driver shared. Separating App production propagation from the Paak/flag gate would make the enabled experience unreachable or allow it to pass only via injected fixture props.
- Require triple match: `snapshotId`, `recommendationFingerprint`, `transitionContextId`.

### Wave 4 — Convergence gate

- Run 1/4/5/10 garment matrix at mobile widths, 200% text, light/dark/temperature themes, forced colors and reduced motion.
- Run full unit/build/e2e suite, fresh-context review and any required real-device evidence.
- Keep Home → Outfit motion off until every semantic/registry contract is green.

## Resolved finite-domain inventory

The read-only planning harness [02-INVENTORY.mts](./02-INVENTORY.mts) was executed against the existing legacy engine and canonical catalog for planning discovery:

`npx tsx .planning/phases/02-outfit-truth-antrekkskart/02-INVENTORY.mts`

This planning file is not release evidence. Plan 02-01 must create and test tracked `scripts/outfit/inventory-v1.ts` inside its isolated candidate before first invocation; every dependent/final gate runs only `npx tsx scripts/outfit/inventory-v1.ts --assert` from the reviewed candidate.

It enumerates one representative on every side of each current garment-affecting threshold plus every discrete age/activity/vogn/bilstol/inner-jacket/calibration/can-roll branch. Humidity, UV and exposure are excluded only because current source uses them for note text, not item membership. Exact measured result on 2026-07-24:

| Measure | Result |
|---|---:|
| Branch-representative scenarios | 2,036,160 |
| Unique emitted source labels | 70 |
| Canonical catalog coverage | 70/70 |
| Unique semantic garments | 57 |
| Planned catalog-to-body-region coverage | 57/57 |
| Unique semantic equipment outputs | 13 |
| Maximum semantic equipment in one result | 6 |
| Maximum semantic garments in one result | **11** |
| Results above the locked 1–10 map range | **12,960** |
| Results below one garment | 0 |

Semantic equipment is the union of engine category `utstyr` and canonical catalog category `utstyr`. The catalog path reclassifies ten outputs that legacy places under `ekstra`: `ansiktskrem`, `regnponcho over bæresele`, `saueskinn i vogn`, four emitted sovepose variants and three varmepose variants. Engine-`utstyr` outputs `regntrekk på vognen`, `vognpose` and `kjørepose` remain equipment. Equipment is excluded before the 1–10 garment count.

Representative 11-garment result:

- age/activity/context: `ageMonths=0`, `activity=vogn`, `vognMode=awake`, `childCalibration=0`;
- weather: `feelsLikeC=-30`, `tempC=-30`, `windMs=8`, `precipMmH=0`, no symbol, no bilstol;
- ordered semantic garments: `to ullsett oppå hverandre`; `tykke ullstrømper`; `ullsokker`; `ull-jakke`; `ull-bukse`; `ekstra ull-lag`; `isolert vinterkjøredress`; `balaklava`; `votter dun`; `halsedisse`; `vindvotter (skall)`.

This cannot be normalized to ten without truth loss: every string is a distinct finalized engine occurrence, and Phase 2 is forbidden to delete, merge, reorder or reinterpret recommendation output. Even apparently overlapping foot/hand items may encode separate finalized advice; deduplication would change content and fingerprint.

**Resolved handling:** retain the locked 1–10 graphical requirement and implement an honest list-only unsupported-cardinality result for 11: all ordered rows and semantic equipment remain visible, while map, connectors, avatar claim, alternatives and Phase-3 motion are ineligible. Do not silently add a third 11–12 density mode because that expands the locked design contract and its evidence matrix. If the requirement is later changed to 1–12, add a separately approved third density mode and new geometry/browser cases rather than squeezing 11 into the five-per-rail contract. ROADMAP is intentionally unchanged.

## Resolved review question

The existing `VarmEllerKaldScreen` wording may be reused only as a byte-identical shared constant with characterization tests that prove identical visible and accessible output. That is a code-location refactor, not a new claim. It still runs in the high-risk lane because it is safety copy. Any wording, threshold or action change is outside this contract and remains BLOCKED pending the evidence/authority required by the governing process; no new human checkpoint is invented inside Phase 2.

## Remaining measured implementation assumption

| # | Assumed claim | Section | Resolution gate |
|---|---|---|---|
| A2 | The proposed 48–64 px rail nodes and centered avatar fit the smallest supported container without visual collision. | Layout | 02-03 pure geometry plus 02-04/02-09 computed DOM rectangles at 320/390/560 and 200% must prove it; failure changes output geometry, never truth. |

## Environment Availability

| Dependency | Required by | Available | Version/state | Fallback |
|---|---|---:|---|---|
| Node.js | build/tests | ✓ | `v24.14.1` `[VERIFIED: local CLI]` | — |
| npm | dependency restore/scripts | ✓ | `11.11.0` `[VERIFIED: local CLI]` | — |
| Git | isolated worktrees/commits | ✓ | `2.53.0.windows.2` `[VERIFIED: local CLI]` | — |
| Locked npm tree | React/Vitest/build | ✗ incomplete | `package-lock.json` present; React/Vitest binaries absent `[VERIFIED: filesystem/npm audit]` | Run `npm ci` before implementation |
| Playwright browser runtime | real-browser evidence | not verified | package declared but local CLI absent `[VERIFIED: package.json; filesystem audit]` | Restore with `npm ci`, then install only required browser if missing |
| External paid service | none | not required | — | No service/package/media spend is needed |

**Missing dependency with no functional fallback:** the locked npm tree must be restored before implementation evidence can run.

**Cost note:** `npm ci`, public W3C/OWASP sources and the existing local stack require no planned new paid commitment; any unexpected paid tool proposal remains behind the NOK 1,000 owner gate. `[VERIFIED: AGENTS.md:29]`

## Validation Architecture

### Test framework

| Property | Value |
|---|---|
| Framework | Vitest `^4.1.8` + direct Playwright `^1.60.0` browser harness `[VERIFIED: package.json; e2e/planlegg.ts]` |
| Config file | `vite.config.ts` / existing package scripts `[VERIFIED: repository]` |
| Quick run | `npm test -- src/lib/outfit` |
| Browser run | `npx tsx e2e/outfit-truth.ts` after locked dependencies are restored |
| Full suite | `npm test && npm run build && npm run e2e` |

### Phase requirements → test map

| Req ID | Behavior | Type | Automated command | Exists? |
|---|---|---|---|---|
| OUTFIT-01 | Snapshot has all occurrences, stable unique IDs and exact order | unit | `npm test -- src/lib/outfit/__tests__/outfit-truth.test.ts` | ❌ Wave 0 |
| OUTFIT-01 | Body-anchor catalog covers every supported legacy output | exhaustive unit | `npm test -- src/lib/outfit/__tests__/body-anchor-coverage.test.ts` | ❌ Wave 0 |
| OUTFIT-01 | 1/4/5/10 maps have no node overlap, hidden items or connector/node intersections at 320/390/560 | pure layout + browser | `npm test -- src/lib/outfit/__tests__/outfit-map-layout.test.ts` | ❌ Wave 0 |
| OUTFIT-01 | Avatar is exact verified outer state or neutral; inner layers remain map/list-only | unit + browser | `npm test -- src/lib/outfit/__tests__/outfit-avatar-truth.test.ts` | ❌ Wave 0 |
| OUTFIT-02 | Node/row pointer, focus and activation cross-highlight with non-color cues | browser | `npx tsx e2e/outfit-truth.ts` | ❌ Wave 0 |
| OUTFIT-02 | Enter/Space, focus return, accessible names and pressed state are correct | browser/a11y | `npx tsx e2e/outfit-truth.ts` | ❌ Wave 0 |
| OUTFIT-02 | Alternative is exposed only for a post-finalization outcome and changes every surface | unit + browser | `npm test -- src/lib/outfit/__tests__/alternative-options.test.ts` | ❌ Wave 0 |
| OUTFIT-02 | Warm/cold surface has unchanged approved text, no thresholds/calibration/V2 writes | source contract + browser | `npm test -- src/lib/outfit/__tests__/recovery-contract.test.ts` | ❌ Wave 0 |
| Both | 200%, forced colors and reduced motion preserve complete static truth | browser | `npx tsx e2e/outfit-truth.ts` | ❌ Wave 0 |
| Phase-3 gate | IDs/registries/triple context match and fail-closed behavior | contract/browser | Phase-3 transition contract suite | ❌ integration |

### Sampling rate

- **Per task commit:** focused Vitest file plus TypeScript/build for touched boundary.
- **Per wave merge:** all `src/lib/outfit` tests, focused browser harness and `npm run build`.
- **Phase gate:** full suite, full e2e, fresh-context review and required device/media evidence green before `$gsd-verify-work`.

### Wave 0 gaps

- [ ] `src/lib/outfit/__tests__/outfit-truth.test.ts`
- [ ] `src/lib/outfit/__tests__/body-anchor-coverage.test.ts`
- [ ] `src/lib/outfit/__tests__/outfit-map-layout.test.ts`
- [ ] `src/lib/outfit/__tests__/alternative-options.test.ts`
- [ ] `src/lib/outfit/__tests__/recovery-contract.test.ts`
- [ ] `e2e/outfit-truth.ts`
- [ ] Restore locked dependencies with `npm ci`

## Security Domain

Security enforcement is enabled at ASVS L1 in project configuration. `[VERIFIED: .planning/config.json]`

### Applicable ASVS categories

| ASVS category | Applies | Standard control |
|---|---:|---|
| Authentication | no new scope | No auth/session behavior changes |
| Session management | limited | Alternative/transition state remains memory-only; do not persist child/place/outfit data |
| Access control | yes, existing | Preserve `PlannedOutfitContext.access`; Outfit cannot bypass Free/Plus decisions. `[VERIFIED: src/lib/planning/planned-outfit-context.ts]` |
| Validation/sanitization/encoding | yes | Strict factory allowlist, own-data checks, finite normalized geometry, React text rendering and no `innerHTML` |
| Cryptography | no | No new secret, token, storage encryption or network service |

OWASP ASVS 5.0.0 is the current stable ASVS source; this phase uses its validation/encoding intent without inventing a server boundary. `[CITED: https://owasp.org/www-project-application-security-verification-standard/]`

### Known threat patterns

| Pattern | STRIDE | Mitigation |
|---|---|---|
| Tampered/fabricated snapshot | Tampering | Factory ownership, schema version, deep freeze, exact ID/fingerprint/context checks |
| Garment label HTML/script | Tampering/XSS | Normalize input and render as React text; never `dangerouslySetInnerHTML` |
| Stale alternative applied to a new context | Tampering | Bind option to source `itemId` + snapshot ID; reject mismatched outcome |
| Transition leaks child/place/outfit | Information disclosure | Registry/rect snapshot memory-only; no logs, analytics, URL or storage |
| Missing target causes blocking overlay | Denial of service | First-error fail closed to complete static Outfit; bounded cleanup |
| Guessed body/avatar state | Spoofing | Unknown anchor disables map/motion; unknown avatar renders neutral |

## Sources

### Primary — HIGH confidence

- `AGENTS.md` — current authorization, phase parallelism, truth/evidence and cost constraints.
- `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md` — Phase-2 goal, OUTFIT-01/02 and acceptance gates.
- `docs/DECISION-LOG.md`, `docs/BABYORA-UX-MOTION-BIBLE.md` — locked Antrekkskart, avatar and motion truth.
- `src/lib/planning/planned-outfit-context.ts`, `src/screens/HjemScreen.tsx`, `src/screens/UkeScreen.tsx`, `src/screens/PaakledningScreen.tsx` — exact-context production/consumption.
- `src/components/PlaggDetailSheet.tsx`, `src/state/swap-override-store.ts`, `src/lib/wool-layers/finalize-safety.ts`, `src/lib/wool-layers/alternatives.ts` — current alternative bug and containment boundary.
- `src/lib/recommendation/avatar-state.ts`, `src/lib/recommendation/verified-avatar.ts`, `src/components/outfit/VerifiedAvatarComposite.tsx` — verified-or-neutral avatar policy.
- `src/lib/anchors.ts`, `src/data/garment-category.ts`, `public/design-2026/f79-paakledning-a/index.html` — why current/prototype geometry is insufficient.

### Secondary — MEDIUM confidence

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) — reflow, non-text contrast and focus criteria.
- [WAI-ARIA APG Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/) — native button, Enter/Space, pressed state and focus behavior.
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) — current stable security-verification source and validation/encoding intent.

### Tertiary — LOW confidence

- Assumptions A1–A4 only; each is gated by Wave-0 evidence.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — repository-declared; no new dependency.
- Current-state diagnosis: HIGH — direct code inspection with exact key mismatch.
- Canonical architecture: HIGH — follows locked exact-context/final-safety contracts.
- Layout geometry: MEDIUM — deterministic design is decision-ready but awaits rendered 320/390/200% evidence.
- Accessibility behavior: MEDIUM/HIGH — official W3C guidance plus existing project browser-test convention.
- Recovery copy: MEDIUM — unchanged-source strategy is clear; governance status of reuse in a new placement remains an explicit question.

**Research date:** 2026-07-24
**Valid until:** 2026-08-23 for architecture; recheck repository collisions and package versions immediately before execution.
