# Babyora UI 90+ Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the free daily clothing decision immediate and internally consistent, establish the four-tab product structure, implement the approved two-pose outer-outfit avatar contract, and raise every enabled page family to 90+.

**Architecture:** Add pure typed UI contracts before changing screens. Motor 2.0 is the canonical structured recommendation and safety source; derive one `RecommendationView` for every visual consumer, and centralize capability decisions so UI does not scatter `isPremium` checks. Until a cohort is enabled, consume the tested Motor 2.0 legacy adapter or untouched legacy result according to feature flags.

**Tech Stack:** React 19, TypeScript, Zustand, Capacitor, Motion, Vitest, Playwright, existing product-audit tooling.

## Global Constraints

- Apply every constraint in `2026-07-13-babyora-90-plus-master-plan.md`.
- Apply `2026-07-13-babyora-verification-protocol.md`; every task requires a fresh-context structured PASS before it is complete.
- No backend dependency is required for this plan; signed-out/local mode remains fully functional.
- Recommendation-facing Tasks 2, 4 and 5 depend on Motor 2.0 contracts, fingerprint and adapter. Navigation, tokens and non-recommendation surfaces may proceed independently after the baseline gate.
- Production UI work follows the five-parent North-Star gate. Prototype code/assets are not production authorization.
- v1 supports ages 0–24 only. Use sitting 0–11 and standing 12–24 avatar poses; no 25+ UI, copy, fixture or capability claim.
- The avatar shows only the final outermost visible outfit/accessories. Hidden base and middle garments remain in the ordered list and are never crossfaded through outerwear.
- Avatar asset production is capped at 24 approved composites and NOK 1,000 direct generation spend; no runtime 2.5D.
- Bottom navigation appears only on Hjem, Planlegg, Guide, and Familie roots.
- **Execution model:** Sonnet 5 with High effort for all tasks. Medium is allowed only for documentation or a known one-file test/copy fix. Escalate to Fable 5 Extra only after two evidenced failures or when a change crosses into authorization, billing, or shared-data architecture.

---

### Task 1: Capability and terminology contract

**Files:** Create `src/lib/access/capabilities.ts`, `src/lib/access/__tests__/capabilities.test.ts`; modify `src/lib/premium/gating.ts`, `src/lib/premium/products.ts`, `src/lib/premium/paywall-copy.ts` and their tests.

**Interfaces:** Produces `Capability`, `AccessContext`, `AccessDecision`, and `decideAccess(capability, context)`.

- [ ] Write failing table tests proving `today_home`, safety tools, and `morning_reminder` are free; Plus capabilities require an active entitlement; `family_sharing` additionally requires authentication.
- [ ] Run `npx vitest run src/lib/access/__tests__/capabilities.test.ts`; expect failure because the module does not exist.
- [ ] Implement the pure map:

```ts
export type Capability = 'today_home' | 'morning_reminder' | 'safety_guides' |
  'future_plan' | 'automatic_location' | 'extra_places' | 'extra_children' |
  'family_sharing' | 'personal_calibration' | 'smart_notifications' | 'widget';
export type AccessContext = { isPlus: boolean; authenticated: boolean; loading: boolean };
export type AccessDecision = {
  allowed: boolean;
  reason: 'free' | 'plus' | 'loading' | 'signed_out' | 'expired' | 'role_denied';
  paywallTrigger?: string;
};
export function decideAccess(capability: Capability, c: AccessContext): AccessDecision {
  if (c.loading) return { allowed: false, reason: 'loading' };
  if (['today_home', 'morning_reminder', 'safety_guides'].includes(capability)) return { allowed: true, reason: 'free' };
  if (!c.isPlus) return { allowed: false, reason: 'expired', paywallTrigger: capability };
  if (['family_sharing', 'personal_calibration', 'smart_notifications'].includes(capability) && !c.authenticated) {
    return { allowed: false, reason: 'signed_out' };
  }
  return { allowed: true, reason: 'plus' };
}
```

