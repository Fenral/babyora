# Babyora engine consistency — Definition of Done

Status: implementation contract
Date: 2026-08-09
Baseline: `2dce070038a659486491a521854ce5d820fac79c`
Risk lane: HIGH — recommendation and safety-adjacent behavior

## Outcome

For one canonical situation, Babyora must produce one canonical clothing decision.
Home, Plan, Find outfit, TOG guidance, widgets, summaries, and post-swap views may
format the decision differently, but they may not disagree about the ordered
garments, temperature band, active safety flags, or severity.

The active engine remains `src/lib/wool-layers/recommend.ts`. This work does not
claim that a clothing recommendation is scientifically provable. It makes the
current, approved rule set deterministic, internally coherent, and resistant to
accidental divergence.

## Canonical input

Two calls are the same effective input only when all of these values are equal:

- temperature, feels-like temperature, wind, precipitation, and weather symbol;
- child age in months;
- activity;
- stroller mode;
- material preference;
- explicit overrides or finalized swaps.

Location name, locale, clock time, screen name, render order, and network state are
presentation context. They must not change the canonical clothing decision.
Locale may change human-readable copy only.

## Acceptance criteria

### AC-1 — one production source of truth

- Runtime recommendation surfaces call the active `wool-layers` engine, directly
  or through a thin adapter that delegates to it.
- No production screen calls or activates `clothing-engine-v2`.
- `clothing-engine-v2` feature flags remain off.
- The TOG screen does not own a second temperature-to-TOG decision table. It
  renders the sleep recommendation returned by the active engine.
- The widget consumes the already-resolved canonical recommendation and does not
  infer a second garment set.

### AC-2 — repeatability

- Repeating every matrix input 100 times produces a deep-equal canonical decision.
- No recommendation decision reads random values, current time, DOM state, network
  state, or mutable screen state.
- For all supported locales, ordered layers/items, temperature band, flag codes,
  flag severities, and final severity are identical.
- Localized messages may differ; decisions may not.

### AC-3 — cross-surface parity

- Home, Plan, and Find outfit pass the same child age, activity, stroller mode, and
  material preference when those values describe the same situation.
- A shared parity fixture produces the same ordered categories/items, temperature
  band, flag codes, and severity on all three surfaces.
- TOG guidance at a selected room temperature shows the exact ordered garments and
  TOG value produced by canonical sleep input for the active child.
- No screen-local fallback silently substitutes another recommendation after an
  engine validation error.

### AC-4 — coherent final output

- `summary` is derived from the final layers after overrides, safety finalization,
  calibration, and user swaps. It cannot name a removed or replaced garment.
- Every category is unique and follows canonical dressing order.
- No category is empty; no item is blank; no identical item appears twice.
- Notes and flags are de-duplicated.
- Final severity equals the highest severity among final flags, or `none` when no
  final flag exists.
- The structured notes and the legacy notes array remain synchronized.

### AC-5 — current safety invariants survive every mutation path

Tests must prove the existing engine/finalizer rejects or removes these states:

- headwear during indoor sleep;
- sleeping bag combined with a blanket, or more than one sleeping bag;
- weighted sleep products;
- soft objects added to a sleep recommendation;
- swaddling when the child can roll;
- thick winter outerwear in a car seat;
- a currently recognized pram-cover item in prohibited hot-stroller conditions.

The same checks must run after direct overrides, finalized swaps, and occurrence
swaps. This criterion freezes current guardrails; it does not expand their clinical
meaning or repair clinician-gated audit findings.

### AC-6 — boundary and invalid-input coverage

- Test immediately below, exactly at, and immediately above every existing
  temperature-band boundary: `28`, `22`, `16`, `10`, `5`, `0`, `-7`, and `-15` °C.
- Cover ages `0`, `2`, `3`, `4`, `6`, `7`, `9`, `12`, `16`, and `24` months.
- Retain defensive compatibility checks for ages `25` and `60`; reject `61`.
- Cover every active activity and every production-reachable stroller mode.
- Non-finite temperatures, negative/non-finite wind or precipitation, invalid age,
  and invalid activity fail closed with a predictable validation error. They must
  never fall through to the coldest recommendation.
- Outdoor stroller sleep remains out of production reach until its separate
  professional gate is closed. A static gate proves no current production surface
  passes `vognMode: 'sleeping'`.

### AC-7 — material preference is subordinate to safety

- Wool, cotton, or fleece preference changes only the engine's currently
  authorized equivalent garments.
- Preference cannot change the temperature band, remove a safety flag, lower final
  severity, or bypass the finalizer.
