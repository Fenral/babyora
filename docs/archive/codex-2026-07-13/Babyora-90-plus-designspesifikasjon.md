# Babyora 90+ — Master Product and Experience Design

**Date:** 2026-07-13  
**Status:** Approved direction; written specification awaiting user review  
**Scope:** The 13 audited page families plus the complete Plus system for family, personal calibration, smart notifications, and widgets  
**Baseline:** Weighted product score 73.3/100

## 1. Goal

Raise every Babyora page family to a defensible score of at least 90/100 and fully define the product that can sustain that quality: a trustworthy daily recommendation, shared family access, controlled personal learning, proactive notifications, and glanceable widgets. The design must not game the audit rubric, weaken the free product, or replace Babyora's established visual identity.

The product principle is fixed:

> **Free = i dag hjemme.**  
> **Plus = fremover, overalt og sammen — personlig tilpasset.**

Every named Plus capability in this document is planned to implementation-ready depth. Delivery is divided into work packages to control risk, but family sharing, personal temperature learning, smart notifications, and widgets are not deferred product decisions.

## 2. Success criteria

The project is complete only when:

1. Every implemented page family is captured at 390 × 844 and scores at least 90 with rubric version 1.x.
2. No critical or high-severity issue remains without an explicit accepted exception.
3. The rendered app, repository behavior, product copy, and entitlement rules agree.
4. The complete and safe recommendation for today at home remains free.
5. Safety-critical guidance is not gated.
6. The avatar, garment count, garment list, dressing order, weather, and explanation use the same recommendation state.
7. All existing tests and production builds pass; no new lint failures are introduced.
8. Navigation, touch targets, reduced motion, contrast, loading, empty, offline, and denied-permission states are verified.
9. Haptics are checked on a physical iPhone and Android device before interaction quality receives a final 90+ score.
10. A signed-in household can invite, revoke, and manage caregivers with tested role boundaries and row-level authorization.
11. Local child data can be migrated to a signed-in account without silent loss or duplication.
12. Personal calibration is bounded, explainable, reversible, and never overrides safety rules.
13. Smart notifications are deduplicated, rate-limited, permission-aware, and sent only when the recommendation changes meaningfully.
14. Widgets handle fresh, stale, offline, signed-out, and entitlement-loss states without exposing sensitive child or location data.

Scores are a release gate, not an instruction to inflate the evaluator. If a page remains below 90, the cause is documented and corrected before completion.

## 3. Work decomposition

### Workstream A — Current app 90+

Included in this specification:

- design-system consolidation;
- navigation and haptic grammar;
- free/Plus entitlement correction;
- current Home, Outfit, Plan, Guide, calculators, knowledge, profile/settings, and paywall flows;
- replacement of the high-friction wardrobe experience;
- illustration consistency;
- deterministic screenshot and audit verification.

### Workstream B — Family network

Fully specified in this document:

- accounts and authentication;
- family ownership;
- caregiver roles and permissions;
- invitations and revocation;
- multi-device synchronization;
- caregiver-local weather;
- privacy, export, and data deletion;
- anonymous-to-account migration and offline synchronization;
- household-level Plus sponsorship.

### Workstream C — Personal intelligence and proactive surfaces

Fully specified in this document:

- warm/comfortable/cold feedback history;
- controlled per-child calibration;
- meaningful weather-change notifications;
- widgets and lock-screen surfaces;
- notification scheduling and suppression;
- native widget snapshots and deep links;
- transparent explanation, reset, and caregiver feedback review.

The three workstreams share one master design and one capability model. They may be implemented sequentially, but marketing for a capability is enabled only when its runtime path, authorization, error states, analytics, and tests are complete.

## 4. Visual system: preserve and formalize

Babyora keeps its current identity:

- dark navy/plum foundations;
- DM Serif Display paired with a practical sans-serif;
- mint action language;
- peach editorial warmth;
- temperature-reactive backgrounds;
- soft, tactile 3D baby and garment imagery;
- calm, precise Norwegian copy.

This project does not introduce a replacement design system. It consolidates the existing one into semantic tokens and reusable interaction components.

### 4.1 Color grammar

| Semantic role | Required use |
|---|---|
| Canvas night | App canvas and neutral knowledge surfaces |
| Temperature canvas | Home, Plan, and Find Outfit only; derived from perceived temperature |
| Raised surface | Cards, sheets, segmented controls, and navigation |
| Primary text | Decisions, titles, and essential values |
| Secondary text | Explanation and metadata with tested contrast |
| Mint action | Primary action and completed/active confirmation |
| Mint navigation | A quieter mint tint than the primary CTA |
| Peach editorial | Warmth, selected words, temperature emphasis, and knowledge highlights |
| Cold blue | Cold temperature meaning only |
| Amber warning | Non-critical caution |
| Coral error | Errors and destructive feedback |
| Focus ring | Keyboard and assistive focus; never used as permanent decoration |

