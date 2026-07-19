---
phase: 1
slug: planlegg-dagslinjen
status: approved
shadcn_initialized: false
preset: none
created: 2026-07-19
reviewed_at: 2026-07-19T15:36:21+02:00
baseline_sha: 37fc01ac2699c671eab3f22af4f8a5a8abe1b7ac
---

# Phase 1 — Planlegg/Dagslinjen UI Design Contract

> Canonical visual and interaction contract for the bounded Planlegg/Dagslinjen phase. The existing Babyora design system is refined, not replaced. New app screenshots and video are forbidden while implementation changes; the final media-based 90+ gate remains **Pending**.

## Contract Boundary

- Product promise: **Free = i dag hjemme. Plus = fremover, overalt og sammen only when each capability is implemented and enabled.**
- Planlegg is one calm, continuous planning instrument, not a card dashboard.
- Clothing rules, safety guardrails, Motor V2 activation, avatar assets, pricing, RevenueCat semantics, family backend, notifications, and unrelated screens are outside this UI contract.
- The canonical order is: visible title/context → `I dag / Uke / Snart` → verdict/next action → dominant Dagslinje → secondary forecast.
- Only recommendation-changing or action-bearing moments receive markers. Passive weather-only changes do not.
- No destructive action exists in this bounded phase.

## Governing Sources

| Source | Contract decisions used |
|---|---|
| `AGENTS.md` | Product/access boundary, source-of-truth and risk policy |
| `.planning/REQUIREMENTS.md` | UI, access, exact-context, accessibility, evidence states |
| `docs/DECISION-LOG.md` (2026-07-19) | Locked Dagslinje hierarchy and interaction model |
| `docs/PROSESS-PLAN-TIL-KODE.md` | Risk lanes, exact-SHA review and evidence rules |
| Detailed 2026-07-19 implementation plan | Wave boundaries, allowed paths, deferred media |
| Visual-signature specification | Protective morning instrument, rail, material and motion laws |
| Current-app 90+ specification | Existing palette, type, Free/Plus and state requirements |
| Existing source at baseline SHA | Real tokens, app shell, controls, haptics and route conventions |

## Design System

| Property | Value |
|---|---|
| Tool | Existing manual Babyora/Morgennatt system |
| Preset | Not applicable; owner explicitly rejected shadcn initialization |
| Component library | None; React components and native HTML semantics |
| Icon library | Existing Lucide/inline SVG convention; no new icon system |
| Display font | `var(--font-display)` / Fraunces |
| Functional font | `var(--font-sans)` / platform sans |
| Registry | None |

`components.json` is absent. This is intentional: do not initialize shadcn, install a UI kit, or create a parallel token system.

## Composition and Focal Hierarchy

Babyora's 60/25/15 product emphasis applies here:

1. **60% clothing decision:** the verdict and Dagslinje dominate first-screen comprehension.
2. **25% weather atmosphere:** temperature-reactive canvas explains context without becoming a weather dashboard.
3. **15% numeric precision:** time, temperature and coverage remain exact, tabular and secondary.

At 390 × 844:

- `App.tsx` owns the only `<main>` and the only vertical page scroll.
- Planlegg renders a section inside that main; it must not render another `<main>`, `100dvh`, or a nested vertical list scroller.
- Content uses 24px horizontal gutters, max-width 560px, centered on wider viewports.
- Top safe area is owned by the app shell. Planlegg adds 16px after the safe area, not a hard-coded status-bar void.
- Visible `Planlegg` title and child/place context lead; no dead place or bell button is shown.
- The verdict is visually dominant and sits directly on the canvas, never inside a mega-card.
- Dagslinjen begins 24px after the verdict block and remains the dominant body composition.
- Full forecast is collapsed below the rail and uses the same page scroll.
- Bottom navigation remains app-owned and outside the screen section.

## Spacing Scale

Declared phase scale. Existing `src/styles/design-tokens.css` values are reused only where their value matches; 48px and 64px remain Planlegg-scoped layout values rather than remapping global tokens:

| Token | Value | Usage |
|---|---:|---|
| `plan-space-1` | 4px | Icon/text micro-gap |
| `plan-space-2` | 8px | Related labels and metadata |
| `plan-space-3` | 16px | Standard component padding and gap |
| `plan-space-4` | 24px | Page gutter and section separation |
| `plan-space-5` | 32px | Major hierarchy separation |
| `plan-space-6` | 48px | Large state or section separation |
| `plan-space-7` | 64px | Rare page-level breathing space |

