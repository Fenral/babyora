# Babyora Smart Notifications and Widgets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Proactively surface only outfit-changing weather information and provide privacy-safe, glanceable iOS and Android widgets.

**Architecture:** A pure significance engine compares canonical Motor 2.0 recommendation fingerprints and emits actions, not raw weather alerts. Server scheduling uses household preferences and device tokens; the free morning reminder remains local. Widgets receive a versioned, local-only snapshot through the existing native bridge. This plan cannot begin semantic notification work until the V2 fingerprint and structured explanation codes are stable.

**Tech Stack:** TypeScript/Vitest, Supabase Edge Functions/scheduled jobs, platform push provider, Capacitor local/push notifications, WidgetKit, Android AppWidget, native shared storage.

## Global Constraints

- Apply `2026-07-13-babyora-verification-protocol.md`; scheduler/privacy and native widget tasks require independent review and physical-device evidence.
- Maximum one dressing-change notification per child per six hours and three non-security notifications per household per day.
- Quiet hours, timezone, permission, category, significance, entitlement, dedupe, and current membership are checked before delivery.
- Widget and push payloads contain no identifiers, date of birth, coordinates, feedback history, or account details.
- **Execution model:** Use Fable 5 Extra for Tasks 1 (significance/security contract) and 3 (server scheduler/delivery). Use Sonnet 5 High for preference UI, deep links, widget contract, native iOS/Android work, and release evidence. If Fable is unavailable or paid usage is not approved, use Opus 4.8 Extra.

---

### Task 1: Notification preferences and significance engine

**Files:** Create `supabase/migrations/202607130003_notifications.sql`, RLS tests, `src/lib/notifications/types.ts`, `significance.ts`, tests; replace/bridge `src/state/notification-pref-store.ts`.

**Interfaces:** `evaluateChange(previous, next): ChangeDecision`; `ChangeDecision` is `{ significant:false; reason }` or `{ significant:true; category; actions:string[]; dedupeKey:string }`.

- [ ] Write tests for raw 1°C change ignored, garment added/removed, rain/wind/UV protection, warmth-band change, changed calibration, unchanged fingerprint, combined actions, and stable dedupe key.
- [ ] Create `notification_preferences`, `device_tokens`, and `notification_deliveries` with RLS, expiry/revocation, category checks, and dedupe unique index.
- [ ] Implement semantic comparison using ordered garment categories and structured recommendation reasons; never notify solely because a weather number changed.
- [ ] Run focused/SQL tests; commit `feat: define meaningful Babyora notification changes`.

### Task 2: Device registration and preference UX

**Files:** Create `src/lib/notifications/device-registration.ts`, `src/screens/family/NotificationSettingsScreen.tsx`, tests; modify `src/lib/notifications/morning-notification.ts`, Family routing, and native configuration.

- [ ] Write tests for pre-prompt, denied/default/granted, token rotation, sign-out revocation, child/category scope, departure/pickup time, quiet hours crossing midnight, timezone change, and privacy preview.
- [ ] Keep `scheduleMorningNotification()` free/local; add remote token registration only after explicit smart-notification enablement.
- [ ] Store tokens by installation id and user, upsert on rotation, revoke on sign-out/member removal, and remove after 90 inactive days.
- [ ] Build grouped settings for morning, meaningful changes, tomorrow, Soon, and account/family with one-sentence trigger explanations.
- [ ] Run permission tests and physical-device registration; commit `feat: add transparent notification controls`.

### Task 3: Server evaluator, scheduler, and delivery

**Files:** Create `supabase/functions/evaluate-notifications/index.ts`, `send-notification/index.ts`, shared weather/recommendation/push helpers and function tests; add documented scheduled invocation migration/config.

- [ ] Write tests for inactive entitlement, revoked membership, quiet hours, six-hour child cooldown, three-per-day household cap, duplicate fingerprint, stale forecast, timezone/DST, invalid token, retry, and security-event bypass.
- [ ] For eligible preferences, fetch forecast, build canonical recommendation with server-shared rule fixtures/version, compare last acknowledged/sent fingerprint, and insert a pending delivery atomically by dedupe key.
- [ ] Send generic payload `{ category, deepLink, changeKey }`; render child/place text in-app after authentication rather than embedding sensitive data in the push.
- [ ] Mark sent/suppressed/failed with categorical reason; retry transient failures with bounded backoff and revoke provider-invalid tokens.
- [ ] Verify exact current Supabase scheduler and push-provider APIs against primary docs before coding; record chosen provider/config in `docs/notifications-operations.md`.
- [ ] Run function tests and staging push matrix; commit `feat: deliver deduplicated recommendation changes`.

