---
phase: 01
slug: planlegg-dagslinjen
status: approved_for_execution
plan_count: 18
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-19
updated: 2026-07-22
media_gate: pending_owner_permission_after_stable_candidate
---

# Phase 01 — Validation Strategy

> Exact validation map for 18 sequential plans and 45 tasks: 44 automated bindings plus one blocking human checkpoint. While implementation can still change, evidence is source-, test-, DOM-, accessibility- and interaction-based only. No new app screenshot, video or trace is created.

## Current gate truth

- `wave_0_complete` is **true**: Plan 01-01 created every fixture/TODO/harness path and the repaired candidate `9115aeb` received a fresh independent exact-SHA PASS.
- `nyquist_compliant` is **true** for the repaired 18-plan package after fresh independent plan/UI/validation convergence against source SHA `e669afff0259750840393e8475f84afbc7937352`.
- `01-SNART-RULES.md` remains exactly `snart-v1.0-draft` / `pending_approval` during planning. Plan `01-13-01` is the only blocking human checkpoint and must stop until all six approvals and independently supplied climate artifacts exist.
- The corrected draft requires `empty` only when no group has a visible item. If actionable items are marked while a winning `not_yet` remains, S18 requires authoritative `ready` with only `not_yet` and no `Har allerede` action.
- App media, physical-device checks, the media-based 90+ score and owner release remain **Pending**. `audit:prepare` and `audit:finalize` remain deferred.

## Test infrastructure

| Property | Contract |
|---|---|
| Unit/component | Vitest 4.1.8; pure functions and `react-dom/server`; no jsdom or Testing Library |
| Browser | Repository TypeScript Playwright harness: `npx tsx e2e/planlegg.ts --case <name>` |
| Browser fixture | 390×844, `Europe/Oslo`, frozen clock/weather/child/entitlement/location and invented data only |
| Multi-step command | PowerShell 5.1-safe fail-fast wrapper: `cmd.exe /d /s /c "first && second"` |
| Full deterministic run | `cmd.exe /d /s /c "node scripts/validate-snart-climate.mjs src/data/snart-climate-1991-2020-v1.json .planning/phases/01-planlegg-dagslinjen/01-SNART-CLIMATE-PROVENANCE.md && npm test && npm run lint && npm run build && npx tsx e2e/planlegg.ts --case native-polish && npx tsx e2e/planlegg.ts --case all"` |
| Recording | Screenshot off, video off, trace off and no persisted browser media output |
| Review | Every candidate is immutable; executor cannot PASS own work; any edit invalidates the prior verdict |

## Review continuity

- Run each task's exact literal command below immediately after that task. Commands must remain byte-identical to their PLAN binding.
- High-risk truth/context/entitlement/access/location/Snart slices require fresh approved high-risk verification on their exact candidate SHA.
- Standard UI/routing slices that touch App/Uke boundaries also require high-risk regression review of unchanged contracts.
- Plan 01-18 requires separate standard UI/code and high-risk truth/context/access verdicts on the same exact code SHA, recorded in a deterministic text-only packet.
- One scoped repair cycle creates a new SHA and new reviews. A repeated unresolved disagreement stops and escalates to the owner.

## Multi-Source Coverage Audit