Exceptions: none. A 44px minimum interaction target is a control-size requirement, not a spacing token or exception.

## Typography

Exactly four sizes and two weights are permitted in this phase:

| Role | Size | Weight | Line height | Font |
|---|---:|---:|---:|---|
| Metadata / segment label / time | 14px | 500 | 1.4 | Sans |
| Body / action / button | 16px | 500 or 640 | 1.5 | Sans |
| Visible screen title / section heading | 20px | 640 | 1.25 | Sans |
| Dominant verdict | 32px | 640 | 1.15 | Fraunces |

- No other font size or weight is introduced in Planlegg.
- Times and temperatures use tabular figures.
- Fraunces is reserved for the dominant verdict, not controls, rail actions, metadata, or every heading.
- No micro uppercase headings. Norwegian sentence case is the default.
- Long text wraps; truncation cannot hide an action, place, garment, status, or entitlement meaning.

## Color

| Role | Value | Usage |
|---|---|---|
| Dominant (60%) | `var(--bg-canvas)` | Matte Morgennatt/temperature canvas and page continuity |
| Secondary (30%) | `var(--surface)`, `var(--surface-elevated)`, `var(--ink-100/200)` | Segmented control, selected disclosure, status notice, forecast disclosure |
| Accent (≤10%) | `var(--accent-cta)` | Selected segment, executable primary action, selected rail emphasis, active bottom-nav pool |
| Narrative warmth | Existing peach/terracotta tokens | Cause emphasis only; never primary action |
| Weather cold | Existing cold-blue/`--accent-temp` tokens | Temperature/weather meaning only |
| Error/recovery | `var(--terracotta-600)` | Error text/icon only; no destructive action exists |
| Focus | `var(--focus-ring)` | Keyboard focus only |

Accent is reserved for: selected view, selected event, a real executable CTA, active root navigation, and confirmed lightweight choice. It is not used for large promotional fields, passive weather, every marker, or decoration.

The canvas derives from the selected event's perceived temperature when an exact context exists; otherwise it uses the current valid context. It never averages days. Temperature remains explicitly labeled, so color never carries meaning alone. Text/control contrast targets WCAG AA across light, dark, cold, mild, warm and forced-color states.

## Core Components

| Component | Prescriptive contract |
|---|---|
| Planlegg section | Visible `h1`, compact child/place context, no nested main or scroll owner |
| View control | Native radio group/fieldset with `I dag`, `Uke`, `Snart`; 44px targets; one selection haptic on actual change |
| Verdict | One Fraunces answer plus one sans next-action line; no card chrome |
| Dagslinje | Controlled semantic `<ol>`; exactly one selected expansion for one/many events |
| Static span row | Non-interactive `<li>` for verified unchanged coverage; never styled as a button |
| Event disclosure | Button with `aria-expanded`, real `<time datetime>`, marker shape, verb action and cause |
| Garment preview | At most three safe thumbnails; visible garment names remain authoritative |
| Outfit action | `Se hele antrekket` only when exact context exists and fuller content is available |
| Forecast disclosure | Secondary `Vis full værprognose` / `Skjul full værprognose`; weather only, no duplicate garment timeline |
| Plus teaser | One truthful example and contextual action; never a wall of locks |
| Snart list | One continuous grouped list, not cards; `Bør ha`, `Kjekt å ha`, `Ikke nødvendig ennå` |
| Status notice | Loading/error/offline/partial truth with timestamp and recovery action |
| Bottom navigation | Existing four roots; filled/strong icon, strong label, quiet mint pool, `:focus-visible` only |

### Dagslinje Marker Grammar

| Moment | Shape/icon | Required verb copy |
|---|---|---|
| Add garment | Circle + plus | `Ta på {plagg}` |
| Remove garment | Circle + minus | `Ta av {plagg}` |
| True swap | Diamond + opposing arrows | `Bytt fra {av} til {på}` |
| Rain protection | Droplet/shield | `Ta med {beskyttelse}` or `Ta på {beskyttelse}` |
| Location | Pin | `Når dere kommer til {sted}: {handling}` |
| Preparation | Bag/check | `Forbered {plagg}` |

Shape, icon and verb carry meaning; color is redundant. Weather-only changes have no clothing marker. Event identity uses stable ISO time/event ID, never hour alone.

### Selection Rules