### Task 4: Deep links and acknowledgement

**Files:** Create `src/lib/navigation/deep-links.ts` and tests; modify `src/App.tsx`, `src/lib/native-init.ts`, analytics.

- [ ] Write tests for push/widget/invite/auth links, missing child context, revoked access, stale recommendation, signed-out recovery, and focus restoration.
- [ ] Parse only allowlisted routes/parameters; resolve child/context after auth and membership checks; fallback to Hjem/selector safely.
- [ ] Record the opened recommendation fingerprint as acknowledged without including it in analytics.
- [ ] Track only source/category/outcome; run native cold/warm start tests; commit `feat: route Babyora proactive surfaces safely`.

### Task 5: Widget snapshot v2 web contract

**Files:** Modify `src/lib/widget/snapshot.ts`, `bridge.ts`, tests, `docs/widget-contract.md`.

**Interfaces:** `WidgetSnapshotV2` includes `v:2`, display label/privacy mode, timestamps, weather summary, `garmentCount`, top garments/accessories, situation, optional next change/time, fingerprint, and deep link.

- [ ] Write failing tests for garment—not layer—count, max item lengths, privacy label, next change, valid-until, unsupported version, stale threshold, and forbidden-field serialization.
- [ ] Implement v2 without child/household ids, DOB, coordinates, or feedback; delete `layerCount/layerBadgeBand` from the new contract.
- [ ] Write snapshots after successful recommendation, situation/active-child/profile/entitlement change, relevant push, and stale app resume.
- [ ] Keep a v1 reader only for one migration release; native widgets show safe fallback for unknown versions.
- [ ] Define the widget's visual contract as a small Babyora instrument: dominant temperature/garment decision, slim non-interactive temperature column, optional next-change line, and explicit freshness.
- [ ] Run snapshot tests and commit `feat: version privacy-safe Babyora widget snapshot`.

### Task 6: iOS WidgetKit surface

**Files:** Modify `ios/App/BabyoraWidget/WidgetSnapshot.swift`, `BabyoraWidget.swift`, bundle/entitlements as required, `ios/App/App/Plugins/WidgetBridgePlugin.swift`; add native tests/snapshot previews.

- [ ] Add decoder fixtures for fresh, stale, privacy, next-change, never-opened, signed-out, and unknown-version states.
- [ ] Render small/medium widgets with Babyora night/temperature palette, slim instrument column, Dynamic Type-safe layout, updated time, garment summary, and clearly labeled stale state.
- [ ] Reload timelines through the App Group bridge without promising live weather; respect WidgetKit refresh budgets.
- [ ] Verify deep links and app-group access on a physical iPhone release build; commit `feat: ship Babyora WidgetKit v2`.

### Task 7: Android widget surface

**Files:** Modify `android/.../plugins/WidgetBridgePlugin.kt`, manifest/resources; create/update AppWidget provider/receiver/layout code and tests.

- [ ] Add the same v2 fixture/state tests as iOS, including process death and device reboot.
- [ ] Store snapshot in protected app preferences/DataStore, update configured widget ids, and render small/medium equivalents with accessible content descriptions.
- [ ] Route clicks through an allowlisted deep link and show stale/unknown fallback.
- [ ] Verify on physical Android across light/dark launcher backgrounds and battery restrictions; commit `feat: ship Babyora Android widget v2`.

### Task 8: Operations, privacy, and release evidence

**Files:** Modify analytics/privacy docs; create `docs/superpowers/evidence/notifications-widgets.md`.

- [ ] Add typed, non-PII events for eligible/suppressed/delivered/opened category and widget snapshot/deep-link outcome.
- [ ] Inspect 20 staging push payloads and 20 widget files; assert forbidden data is absent.
- [ ] Exercise quiet hours, DST, timezone travel, offline, entitlement loss, removed member, stale forecast, token rotation, and app reinstall.
- [ ] Run unit/SQL/function/build/lint-delta tests and physical iOS/Android matrix; document evidence.
- [ ] Commit `docs: verify Babyora proactive surfaces`.
