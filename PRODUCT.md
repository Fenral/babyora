# Babyora — Product context

## Product purpose

Babyora is a Norwegian baby-dressing-by-weather app for parents of children **0–24 months**. It removes the daily cognitive load of deciding what to put on a baby by combining live local weather (met.no) with a rules engine (wool-layers) that returns a structured layer-by-layer recommendation per context: stroller, baby carrier, outdoor play, or indoor sleep.

The product is built to feel like a calm parenting companion, not a weather tool. Recommendations come with warm-Norwegian explanations ("Det biter litt i ørene — votter er en god idé") rather than clinical data ("Vindkjøling −5 °C").

## Users

Primary: Norwegian parents (mor + far + delvis-pappa-perm-far) with babies 0–24 months. Often using the app outdoors with one hand, in winter gloves, in low light. Sleep-deprived. Cognitive load is high. They open the app 3–8 times per day.

Secondary: Grandparents and other caregivers asked to dress the baby for an outing.

Excluded for v1: Toddlers 2–6 år (planned v2 product "Babyora Junior").

## Brand

**Name:** Babyora (fantasy mark — "baby" + soft "-ora" suffix; short, multilingual, distinct from incumbent baby-app brands)
**Brand heritage:** Renamed from "Klemeg" (Norwegian baby-voice for "kle-meg" = "dress me") jun 2026 for international ASO + multi-language launch. Internal codebase (repo `wool-app`, bundle ID `no.klemeg.app`) retains the legacy name to preserve Apple/Play provisioning continuity.
**Bundle ID:** no.klemeg.app
**Existing illustration system:** "Lillian" character (recurring 3D claymation child figure with matte clay material). The character is now a neutral mascot, not a literal rendering of the recommended outfit. On weather surfaces, only the head, arms and a small part of the upper body hang over the weather/result material. Standing and sitting variants may be used elsewhere in the app. Garment accuracy is communicated through dedicated garment images, not combinatorial dressed-avatar renders.
**Tone of voice:** warm, calm, slightly poetic without being precious. Conversational Norwegian. Never clinical. Never alarmist. Uses concrete sensory references ("biter i ørene", "skygge og solhatt") rather than measurements.
**Visual identity status (jul 2026):** structural direction is locked, while final palette and detailed design system remain deliberately open until the core screens are resolved. Previous F60.8 warm-grey/orange values are historical candidates, not implementation requirements. The domain remains "small child in Nordic weather", not "tool".

**Owner decisions 2026-07-31 (override earlier statements in this file and in the design handoff where they conflict):**