Mint must no longer simultaneously dominate CTA, Plus, navigation, success, and large promotional areas at the same intensity. Plus may use a small mint marker, but the paywall should remain visually part of Babyora rather than becoming a mint campaign page.

### 4.2 Temperature background

- Use perceived temperature, not raw air temperature.
- Interpolate continuously across cold blue, neutral night, plum, and warm burgundy.
- Preserve a dark contrast layer so text contrast remains stable.
- Animate only meaningful changes, with reduced-motion fallback.
- On sliders, the atmosphere follows smoothly while garment recommendations update only at actual rule thresholds.
- Temperature color never carries meaning alone; labels and values remain explicit.

### 4.3 Typography

- DM Serif Display is reserved for display titles, emotional product moments, and major numbers.
- Sans-serif is used for actions, navigation, controls, garment lists, safety copy, and dense information.
- Large numbers use tabular figures.
- Small uppercase labels are reduced where sentence case or serif italics produce clearer hierarchy.
- Body text is constrained to readable line lengths and uses text wrapping that avoids orphans.
- Every screen has one semantic `h1`.

### 4.4 Surfaces and controls

- Use one shared component per control role: primary button, secondary button, segmented control, sheet header, back button, close button, setting row, and paywall plan row.
- Touch targets are at least 44 × 44 points.
- Back buttons and close buttons keep large hit areas but visually recede from the content.
- Permanent purple glow and decorative focus rings are removed.
- Cards exist only when grouping or elevation communicates structure.
- Loading skeletons match the final layout; empty and error states contain a useful next action.

## 5. Illustration system

Use two coordinated families:

### Functional imagery

- soft 3D baby and garments;
- consistent camera angle, scale, lighting direction, material, and shadow;
- generated from the same recommendation state as the garment list;
- no decorative garment that contradicts the recommendation.

### Knowledge imagery

- quieter textile, clay, paper, or low-relief illustration;
- palette derived from Babyora's plum, peach, mint, and temperature colors;
- used for onboarding and educational content;
- no watercolor family that appears to belong to a separate product;
- no emoji avatar as a primary profile illustration.

Nano Banana Pro may be used to create missing assets after an asset brief is approved from this specification. Generated assets are inspected for garment accuracy, anatomy, visual consistency, licensing suitability, and transparent-background quality before integration. Google Image is used for research references, not for copying or shipping unlicensed artwork.

## 6. Navigation design

### 6.1 Four top-level destinations

| Tab | User question | Content |
|---|---|---|
| Home | What applies now? | Weather, situation, today's recommendation, next meaningful change |
| Plan | What happens later? | Rest of today, future days, and Soon |
| Guide | How does this work? | Find Outfit, Warm or Cold, TOG, clothing knowledge, and first winter |
| Family | Who and what does this apply to? | Children, places, notification preferences, subscription, and settings |

The user-facing Norwegian labels are **Hjem**, **Planlegg**, **Guide**, and **Familie**.

### 6.2 Active state

Use no more than three coordinated signals:

- a quiet mint-tinted icon background;
- a filled or strengthened icon;
- stronger label color and weight.

Remove the permanent full mint outline around the entire tab. Navigation mint is visually quieter than primary action mint.

### 6.3 Hierarchy

- Bottom navigation appears only on the four top-level roots.
- Outfit, TOG, Warm or Cold, Clothing Library, First Winter, and other drills use a back button and hide bottom navigation.
- Outfit remains a focused full-screen recommendation surface.
- A screen never shows a dominant back control and competing global navigation simultaneously.
- Tab changes preserve the relevant root scroll position; drill-down back navigation returns to the initiating element.

## 7. Haptic grammar

| Interaction | Haptic |
|---|---|
| Change tab or segmented selection | `selection` |
| Toggle or small binary choice | `light` |
| Confirm child, place, or important setting | `medium` |
| Save or complete a meaningful task | `success` |
| Invalid or blocked action | `warning` |
| Temperature slider | Subtle tick only at meaningful garment thresholds |
| Scroll, open article, ordinary back navigation | None |

Rules:

- Respect the user's haptic preference.
- Do not fire haptics for every tap or animation.
- Reduced motion and reduced haptics are separate preferences.
- Web/PWA gracefully omits unavailable haptics.
- Haptics must be verified on physical iOS and Android hardware.

## 8. Product and entitlement model

### 8.1 Free

- one active child;
- one fixed home place;
- complete recommendation for today;
- all situations required for a correct current recommendation;
- garment details, alternatives, and reasoning;
- simple morning reminder;
- Warm or Cold;
- TOG and safety guidance;
- core educational material.

### 8.2 Plus

- future days and meaningful time-ahead planning;
- automatic current location;
- additional saved places;
- additional children;
- manual planning for another available forecast date and place;
- the Soon preparation experience;
- richer seasonal planning;
- one shared household with additional children;
- invitations for guardians, caregivers, and read-only family members;
- synchronized profiles, places, preferences, and feedback across devices;
- controlled per-child warm/cold calibration;
- meaningful recommendation-change notifications;
- native Home/lock-screen widget surfaces supported by the platforms.

