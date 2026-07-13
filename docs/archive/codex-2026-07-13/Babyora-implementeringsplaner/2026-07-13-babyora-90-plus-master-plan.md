# Babyora 90+ Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a material-aware recommendation engine for outdoor clothing from 0–71 months, every current Babyora page at 90+ quality, production-ready family sharing, bounded personal calibration, meaningful notifications, and native widgets.

**Architecture:** Five independently testable implementation plans share typed contracts for structured recommendations, fingerprints, household capabilities, and privacy-minimized snapshots. Motor 2.0 is built beside the legacy engine and stabilizes `RecommendationV2` before recommendation-facing UI, calibration and proactive surfaces integrate it.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Zustand, Capacitor 8, Vitest, Playwright, Supabase Auth/Postgres/RLS/Edge Functions, RevenueCat, PostHog EU, WidgetKit, Android AppWidget.

## Global Constraints

- Free = `i dag hjemme`; Plus = `fremover, overalt og sammen — personlig tilpasset`.
- Safety-critical current recommendations, TOG, Warm or Cold, and the simple morning reminder remain free.
- User-facing terminology is `plagg`, `Babyora`, and `Babyora Plus`; internal layer logic remains internal.
- Outdoor recommendations support `0–71` months. Ages `72+` are explicitly unsupported; TOG/sleep remains a separate `0–24`-month product.
- Material preference is free per child; synthetics are first-class functional alternatives.
- Preserve the current navy/plum, mint, peach, temperature-reactive, tactile instrument design system.
- No continuous tracking, child-photo judgment, wardrobe-photo ingestion, generic AI chat, affiliate marketplace, or opaque calibration model.
- Never expose service-role credentials in the client; enable RLS on every exposed Supabase table.
- Never send name, date of birth, coordinates, household ID, feedback history, or account data to PostHog or push payloads.
- Every interactive target is at least 44 × 44 points and supports reduced motion, text scaling, and assistive technology.
- Before implementation, work in a git-backed copy/worktree. The inspected repository has no `.git`; do not initialize or replace version control without user approval.
- Baseline commands: `npm test`, `npm run build`, `npm run lint`, and `npm run audit:test`. Existing lint debt is recorded separately; no task may add a lint failure.

## Claude Code model and effort routing

Use the smallest model that can complete the task reliably. Model choice is a quality and quota control, not a status choice.

| Work type | Model | Effort |
|---|---|---|
| UI, components, copy, ordinary tests, mechanical refactors | Sonnet 5 | High |
| Simple test updates, formatting, documentation, known one-file fixes | Sonnet 5 | Medium |
| Supabase schema/RLS, authorization, migration/sync, RevenueCat entitlement, notification scheduler | Fable 5 | Extra |
| Calibration algorithm and safety-engine integration | Fable 5 | Extra |
| Motor 2.0 domain model, safety port, material resolver, shadow review | Fable 5 | Extra |
| Cross-domain debugging after two failed Sonnet attempts | Fable 5 | Extra |
| Fable unavailable, blocked, or extra credits not approved | Opus 4.8 | Extra |

Rules:

- Start each independent task with `/clear`; retain project instructions and load only the relevant plan/task and files.
- Check `/model` before execution because exact availability changes by account and date.
- Check `/usage` before and after every Fable/Opus task.
- Fable 5 may require usage credits beyond the Pro allowance; do not enable or consume paid credits without the user's explicit approval.
- Do not use Max effort by default. Escalate beyond Extra only for a named blocker after tests and evidence show High/Extra failed.
- Do not run the whole master plan in one conversation. Use one task, its tests, review, and checkpoint per session.
- A higher-capability model must still follow TDD, permissions, RLS review, and release gates; it is not permission to broaden scope.

---

## Plan map and shared interfaces

1. `2026-07-13-babyora-verification-protocol.md` governs every task and package.
2. `2026-07-13-babyora-engine-2-plan.md` produces Motor 2.0, adapter, shadow comparison and cohort flags.
3. `2026-07-13-babyora-ui-90-plus-plan.md` produces the canonical UI and truthful paywalls on stable V2 semantics.
4. `2026-07-13-babyora-family-sync-plan.md` produces household/auth/sync.
5. `2026-07-13-babyora-personal-calibration-plan.md` integrates calibration into `ThermalIntent`.
6. `2026-07-13-babyora-notifications-widgets-plan.md` consumes the stable V2 fingerprint.

Shared contracts created by Plan 1:

```ts
export type Capability =
  | 'today_home'
  | 'morning_reminder'
  | 'safety_guides'
  | 'future_plan'
  | 'automatic_location'
  | 'extra_places'
  | 'extra_children'
  | 'family_sharing'
  | 'personal_calibration'
  | 'smart_notifications'
  | 'widget';

export type AccessDecision = {
  allowed: boolean;
  reason: 'free' | 'plus' | 'loading' | 'signed_out' | 'expired' | 'role_denied';
  paywallTrigger?: string;
};

export type RecommendationView = {
  recommendation: RecommendationV2;
  garmentCount: number;
  orderedGarments: string[];
  summary: string;
  explanation: string[];
  fingerprint: string;
};
```

## Release gates

### Gate 0 — Safe execution environment