- [ ] Remove lifetime from `PLAN_ORDER`, set trust copy to “Én Plus — alle som passer barnet”, and replace every Premium/KLEMEG/user-facing `lag` occurrence identified by copy lint.
- [ ] Run the focused tests, then `npm test`; expect pass.
- [ ] Commit `feat: centralize Babyora capability rules`.

### Task 2: Canonical recommendation view and fingerprint

**Files:** Create `src/lib/recommendation/view.ts`, `src/lib/recommendation/fingerprint.ts` and tests; modify `src/lib/outfit-state.ts`, `src/lib/widget/snapshot.ts` later only through these interfaces.

**Interfaces:** Produces `buildRecommendationView(rec: RecommendationV2)`. The fingerprint is consumed from Motor 2.0 and must not be recalculated from translated garment labels. A separate pure `deriveAvatarStateKey()` maps only visible outer state to a verified asset.

- [ ] Write failing tests asserting garment count counts visible garments rather than layer categories, order follows `innerst → mellomlag → yttertoy → ekstra → utstyr`, and equal semantic inputs have equal fingerprints regardless of object key order.
- [ ] Run focused tests; expect module-not-found failure.
- [ ] Implement deterministic normalization and hash using Web Crypto where available with a stable synchronous FNV-1a fallback for tests; include activity, temperature band, ordered visible garments, situation flags, and calibration value—never child identity.
- [ ] Define `AvatarStateKey` from pose, outer body garment, headwear, hands, neck and relevant footwear. Exclude hidden base/middle layers, child identity and weather context.
- [ ] Return `{ recommendation, garmentCount, orderedGarments, summary, explanation, fingerprint, avatarStateKey }`; make Home, Outfit, future rows, widget, and notifications consume it instead of recounting independently.
- [ ] Test that an unknown/unverified avatar key yields `null` and a neutral fallback, never nearest-neighbour asset guessing.
- [ ] Run engine, summary, visibility, and new view tests; expect pass.
- [ ] Commit `feat: add canonical recommendation presentation`.

### Task 3: Four-root navigation and shared controls

**Files:** Modify `src/types/nav.ts`, `src/App.tsx`, `src/components/BottomTabBar.tsx`; create `src/screens/FamilieScreen.tsx`, `src/components/navigation/ScreenHeader.tsx`, `src/components/controls/ActionButton.tsx`, `src/components/controls/SegmentedControl.tsx`; modify `src/styles/design-tokens.css`, `src/styles/motion-grammar.ts`.

**Interfaces:** `TabKey = 'hjem'|'plan'|'guide'|'familie'`; drills hide bottom navigation and return focus to opener.

- [ ] Add failing navigation/copy tests for four labels, active-state semantics, no bottom bar in drills, and `aria-current="page"`.
- [ ] Run focused tests; expect failures against `innstillinger`.
- [ ] Rename the root route, move settings content behind Familie, and implement shared headers/buttons with 44-point targets and the approved haptic grammar.
- [ ] Apply semantic tokens: mint action, quieter mint navigation, peach editorial, temperature-only blue, warning amber, error coral, focus-only ring.
- [ ] Run tests, keyboard navigation, reduced-motion screenshot, and build; expect pass.
- [ ] Commit `feat: establish Babyora four-tab shell`.

### Task 3A: Protective morning primitives and supporting temperature instrument

**Files:** Create `src/components/instrument/TemperatureInstrument.tsx`, `InstrumentReadout.tsx`, `InstrumentDock.tsx`, `src/components/instrument/__tests__/TemperatureInstrument.test.tsx`; modify `src/styles/design-tokens.css`, `src/styles/motion-grammar.ts`, `src/screens/FinnAntrekkScreen.tsx`; add deterministic screenshot fixtures.

**Interfaces:**

```ts
export type TemperatureThreshold = {
  valueC: number;
  label: string;
  garmentIcon: string;
  fingerprint: string;
};

export type TemperatureInstrumentProps = {
  valueC: number;
  minC: -20;
  maxC: 30;
  thresholds: TemperatureThreshold[];
  disabled?: boolean;
  onChange(valueC: number): void;
  onCommit(valueC: number): void;
  onThresholdChange?(threshold: TemperatureThreshold): void;
};
```