| Source | Item or item group | Coverage | Plans |
|---|---|---|---|
| GOAL | Truthful immediate Planlegg decision; Free today at configured/fixed home; Plus only implemented future/place/Snart value; exact future drill; family remains unclaimed | COVERED | 01-02–01-18 |
| REQ | GOV-01, GOV-02, GOV-03 | COVERED | 01-01, 01-07, 01-10 |
| REQ | GOV-04, GOV-05, GOV-06 | COVERED | High-risk candidate/reviewer contracts across 01-02–01-18, final dual verdict in 01-18 |
| REQ | TRUTH-01 | COVERED | 01-01–01-03, 01-07, 01-14 |
| REQ | CTXT-01 | COVERED | 01-04–01-06 and current-context extension 01-12 |
| REQ | UI-01 | COVERED | 01-01, 01-03, 01-06 |
| REQ | UI-02 | COVERED | 01-07, 01-10, 01-12, 01-15–01-18 |
| REQ | ACCESS-01 | COVERED | 01-08–01-17 |
| REQ | A11Y-01 | COVERED | 01-01, 01-06–01-07, 01-15–01-16, 01-18 |
| REQ | EVID-01, EVID-02 | COVERED | 01-01, 01-06–01-08, 01-10, 01-12, 01-16–01-18 |
| RESEARCH | Responsibility map, existing-stack reuse and no new package/framework | COVERED | Exact file ownership and package prohibitions in all plans |
| RESEARCH | Forecast currentness, coverage, timezone and offline truth | COVERED | 01-02–01-03; scope-aware preservation in 01-11–01-12 |
| RESEARCH | Exact future context and controlled semantic rail | COVERED | 01-04–01-07 |
| RESEARCH | Access/product truth and capability availability | COVERED | 01-08–01-10; entitlement freshness in 01-09 |
| RESEARCH | Snart deterministic evidence/model/presentation | COVERED | Blocking approval 01-13; model 01-14; component/session 01-15; enable/E2E 01-16 |
| RESEARCH | Native polish, haptics, shared navigation and validation architecture | COVERED | 01-18 plus per-task command matrix here |
| CONTEXT | No standalone `01-CONTEXT.md` exists; locked owner decisions are carried by PROJECT/REQUIREMENTS/UI-SPEC/SNART-RULES: no app media while changing, no unsupported family claim, session-only `Har allerede`, App state-router semantics and capability-backed premium value | COVERED | 01-08–01-18 and explicit no-media gate |
| DEFERRED | Screenshot/video/trace audit, physical-device evidence, 90+ score and release approval | EXCLUDED — explicitly deferred, never represented as PASS | Post-stable-candidate owner gate |

Audit result: every GOAL, requirement, applicable research constraint and recorded owner decision is covered; there is no unplanned in-scope item. Deferred media/device/release work remains visible as a gate rather than being silently omitted.

## Exact per-task verification map