- [ ] Record `node --version`, `npm --version`, dependency lock hash, baseline test/build/lint/audit outputs, and current screenshots in `docs/superpowers/evidence/90-plus-baseline.md`.
- [ ] Confirm the execution copy is git-backed and clean; if not, stop before code changes and obtain user direction.
- [ ] Commit only the baseline evidence: `docs: record Babyora 90+ baseline`.
- [ ] Execute Motor 2.0 Task 0B as a separate mechanical commit; require test, audit, lint and build to pass before behavior work.
- [ ] Install the verification protocol as a mandatory execution instruction and create the task/package evidence directories.

### Gate 1 — Motor 2.0 foundation

- [ ] Execute Motor 2.0 Tasks 1–14 with all display flags off.
- [ ] Automate all 36 gold scenarios and every existing safety guardrail.
- [ ] Verify legacy adapter, shadow comparison and all-flags-off rollback.
- [ ] Keep new age cohorts off until their scenario packets are externally signed.

### Gate 2 — UI and product foundation

- [ ] Execute every task in the UI 90+ plan.
- [ ] Require an independent structured PASS for every task before the next task starts.
- [ ] Verify current recommendations remain complete when `isPlus=false`, `isAuthenticated=false`, and location permission is denied.
- [ ] Run the 13-page deterministic audit; no page may regress below baseline and the package target is 90+ for every implemented page.
- [ ] Do not enable family/calibration/notification marketing yet.

### Gate 3 — Household foundation

- [ ] Execute every task in the family/sync plan.
- [ ] Apply the two-key rule: the implementation session cannot approve its own RLS, invitation, or entitlement work.
- [ ] Run cross-household RLS denial tests, invite replay tests, local migration rollback tests, and verified RevenueCat webhook tests.
- [ ] Enable `family_sharing` only after owner, guardian, caregiver, read-only, revoked, expired, and offline paths pass.

### Gate 4 — Personal learning

- [ ] Execute every task in the calibration plan.
- [ ] Prove one observation cannot change the recommendation, bounds stay in `-1|0|1`, safety rules always win, and reset returns to standard.
- [ ] Enable personal-calibration copy only after evidence/review/pause/reset UI works.

### Gate 5 — Proactive surfaces

- [ ] Execute every task in the notifications/widgets plan.
- [ ] Verify push payload privacy, dedupe, quiet hours, timezone changes, stale widget behavior, deep links, and physical iOS/Android refresh.
- [ ] Enable smart-notification and widget claims only after native release builds pass.

### Gate 6 — Commercial release

- [ ] Offer only `49 kr/mnd` and `299 kr/år`; annual defaults selected with the configured seven-day trial. Keep `babyora_barnetiden_499` unpublished.
- [ ] Run `npm test`, `npm run build`, `npm run lint`, and `npm run audit:test`; attach outputs to `docs/superpowers/evidence/90-plus-release.md`.
- [ ] Complete VoiceOver, TalkBack, Dynamic Type, reduced-motion, haptics, offline, permission-denied, and multi-device family walkthroughs.
- [ ] Review 50 PostHog events and 20 push payload records for prohibited data.
- [ ] Release only with every enabled page at 90+, no critical/high issue, and truthful capability copy.
- [ ] Require one final fresh-context package review of the combined diff and all linked verification evidence.

## Dependency order

Canonical order: `Git/baseline -> Motor 2.0 contracts/adapter -> shadow and expert review -> canonical UI -> family/calibration/notifications/widgets`.

```text
UI contracts ──► household/auth ──► calibration ──► smart notifications
      │                 │                │                   │
      └─────────────────┴────────────────┴──────────────► widget v2
```

The UI plan can ship its non-recommendation foundation independently. Household/auth must precede cross-device feedback and server push. Widget v2 may begin after the Motor 2.0 fingerprint is stable.

## Specification coverage matrix

| Master specification area | Implemented by |
|---|---|
| Age 0–71, situations, functional materials, structured catalog, safety, adapter and shadow rollout | Motor 2.0 Tasks 1–17 |
| Visual system, modern glass temperature instrument, dressing sequence, textile stack, typography, controls, illustration consistency | UI Tasks 3–4, especially Task 3A |
| Four-root instrument dock and haptic grammar | UI Tasks 3 and 3A |
| Free/Plus capability and pricing rules | UI Tasks 1 and 7; Family Task 6 |
| All 13 existing page families and new Plus surfaces | UI Tasks 4–8; Family Task 7; Calibration Task 4; Notifications Task 2 |
| Canonical recommendation state and fingerprint | Motor 2.0 Tasks 9–12; UI Task 2; Calibration Task 3 |
| Authentication, roles, RLS, invitations, sync, migration, location privacy | Family Tasks 1–5 and 7 |
| Household-sponsored entitlement | Family Task 6 |
| Bounded feedback and transparent calibration | Calibration Tasks 1–5 |
| Meaningful notifications, suppression, privacy, deep links | Notifications Tasks 1–4 and 8 |
| Widget v2, native iOS/Android, stale/privacy states | Notifications Tasks 5–8 |
| Error states, analytics, security, accessibility, audit evidence | Every plan's final task plus Master Gates 0–5 |

No specification section is intentionally unassigned. If execution discovers a requirement that cannot be mapped to a task above, stop that package, amend the relevant plan and tests, and obtain review before code continues.
