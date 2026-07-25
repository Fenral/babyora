# Phase 3 Context: Living Home and signature transition

**Captured:** 2026-07-24
**Authority:** Direct owner instructions for this planning run, interpreted under `AGENTS.md` and `docs/DECISION-LOG.md`.

## Decisions

- **D-01 — Living Home is non-blocking.** Atmosphere derives synchronously from the same current weather snapshot as today's recommendation, using perceived temperature first, normalized weather, and explicit day/night/polar-twilight evidence. Recommendation, explanation, and CTA never wait for atmosphere or media.
- **D-02 — Reuse the existing visual/runtime stack.** Use CSS/DOM, current local assets where useful, existing temperature tokens, `motion`, `motion-grammar.ts`, `useNativeSettings`, and the current haptic system. Add no package, runtime video, runtime Higgsfield call, remote media dependency, or parallel design system.
- **D-03 — Semantic Outfit is primary.** Home→Outfit motion is an `aria-hidden`, non-focusable, pointer-transparent explanatory overlay above an already complete, operable, heading-focused Outfit. Normal completion, reduced motion, cancellation, and every error end in the same semantic state without waiting.
- **D-04 — Identity fails closed.** Motion requires exact equality of `snapshotId`, `recommendationFingerprint`, and `transitionContextId`, plus the frozen Phase-2 invariants and complete finite geometry. Any mismatch, missing/duplicate/zero-size anchor, stale viewport, unknown body mapping, or equipment-only item skips motion and keeps navigation successful.
- **D-05 — Phase-2 visibility truth is authoritative.** Transition selection starts only from `base.avatar.visibleGarmentIds`. Every listed ID must resolve exactly once in `base.garments`, have `visibleOnAvatar === true`, and carry valid non-null `avatarCoverage` whose slots/rank/occlusion confirm surviving visibility. `base.garments` resolves authoritative IDs but never independently selects candidates. Unknown, missing, duplicate, hidden, occluded, ambiguous, and equipment entries remain static. `transitionVisualState` is only scalar `"settled" | "landing"` presentation.
- **D-06 — Timing is bounded.** The explanatory sequence completes and cleans up in 900–1400 ms. Ordinary interaction feedback uses approximately 180–250 ms. The legacy ring/takeover sequence with more than 3.5 seconds of waiting is not part of the current Home→Outfit path.
- **D-07 — Replay default is conservative and deterministic.** At most one attempt is allowed per exact identity triple during the current App lifetime. The triple is consumed on the first deliberate Home activation whether motion runs or falls back, so reopening never surprises the user with delayed motion. A changed exact triple may teach the relationship once. Replay state stays in memory and never blocks navigation, focus, keyboard, or assistive technology.
- **D-08 — Verification is broad, release evidence is separate.** Automated coverage includes light/dark, cold/mild/warm, representative weather/daylight pairs, asset failure, focus, keyboard, screen-reader semantics, 200% text, reduced motion, lifecycle aborts, and deterministic performance budgets. Physical-device haptics/WebView traces and owner-authorized media remain Phase-4 evidence and do not block this code phase.
- **D-09 — Two execution tracks are mandatory.** The Phase-3 foundation (Living Home primitives, timeline/policy/eligibility, static fallback, and test harness) can be implemented before Phase 2 completes. Home→Outfit integration waits for the Phase-2 exact interface candidate and independent PASS.
- **D-10 — Worktree and ownership isolation are mandatory.** Phase 3 runs in isolated worktrees. Shared files owned by Phase 1 or Phase 2 are edited only after their declared exact-SHA gate, by one integration executor at a time.
- **D-11 — Cost target is NOK 0.** No package, generated media, external paid service, or new credit use is required. Any single or aggregate new commitment above NOK 1,000 requires owner approval and is outside autonomous execution.
- **D-12 — The plans are autonomous.** There are no human checkpoints or owner approval gates. Every plan freezes an immutable candidate SHA and obtains a fresh-context independent PASS before a dependent plan consumes it. Final candidate, two separate review records, and deterministic log live under an absolute orchestrator-created `BABYORA_PHASE3_EVIDENCE_ROOT` outside the detached checkout; summaries only reference their paths/hashes and never self-hash.

## Agent's Discretion

- Use a 1250 ms default explanatory timeline inside the approved 900–1400 ms window, with a compressed stagger that remains bounded for 1–10 garments.
- Use pairwise browser cases for the visual state matrix while unit tests exhaustively cover normalized atmosphere inputs.
- Create new-file Living Home atmosphere components during foundation work; replace/wire shared Home rendering only in the serialized post-gate integration plan.

## Deferred Ideas

- New generated runtime visual assets, Higgsfield production, or Lottie work.
- A new animation framework, physics engine, timeline editor, or design-token system.
- Recommendation thresholds, garment ordering, safety logic, Motor V2 activation, avatar generation, or Phase-1 exact-context redesign.
- Hardware, optional-media scoring, store submission, and release approval; these remain Phase 4 evidence.