### 8.3 Central entitlement source

Entitlement decisions must be centralized in a typed capability map rather than scattered component checks. Each capability declares:

- free or Plus;
- whether it affects safety/correctness;
- supported runtime state;
- paywall trigger and contextual copy;
- fallback behavior when entitlement is lost.

Safety-critical capability entries cannot be configured as Plus.

### 8.4 Household entitlement

The RevenueCat entitlement belongs to an authenticated purchaser but sponsors one Babyora household. Active household members receive the shared Plus capabilities while membership and sponsorship are valid. StoreKit/Play billing remains the commercial source; a verified RevenueCat webhook updates a server-owned entitlement record. The client may display cached status, but it cannot grant household access by writing subscription state itself.

One household includes the owner plus up to six active invited members. Pending invitations reserve a seat for seven days. The owner can revoke an invitation or member to free a seat. Members do not buy separate subscriptions for access to that household.

Entitlement loss follows a graceful rule:

- current safe recommendations remain available;
- shared data is retained while the household account exists and can be exported or deleted by the owner;
- members can view existing children but cannot add people, children, or Plus-only planning;
- automatic location falls back to the chosen home place;
- smart notifications and remote sync stop cleanly;
- export, deletion, purchase restore, and account recovery remain available.

### 8.5 Account timing

Account creation is not required before the first recommendation. Babyora first delivers the free value locally. Authentication is requested when the user enables sync, invites someone, restores a household purchase, or adds another device. Sign in with Apple is the primary iOS path; Google is offered on Android and web; email magic link is the recovery and cross-platform fallback. Existing local children are imported through an explicit preview-and-confirm flow after sign-in.

## 9. Page-by-page design

### 9.1 Onboarding — baseline 72

Goal: first personalized outfit before any broad Plus request.

- Keep four short logical steps only if all are required: child, age/date, home place, first result.
- Use one progress indicator, not both step text and vertical dots.
- Reduce illustration height so fields and primary action remain visible at 390 × 844.
- Replace the watercolor image with the coordinated knowledge illustration family.
- Explain why date and location improve the recommendation.
- Ask notification permission only after showing the first real recommendation, with a pre-permission explanation.
- Do not show a general paywall before the first result.
- Name is optional; date and place are required for personalization.

### 9.2 Home — baseline 79.4

Goal: answer the daily question without a tap.

- Render the dressed baby automatically when weather and recommendation are ready.
- Show a concise summary such as “8 plagg · ull, fleece og vinterdress”.
- Change the CTA from “See today's outfit” to “See details”.
- Keep situation selection before the summary when it changes correctness.
- Show only the next meaningful change, such as “Same outfit all day” or “Add fleece before pickup”.
- Maintain the temperature atmosphere and strong thumb-zone placement.
- Provide stable loading, cached/offline, denied-location, and weather-error states.

### 9.3 Outfit — baseline 77.8

Goal: preserve the signature visual while improving speed and truth.

- Use **plagg**, never an exposed “lag count”.
- The visual orbit, avatar, summary, and list share one recommendation object.
- Keep the correctly dressed avatar and compact the orbit when garment count is high.
- Show a short summary before the detailed sequence.
- Use “Rekkefølge · innerst først”.
- Group optional accessories without implying they are stacked layers.
- Make the list denser while preserving 44-point rows.
- Keep garment alternatives and explain the consequence of each swap.

### 9.4 Plan — baseline 67.9

Goal: become the clearest Plus value.

- Rename Uke to Planlegg.
- Free today view compresses unchanged periods into one message.
- Show only recommendation-changing events in the timeline.
- Future teaser shows one real example before the paywall.
- Plus week view summarizes each day's difference from today rather than repeating garment counts.
- Add a Soon subview for preparation over the next four to six weeks.
- A selected future row opens the matching future recommendation, never today's recommendation.

### 9.5 Guide — baseline 72.6

Goal: support the core product without becoming a competing app.

- Replace KLEMEG with Babyora everywhere.
- Remove TOG from outdoor calculator claims.
- Organize content into Tools, Learn, and Prepare.
- Put Find Outfit, Warm or Cold, and TOG first.
- Clothing Library remains an optional reference lower in the hierarchy.
- Replace the wardrobe hero/card with Soon.
- Use Babyora's knowledge illustration family consistently.

### 9.6 Find Outfit — baseline 76

Goal: expose cause and effect in human language.

- Show plagg count and garment summary instead of “lag”.
- Add human labels such as no rain, light rain, and fresh wind while retaining units secondarily.
- Add plus/minus temperature controls and whole-degree snapping.
- Use subtle haptic ticks only when crossing garment recommendation thresholds.
- Explain each recommendation change: wind added a shell; rain added waterproof protection.
- Prevent the result card from competing with or being hidden by navigation.