| Task ID | Behavior proved | Exact automated/manual gate | Status |
|---|---|---|---|
| `01-01-01` | Frozen invented fixtures and pending contracts | `npx vitest run src/lib/planning/__tests__/forecast-evidence.test.ts src/lib/planning/__tests__/timezone.test.ts src/lib/planning/__tests__/plan-view-model.test.ts src/lib/planning/__tests__/planned-outfit-context.test.ts src/lib/planning/__tests__/planning-interaction.test.ts src/lib/planning/__tests__/snart.test.ts` | PASS on `9115aeb` |
| `01-01-02` | Case-selectable no-media harness | `cmd.exe /d /s /c "npm run build && npx tsx e2e/planlegg.ts --case harness"` | PASS on `9115aeb` |
| `01-02-01` | Forecast cache provenance/currentness and stale recovery | `npx vitest run src/lib/met-no/__tests__/client.test.ts` | Pending |
| `01-02-02` | Atomic weather hook plus Oslo/DST coverage | `npx vitest run src/hooks/__tests__/useWeather.test.ts src/lib/planning/__tests__/forecast-evidence.test.ts src/lib/planning/__tests__/timezone.test.ts` | Pending |
| `01-03-01` | Stable events, distinct changes and action grammar | `npx vitest run src/lib/planning/__tests__/change-events.test.ts src/lib/planning/__tests__/change-sentence.test.ts` | Pending |
| `01-03-02` | Coverage-aware canonical rail rows | `npx vitest run src/lib/planning/__tests__/rail-rows.test.ts` | Pending |
| `01-03-03` | Safe aggregate view model and isolated legacy seam | `cmd.exe /d /s /c "npx vitest run src/lib/planning/__tests__/plan-view-model.test.ts && npx vitest run src/lib/planning/__tests__ && npm run lint && npm run build"` | Pending |
| `01-04-01` | Expected missing planned-context RED signature | `powershell -NoProfile -Command '$out = (& npx vitest run src/lib/planning/__tests__/planned-outfit-context.test.ts --reporter=verbose 2>&1 | Out-String); $code = $LASTEXITCODE; if ($code -eq 0) { throw "Expected RED" }; if ($out -notmatch "RED_PLANNED_CONTEXT_CONTRACT" -or $out -notmatch "MISSING_PLANNED_OUTFIT_CONTEXT_CONTRACT") { $out; throw "Unexpected RED signature" }'` | Pending |
| `01-04-02` | Immutable DTO with three distinct IDs and no persistence | `cmd.exe /d /s /c "npx vitest run src/lib/planning/__tests__/planned-outfit-context.test.ts && npx tsc -b --pretty false"` | Pending |
| `01-05-01` | Pure fail-closed current-event/map/DTO/ID resolver | `npx vitest run src/lib/planning/__tests__/planned-outfit-resolver.test.ts src/lib/planning/__tests__/planned-outfit-context.test.ts` | Pending |
| `01-05-02` | Trusted transient App/Outfit planned branch | `cmd.exe /d /s /c "npx vitest run src/lib/planning/__tests__/planned-outfit-resolver.test.ts src/lib/planning/__tests__/planned-outfit-context.test.ts src/lib/recommendation/__tests__ && npm run build"` | Pending |
| `01-06-01` | Expected old rail-contract RED and pure cue cases | `powershell -NoProfile -Command '$out = (& npx vitest run src/components/planning/__tests__/PlanChangeRail.test.tsx --reporter=verbose 2>&1 | Out-String); $code = $LASTEXITCODE; if ($code -eq 0) { throw "Expected RED" }; if ($out -notmatch "RED_CONTROLLED_RAIL_CONTRACT" -or $out -notmatch "OLD_RAIL_OWNS_LOCAL_OPEN_STATE") { $out; throw "Unexpected RED signature" }'` | Pending |
| `01-06-02` | ID-only controlled rail, nullable select, six markers and canonical thumbnail chain | `cmd.exe /d /s /c "npx vitest run src/lib/planning/__tests__/planning-interaction.test.ts src/components/planning/__tests__/PlanChangeRail.test.tsx && npm run lint && npm run build"` | Pending |
| `01-06-03` | Atomic Uke/App migration, sole trusted DTO handoff and exact-context E2E | `cmd.exe /d /s /c "npx vitest run src/lib/planning/__tests__/planned-outfit-resolver.test.ts src/lib/planning/__tests__/planned-outfit-context.test.ts src/lib/planning/__tests__/planning-interaction.test.ts src/components/planning/__tests__/PlanChangeRail.test.tsx && npm run build && npx tsx e2e/planlegg.ts --case semantic-rail && npx tsx e2e/planlegg.ts --case exact-context"` | Pending |
| `01-07-01` | Truthful status/recovery and weather disclosure primitives | `cmd.exe /d /s /c "npm run lint && npm run build"` | Pending |
| `01-07-02` | One-scroll hierarchy, preserved resolver and silent refresh repair | `cmd.exe /d /s /c "npx vitest run src/lib/planning/__tests__ src/components/planning/__tests__/PlanChangeRail.test.tsx && npm run lint && npm run build"` | Pending |
| `01-07-03` | Composition state/focus/reflow plus exact-context regression | `cmd.exe /d /s /c "npm run build && npx tsx e2e/planlegg.ts --case composition && npx tsx e2e/planlegg.ts --case exact-context"` | Pending |
| `01-08-01` | Pure centralized capability decision matrix | `npx vitest run src/lib/access/__tests__/capabilities.test.ts` | Pending |
| `01-08-02` | Generic policy/availability intersection and compatibility wrapper | `npx vitest run src/lib/premium/__tests__/gating.test.ts src/lib/premium/__tests__/plus-features.test.ts` | Pending |
| `01-08-03` | False-availability containment at App-called refresh and Settings, with seeded-auto zero-I/O/unchanged-child evidence | `cmd.exe /d /s /c "npm run build && npx tsx e2e/planlegg.ts --case location-containment"` | Pending |
| `01-09-01` | Expected missing single-flight entitlement RED signature | `powershell -NoProfile -Command '$out = (& npx vitest run src/lib/premium/__tests__/use-access.test.ts --reporter=verbose 2>&1 | Out-String); $code = $LASTEXITCODE; if ($code -eq 0) { throw "Expected RED" }; if ($out -notmatch "MISSING_SINGLE_FLIGHT_ENTITLEMENT_FRESHNESS") { $out; throw "Unexpected RED signature" }'` | Pending |
| `01-09-02` | Fail-closed startup/resume entitlement freshness | `cmd.exe /d /s /c "npx vitest run src/lib/premium/__tests__/use-access.test.ts src/lib/access/__tests__/capabilities.test.ts && npx tsc -b --pretty false && npm run build"` | Pending |
| `01-10-01` | Capability-derived paywall and zero family semantics | `cmd.exe /d /s /c "npx vitest run src/lib/premium/__tests__/paywall-copy.test.ts src/lib/premium/__tests__/products.test.ts src/lib/premium/__tests__/gating.test.ts && npx tsc -b --pretty false"` | Pending |
| `01-10-02` | Truthful Today/Uke from fresh centralized access | `cmd.exe /d /s /c "npx vitest run src/lib/premium/__tests__/use-access.test.ts src/lib/premium/__tests__/gating.test.ts src/lib/planning/__tests__/plan-view-model.test.ts src/lib/premium/__tests__/paywall-copy.test.ts && npm run build"` | Pending |
| `01-10-03` | Free/loading/Plus/downgrade/focus access matrix | `cmd.exe /d /s /c "npm run build && npx tsx e2e/planlegg.ts --case access && npx tsx e2e/planlegg.ts --case exact-context && npx tsx e2e/planlegg.ts --case semantic-rail"` | Pending |
| `01-11-01` | Persistent fixed/manual versus memory-only automatic cache scopes | `cmd.exe /d /s /c "npx vitest run src/lib/met-no/__tests__/client.test.ts src/lib/geocode/__tests__/nominatim.test.ts && npx tsc -b --pretty false"` | Pending |
| `01-11-02` | Cache scope/source carried atomically through useWeather | `npx vitest run src/hooks/__tests__/useWeather.test.ts src/lib/planning/__tests__/forecast-evidence.test.ts` | Pending |
| `01-11-03` | Fixed home, persisted mode and child-scoped ephemeral place separation | `cmd.exe /d /s /c "npx vitest run src/state/__tests__/location-pref-store.test.ts src/lib/premium/__tests__/gating.test.ts && npx tsc -b --pretty false"` | Pending |
| `01-12-01` | Intent-aware cancellable automatic-location controller | `cmd.exe /d /s /c "npx vitest run src/hooks/__tests__/useAutoLocationRefresh.test.ts src/state/__tests__/location-pref-store.test.ts src/lib/premium/__tests__/use-access.test.ts src/lib/premium/__tests__/gating.test.ts && npx tsc -b --pretty false"` | Pending |
| `01-12-02` | Settings/Hjem/Uke share access/place/scope and enable only proven automatic location | `cmd.exe /d /s /c "npx vitest run src/hooks/__tests__/useWeather.test.ts src/hooks/__tests__/useAutoLocationRefresh.test.ts src/state/__tests__/location-pref-store.test.ts src/lib/premium/__tests__/plus-features.test.ts src/lib/premium/__tests__/paywall-copy.test.ts && npm run build"` | Pending |
| `01-12-03` | Exact current/future Outfit contexts plus zero automatic persistent cache keys | `cmd.exe /d /s /c "npm run build && npx tsx e2e/planlegg.ts --case automatic-location && npx tsx e2e/planlegg.ts --case access && npx tsx e2e/planlegg.ts --case exact-context"` | Pending |
| `01-13-01` | Six Snart approvals, unchanged normative projection and approved climate artifacts | **Blocking human checkpoint:** follow Plan 01-13's seven-step verification and resume only with six named approvals plus rules/pack/provenance/validator hashes | Pending / expected block |
| `01-14-01` | Approved offline pack validator and strict exact-profile decoder | `cmd.exe /d /s /c "node scripts/validate-snart-climate.mjs src/data/snart-climate-1991-2020-v1.json .planning/phases/01-planlegg-dagslinjen/01-SNART-CLIMATE-PROVENANCE.md && npx vitest run src/lib/planning/__tests__/snart-climate.test.ts"` | Pending after 01-13 PASS |
| `01-14-02` | S01–S18 pure model, traceability and corrected mark-all semantics | `cmd.exe /d /s /c "npx vitest run src/lib/planning/__tests__/snart-climate.test.ts src/lib/planning/__tests__/snart.test.ts && npx tsc -b --pretty false"` | Pending after 01-13 PASS |
| `01-14-03` | Immutable model/evidence candidate and independent exact-SHA PASS | `cmd.exe /d /s /c "node scripts/validate-snart-climate.mjs src/data/snart-climate-1991-2020-v1.json .planning/phases/01-planlegg-dagslinjen/01-SNART-CLIMATE-PROVENANCE.md && npm test && npm run lint && npm run build"` | Pending after 01-13 PASS |
| `01-15-01` | Exhaustive accessible component with both authoritative mark-all outcomes | `cmd.exe /d /s /c "npx vitest run src/lib/planning/__tests__/snart.test.ts src/components/planning/__tests__/SnartPlan.test.tsx && npm run lint"` | Pending after 01-14 PASS |
| `01-15-02` | Access-before-evaluation fixed-home session and one-shot request contract | `cmd.exe /d /s /c "npx vitest run src/lib/planning/__tests__/snart-session.test.ts src/lib/premium/__tests__/gating.test.ts src/lib/premium/__tests__/products.test.ts src/lib/premium/__tests__/paywall-copy.test.ts src/lib/planning/__tests__/planning-interaction.test.ts src/components/planning/__tests__/SnartPlan.test.tsx && npx tsc -b --pretty false"` | Pending after 01-14 PASS |
| `01-16-01` | Only verified `soon_preparation` becomes available | `cmd.exe /d /s /c "npx vitest run src/lib/premium/__tests__/plus-features.test.ts src/lib/premium/__tests__/paywall-copy.test.ts src/components/planning/__tests__/SnartPlan.test.tsx && npm run build"` | Pending after 01-15 PASS |
| `01-16-02` | Browser no-leak/state/fixed-home/mark-all/regression matrix | `cmd.exe /d /s /c "npm run build && npx tsx e2e/planlegg.ts --case snart && npx tsx e2e/planlegg.ts --case automatic-location && npx tsx e2e/planlegg.ts --case exact-context && npx tsx e2e/planlegg.ts --case semantic-rail && npx tsx e2e/planlegg.ts --case composition && npx tsx e2e/planlegg.ts --case access"` | Pending after 01-15 PASS |
| `01-17-01` | Guide/program entries share one typed Snart dispatcher | `cmd.exe /d /s /c "npx vitest run src/screens/__tests__/guide-routing.test.tsx src/lib/premium/__tests__/plus-features.test.ts src/lib/planning/__tests__/planning-interaction.test.ts && npx tsc -b --pretty false"` | Pending after 01-16 PASS |
| `01-17-02` | Unreachable legacy route removed and content targets locked | `cmd.exe /d /s /c "npx vitest run src/screens/__tests__/guide-routing.test.tsx && npm run lint && npm run build"` | Pending after 01-16 PASS |
| `01-17-03` | In-app root/left-edge/dismiss route semantics, no replay/history invention and high-risk regressions | `cmd.exe /d /s /c "npm run build && npx tsx e2e/planlegg.ts --case route-migration && npx tsx e2e/planlegg.ts --case exact-context && npx tsx e2e/planlegg.ts --case access && npx tsx e2e/planlegg.ts --case automatic-location && npx tsx e2e/planlegg.ts --case snart"` | Pending after 01-16 PASS |
| `01-18-01` | Native-only haptics, off/web/plugin zero adapter calls and motion independence | `cmd.exe /d /s /c "npx vitest run src/lib/planning/__tests__/planning-interaction.test.ts src/lib/haptics/__tests__/system.test.ts && npx tsc -b --pretty false"` | Pending |
| `01-18-02` | Four-root focus-visible/44px/forced-colors active navigation | `cmd.exe /d /s /c "npx vitest run src/components/__tests__/BottomTabBar.test.tsx src/lib/haptics/__tests__/system.test.ts src/types/__tests__/nav.test.ts && npm run lint && npm run build"` | Pending |
| `01-18-03` | Full deterministic text-only packet, source-boundary scans, dual independent verdicts and post-PASS AGENTS routine | `cmd.exe /d /s /c "node scripts/validate-snart-climate.mjs src/data/snart-climate-1991-2020-v1.json .planning/phases/01-planlegg-dagslinjen/01-SNART-CLIMATE-PROVENANCE.md && npm test && npm run lint && npm run build && npx tsx e2e/planlegg.ts --case native-polish && npx tsx e2e/planlegg.ts --case all"` | Pending |