- **Commercial model — hard paywall:** 7 days free via StoreKit intro trial on ALL three plans (39/99/299 kr unchanged, `no.klemeg.app.{monthly,quarterly,yearly}`), then the whole app requires the `premium` entitlement. The Free-tier ("today at home") code path is removed. Paywall appears after onboarding + the first real recommendation has been shown once.
- **Navigation — 3 tabs:** Hjem, Planlegg, Familie. The Guide tab is retired: Finn antrekk becomes a "Juster" drill from the Hjem result (sliders prefilled from live weather); TOG/Varm-kald/Første vinter become tool rows under Familie; Plaggbibliotek is reached from garment rows ("Se alternativer").
- **Theme — dark-first, warm:** deep petrol/espresso canvas, wool-cream typography, warm accent, weather-reactive panel nuances. Never cold tech-slate. A calibrated light mode ships as a secondary variant later.
- **Mascot production:** the hanging-mascot concept is locked; the visual style is decided in a 3-way shootout (Laika stop-motion puppet / matte 3D without gloss / current soft-3D mock style as control) before any asset batch. New garment + weather-icon assets are produced in the chosen material family after mascot style + palette are locked.
- **Mascot style (decided 2026-07-31, shootout round 2):** matte 3D (K2 direction) with reduced gloss; wardrobe is a plain cream short-sleeved body ONLY (owner decision: no bonnet/cardigan, since quasi-clothing on the mascot can read as a recommendation; body = the universal pre-dressing baseline and layer 1 of the engine's own vocabulary). Direct gaze, warm rim light along the panel edge ("monter-lys"). The diaper-only variant was considered and dropped (winter-context dissonance + image-safety-filter friction in asset production). Panel color in shootout images is a placeholder; palette is decided by the Steg 2 color analysis.

**Hjem experience (locked jul 2026):** the first state is a weather scene where the neutral mascot hangs over the weather panel. Weather, place and activity are inputs to a visible scan. The first scan of the day may play in full. Later openings show the cached result immediately. A new scan is offered when place or activity changes. To the user, the weather scene transforms into the outfit result even if the implementation uses two views.

**Outfit result (locked jul 2026):** clothes are the primary content. Show a numbered vertical list in dressing order, inner to outer. Each row contains garment image, garment name, role ("Innerst", "Mellomlag", "Ytterst", "Tilbehør") and access to alternatives. The whole row is tappable. Do not rely on the mascot to visualize garment combinations.

**Planlegg experience (locked jul 2026):** use two explicit segments, "I dag" and "I morgen". "I morgen" always presents one preparation widget. "I dag" only shows meaningful changes in clothing requirements later that day. A compact next-week view highlights deviations rather than repeating detailed daily forecasts.

**Weather scene rule (locked jul 2026):** a dynamic weather scene is permitted on Hjem and the selected-day hero in Planlegg because it explains the recommendation. It must remain quieter than the content, fade into a stable reading surface, preserve contrast across all weather states and avoid decorative particles or perpetual motion. Guide, Family and detailed garment views stay calm and neutral.

## Tone

- Warm-Norwegian conversational, not formal: "Det blåser friskt" not "Vindkjøling betydelig"
- Concrete sensory: ear-biting cold, ulldress that breathes, regntrekk over the stroller
- Calm authority: gives a recommendation, doesn't hedge or apologize
- Short: notes under 120 chars
- Never patronizing — parent knows their child best, app supports judgment

## Anti-references (we are NOT this)

- **Weather apps** (Mercury, Apple Weather, CARROT): we are not selling forecast precision. We are not a number-and-symbol product. Our value is the recommendation, not the data.
- **Health/medical apps** (Doctolib, Helsenorge): we are not authoritative medical advice. We don't measure or diagnose. We are a friendly guide, not a doctor.
- **Children's edutainment** (Khan Academy Kids, Endless): we are for the parent, not the child. The child never sees the screen.
- **Tracker apps** (Glow Baby, BabyConnect): we don't ask the parent to log everything. We compute, we don't accumulate.
- **AI-generated cream-and-serif "magazine app"**: we resisted P1b cream/rust direction because cream is overused as the AI-default for parenting apps. Dark identity is intentional differentiation.

## Strategic principles

1. **The recommendation is the product.** Everything else (charts, sliders, illustrations) is supporting context. If we removed them, the product still works.
2. **Sparing AI**: Babyora uses generative AI (Gemini Nano Banana) only for one-time character generation. No runtime AI calls, no live LLM responses. The wool-layers rules engine is deterministic and explainable.
3. **Local-first**: met.no via direct API, no analytics SDK, no third-party trackers. localStorage for state. Native via Capacitor when shipped.
4. **One-handed in winter gloves**: every interactive target ≥44×44 px, primary action always reachable on first scroll, no nested gestures.
5. **Accessibility is non-optional**: WCAG 2.1 AA minimum, AAA where reasonable. Every UI change goes through accessibility-lead first.
6. **Sparing visual elements**: hairline dividers, not cards. Single accent per screen. Watercolor character as punctuation, not flood. Tabular numerals everywhere.

## Register

**Product register.** Design serves the product. The product is the wool-layers recommendation engine + met.no integration + warm-Norwegian tone, packaged for one-handed outdoor parenting use. The design's job is to deliver that with maximum clarity, warmth, and minimum friction.

Not brand register: we are not a marketing site, not a campaign, not an editorial publication. Design is utility, not statement.

## Status (jun 2026)

- Live on TestFlight (almost — Apple ASC key + pricing pending)
- 4 tabs: Hjem (today's recommendation), Plan (10-day forecast), Guide (interactive calculator), Innstillinger
- Iter 32 active: mockup-locked layout (per ChatGPT-mock) applied to Hjem, Plan refactor pending
- Iter 32g (current): dark theme reverted from P1b experiment, multi-skill design consensus analysis incoming

**Owner decision 2026-07-31 (Familie IA):** the tab keeps the name "Familie" (child profile and caregivers are its core; the warm framing is brand-bearing). The migrated guide tools additionally get contextual entry points at their point of need: "Hvorfor akkurat dette?" on the result screen links into Varm eller kald / relevant guides, and Soveguiden surfaces in evening/night context. Tools thus have two paths: contextual (primary) and Familie > Verktøy (browsing).
