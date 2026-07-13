# Babyora Family and Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add secure accounts, household roles, invitations, multi-device child data, local migration, and one verified Plus entitlement for everyone in the household.

**Architecture:** Supabase Auth identifies users; Postgres plus RLS owns shared data. A repository boundary keeps screens independent of Supabase, while a local cache and idempotent queue preserve offline use. RevenueCat remains billing truth and a verified webhook grants a household entitlement server-side.

Motor 2.0 adds the free per-child field `materialPreference` with allowed values `best_for_conditions`, `prefer_wool`, and `avoid_wool`. The local migration must exist before family sync; the server column defaults to `best_for_conditions`, validates the enum, and follows the same child-edit role permissions as other non-medical profile settings.

**Tech Stack:** Supabase JS, Postgres migrations/RLS, Supabase Edge Functions, React/Zustand, RevenueCat, Vitest, Supabase local test stack.

## Global Constraints

- Apply the master plan constraints and current official Supabase documentation at implementation time.
- Apply `2026-07-13-babyora-verification-protocol.md`; RLS, invitations, migration, and entitlement require independent two-key review.
- RLS is enabled in the same migration as every exposed table; no service-role key enters Vite/client code.
- Owner + six active invited members; pending invitations reserve a seat for seven days.
- **Execution model:** Use Sonnet 5 High for Tasks 1, 3, 4, and 7. Use Fable 5 Extra for Tasks 2 (schema/RLS), 5 (secure invitations), and 6 (RevenueCat household sponsorship). If Fable is unavailable or paid usage is not approved, use Opus 4.8 Extra.

---

### Task 1: Supabase boundary and generated types

**Files:** Modify `package.json`, `.env.example`, `src/vite-env.d.ts`; create `src/lib/supabase/client.ts`, `src/lib/supabase/database.types.ts`, `src/lib/supabase/session.ts` and tests.

- [ ] Add `@supabase/supabase-js` with the existing package manager and lockfile; never hand-edit the lockfile.
- [ ] Write tests that missing env returns a typed unavailable state and never logs keys.
- [ ] Implement a singleton browser client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, persisted sessions, auto refresh, and PKCE.
- [ ] Generate database types from the local/linked project after migrations; imports must use `Database` rather than handwritten row shapes.
- [ ] Run focused tests and build; commit `feat: add typed Supabase client boundary`.

### Task 2: Household schema and RLS

**Files:** Create `supabase/migrations/202607130001_households.sql`, `supabase/tests/households_rls.sql`, `src/lib/family/types.ts`.

**Interfaces:** Roles are `'owner'|'guardian'|'caregiver'|'read_only'`; active membership is the only read path.

- [ ] Write pgTAP/local SQL tests first: cross-household SELECT/UPDATE denied, caregiver cannot edit child, guardian can edit child, read-only cannot submit feedback, revoked member sees nothing, last owner cannot be removed.
- [ ] Create `profiles`, `households`, `household_members`, `household_invites`, `children`, `places`, and `household_entitlements` with UUID PKs, UTC timestamps, checks, unique active membership, and indexes on every RLS predicate.
- [ ] Add `is_household_member(household_id)` and `has_household_role(household_id, roles[])` as tightly scoped stable SQL helpers; do not use client-writable metadata.
- [ ] Enable RLS and add separate SELECT/INSERT/UPDATE/DELETE policies with both `USING` and `WITH CHECK` where required.
- [ ] Run `supabase db reset` and SQL tests; inspect security/performance advisors; commit `feat: add household schema and row level security`.

### Task 3: Authentication and account recovery

**Files:** Create `src/lib/auth/auth-service.ts`, `src/state/auth-store.ts`, `src/screens/auth/SignInSheet.tsx`, `src/screens/auth/AuthCallbackScreen.tsx`, tests; modify `src/main.tsx`, `src/App.tsx`, native URL configuration.

- [ ] Write tests for Apple, Google, email magic link, cancelled provider, expired link, session refresh, sign-out, and preserved invite deep link.
- [ ] Implement `signInWithApple()`, `signInWithGoogle()`, `sendMagicLink(email)`, `signOut()`, and `onAuthStateChange()` behind `AuthService`.
- [ ] Configure `babyora://auth/callback` and web callback allowlists; restore the initiating action after successful auth.
- [ ] Ask for auth only at sync/invite/restore/second-device intent, never before the first local recommendation.
- [ ] Run web/native callback tests and build; commit `feat: add recoverable Babyora authentication`.

### Task 4: Repository, cache, and local migration