## Browser case registry

| Case | Binding | Scope |
|---|---|---|
| `harness` | `01-01-02` | deterministic boot and no-media harness |
| `exact-context` | `01-06-03` | trusted exact future handoff; later regression owner unchanged |
| `semantic-rail` | `01-06-03` | ID-only rail, six markers, keyboard and reflow |
| `composition` | `01-07-03` | state matrix, one main/scroll and four roots |
| `location-containment` | `01-08-03` | seeded stored-auto startup/resume and Settings off/blocked reactivation; zero permission/geolocation/geocode/forecast calls and unchanged child bytes |
| `access` | `01-10-03` | fresh entitlement, Free/loading/Plus/downgrade/paywall |
| `automatic-location` | `01-12-03` | intent/access/cache/privacy/exact-current-and-future lifecycle |
| `snart` | `01-16-02` | no-leak access and ready/empty/unavailable plus S18 |
| `route-migration` | `01-17-03` | Guide/program to Snart through App state-router semantics |
| `native-polish` | `01-18-03` | visible navigation/motion behavior; haptic internals stay unit-only |
| `all` | `01-18-03` | all deterministic cases; no media output |

## Explicit no-media gate

- Do not run `scripts/verify-browser-uke.mjs`, `npm run audit:prepare`, `npm run audit:finalize`, screenshot-matrix helpers or any media-writing command while implementation changes.
- `e2e/planlegg.ts` keeps screenshot, video and trace recording off and persists no Playwright media artifacts.
- Browser assertions may inspect DOM geometry, landmarks, overflow, keyboard, focus, semantics, copy, exact context, route state, storage keys and external-call cardinality. They must not instrument haptic delivery or claim physical tactile quality.
- Final Plan 01-18 evidence is a deterministic text-only packet bound to one code SHA. App media and the 90+ visual score remain Pending until the owner explicitly permits capture.