### 9.7 Clothing Library — baseline 72.1

Goal: fast reference, not inventory management.

- Remove desktop-only command hints on touch devices.
- Keep search prominent and expose the most common categories first.
- Make horizontal filtering clearly scrollable without accidental clipped labels.
- Reduce repeated counts and visual density.
- Use one consistent garment image family and truthful material labels.
- Provide a useful no-results state with spelling/category suggestions.

### 9.8 Soon, replacing My Wardrobe — baseline family 64

Goal: deliver proactive value with minimal maintenance.

- Remove My Wardrobe from primary navigation and Guide.
- Reuse this audited page family's weight for **Snart**.
- Use child age, optional current size, season, home climate, and forecast tendencies.
- Present “Bør ha”, “Kjekt å ha”, and “Ikke nødvendig ennå”.
- Use cautious language such as likely next size; never claim exact growth timing.
- Let users mark only currently relevant suggestions as already owned.
- Do not require a 62-item wardrobe database.
- Do not add shopping links or affiliate bias in this project.

### 9.9 TOG — baseline 82

Goal: retain the strong focused tool and improve epistemic safety.

- Replace “Riktig varme for natten” with wording that presents a good starting point.
- Keep the strong temperature/TOG visualization.
- Put manufacturer guidance and a short neck-check reminder near the result.
- Make clothing-under-sleeping-bag assumptions visible.
- TOG remains free.
- Do not reference TOG as the basis for outdoor dressing.

### 9.10 Warm or Cold — baseline 83

Goal: become Babyora's trust signature.

- Preserve the one test, three signals, and three actions.
- Moderate the absolute statement about hands and feet.
- Refer to neck, overall behavior, and other signs in plain language.
- Keep semantic color paired with icon and text.
- End with an optional “Hvordan kjentes nakken?” response: litt varm, passe, or litt kald.
- Explain when feedback will be used and show the current calibration state.
- Store feedback only after an authenticated household exists; a local response may be queued and attached after explicit account migration.
- Let guardians inspect recent feedback, see who submitted it, and reset the child's calibration.

### 9.11 First Winter — baseline 70

Goal: need-based knowledge, not artificial course retention.

- Make all safety-critical core lessons free.
- Let the parent open lessons by current need rather than waiting one week.
- Keep a recommended order but remove forced pacing language.
- Plus may add seasonal preparation and contextual reminders, not basic safety facts.
- Replace or align decorative assets with the knowledge illustration family.

### 9.12 Family root, replacing Settings tab — baseline 70.9

Goal: make profiles and product control feel like a useful destination.

- Rename the tab Familie.
- Show the household, children, caregivers, active home place, saved places, notification preferences, calibration status, and subscription summary.
- Keep technical settings and legal links lower in the page.
- Make the simple morning reminder free.
- Gate automatic location and extra places behind Plus.
- Gate child two and later while preserving safe read access after entitlement loss.
- Let the owner invite a guardian, caregiver, or read-only family member by secure link or email.
- Show pending, accepted, expired, and revoked invitations with clear actions.
- Each member sees their role in plain language and only the actions that role permits.
- Provide account recovery, export, leave-family, remove-member, and delete-household flows with step-up confirmation for destructive actions.
- Permission requests explain why before invoking the native prompt.

### 9.13 Paywall — baseline 64.7

Goal: sell the truthful current Plus product.

- Lead with “Fremover, overalt og sammen”.
- Show concrete previews: tomorrow's change, automatic place, shared family access, personal calibration, smart changes, and Soon.
- Present value before prices.
- Offer 49 kr/month and 299 kr/year at launch; annual is selected by default and includes the configured seven-day trial.
- Do not offer the current 499 kr lifetime product at launch. Keep the store product unpublished rather than presenting an economically conflicting third plan.
- Clearly show trial timing, exact post-trial charge/date, cancellation, terms, privacy, and restore purchase.
- Use Babyora Plus consistently; remove “Premium”.
- Replace “both parents” with “Én Plus — alle som passer barnet” only when the complete household runtime is enabled.
- Contextual paywalls explain the attempted action and retain focus when closed.
- No fake urgency, countdown, shame, or safety fear.

### 9.14 New Plus surfaces — target 90+

These surfaces are part of the same audit, even though they have no original baseline score.

**Family overview**

- Hero shows active child and household, not a technical account dashboard.
- “Barn”, “De som passer”, “Steder”, and “Babyora Plus” form the primary sections.
- Each member row shows name, plain-language role, status, and last sync only when useful.
- The invite CTA opens a focused sheet: recipient, role explanation, seat count, and send action.

**Invitation acceptance**

- Shows inviter, household, role, access scope, expiry, and accept/decline before authentication.
- Preserves the invite through provider sign-in and app installation/deep-link handoff.
- Never reveals child details before successful acceptance.

**Child personalization**