- Zero change events: no disclosure is expanded; render one truthful static span.
- One event: it is selected and expanded by default.
- Many events: the next relevant event is selected by default; selecting another collapses the previous one.
- `selectedEventId`, `onSelect`, and `onOpenOutfit` are controlled by the parent.
- If refresh removes the selected ID, selection moves deterministically to the next relevant valid event; it never points to stale content.
- Collapse/expand does not move keyboard focus. Opening Outfit moves focus to its title; back returns focus to the originating event and preserves Planlegg scroll/selection.

## Copywriting Contract

| Element/state | Exact copy or grammar |
|---|---|
| Screen title | `Planlegg` |
| Context | `{barn} · {sted}` plus explicit current/cached status when relevant |
| Full verified span | `Samme antrekk til kl. {HH:mm}` or `Samme antrekk ut dagen` only with contiguous evidence |
| Sampled span | `Samme antrekk i de vurderte tidspunktene` |
| Event cause | Plain language: `{værårsak}. {verbdrevet handling}.` |
| Exact Outfit CTA | `Se hele antrekket` |
| Forecast open/close | `Vis full værprognose` / `Skjul full værprognose` |
| Free Uke CTA | `Se uke med Babyora Plus` |
| Free Snart CTA | `Se hva {barn} kan trenge snart` |
| Empty heading | `Ingen antrekksendringer` |
| Empty body | `Babyora fant ingen endringer i perioden som er vurdert.` |
| Loading status | `Henter dagens plan …` |
| Error heading | `Vi fikk ikke oppdatert planen` |
| Error body | `Vi har ingen oppdatert plan å vise. Prøv å hente planen på nytt.` |
| Error action | `Prøv å hente planen` |
| Offline cached | `Du er frakoblet · viser planen fra {HH:mm}` |
| Partial coverage | `Planen viser bare tidspunktene Babyora har værdata for.` |
| Empty Snart | `Ingenting å forberede akkurat nå` |
| Destructive confirmation | Not applicable — this phase has no destructive action |

Generic CTA copy such as `Fortsett`, `Les mer`, `Oppgrader`, `Se forslag` or `Prøv nå` is forbidden when a specific outcome can be named. Copy never leads with `+N til`, never calls samples `time for time`, and never claims `hele dagen` without evidence.

## Free, Plus and Snart

| State | Contract |
|---|---|
| Free / I dag | Complete supported Dagslinje for one fixed home, including all correctness-relevant situations and exact Outfit drill |
| Free / Uke | One real future weather/example comparison, no unlocked future clothing advice, followed by contextual Plus action |
| Plus / Uke | Implemented future dates/places only; each row/event carries exact context |
| Free / Snart | Explains the outcome without revealing unimplemented/advisory garment guidance; opens contextual paywall |
| Plus / Snart | Deterministic 4–6 week grouped guidance with cautious size language and lightweight `Har allerede` choice |
| Missing capability | Hide the associated tab/claim during intermediate delivery; never ship a dead control or marketing promise |
| Entitlement loading | Preserve neutral structure until access resolves; do not flash unlocked or locked advice |
| Entitlement loss | Today remains complete; future/Snart become read-safe teasers and current safe data remains accessible |

`future_plan`, place, Snart, family and other claims must be rendered from the centralized capability map. `sammen` stays absent until family sharing is actually enabled. Safety-critical guidance is never Plus-gated.

## Exact-Context Navigation

Every future Outfit action passes one immutable payload containing child/age inputs, ISO date/time, `Europe/Oslo` timezone, place label and lookup coordinates without history, activity/vogn mode, weather snapshot, finalized recommendation, planning event ID and access state.

- Outfit renders this payload and must not recompute from current time or current weather.
- The Outfit header exposes the selected date/time/place so context is auditable.
- A locked teaser is not a link to Outfit; its separate CTA opens the paywall.
- Closing the paywall restores focus to that CTA.
- Returning from Outfit restores focus to the originating Dagslinje event and preserves selected view, selected event and page scroll.

## Motion and Haptics

| Interaction | Motion | Haptic |
|---|---|---|
| View/date selection | 160ms color/surface transition | `selection` once on actual change |
| Event expansion | 240ms inline height/opacity, `--ease-standard` | `light` once on expansion only |
| Event collapse | 200ms inline close | None |
| Temperature atmosphere | 280ms color interpolation | None |
| Root-tab change | Existing 140ms crossfade | Existing `selection` |
| Paywall | Existing single reveal only when opened | Existing dialog contract |

- Reduced motion resolves directly to the final state; no delayed content, parallax, auto-scroll or shimmer.
- Haptic preference is independent of reduced-motion preference. A reduced-motion user may still receive haptics unless haptics are off.
- Web, unavailable plugin and preference-off paths are silent no-ops.
- Haptics never carry meaning alone; physical feel remains a human iOS/Android gate.

