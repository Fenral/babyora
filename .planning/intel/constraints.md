# Constraints

## Repository source of truth
- source: AGENTS.md
- type: protocol
- content: GitHub is the durable source for code, plans, decisions, and handoffs. Planning follows the repository's declared document precedence and does not infer approval from older analysis or archived chat output.

## Current product boundary
- source: AGENTS.md
- type: protocol
- content: Free covers today at one fixed home location; Plus covers future, everywhere, and family sharing. v1 recommendation scope is ages 0-24 months. Babyora is the approved public name, Protected Core is the selected logo direction, and formal availability checks remain recommended before submission.

## Change authorization and risk policy
- source: AGENTS.md
- type: protocol
- content: docs/PROSESS-PLAN-TIL-KODE.md governs delivery through light, standard, and high-risk lanes. Planning does not authorize implementation; the owner must explicitly start an implementation phase. Implementation uses one scoped task and intentional commit at a time, completion claims require the plan's checks, and safety-related clothing guidance needs scenario evidence plus external professional review where the governing plan requires it.

## Repository security hygiene
- source: AGENTS.md
- type: nfr
- content: Secrets, local environment files, credentials, private keys, generated dependency folders, and build output must not be pushed. Before pushing, inspect repository status, review the staged diff, and check for sensitive files.

## Git and handoff synchronization
- source: AGENTS.md
- type: protocol
- content: Commit and push after meaningful approved milestones, avoid noisy conversational commits, update the decision log and current handoff at natural checkpoints, keep docs/CURRENT-HANDOFF.md current when the next action changes, and do not force-push, rewrite shared history, or delete remote branches without explicit approval.

## Product-wide release quality gates
- source: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md
- type: nfr
- content: Each implemented page family is verified at 390 by 844 and reaches at least 90/100 with no unaccepted critical or high issue. Rendered behavior, repository logic, copy, and entitlements agree; today's complete safe recommendation remains Free; canonical recommendation/avatar/list/fingerprint output remains consistent; builds and existing tests pass; accessibility, navigation, offline, permission, migration, household security, calibration, notification, and widget states are verified before release.

## Preserve and formalize the existing visual identity
- source: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md
- type: nfr
- content: Preserve navy/plum foundations, an expressive display serif paired with a practical sans-serif, mint action language, peach editorial warmth, temperature-reactive backgrounds, tactile 3D imagery, calm Norwegian copy, and restrained motion/haptics. Consolidate these into semantic tokens and reusable components rather than replacing the design system.

## Semantic color, temperature, and typography
- source: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md
- type: nfr
- content: Color follows semantic roles; mint intensities distinguish primary action, navigation, success, Plus markers, and promotion. Temperature surfaces use perceived temperature, continuous cold-to-warm interpolation, a stable contrast layer, reduced-motion fallback, and explicit labels so color never carries meaning alone. Display serif is reserved for major emotional moments and values; sans-serif serves actions, navigation, lists, safety, and dense information; figures are tabular and each screen has one semantic h1.

## Shared controls and accessibility baseline
- source: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md
- type: nfr
- content: Reuse shared components for each control role. Targets are at least 44 by 44 points; back/close controls have large hit areas but visually recede; decorative glow and permanent focus decoration are removed; cards communicate real grouping; loading skeletons match final layout; empty and error states provide a useful next action; text, focus, contrast, reduced motion, and assistive navigation remain valid across supported states.

## Functional and knowledge illustration truth
- source: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md
- type: nfr
- content: Functional imagery uses one child identity with sitting and standing master poses, a consistent camera/light/material/shadow, no context scene, and only verified visible outer garments and accessories derived from the canonical recommendation. Hidden layers stay in the list. Knowledge imagery uses a coordinated quieter family. Avatar production uses locked sequential edits, at most 24 approved composites, licensed/reference-safe inputs, and QA for garment truth, anatomy, identity, material, mobile crop, compression, and transparency.