- Child detail contains profile, current size, dressing preferences, “Hvordan kjentes nakken?” history summary, and calibration state.
- Feedback evidence is summarized as counts and recent pattern, not a clinical chart.
- Pause and reset use clear consequences; reset is reversible only by collecting new evidence.

**Notification center**

- Preferences are grouped by morning, meaningful changes, tomorrow, Soon, and account/family.
- Each category has one sentence describing exactly when Babyora will notify.
- Departure/pickup time, quiet hours, child scope, and minimum significance are visible without technical jargon.
- A preview explains lock-screen privacy before the native permission prompt.

**Widget setup**

- Shows small/medium platform previews using real current recommendation data.
- Lets the user choose child, privacy mode, and whether next change is shown.
- Explains that operating-system widget placement happens outside Babyora and provides the correct platform instruction.
- Shows last refresh and stale behavior; does not imply continuous live tracking.

**Account and data**

- Separates sign-in/recovery, household ownership, export, leave, and delete actions.
- Destructive actions are visually quiet until entered, require recent authentication, and show who loses access.
- Legal/privacy text is reachable but does not dominate the Family root.

## 10. Copy and trust rules

- Use plagg as the user-facing noun; layers remain internal logic and educational explanation.
- Use Babyora and Babyora Plus only.
- Avoid “safe”, “correct”, “guaranteed”, and similarly absolute language unless the claim is reviewed and scoped.
- Describe a recommendation as a starting point and show what to check.
- Do not cite “helsesøster advice” or a standard without a documented, applicable source.
- Every Plus claim must link to a working capability and a verified runtime state.
- Avoid vague premium language; show the exact future decision or saved effort.

## 11. State and data flow

One canonical recommendation state drives:

1. weather and perceived temperature;
2. child age/profile;
3. situation/activity;
4. garment list and order;
5. garment count;
6. avatar outfit;
7. summary and explanation;
8. future comparison.

UI surfaces consume this state rather than independently deriving approximations. Future rows carry their own recommendation context into Outfit.

Entitlement state is separate from recommendation correctness. A denied entitlement changes availability or planning horizon, never the correctness of a current safety-relevant answer.

### 11.1 Bounded domains

The implementation is divided into independently testable domains:

| Domain | Responsibility | Depends on |
|---|---|---|
| Recommendation | Produces garments, order, explanation, fingerprint, and change reasons | Child context, weather, situation, calibration |
| Identity | Authentication, session recovery, and account state | Supabase Auth |
| Household | Membership, children, roles, places, invitations, and ownership | Identity |
| Entitlement | Maps verified RevenueCat status to household capabilities | Identity, household, verified webhook |
| Feedback | Records observations and derives bounded calibration | Household, recommendation fingerprint |
| Notification | Decides whether a change is significant, then schedules or sends | Recommendation, preferences, device tokens |
| Widget | Writes a privacy-minimized local snapshot | Recommendation, active child, native bridge |
| Analytics | Typed, non-PII product events | Explicit domain events |

No screen reaches directly into another domain's storage. Screens call typed services/hooks and render explicit loading, stale, denied, and error states.

### 11.2 Supabase data model

Supabase is the shared source of truth after sign-in. Local storage remains the offline cache and anonymous first-use store.

| Table | Essential fields and purpose |
|---|---|
| `profiles` | `user_id`, display name, locale, created/updated timestamps; no child data |
| `households` | `id`, name, owner user, status, deletion state |
| `household_members` | household, user, role, active/revoked state, joined timestamp |
| `household_invites` | household, role, hashed token, destination hash/normalized destination, expiry, inviter, accepted/revoked timestamps |
| `children` | household, display name, date of birth, optional current size, relevant dressing preferences, active/archive state, version timestamp |
| `places` | household, user-facing label, coarse weather lookup location, home flag; no movement history |
| `child_feedback_events` | child, submitting member, recommendation fingerprint, warm/passe/cold value, context snapshot, observed timestamp; append-only |
| `child_calibrations` | child, bounded offset, confidence/evidence count, explanation inputs, updated timestamp |
| `notification_preferences` | member/device/child scope, categories, morning time, pickup time, quiet hours, minimum significance |
| `device_tokens` | user, device installation id, platform, encrypted/protected token, last seen, revoked timestamp |
| `household_entitlements` | household, sponsor user, RevenueCat app user id, product, active/expiry state, webhook event version |
| `notification_deliveries` | dedupe key, category, scheduled/sent/suppressed state, reason, timestamps; excludes message PII |

All public-schema tables have RLS enabled in the same migration that creates them. Access is based on authenticated `user_id` plus active household membership; authorization never trusts mutable user metadata. Invite acceptance and entitlement updates run server-side. The service-role credential exists only in protected server/Edge Function environments.

### 11.3 Roles and permissions