## Accessibility Contract

- One app-owned `<main>` and page scroll; screen-reader order is title → context → view control → verdict → Dagslinje → forecast.
- View control uses native radios in a named fieldset, not `aria-pressed` tabs masquerading as navigation.
- Dagslinje uses `<ol>`/`<li>`; unchanged spans are static; events use buttons and real `<time datetime>`.
- All actionable targets are at least 44 × 44px.
- Keyboard focus uses a 3px `var(--focus-ring)` outline with 4px offset via `:focus-visible`; touch focus never leaves a permanent ring.
- Selected state is communicated by text, shape and state semantics, not color alone.
- At 200% text: no horizontal page scroll, fixed-height text boxes, clipped action, ellipsis-dependent meaning or nested list scroll.
- Child/place names, Norwegian action sentences and button labels wrap with `overflow-wrap: anywhere` where necessary.
- Forced-colors mode retains marker borders/icons, focus outline and selected disclosure state.
- `aria-live="polite"` announces refresh/error/offline state once; it does not narrate every visual transition.
- Focus is never moved when data refreshes or an event merely expands.

## Media and Image Fallback

- Planlegg has no avatar hero and requires no new generated image.
- Expanded events may show up to three existing garment thumbnails.
- A missing/unapproved thumbnail renders a neutral garment glyph plus the visible garment name; no broken image, nearest-match guess or hidden garment.
- Thumbnail imagery is decorative when the adjacent text names the garment and is `aria-hidden`/empty-alt accordingly.
- The canonical garment text and exact context remain authoritative over all media.

## State Matrix

| State | Required presentation and behavior |
|---|---|
| Loading | Title/context/control remain; verdict and rail-shaped skeleton reserve layout; one polite loading status; no fabricated copy |
| Error, no cache | No verdict claim; error heading/body plus `Prøv å hente planen`; controls that cannot produce truth are unavailable |
| Offline with cache | Cached plan remains visible with timestamp and stale label; retry available; no claim that data is current |
| Partial coverage | Only evaluated moments render; narrowed coverage copy; no `hele dagen`/`time for time` |
| Zero events | One static verified span; no empty card and no expanded disclosure |
| One event | One selected/expanded event with action, cause and exact Outfit action when available |
| Many events | One expansion at a time; page scroll only; events stay chronologically ordered |
| Duplicate/DST | Stable ISO IDs and `Europe/Oslo`; duplicate local hours remain distinguishable by full datetime |
| Rain | Marker/action appears only when protection recommendation changes |
| Location/prep | Marker appears only with a real destination/action; no child-tracking implication |
| Extreme cold/heat | Temperature canvas changes while contrast, labels and action hierarchy remain stable |
| Long copy/name | Wraps without covering rail, marker, CTA or bottom navigation |
| 200% text | Rail becomes vertically roomy; no clipping, horizontal page scroll or nested scroll |
| Reduced motion | Immediate end states; static skeleton; all content and focus behavior unchanged |
| Keyboard/focus | Logical order, visible focus, stable focus on expansion, exact return from dialog/drill |
| Missing media | Neutral glyph and text fallback; recommendation remains complete |
| Free/Plus/Snart | Follows the capability matrix above with no advice leakage or unsupported claim |

## UI Considerations

Applicable state considerations resolved: **8 covered, 0 backstop, 0 unresolved**.

The post-verification GSD probe raised 32 applicable element/category instances across the Planlegg composition, Dagslinje, exact-context actions, recovery surface, Snart groups and garment media. Explicit element-kind overrides confirmed all real surface kinds; the instances aggregate into the eight covered contracts below without dropping a category.

| Category | Element(s) | Status | Resolution / non-media verification |
|---|---|---|---|
| Empty | Dagslinje, Snart, media | ✅ covered | Zero-event static span, explicit empty-Snart copy and neutral thumbnail fallback are specified and component-asserted |
| Loading | Planlegg data/nav | ✅ covered | Rail-shaped reserved layout, one busy/status owner and no truth claim are asserted in DOM |
| Error | Weather/access/route | ✅ covered | No-cache and cached recovery branches expose exact copy/action and currentness state |
| Populated | Verdict, one/many events | ✅ covered | Controlled one-expanded-event invariant and exact action/cause/content structure are component-tested |
| Partial | Forecast/access/context | ✅ covered | Partial coverage narrows copy; unresolved entitlement remains neutral; exact context blocks recomputation |
| Overflow | Rail, forecast, Snart | ✅ covered | Browser assertion at 390px and 200% requires `scrollWidth <= clientWidth`; page is sole scroll owner |
| Zero-one-many | Dagslinje | ✅ covered | Deterministic fixtures assert zero/one/many selection and expansion rules |
| Long text | Context/actions/controls | ✅ covered | Long Norwegian fixtures assert wrapping, full accessible names and no clipped interactive text |