## Four-root navigation and haptic grammar
- source: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md
- type: protocol
- content: The roots are Hjem, Planlegg, Guide, and Familie. Active navigation uses a quiet mint icon background, filled or strengthened icon, and stronger label without a full outline. Bottom navigation appears only on roots; drills use back navigation and preserve initiating focus and root scroll. Haptics map deliberately to selection, small choice, confirmation, success, warning, and meaningful garment thresholds, respect user preference, remain separate from reduced motion, degrade safely on web, and receive physical iOS/Android verification.

## Free and Plus capability boundary
- source: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md
- type: api-contract
- content: Free includes one active child, one fixed home place, the complete recommendation for today and every situation needed for correctness, garment reasoning and alternatives, the simple morning reminder, Warm or Cold, TOG/safety guidance, and core education. Plus adds future planning, automatic/additional places, additional children, Soon, household sharing and sync, bounded calibration, meaningful-change notifications, and native widget surfaces only as their runtime paths become enabled.

## Central and household entitlement enforcement
- source: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md
- type: api-contract
- content: A typed centralized capability map declares tier, safety impact, runtime support, paywall trigger/copy, and entitlement-loss fallback; safety-critical capabilities cannot be Plus. Verified RevenueCat server state sponsors one household and the client cannot grant access. One owner plus up to six active invitees share access; pending invitations reserve a seat for seven days. Loss preserves current safe recommendations, retained/exportable data, recovery, restore, and deletion while stopping new Plus-only operations, automatic location, smart notifications, and remote sync cleanly.

## Account timing and local-data migration
- source: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md
- type: protocol
- content: Account creation is not required before the first recommendation. Authentication is requested for sync, invitation, household purchase restore, or another device, with Apple, Google, and magic-link paths by platform. Existing local children and places move only through an explicit preview-and-confirm flow that exposes duplicates and outcomes rather than silently merging by name.

## First-value and current-recommendation surfaces
- source: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md
- type: protocol
- content: Onboarding keeps only required child/date/place/result steps, keeps fields and action visible at 390 by 844, requests notification permission only after a real recommendation, and shows no broad paywall first. Home automatically renders the verified age-appropriate outer outfit, a concise plagg summary, the next meaningful change, and stable loading/offline/location/weather fallbacks. Outfit uses one canonical recommendation and AvatarStateKey, keeps hidden layers in an innerst-first ordered list, preserves 44-point rows, and shows consequence-aware alternatives.

## Planlegg, Guide, tools, and Soon surfaces
- source: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md
- type: protocol
- content: Planlegg compresses unchanged Free periods, shows only meaningful change events, provides one truthful future example, compares Plus days by difference, includes Soon, and opens each future row in its own recommendation context. Guide prioritizes Find Outfit, Warm or Cold, and TOG under Tools/Learn/Prepare. Find Outfit preserves exact units and whole-degree control with cause explanations; TOG remains Free and not an outdoor-dressing basis; Warm or Cold exposes qualified guidance and attributable feedback; Soon gives cautious age/season/climate preparation without inventory burden, shopping links, or affiliate bias.

## Family, paywall, and Plus surface behavior
- source: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md
- type: protocol
- content: Familie presents household, children, caregivers, places, preferences, calibration, subscription, role-specific actions, invitation states, recovery/export/leave/remove/delete controls, and pre-prompt permission explanations. Paywalls lead with concrete enabled value, disclose trial, charge, cancellation, terms, privacy, and restore, return focus, and use no urgency, shame, or safety fear. Invitation acceptance reveals no child details before successful acceptance; personalization, notification, widget-setup, and account-data surfaces explain evidence, privacy, freshness, and destructive consequences.

## Copy and trust rules
- source: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md
- type: nfr
- content: Use plagg, Babyora, and Babyora Plus. Avoid absolute safety/correctness claims unless reviewed and scoped; present recommendations as starting points and explain what to check. Claims attributed to advice or standards require an applicable source. Every Plus claim maps to a working capability and verified runtime state, and paywall language states the exact future decision or saved effort.

## Canonical recommendation state and bounded domains
- source: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md
- type: api-contract
- content: One canonical state drives weather/perceived temperature, child profile, situation, garment order/count, verified visible AvatarStateKey and asset, summary/explanation, and future comparison. Future rows carry their own context. Entitlement affects availability or horizon, never current recommendation correctness. Recommendation, Identity, Household, Entitlement, Feedback, Notification, Widget, and Analytics remain independently testable domains; screens call typed services/hooks and render explicit loading, stale, denied, and error states rather than reaching into another domain's storage.

