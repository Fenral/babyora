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
**Existing illustration system:** "Lillian" character (recurring 3D claymation child figure with matte clay material, warm orange accent) — same face/proportions, clothing varies per TempBand tier A1-A7 (7 transparent RGBA PNGs). Pivot from watercolor 2026-06-10 after Sivert validation; claymation gives material warmth and differentiates from the flat-illustration parenting-app reflex (Hatch/Frida).
**Tone of voice:** warm, calm, slightly poetic without being precious. Conversational Norwegian. Never clinical. Never alarmist. Uses concrete sensory references ("biter i ørene", "skygge og solhatt") rather than measurements.
**Visual identity (F60.8-LÅS jun 2026):** warm-grey surface (`#DBD8D2`) with deep ink text (`#2B2522`) and warm orange CTA (`#FF6B35`). DM Serif Display på hero-temperatur, Schibsted Grotesk for all annen tekst (body, knapp, meta). Lottie 3D-vær-ikoner (sol/sky/regn/snø + vind-streker) som primær væravlesning. Domain er "small child in nordic weather", ikke "tool". Pivot-historikk: dark navy → cream/terracotta (iter 32g) → pure white/orange-fitness (iter 33 PA-palett) → warm-grey/orange/DM-Serif/Schibsted C-hybrid (F60.8, etter mock-sammenligning A/B/C/D × V1/V2/V3 × tekst-strategi A/B/D). **Brand-aksen er nå LÅST — pivoter ikke igjen før v2-launch.**

**Hjem hero-pattern (F60.8):** V3 — avatar 220px sentered + anbefaling-tekst 22-26px Schibsted weight 600 rett under. Avatar = visuell hero (Lillian-character viser barnet påkledd via tier-PNG A1-A7). Tekst = verbal forsterking.

**Copy-prinsipp på Hjem (F60.8):** B-strategi — "X lag mot kulda" / "i mildt vær" / "i sommervær". Aldri detaljerte plagg-navn på Hjem. Plagg-detaljer hører hjemme i Påkledning-sheet. Ingen subtitle under hero-tekst.

**Anti-pattern (F60.8 LÅS):** AtmosphereBackground (gradient + partikler) er DROPPET. Bryter "sparing visual elements" + skaper AI-weather-cosplay-impressjon. Vær formidles via Lottie-ikoner, ikke ambient-bakgrunn.

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