- [ ] Write failing tests for whole-degree snapping, ± controls, pointer/keyboard/switch access, 44-point hit target, threshold-only impact callback, min/max bounds, large text, and reduced motion.
- [ ] Run `npx vitest run src/components/instrument/__tests__/TemperatureInstrument.test.tsx`; expect module-not-found failure.
- [ ] Add the exact semantic aliases from the visual-signature spec using existing `--surface-elevated`, `--accent-cta`, `--layer-bg-kald`, `--layer-bg-mild`, and `--layer-bg-varm`; introduce no duplicate colors.
- [ ] Implement the temperature instrument as a focused Find Outfit control, not the product's dominant Home identity. Preserve numeric precision and rule thresholds while keeping the clothing result visually primary.
- [ ] Use the smallest height that passes the 390 × 844 result-first fixture; 300–360 pt is a maximum exploration range, not a mandatory size.
- [ ] Make the column/atmosphere follow continuously while recommendations settle after 120–180 ms or at a threshold; fire a distinct haptic only when the recommendation fingerprint changes.
- [ ] Replace the generic Find Outfit temperature slider while preserving exact numeric input, weather defaults, and wind/rain controls.
- [ ] Implement `InstrumentDock` as the restrained root navigation surface: filled active icon, visible label, quiet mint pool, one highlight, one canvas shadow, no outlined glass pill.
- [ ] Capture cold/mild/warm, dragging, threshold, disabled, largest text, keyboard focus, and reduced-motion screenshots at 390 × 844.
- [ ] Run focused tests, `npm test`, build, lint delta, and screenshot audit; commit `feat: add Babyora signature temperature instrument`.

### Task 4: Immediate Home and truthful Outfit

**Files:** Modify `src/screens/HjemScreen.tsx`, `src/screens/PaakledningScreen.tsx`, `src/components/AtmosphereBackground.tsx`, `src/components/PlaggDetailSheet.tsx`; create `src/components/outfit/VerifiedAvatarComposite.tsx`, `AvatarStateResolver.ts`, `OutfitMap.tsx`, `GarmentStack.tsx` and tests; add focused Playwright screenshots.

**Interfaces:** Both screens consume the same `RecommendationView`; avatar selection consumes only `avatarStateKey` and an approved manifest of up to 24 composites or uses an explicitly neutral fallback.

- [ ] Write failing tests for automatic Home answer, “Se detaljer”, plagg count, next meaningful change, cached/offline label, and identical Home/Outfit fingerprint.
- [ ] Implement stable loading/cached/error/location-fallback states and remove the mandatory tap before seeing the answer.
- [ ] Make Outfit use “Ta på innerst først”, consequences for garment swaps, and a calm 44-point close control.
- [ ] Build `OutfitMap` with the avatar centered and every recommended garment visible as a numbered node in inner-to-outer order. Every node has a routed connector to the correct body region; the selected connector is emphasized and the others remain visible at low contrast.
- [ ] Scale deterministically by garment count: 1–4 nodes may show thumbnail, number and short name; 5–10 use two compact node rails around the avatar with all thumbnails/numbers visible and only the selected node expanded. Never hide garments behind `+N`.
- [ ] Cross-highlight node and ordered-list row on tap/focus. Preserve a logical screen-reader order, 44-point targets, non-color selection cues, largest-text fallback and collision-safe connector routing.
- [ ] Make the garment row open its explanation. Render an explicit `Se alternativ` action only when a real alternative exists; verify that it opens the comparison/swap surface and omit it entirely otherwise.
- [ ] Render the verified final outermost outfit immediately. Dressing order is communicated by the static “innerst først” list; do not animate hidden underlayers onto or through the final outer garment.
- [ ] Crossfade only between two verified final composites after a meaningful visible-state change, 180–240 ms; reduced motion swaps immediately.
- [ ] Select the sitting pose for 0–11 months and standing pose for 12–24 months. Use engine footwear rules without creating a third body pose.
- [ ] Replace generic garment cards with one connected ordered sequence below the Antrekkskart; lift only the active row and keep texture confined to garment thumbnails.
- [ ] Verify temperature atmosphere uses perceived temperature and remains readable at coldest/hottest fixtures.
- [ ] Verify no weather, stroller, sleep, or activity context is baked into avatar images and no unverified composite is displayed.
- [ ] Run focused tests, `npm test`, Playwright screenshots at 390 × 844, and audit prepare/finalize; expect no regression.
- [ ] Commit `feat: make daily outfit immediate and consistent`.