## Supabase household data model
- source: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md
- type: schema
- content: Shared state uses profiles, households, household_members, household_invites, children, places, child_feedback_events, child_calibrations, notification_preferences, device_tokens, household_entitlements, and notification_deliveries with the essential ownership, role, state, expiry, fingerprint, preference, token, and delivery fields specified by the source. All public tables receive RLS in their creation migration; authorization uses authenticated user ID plus active membership, invite acceptance and entitlement mutation run server-side, and service-role credentials remain in protected server environments.

## Roles, permissions, and invitations
- source: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md
- type: api-contract
- content: Owner, Guardian, Caregiver, and Read-only roles follow the source capability matrix in both UI and server/RLS enforcement. Ownership transfer requires an active guardian, reauthentication, and audit event; the last owner cannot be removed. Invitations use single-use short-lived hashed tokens, pre-accept disclosure, atomic recipient/expiry/seat/entitlement validation, explicit recovery for invalid states, and immediate access/token revocation when removed.

## Offline sync and location privacy
- source: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md
- type: protocol
- content: Local-to-cloud migration previews exact outcomes, writes transactionally, keeps a recoverable snapshot until verified sync, uses version-aware conflict prompts, append-only feedback, propagated tombstones, and visible idempotent offline queues. Free uses home and Plus may use current/additional places, but current position means the active caregiver device rather than child tracking. Precise coordinates are ephemeral for weather lookup, active/fallback place is explicit, and widgets, pushes, and analytics contain no coordinate history or movement trail.

## Bounded personal temperature calibration
- source: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md
- type: api-contract
- content: Calibration uses attributed warm/comfortable/cold observations without free text, photos, or precise location. It begins only after at least three usable observations across two comparable contexts, needs five or more recent observations for stronger confidence, and no single response changes the recommendation. Output is bounded to slightly lighter, standard, or slightly warmer, can adjust only one non-critical warmth step, never overrides protection/safety, is explained, and supports evidence review, exclusion, pause, reset, and disagreement fallback. Its deterministic fingerprint also drives notification dedupe and widget freshness.

## Smart notification policy
- source: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md
- type: api-contract
- content: The simple local morning reminder remains Free; Plus adds server-assisted meaningful-change categories. Eligibility requires a material recommendation-fingerprint change rather than raw weather change. Dressing-change delivery is limited to one per child per six hours and three non-security household notifications per day, deduplicates by household/child/category/window/fingerprint, honors timezone, quiet hours, category, relevant times, permission, and entitlement, combines nearby changes, uses privacy-safe lock-screen copy, deep-links to exact context, and logs reasons without message PII.

## Versioned widget snapshot
- source: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md
- type: schema
- content: The native snapshot contains schema version, privacy-safe child label, updated/valid-until times, temperature/feels-like, condition, garment count and up to three summaries, accessories, situation, next meaningful change/time, recommendation fingerprint, and deep link. It excludes child ID, birth date, email, coordinates, household ID, and feedback history, stays in native shared storage, supports a neutral privacy label, and defines never-opened, signed-out, fresh, stale, offline, location-fallback, profile-switch, entitlement-loss, and unsupported-version states and refresh triggers.

## Data lifecycle and analytics privacy
- source: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md
- type: nfr
- content: Owners can export and delete household data with recent authentication, clear consequences, and a seven-day recovery window; members can export their account data and leave. Invitation and delivery metadata follow the specified short retention windows, inactive device tokens expire, and linked analytics identity is removed on deletion/opt-out. PostHog remains EU-hosted and receives explicit categorical events without names, birth dates, coordinates, household IDs, invite destinations, or detailed feedback context.

## Required error and edge states
- source: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md
- type: nfr
- content: Surfaces explicitly handle weather loading/staleness/outage, network loss, location denial/fallback, incomplete profiles, unavailable forecast, purchase states, auth recovery, migration conflict/rollback, invitation failure variants, live member removal, calibration evidence variants, push failure/suppression, widget lifecycle variants, missing illustration, empty Soon, and empty search. Each state says what data Babyora is using, what the parent can do, and whether the recommendation is current or cached.