| Capability | Owner | Guardian | Caregiver | Read-only |
|---|---:|---:|---:|---:|
| View recommendations and plans | Yes | Yes | Yes | Yes |
| Select situation and temporary current place | Yes | Yes | Yes | No |
| Submit warm/passe/cold feedback | Yes | Yes | Yes | No |
| Edit child profile and saved places | Yes | Yes | No | No |
| Review/reset calibration | Yes | Yes | No | No |
| Invite/revoke members | Yes | No | No | No |
| Manage subscription, export, or delete household | Yes | No | No | No |
| Leave household | Transfer/delete first | Yes | Yes | Yes |

The UI hides unavailable actions, but RLS and server checks enforce the same rules. Ownership transfer requires an active guardian, re-authentication, and an audit event. Removing the last owner is impossible.

### 11.4 Invitation flow

1. Owner chooses role and sends an email or native share link.
2. Server creates a single-use, short-lived token; only its hash is stored.
3. The recipient sees household name, inviter, requested role, expiry, and privacy summary before accepting.
4. New users authenticate first; existing users resume their session.
5. Acceptance is atomic: validate token, expiry, recipient constraint, household state, seat limit, and entitlement; then create membership and consume token.
6. Expired, reused, mismatched, revoked, and already-member cases each have a specific recovery action.
7. The owner can resend or revoke. A revoked member immediately loses remote access and their device tokens for that household are invalidated.

### 11.5 Anonymous-to-account migration and offline sync

- The first child and home place can remain local until the user chooses a shared capability.
- After sign-in, Babyora shows a migration preview: local children, existing cloud household, duplicates, and the exact result.
- The user chooses create household, join invited household, merge a clearly matched child, or keep profiles separate. Babyora never silently merges by name alone.
- A migration transaction writes cloud records, marks local records with cloud IDs, then keeps a recoverable local snapshot until the next verified sync.
- Simple profile fields use server version timestamps with explicit conflict prompts when both sides changed materially.
- Feedback events are append-only and merge without overwriting.
- Deletes use tombstones long enough to propagate to other devices, followed by policy-defined hard deletion.
- Offline edits are queued with an idempotency key and visible sync state. Recommendation correctness continues locally with the last valid profile and weather cache.

### 11.6 Location and privacy

- Free uses one saved home place.
- Plus can use the current device position or another saved place.
- “Where the child is” always means the location of the caregiver's active device; Babyora does not track the child or other family members.
- Precise coordinates are used ephemerally to request weather, then discarded from history. Saved places store only what is required for repeat weather lookup and a user-facing label.
- The active place is always visible and can be overridden.
- Denied, unavailable, low-accuracy, and stale-location states fall back to home with an explicit label.
- Widgets, pushes, and analytics never include coordinates or a movement trail.

### 11.7 Personal temperature calibration

The feature is a controlled learning loop, not an opaque health model.

1. After a relevant outdoor period, an eligible caregiver records `litt varm`, `passe`, or `litt kald` from the Warm or Cold flow or recommendation follow-up.
2. The event stores child, member, time, recommendation fingerprint, perceived-temperature band, situation, garment categories, and answer. It does not store free text, photos, or precise location.
3. Calibration begins only after at least three usable observations, including at least two comparable contexts. A stronger confidence label requires five or more recent observations.
4. Recent observations carry more weight; contradictory or old observations reduce confidence. A single response never changes the recommendation.
5. The derived preference is bounded to `litt lettere`, `standard`, or `litt varmere`. It may adjust one non-critical warmth step, never mandatory weather protection or a safety rule.
6. Every adjustment is disclosed: “Tilpasset Liv: ett lettere mellomplagg fordi Liv ofte er varm i lignende vær.”
7. Guardians can inspect the evidence summary, exclude an erroneous event, pause learning, or reset to standard.
8. Conflicting feedback from caregivers is retained with attribution. Low agreement returns the child to standard and asks for more observations rather than averaging aggressively.

The recommendation fingerprint is deterministic and changes when garments, order, situation, weather band, or calibration-relevant reasoning changes. This same fingerprint powers notification deduplication and widget freshness.

### 11.8 Smart notification system

The simple scheduled morning reminder is free and may remain local. Plus adds server-assisted, recommendation-aware changes.

Notification categories:

- morning summary;
- meaningful change before a user-defined departure or pickup time;
- rain/wind/temperature protection newly required;
- tomorrow preparation;
- Soon seasonal preparation;
- family invitation and account/security events.

A smart notification is eligible only when the new recommendation fingerprint differs materially from the last acknowledged/sent fingerprint. Material changes include adding/removing a garment category, adding rain/wind/UV protection, crossing a meaningful warmth band, or a clearly different preparation action. Raw temperature changes alone are insufficient.

Delivery policy:

- default maximum one dressing-change notification per child per six hours and three non-security notifications per household per day;
- deduplicate by household, child, category, time window, and recommendation fingerprint;
- honor timezone, quiet hours, category preferences, pickup/departure time, permission state, and active entitlement;
- combine nearby changes into one actionable message;
- use generic lock-screen copy by default and never put date of birth, coordinates, account details, or sensitive feedback in the payload;
- deep-link into the exact recommendation context;
- log sent/suppressed reason without storing sensitive message content;
- security and invitation messages follow separate rate limits and are never suppressed by Plus loss.

The server reevaluates eligible households on scheduled weather windows and on relevant profile/preference changes. Exact Supabase scheduling and push-provider APIs must be checked against current official documentation during implementation. Local notifications remain the fallback for the free morning reminder.

### 11.9 Widget and glanceable surfaces

The existing versioned widget snapshot remains the boundary between the app and native widgets, but its vocabulary is updated from exposed layer count to garments and meaningful change.

Required snapshot content:

- schema version;
- child display name or privacy-mode neutral label;
- updated and valid-until timestamps;
- temperature and feels-like value;
- normalized condition;
- garment count and up to three garment summaries;
- optional accessories;
- situation;
- next meaningful change summary and time;
- recommendation fingerprint;
- deep link.

The snapshot contains no child ID, date of birth, email, coordinates, household ID, or feedback history. It is stored only in the iOS App Group / Android shared native storage. A privacy preference can replace the child's name with “Dagens antrekk”.

Widget states are specified for never opened, signed out, fresh, stale, offline, location fallback, profile switched, entitlement expired, and unsupported schema version. Stale data is visibly labeled and never presented as current. Tapping always opens the corresponding child/context or a safe selector if that context is no longer accessible. Widgets refresh after a successful recommendation, situation switch, active-child change, relevant push, app resume when stale, and entitlement/profile change. Platform budget limits are respected; the widget does not promise live weather.

### 11.10 Data lifecycle and legal controls

- The owner can export household profiles, memberships, saved places, preferences, feedback, and calibration in a readable format.
- A member can export their own account data and leave a household.
- Household deletion requires recent authentication, clear consequences, and a 7-day recovery window before hard deletion. Security/legal holds, if ever required, are documented separately and shown to the owner.
- Consumed/revoked/expired invitation records are deleted after 30 days; unused invites expire after 7 days. Inactive push tokens are deleted after 90 days. Notification delivery metadata is deleted after 30 days. The anonymous analytics identifier is reset on opt-out and deleted with account deletion where it can be linked to that account.
- PostHog remains EU-hosted, explicit-event only, and receives no names, dates of birth, coordinates, household IDs, invite destinations, or feedback context beyond the allowed categorical event.
- Privacy copy explains shared access, who can see the child, how to revoke access, how calibration works, and that Babyora is guidance rather than medical judgment.

## 12. Error and edge-state design

Required states include:

- weather loading and stale cache;
- weather service unavailable;
- no network;
- location denied or unavailable;
- automatic location reverting to home;
- child profile incomplete;
- future forecast unavailable;
- purchase pending, cancelled, failed, restored, or expired;
- sign-in cancelled, expired link, provider unavailable, and recoverable session;
- local-to-cloud migration preview, conflict, partial failure, retry, and rollback;
- invitation expired, revoked, wrong recipient, already accepted, seat limit, and entitlement unavailable;
- member removed while the app is open;
- feedback queued offline, insufficient evidence, conflicting evidence, learning paused, and calibration reset;
- push permission denied, token invalid, delivery suppressed, timezone changed, and notification deep-link context missing;
- widget never configured, stale, signed out, unsupported schema, active child removed, and privacy mode;
- missing generated illustration with a non-misleading fallback;
- no Soon recommendations yet;
- no Clothing Library search result.

Each state explains what Babyora is using, what the parent can do, and whether the recommendation is current or cached.

## 13. Measurement and analytics

Track only product questions needed for improvement:

- onboarding step and first recommendation reached;
- Home recommendation viewed without opening details;
- Outfit details opened;
- Plan today/future/Soon intent;
- contextual paywall trigger;
- trial start and purchase;
- automatic location intent and permission outcome;
- second-child intent;
- morning reminder enabled;
- safety/knowledge tool opened;
- sign-in and local-data migration funnel, without child identifiers;
- invitation created, accepted, expired, revoked, and failed by reason category;
- shared recommendation viewed by role category;
- feedback submitted and calibration state changed, using categorical values only;
- smart notification eligible, suppressed, delivered, and opened by category/reason;
- widget snapshot written and widget deep link opened;
- household Plus entitlement activated, restored, expired, and recovered.

Do not infer purchase willingness from aesthetics alone. The 90+ expert audit is a quality gate; conversion, retention, and feature usage require measured behavior.

## 14. Verification strategy

### Automated