**Files:** Create `src/lib/family/family-repository.ts`, `src/lib/family/supabase-family-repository.ts`, `src/lib/sync/offline-queue.ts`, `src/lib/sync/local-migration.ts`, `src/state/family-store.ts`, tests; adapt `src/state/children-store.tsx` without breaking its consumer contract.

**Interfaces:** `FamilyRepository` exposes `loadHousehold`, `listChildren`, `upsertChild(command)`, `archiveChild(command)`, `listPlaces`, and `subscribe`; every mutation carries `operationId` and `baseUpdatedAt`.

- [ ] Write tests for anonymous mode, migration preview, create/join/merge/keep-separate choices, duplicate-name non-merge, mid-transaction failure, idempotent retry, offline queue replay, conflict prompt, and delete tombstone propagation.
- [ ] Implement explicit migration phases `preview → confirm → upload → verify → bindLocalIds`; retain a recoverable local snapshot until verified sync.
- [ ] Keep feedback append-only; use last-write-with-conflict-prompt for materially changed profile fields.
- [ ] Show `lokal`, `synkroniserer`, `frakoblet`, `konflikt`, or `oppdatert` state without blocking the current recommendation.
- [ ] Run repository tests offline and against local Supabase; commit `feat: migrate and sync Babyora family data safely`.

### Task 5: Secure invitations and roles

**Files:** Create `supabase/functions/create-household-invite/index.ts`, `accept-household-invite/index.ts`, `revoke-household-access/index.ts`, shared auth/CORS helpers, function tests; create `src/lib/family/invites.ts`, `src/screens/family/InviteSheet.tsx`, `InvitationAcceptScreen.tsx`, `MemberDetailScreen.tsx`.

- [ ] Write failing tests for single use, token hash only, seven-day expiry, recipient mismatch, replay, revoked invite, already member, seventh invited member, concurrent accept, and no child disclosure before acceptance.
- [ ] Create 256-bit random tokens, store SHA-256 hashes, return the plaintext only once, and validate auth/owner/seat/entitlement in the Edge Function transaction.
- [ ] Implement acceptance as an atomic database function that consumes the invite and creates membership once.
- [ ] Build role explanations and pending/accepted/expired/revoked states; owner alone can invite or revoke.
- [ ] Run Edge Function, RLS, deep-link, and UI tests; commit `feat: add secure household invitations`.

### Task 6: RevenueCat household sponsorship

**Files:** Modify `src/lib/billing/revenuecat.ts`, `src/lib/premium/use-access.ts`, `src/state/subscription-store.ts`; create `supabase/functions/revenuecat-webhook/index.ts`, `src/lib/access/household-entitlement.ts`, tests.

- [ ] Write tests for webhook authorization header/signature policy, event idempotency, purchase/renew/expire/transfer, stale-event rejection, restore, signed-out cache, and client inability to grant access.
- [ ] Identify RevenueCat with the authenticated Supabase user id; after purchase, the server maps sponsor user to one household.
- [ ] Upsert `household_entitlements` only from the verified function and store last webhook event/version.
- [ ] Make `useAccess()` combine server household entitlement, RevenueCat freshness, auth loading, and safe offline grace without writing server truth.
- [ ] Offer monthly/yearly only and keep the lifetime SKU unpublished.
- [ ] Run billing sandbox tests and commit `feat: sponsor household access from RevenueCat`.

### Task 7: Family UX, privacy, export, and deletion

**Files:** Expand `src/screens/FamilieScreen.tsx`; create `src/screens/family/HouseholdScreen.tsx`, `ChildProfileScreen.tsx`, `PlacesScreen.tsx`, `AccountDataScreen.tsx`; create export/delete Edge Functions and tests; update privacy documents.

- [ ] Write tests for owner/guardian/caregiver/read-only visible actions, current-device location wording, owner transfer, leave, removal while open, export, 7-day deletion recovery, and hard-delete cascade.
- [ ] Implement Family sections “Barn”, “De som passer”, “Steder”, “Babyora Plus”; keep legal/destructive controls lower.
- [ ] Use current device position ephemerally for weather and never persist movement history; fallback visibly to home.
- [ ] Export readable JSON/CSV; require recent authentication for ownership transfer and deletion; schedule hard deletion after seven days with cancel recovery.
- [ ] Purge invites after 30 days, inactive device tokens after 90 days, and notification metadata after 30 days.
- [ ] Run multi-device manual matrix and automated security suite; commit `feat: complete family privacy and data controls`.