## Automated and manual verification strategy
- source: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md
- type: nfr
- content: Automated coverage includes unit/integration, capabilities, RLS roles and denial, invitation security, migration/idempotency/offline/delete propagation, recommendation consistency, calibration bounds, notification significance/dedupe/rates/privacy, widget version/freshness/privacy/deep links, RevenueCat webhook verification, navigation/focus, copy lint, deterministic screenshots, contrast where supported, production build, and lint delta. Manual coverage includes physical-device haptics, one-handed use, text scaling, screen readers, reduced motion, offline/permissions, multi-role/multi-device household paths, invitations, notifications/widgets, and asset truth.

## Delivery packages and capability gating
- source: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md
- type: protocol
- content: Delivery is sequenced through contract freeze, 90-plus foundation, identity/household/migration, family sharing, calibration, notifications/widgets, and commercial release. Unsupported family/calibration claims remain feature-flagged off until their runtime, authorization, errors, analytics, and tests are complete. Release requires every enabled page at 90-plus, every enabled capability claim working, and no critical or high finding.

## Product-wide non-goals and guardrails
- source: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md
- type: nfr
- content: No framework migration, generic AI chat, child-photo clothing judgment, wardrobe-photo ingestion, affiliate marketplace, streak mechanics, continuous tracking, movement history, sensitive push/widget payload, opaque warmth model, client privilege escalation, hidden AI health claims, broad identity replacement, or automatic implementation of audit prompts without review and tests.

## Protective morning instrument visual laws
- source: docs/superpowers/specs/2026-07-13-babyora-visual-signature-design.md
- type: nfr
- content: Babyora is approximately 60 percent clothing decision, 25 percent weather atmosphere, and 15 percent numeric precision. The verified child and ordered garment answer lead. Each screen has one decision and dominant physical metaphor; depth explains hierarchy, texture stays local, numbers stay exact, color stays semantic, motion demonstrates cause/effect, fake realism is excluded, and every metaphor has explicit labels, values, focus, controls, and reduced-motion behavior.

## Temperature instrument behavior
- source: docs/superpowers/specs/2026-07-13-babyora-visual-signature-design.md
- type: protocol
- content: Find Outfit uses a responsive vertical glass temperature instrument whose result and action stay visible, with an engraved whole-degree scale, explicit readout, threshold labels, and separate wind/rain controls. Drag and plus/minus controls have at least a 44-point hit area and whole-degree snapping. A subtle optional selection haptic may occur per degree and a distinct light impact occurs only on recommendation-fingerprint change. Atmosphere follows input; garment output settles after 120-180 ms or a real threshold; keyboard, large text, loading, override, and reduced-motion/haptic states remain explicit.

## Verified outer-outfit avatar behavior
- source: docs/superpowers/specs/2026-07-13-babyora-visual-signature-design.md
- type: protocol
- content: Use one identity with sitting and standing locked poses. Render the verified final visible outfit immediately; hidden base/middle layers remain list-only and are not shown through or animated onto outer garments. Crossfade 180-240 ms only when the visible state changes. If no verified composite exists, show an explicitly neutral avatar and keep the canonical list authoritative. Reduced motion resolves instantly and all visible anchors share one light source.

## Textile garment stack
- source: docs/superpowers/specs/2026-07-13-babyora-visual-signature-design.md
- type: protocol
- content: Outfit rows form one continuous, lightly overlapped vertical stack. Each row exposes garment name, placement/category, and a real optional alternative; the active row lifts slightly with a restrained mint edge and inactive rows avoid full shadows. Group tabs may identify internal layer categories, but user copy remains plagg and innerst først. Texture stays on thumbnails/tabs and drag-and-drop is not introduced.