- All applicable production surfaces pass the same saved preference.

### AC-8 — tests can catch a real contradiction

The engine consistency command must contain both controls in one invocation:

1. A positive fixture that passes the full consistency contract.
2. Deliberately malformed in-memory results that fail for at least stale summary,
   duplicate layer/item, mismatched severity, and forbidden sleep combination.

Negative controls must not edit production source, snapshots, or repository state.
A gate that only proves valid data passes is not a valid release gate.

### AC-9 — traceability and release evidence

- The release evidence records baseline SHA, candidate SHA, commands, duration,
  pass counts, and any explicit exclusions.
- Every decision-changing production file is linked to a test that would fail if
  that decision drifted.
- The implementation diff contains no new clinical thresholds or new claims of
  medical validation.
- A fresh-context verifier runs the focused gate, full unit suite, lint, and build
  against one immutable candidate SHA.
- Push is allowed only after implementer and independent verifier both pass.

## Locked non-goals

- Do not activate or tune `clothing-engine-v2`.
- Do not change numeric temperature, wind, precipitation, age, TOG, or safety
  thresholds.
- Do not resolve clinician-gated findings such as new pram-cover vocabulary,
  sheepskin policy, wind modeling, or outdoor stroller-sleep logic.
- Do not add runtime AI, probability, personalization learning, or network calls.
- Do not redesign the Home, Plan, Find outfit, or TOG interfaces beyond the minimum
  presentation change needed to remove contradictory recommendation truth.
- Do not claim that a recommendation is medically proven or universally safe.

## Authorized implementation scope

Production edits are limited to:

- `src/lib/wool-layers/**`
- `src/lib/outfit/finalized-outfit-swap.ts`
- `src/screens/HjemScreen.tsx`
- `src/screens/UkeScreen.tsx`
- `src/screens/FinnAntrekkScreen.tsx`
- `src/screens/TogGuideScreen.tsx`
- the smallest directly related localization keys or TOG presentation styles

Verification and process edits are limited to:

- focused tests under the corresponding `__tests__` directories
- `tools/verify-engine-consistency.mjs`
- `tools/garment-audit/ENGINE-CONSISTENCY-*.md`
- `package.json`
- `.github/workflows/ci.yml`

Any required file outside this list must be recorded with a concrete reason before
it is changed.

Recorded verification-only scope exceptions:

- `docs/CURRENT-APP-FLOW.md` fulfills the user's explicit request for a
  documented flow of every current app page and overlay; it is read-only
  product documentation and changes no runtime behavior.
- `docs/design-notes/skjermmanifest.md` is regenerated because the authorized
  Home, Plan, and Find-outfit import edits changed generated line counts; its
  equality test blocks a stale manifest.
- `e2e/localization-carousel.ts` updates stale selectors and assertions so the
  required browser gate exercises the current result surface, localized
  carousel, and garment-image parity instead of a retired UI contract.
- `tools/verify-hjem.mjs` waits for the existing mascot image to decode before
  measuring layout stability. A cold image previously moved from zero intrinsic
  height during the measurement and produced a false animation failure; no UI,
  motion, geometry, or visual threshold is changed.

## Required RED → GREEN loop

1. Add the smallest failing contract test for one observable contradiction.
2. Run it and record that it fails for the expected reason.
3. Make the smallest threshold-neutral production change.
4. Run the focused gate until green.
5. Run lint, the full unit suite, build, and relevant end-to-end gates.
6. Create one candidate commit and record its immutable SHA.
7. Run fresh-context independent verification on that SHA.
8. If verification fails, fix, create a new candidate SHA, and repeat from step 4.

## Required commands

The implementation must provide and pass this focused command:

```powershell
npm run verify:engine-consistency
```

The final implementer and independent verifier gates are:

```powershell
npm run verify:engine-consistency
npm run lint
npm test
npm run build
npm run e2e
```

If a command cannot complete, the evidence must name the exact failing test, cause,
and whether the failure is introduced, pre-existing, or environmental. A timeout or
an unexplained skipped gate is not PASS.

## Rollout and rollback

- Rollout: one reviewed candidate commit on the current feature branch; no feature
  flag activation and no data migration.
- Rollback: revert that candidate commit. Stored profiles and recommendations need
  no migration.
- Production release, merge, tag, or TestFlight upload is outside this task unless
  separately requested.

## Done

This task is done only when every AC is either PASS or explicitly marked outside
scope because it requires missing professional authority, all required commands are
green on the same candidate SHA, independent verification is green, the current app
flow is documented, and the approved branch is pushed.