## Existing-Code Alignment Gaps

These are contract gaps for the implementation plan, not changes made by this task:

- `UkeScreen.tsx` currently creates a nested `<main>`, nested list scroll, hard status-bar spacing, sampled `Time for time` claims and competing row/card content.
- `PlanChangeRail.tsx` currently owns per-row open state, so multiple events can expand; it uses hour-only identity and lacks exact context/cause/preview/action contracts.
- `SegmentedControl.tsx` currently has a sub-44px visual label target and needs a compliant Planlegg variant or shared correction.
- `App.tsx` currently passes only recommendation/activity/vogn context; the future immutable payload is incomplete.
- `BottomTabBar.tsx` tracks all focus rather than `:focus-visible`, which can retain a touch outline.
- `useHapticSystem` currently couples reduced motion to haptic suppression; this contract requires independent preferences.
- Generic paywall headline/trust copy can outrun capability flags; Planlegg entry copy must be capability-derived.

## Allowed Paths

| Purpose | Allowed paths |
|---|---|
| Truth/view model | `src/lib/planning/**` and focused planning tests |
| Planlegg screen | `src/screens/UkeScreen.tsx` plus one scoped Planlegg stylesheet/component set |
| Dagslinje | `src/components/planning/**` and focused component tests |
| Exact Outfit context | `src/App.tsx`, `src/screens/PaakledningScreen.tsx`, planning context module and deterministic Planlegg E2E |
| View control | `src/components/controls/SegmentedControl.tsx` only if shared behavior remains regression-safe |
| Access/Snart truth | Central premium capability/gating/copy modules and new deterministic Snart planning module/tests |
| Shared nav/haptics | `BottomTabBar.tsx`, haptic abstraction/settings and tests only for locked Wave 6 behavior |
| Tokens | Existing `design-tokens.css` only for semantic aliases/focus/Planlegg-scoped rules; no palette replacement |
| Entry migration | Former wardrobe/Guide entry paths only after verified Snart replacement exists |

Any other path requires an amended reviewed plan before editing.

## Explicitly Out of Scope

- Clothing thresholds, safety logic, Motor V2 activation or new safety copy.
- New design system, shadcn, Tailwind, registry blocks or framework migration.
- New avatar/garment generation, screenshot/video capture, store assets or marketing files.
- Family auth/backend, tracking, notifications, widgets or calibration.
- Price/product/RevenueCat changes.
- Redesign of Hjem, Guide, Familie, onboarding or unrelated drills beyond shared-nav regression safety.
- Adding `docs/screenshots/`, `docs/store-assets-2026/` or `docs/MARKETING-PLAN-2026.md` to candidate work.

## Verification Without New App Media

During changing implementation, evidence is limited to deterministic non-media checks:

- Component assertions for semantic order, zero/one/many events, one-expanded invariant, marker/action grammar, fallback media and 44px targets.
- Unit tests for coverage claims, add/remove/swap/rain/location/prep, stable IDs, ordering, duplicates, DST and `Europe/Oslo`.
- Browser assertions for one `<main>`, one vertical scroll owner, no horizontal overflow at 390px/200% text, focus-visible behavior, focus return and reduced-motion final state.
- Exact-context E2E assertion that date, place, activity, temperature and garments match the selected future event.
- Capability tests proving Free completeness and that every Plus/Snart/paywall claim maps to enabled runtime support.
- Haptic call-count/no-op tests; physical quality remains Pending human evidence.
- Contrast may be token/computed-style checked, but subjective visual fit and the 90+ score are not passed here.

No implementation-time command may persist a new app screenshot or video. `audit:prepare`, screenshot matrices and video capture wait for a stable immutable candidate plus owner permission. Final visual score, physical-device UAT and owner release approval remain **Pending**, not waived.

## Registry Safety

| Registry | Blocks used | Safety gate |
|---|---|---|
| None | None | Not applicable — manual system locked by owner |

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-07-19 by fresh independent `gsd-ui-checker` Revision 2; post-verification UI-consideration probe resolved 32/32 applicable instances into 8 covered categories.