### Task 5: Planlegg and Snart

**Files:** Modify `src/screens/UkeScreen.tsx`; create `src/screens/SnartScreen.tsx`, `src/components/planning/PlanChangeRail.tsx`, `src/lib/planning/change-events.ts`, `src/lib/planning/soon.ts` plus tests.

**Interfaces:** `deriveChangeEvents(recommendations)` returns only semantic fingerprint changes; `buildSoonAdvice(child, homeClimate, date)` returns `mustHave`, `niceToHave`, and `notYet` with cautious size language.

- [ ] Write failing truth fixtures before styling: complete-hour coverage versus sampled-hour wording; unchanged-day compression; add/remove; a true swap with separate removed/added garments; rain; pickup-time change; tomorrow comparison; exact future-context drill; and 4–6 week Soon groups.
- [ ] Define one persisted planning context for child, date, time, place, activity and recommendation. A tapped future event must pass its own full context into Outfit; it must never open the current recommendation as a fallback.
- [ ] Permit “Time for time”, “hele dagen” and “samme antrekk til …” only when the evaluated forecast coverage supports the claim. Otherwise use narrower, truthful copy.
- [ ] Generate parent-facing action sentences from semantic deltas: `Ta på`, `Ta av`, `Bytt fra … til …`, `Ta med` or `Forbered`. Never mix removed and added garments after one `Bytt til`, and never lead with engine compression such as `+8 til`.
- [ ] Implement the locked **Dagslinjen** hierarchy: visible `Planlegg` title; compact child/place context; restrained `I dag / Uke / Snart`; dominant current verdict and next action; one continuous vertical rail directly on the temperature-reactive canvas.
- [ ] Remove the mega-card/repeated-card composition. Only recommendation-changing moments receive markers; unchanged spans are quiet line captions. Only the selected event expands inline, showing one action sentence, up to three garment thumbnails and `Se hele antrekket` when more detail exists.
- [ ] Integrate time, temperature and weather cause as supporting information on the same rail. Demote the complete forecast to a secondary disclosure instead of rendering a competing duplicate list.
- [ ] Use the line as a shared semantic signature with Antrekkskartet: every line communicates a real relationship; marker form plus text carries meaning and color remains secondary.
- [ ] Implement “I dag / Uke / Snart”; Free receives the complete today-at-home Dagslinje plus one truthful future example, while Plus receives future days, current/other places and Soon.
- [ ] Replace Min Garderobe entry points with Snart; retain only lightweight “har allerede” marks for current suggestions.
- [ ] Remove dead affordances. Place, notification and event controls render as interactive only when their actions are wired and truthful.
- [ ] Keep one app-level `<main>` and one vertical scroll owner. Validate 44 pt targets, `focus-visible`, label-in-name, VoiceOver/TalkBack order, large text, and every foreground/background pair in light, dark, cold, mild and warm themes.
- [ ] Apply the locked interaction grammar: `selection` haptic for view/date changes, light haptic for event expansion, calm inline motion around 200–280 ms, no decorative bounce, and instant reduced-motion state.
- [ ] Capture deterministic states at 390 × 844 for: no changes, one change, many changes, rain, location change, extreme cold, extreme heat, Free future teaser, Plus week, Soon, dark mode, 200% text and reduced motion.
- [ ] Run focused tests, screenshots, build and the governing risk-based audit. Score Planlegg with the shared rubric and iterate until the enabled states reach documented 90+ without hiding Free today.
- [ ] Commit `feat: rebuild planning around meaningful changes`.

