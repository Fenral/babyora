---
phase: 03-living-home-signature-transition
plan: "01"
subsystem: ui
tags: [react, css, weather, atmosphere, accessibility, reduced-motion]

requires:
  - phase: planning-baseline
    provides: frozen Phase 3 plans and Babyora design/motion contracts
provides:
  - deterministic same-snapshot Home atmosphere resolver
  - bounded semantic-hidden Living Home background renderer
  - exact-SHA independent code/security and UI/accessibility approval
affects:
  - 03-04-living-home-composition
  - 03-06-home-app-integration

tech-stack:
  added: []
  patterns:
    - semantic weather model separated from decorative rendering
    - two-to-three token-driven layers with bounded or reduced motion

key-files:
  created:
    - src/lib/home-atmosphere.ts
    - src/lib/__tests__/home-atmosphere.test.ts
    - src/components/LivingHomeBackground.tsx
    - src/components/LivingHomeBackground.css
    - src/components/__tests__/LivingHomeBackground.test.tsx
    - .planning/phases/03-living-home-signature-transition/evidence/03-01-INDEPENDENT-REVIEW.md
  modified: []

key-decisions:
  - "Only exact supported MET provider symbols create a weather condition; unfamiliar values fail to neutral."
  - "Decorative Home motion is bounded to a maximum effective duration of 240 ms and becomes fully static under reduced motion."
  - "Weather meaning remains in semantic Home content; the decorative renderer is aria-hidden and pointer-inert."

patterns-established:
  - "Same-snapshot derivation: the resolver consumes caller-provided forecast values and never reads clock, global state or network."
  - "Neutral-by-default decoration: malformed or unknown data retains a readable token-driven surface."

requirements-completed:
  - HOME-01

coverage:
  - id: D1
    description: Deterministic same-snapshot atmosphere resolution with neutral malformed-input handling
    requirement: HOME-01
    verification:
      - kind: unit
        ref: "src/lib/__tests__/home-atmosphere.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: Semantic-hidden, pointer-inert, SSR-safe two-to-three-layer background with bounded and reduced motion
    requirement: HOME-01
    verification:
      - kind: unit
        ref: "src/components/__tests__/LivingHomeBackground.test.tsx"
        status: pass
    human_judgment: false
  - id: D3
    description: Independent code/security and fresh UI/accessibility reviews on one exact clean candidate SHA
    requirement: HOME-01
    verification:
      - kind: other
        ref: ".planning/phases/03-living-home-signature-transition/evidence/03-01-INDEPENDENT-REVIEW.md"
        status: pass
    human_judgment: false

duration: "16m implementation plus independent review"
completed: 2026-07-24
status: complete
phase3_candidate_sha: dbb9192140691ee152230a8bd610adadbf132d61
code_security_sha: dbb9192140691ee152230a8bd610adadbf132d61
code_security_status: PASS
ui_accessibility_sha: dbb9192140691ee152230a8bd610adadbf132d61
ui_accessibility_status: PASS
ancestry_status: PASS
clean_status: PASS
cost_nok: 0
---

# Phase 3 Plan 03-01: Living Home Atmosphere Summary

**A deterministic weather-aware Home atmosphere with exact MET symbol handling,
neutral fallbacks and a bounded accessible decorative renderer**

## Candidate and gate

```text
phase3_candidate_sha: dbb9192140691ee152230a8bd610adadbf132d61
code_security_sha: dbb9192140691ee152230a8bd610adadbf132d61
code_security_status: PASS
ui_accessibility_sha: dbb9192140691ee152230a8bd610adadbf132d61
ui_accessibility_status: PASS
ancestry_status: PASS
clean_status: PASS
cost_nok: 0
```

Review evidence:
`.planning/phases/03-living-home-signature-transition/evidence/03-01-INDEPENDENT-REVIEW.md`

## Accomplishments

- Resolves palette, lighting, condition, intensity and two-to-three layer
  descriptors solely from one caller-provided forecast snapshot.
- Uses perceived temperature for the main temperature axis while retaining
  actual temperature as a separate intensity input.
- Recognizes exact supported MET symbols and explicit day/night/polar-twilight
  suffixes without consulting the client clock.
- Renders a token-driven, semantic-hidden and pointer-inert React/CSS
  background that remains static for reduced motion and settles within 240 ms.
- Preserves a neutral readable surface for malformed or unknown weather.
- Passed two independent exact-SHA reviews with zero blockers and zero warnings.

## Task commits

1. **Resolver contract and implementation**
   - `e157b0c`, `61dfa66`, `94084a4`
2. **Renderer contract and implementation**
   - `dad45e7`, `ce84786`, `a765eed`
3. **Independent-review remediation**
   - `8e03b82`, `dbb9192`

The documentation commit is the atomic follow-up commit that contains this
summary and its independent-review evidence.

## Verification

| Check | Result |
|---|---|
| Focused resolver and renderer tests | PASS — 36/36 |
| TypeScript no-emit validation | PASS |
| Exact five-file implementation/test scope | PASS |
| Foundation ancestry | PASS |
| Dependency manifest/lockfile drift | PASS — none |
| Unknown/malformed provider fallback | PASS — neutral |
| Decorative layer bound | PASS — two or three |
| Effective motion maximum | PASS — 240 ms |
| Prop and OS reduced motion | PASS — static |
| SSR, ARIA and pointer behavior | PASS |
| Network/assets/timers/canvas/video/perpetual loops | PASS — none |
| Independent code/security review | PASS — 0 findings |
| Independent fresh UI/accessibility review | PASS — 0 findings |
| Cost | NOK 0 |

## Rejected predecessor and correction

Candidate `a765eedd617e46ada60880f5d1d34972277729d0` was not promoted.
Independent review identified overly broad provider-symbol interpretation and
layered timing outside the locked ordinary-UI band. Regression tests were
added, exact MET symbol mapping replaced substring-style classification, and
the effective layered duration was capped at 240 ms. Both reviews were then
repeated against `dbb9192140691ee152230a8bd610adadbf132d61`.

## Deviations from plan

### Auto-fixed review findings

1. Unknown provider strings now fail closed instead of receiving an inferred
   known condition.
2. Layer duration plus delay is now bounded to 240 ms.

No feature scope, package, schema, storage, network or media work was added.

## User setup required

None.

## Rollback

Keep the existing static Home surface and do not integrate this candidate, or
revert the isolated Plan 03-01 commit range after foundation
`776a91fb3ea048475d6800d8211420dcc74c3e27` through candidate
`dbb9192140691ee152230a8bd610adadbf132d61`. No external state requires
cleanup.

## Next phase readiness

Plan 03-01 is complete and unblocks the Phase 3 Living Home composition that
depends on this primitive. Later Home/App integration must continue to pass the
same forecast snapshot into the resolver and preserve the semantic-hidden
decorative boundary.

---

*Phase: 03-living-home-signature-transition*
*Plan: 03-01*
*Completed: 2026-07-24*