- existing unit and integration tests;
- entitlement capability tests;
- RLS policy tests for every role, membership state, and cross-household denial;
- invitation single-use, expiry, recipient binding, revocation, and concurrent acceptance tests;
- anonymous migration, idempotency, conflict, offline queue, and delete-propagation tests;
- recommendation consistency tests;
- deterministic calibration tests for thresholds, recency, disagreement, bounds, reset, and safety-rule immunity;
- notification significance, deduplication, quiet-hour, rate-limit, timezone, and payload-privacy tests;
- widget contract/version/freshness/privacy and deep-link tests on both platforms;
- verified RevenueCat webhook signature/idempotency and household entitlement tests;
- navigation and focus-return tests;
- copy lint for Babyora/Plus/plagg and prohibited unsupported claims;
- deterministic Playwright screenshots for all page families and required states;
- contrast checks across temperature extremes where tooling permits;
- production build and lint delta check.

### Manual

- physical iPhone and Android haptic pass;
- one-handed thumb-zone review;
- Dynamic Type/text scaling;
- VoiceOver/TalkBack navigation;
- reduced motion;
- offline and permission-denied flows;
- multi-device owner/guardian/caregiver/read-only role walkthrough;
- invitation acceptance from installed, not-installed, signed-in, and wrong-account states;
- notification delivery and widget refresh on physical iOS and Android devices;
- visual asset accuracy and consistency;
- five-parent qualitative usability review before calling the commercial story validated.

### Audit loop

Run the same rubric after each coherent work package. Address the lowest weighted score and any critical/high issue first. Do not make isolated changes solely to gain points if they weaken the product journey.

## 15. Implementation work packages

The functions are fully planned here; packages are an execution and release-control mechanism, not a deferral.

### Package 0 — Contract freeze and baseline

- capture current tests, screenshots, scores, schemas, analytics, RevenueCat products, and native targets;
- centralize capability names and recommendation fingerprint contract;
- forbid unsupported family/calibration claims behind feature flags until their complete paths ship.

### Package 1 — 90+ product foundation

- consolidate semantic tokens, shared controls, terminology, motion, haptics, and navigation;
- fix Home and Outfit consistency;
- rebuild Plan, Soon, Guide hierarchy, onboarding, and paywall structure;
- complete loading/offline/permission/accessibility states and page-level screenshot tests.

### Package 2 — Identity, household, and safe migration

- add Supabase client boundary, schema migrations, RLS, auth providers, recovery, and session handling;
- implement households, roles, places, local-data migration, offline cache, and conflict handling;
- connect RevenueCat identities and verified webhook entitlement sponsorship;
- ship data export, member leave/removal, ownership transfer, and deletion controls.

### Package 3 — Family sharing

- implement secure invitations, acceptance, revoke/resend, deep links, role-specific Family UI, and multi-device synchronization;
- make caregiver-local weather explicit and temporary;
- complete role/RLS/edge-state security testing before enabling “sammen” marketing.

### Package 4 — Personal calibration

- add feedback capture and append-only events;
- implement bounded deterministic calibration, evidence/conflict review, explanations, pause, and reset;
- connect the calibrated context to recommendation, Plan, notifications, and widgets without overriding safety rules.

### Package 5 — Smart notifications and widgets

- keep the free local morning reminder;
- add device tokens, preferences, scheduler/evaluator, push delivery, dedupe, rate limits, and deep links;
- revise the widget contract, implement iOS and Android surfaces, stale/privacy states, and native refresh triggers;
- verify physical-device behavior, energy/platform constraints, and payload privacy.

### Package 6 — Commercial and quality release

- enable truthful capability-led paywalls and household Plus copy;
- run full automated verification, Supabase security/advisor review, physical-device checks, family usability sessions, and the 13-page audit;
- release only when every enabled page is 90+, every named Plus claim works, and no critical/high issue remains.

## 16. Non-goals and guardrails

- No framework migration.
- No generic AI chat.
- No child-photo clothing judgment.
- No wardrobe-photo ingestion.
- No affiliate marketplace.
- No streaks or artificial engagement loops.
- No continuous child or caregiver tracking and no movement history.
- No precise location, birth date, account detail, or feedback history in push/widget payloads.
- No opaque machine-learning model that changes warmth without bounded rules and an explanation.
- No client-written entitlement or role escalation.
- No hidden AI-generated health claims.
- No broad visual replacement of Babyora's identity.
- No automatic implementation of audit prompts without review and tests.

## 17. Deliverables

- consolidated Babyora design and interaction tokens;
- capability-based free/Plus model;
- four-tab navigation and haptic grammar;
- updated 13 page families, with Soon replacing My Wardrobe;
- coordinated functional and knowledge illustration sets;
- truthful outcome-led paywall;
- Supabase identity, household, role, invitation, RLS, migration, sync, export, and deletion design;
- household-sponsored RevenueCat entitlement design;
- deterministic personal calibration with explain/reset controls;
- smart notification policy, scheduler, dedupe, privacy, and deep-link contracts;
- versioned iOS/Android widget contract and all freshness/privacy states;
- deterministic screenshots and score report;
- test and verification evidence;
- one master implementation plan decomposed into Packages 0–6 after this specification is approved.