## Manual/external gates

| Gate | Status |
|---|---|
| Six Snart policy/numeric/health/climate/size/privacy approvals and approved climate artifacts | **Pending; blocks 01-13** |
| Fresh plan/UI/validation convergence | **PASS on `6e7ccac`** |
| VoiceOver, TalkBack, physical haptics, OS text scaling and one-handed reach | Pending stable candidate |
| Media-based 90+ audit | Pending stable candidate and owner permission |
| Owner release approval | Pending all required gates |

## Sign-off checklist

- [x] All 18 plan numbers and all 45 task IDs are represented: 44 automated bindings plus one blocking human checkpoint.
- [x] Every multi-step command uses the exact PowerShell-5.1-safe `cmd.exe /d /s /c "... && ..."` literal from its PLAN.
- [x] Browser registry ownership is location containment 01-08-03, access 01-10-03, automatic location 01-12-03, Snart 01-16-02, route 01-17-03, and native/all 01-18-03.
- [x] No media-writing or watch-mode command is specified.
- [x] Browser haptic call-count assertions are excluded; native adapter behavior is unit-tested.
- [x] Wave 0 artifacts exist and pass on independently verified candidate `9115aeb`.
- [x] Fresh independent plan/UI/validation checker confirms this exact repaired package and source-grounds the drifted `GuideHubScreen.tsx`, `package.json`, and `e2e/smoke.ts` assumptions.

**Approval:** Ready for Plan 01-02 on exact clean HEAD `6e7ccac`. Wave 0 is independently verified on `9115aeb`, and fresh plan/UI/validation convergence passed on `6e7ccac`. This document does not pass Snart human evidence, app runtime, physical-device, media, 90+ or release gates.