## Plan change rail
- source: docs/superpowers/specs/2026-07-13-babyora-visual-signature-design.md
- type: protocol
- content: Planlegg uses one accessible vertical rail rather than repeated cards. Recommendation-changing and action-bearing location/preparation moments receive semantic markers whose shape communicates add, remove, rain protection, location, or preparation; passive weather-only changes receive no clothing marker. The selected marker expands to one action sentence and up to three garments, unchanged periods collapse into a single span, and future locked content shows one truthful restrained teaser rather than a wall of locks.

## Warm or Cold gauge
- source: docs/superpowers/specs/2026-07-13-babyora-visual-signature-design.md
- type: protocol
- content: The feedback control has three explicit cold/comfortable/warm positions with labels and icons, a neutral center, one restrained haptic, and immediate plain-language action. When calibration exists, show a small evidence explanation rather than a clinical graph or percentage. Assistive technology receives three radio choices rather than an unlabeled custom slider.

## Family care circle presentation
- source: docs/superpowers/specs/2026-07-13-babyora-visual-signature-design.md
- type: protocol
- content: The target Family summary places the active child centrally, shows up to four caregiver tokens plus a compact additional count, distinguishes active and pending access with redundant visual treatment, omits revoked members, and links to a conventional accessible member list. Roles use plain Norwegian and no visual or language implies live location, presence, or tracking. Current runtime availability remains governed by the higher-precedence feature-availability decision.

## Widget glance surface
- source: docs/superpowers/specs/2026-07-13-babyora-visual-signature-design.md
- type: protocol
- content: The widget is a small instrument rather than a miniature dashboard. Temperature plus a short garment decision dominates; next change appears only when action is needed. Small and medium layouts add only the specified summary, freshness, privacy label, condition, and next change. Stale data is visibly dimmed and directs the user to update in Babyora; the stable dark surface remains legible across launcher backgrounds.

## Paywall transformation and navigation dock
- source: docs/superpowers/specs/2026-07-13-babyora-visual-signature-design.md
- type: protocol
- content: The paywall demonstrates Free-to-Plus expansion through one 500-700 ms reveal, skipped under reduced motion, while readable capability text and calm plan rows remain primary. The bottom dock is integrated with the dark canvas, uses filled icon/strong label/quiet mint pool without a full outline or heavy blur, keeps Hjem/Planlegg/Guide/Familie visible, crossfades roots in 140 ms, uses a controlled drill transition, and preserves quiet 44-48-point back/close controls.

## Material hierarchy and semantic tokens
- source: docs/superpowers/specs/2026-07-13-babyora-visual-signature-design.md
- type: nfr
- content: Materials are ordered as matte night canvas, restrained instrument glass, textile on garments/knowledge assets, then solid raised lists/forms. Lighting comes from upper left; highlights stay below the contrast layer, active elements receive soft reflected mint rather than neon, peach remains warmth/editorial, and shadows avoid pure black. The instrument-glass, highlight, channel, reflection, textile-shadow, and temperature aliases reuse existing colors and introduce no duplicate palette; the current expressive serif token remains Fraunces where the visual-signature spec governs.

## Motion and haptic choreography
- source: docs/superpowers/specs/2026-07-13-babyora-visual-signature-design.md
- type: nfr
- content: Temperature input responds immediately, atmosphere interpolates for 220-320 ms, the value settles, a threshold/fingerprint haptic fires only when appropriate, the verified avatar crossfades for 180-240 ms only on visible-state change, and reason copy appears last. Full sequences stay at or below 900 ms and individual transitions at or below 360 ms except the one-time paywall demonstration. Reduced motion resolves directly and haptics never carry meaning alone.

## Visual asset and acceptance constraints
- source: docs/superpowers/specs/2026-07-13-babyora-visual-signature-design.md
- type: nfr
- content: Produce design references for the temperature control, two poses, care circle, and widget before related production assets. Avatar assets use the locked edit-chain identity, consistent light/camera/grounding, exact visible-garment mapping, licensed inputs, and review for anatomy, identity, material, silhouette, transparency, crop, compression, and AvatarStateKey. Dynamic text, scales, controls, focus, and temperature columns remain rendered UI. Affected surfaces must preserve garment truth, privacy, accessibility, one dominant metaphor, device/state robustness, and a 90-plus audit; the higher-precedence decision governs the user-comprehension gate and spend approval.