### Task 6: Guide and knowledge surfaces

**Files:** Modify `src/screens/GuideHubScreen.tsx`, `FinnAntrekkScreen.tsx`, `PlaggbibliotekScreen.tsx`, `TogGuideScreen.tsx`, `VarmEllerKaldScreen.tsx`, `VinterprogramScreen.tsx`, `src/data/vinterprogram.ts`, and Norwegian locale/copy tests.

- [ ] Write failing copy tests forbidding KLEMEG, outdoor TOG claims, absolute “trygg/riktig” claims, and touch-device keyboard hints.
- [ ] Reorder Guide into Verktøy, Lær, Forbered; place Find Outfit, Warm or Cold, and TOG first and Snart in Forbered.
- [ ] Add whole-degree snapping, ± controls, human precipitation/wind labels, and rule-change explanations to Find Outfit.
- [ ] Moderate TOG/Warm or Cold claims, keep safety content free, remove forced weekly pacing from First Winter, and improve library filters/empty state.
- [ ] Run copy lint, focused tests, all page screenshots, and build; expect pass.
- [ ] Commit `feat: align Babyora guides with core decision`.

### Task 7: Onboarding, Family root, and paywall

**Files:** Modify `src/screens/OnboardingScreen.tsx`, `src/screens/InnstillingerScreen.tsx` (split reusable sections), `src/screens/FamilieScreen.tsx`, `src/components/PaywallDialog.tsx`; create `src/components/family/CareCircle.tsx`, `src/components/paywall/PlusExpansionPreview.tsx` and tests; modify premium copy/products tests.

- [ ] Write failing tests for first recommendation before paywall, notification pre-prompt after value, free morning reminder, annual/monthly-only plans, explicit trial charge copy, and contextual paywall focus return.
- [ ] Implement compact child/date/home/result onboarding with one progress indicator and an explicit local-first explanation.
- [ ] Build Familie root sections for child, place, notifications, Plus, settings, legal, and disabled feature-flag previews only in development.
- [ ] Add the accessible care-circle summary: active child at center, four visible caregiver tokens, `+N` overflow, solid active/dashed pending connection, and a conventional role list below; never imply live presence or tracking.
- [ ] Rebuild paywall around “Fremover, overalt og sammen”; do not render family/calibration claims unless their runtime feature flags are enabled.
- [ ] Demonstrate Free → Plus with one 500–700 ms expansion from today/home/one child to future/current place/care circle/calibration; show final state instantly for reduced motion.
- [ ] Run tests, purchase-state screenshots, VoiceOver focus-order review, and build.
- [ ] Commit `feat: deliver truthful onboarding family and paywall flows`.

### Task 8: Page audit and evidence

**Files:** Modify `tools/product-audit` fixtures only if route names changed; create `docs/superpowers/evidence/ui-90-plus.md` and deterministic screenshots.

- [ ] Capture all 13 current page families plus loading, empty, error, offline, denied-permission, paywall, and reduced-motion states at 390 × 844.
- [ ] Run `npm test`, `npm run build`, `npm run lint`, and `npm run audit:test`; record exact pass/fail counts and distinguish pre-existing lint debt.
- [ ] Score every page with the same rubric; fix the lowest scoring actionable issue and rerun until each enabled page reaches 90+.
- [ ] Complete manual text-scaling, VoiceOver/TalkBack, thumb-zone, and physical haptic checks.
- [ ] Validate the avatar manifest: maximum 24 production composites, one locked child identity with two poses, exact `AvatarStateKey` mapping, 2K source, optimized mobile export, anatomy/material/alpha review, and direct spend log ≤ NOK 1,000.
- [ ] Repeat the five-parent comprehension check against the implemented core journey; require median ≤5 seconds and correct outfit/reason recall from all five.
- [ ] Commit `docs: record Babyora UI 90 plus evidence`.
