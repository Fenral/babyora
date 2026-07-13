# Babyora — ekstern AI design-brief

> Lim inn hele denne filen i ChatGPT / Gemini / Claude (annen instans) /
> Grok / Perplexity for å få brutalt ærlig tilbakemelding på designet.
> Filen er selvstendig — du trenger ikke gi noe ekstra kontekst.

---

## 1. Produktkontekst

**Babyora** er en norsk mobil-app (web + iOS via Capacitor) som hjelper
foreldre kle på spedbarn (0–3 år) basert på vær. Det er IKKE en
weather-app. Det er et **instrument** som oversetter vær til konkret
handling — hva babyen skal ha på seg.

**Use case:** Forelder bruker appen i 5–15 sekunder før de går ut. Skal
få umiddelbar, troverdig anbefaling.

**Konkurrenter:** Pampers-app, AnneAnne, generiske vær-apper, plus
parenting-content-apps. De fleste er enten playful baby-apper eller
generiske vær-widgets. Babyora prøver å være verken.

**Brand-DNA (lås):**
- "calm, intelligent, trustworthy, effortless"
- ALDRI playful, ALDRI loud
- "instrument med menneskelig varme" — ikke maskot, ikke karakter
- Skandinavisk minimalisme
- Soft daylight aesthetic (ikke dark mode default)

---

## 2. Designsystem-doktrin (fra Claude Design handoff)

**Visual philosophy:** UI er "air + light + surface" — én kontinuerlig
materiale. Unngå cards, sterke borders, tunge skygger, flate gradienter.

**Bakgrunn:**
- Ingen synlig horisont-linje
- Soft transisjon: kjølig topp → varm bunn
- Subtil atmospheric depth
- Bakgrunnen suggererer plass, viser ikke design

**Avatar:**
- Ikke dekorasjon — representerer hvordan været føles
- Alltid sentrert, grounded, integrert med bakgrunnen
- 3D-rendered (Nano Banana Pro / gemini-3-pro-image)
- Strikse regler: fast kamera, fast lys, fast pose, neutral expression,
  klær > karakter

**Hierarki (aldri bryt):**
1. Temperatur (primær, dominant)
2. Context (vær-condition)
3. Avatar (interpretation)
4. Action (CTA)
5. Navigation (ambient)

**CTA:** Ikke en knapp — det "naturlige neste steget". Soft, low contrast,
slightly elevated, aldri aggressiv.

**Navigation:** Ambient. Ingen synlig bar, low-contrast monochrome ikoner,
minimal active state. Må ikke konkurrere med CTA.

**Typography:** Schibsted Grotesk. Clean, readable, calm. Temperatur må
alltid dominere.

**Interaction:** 300–500ms ease-out. Ingen aggressiv motion. Ingen bounce.
Temperatur-basert tone-shift (kald = blå tint, varm = terracotta tint).

**Palette (lås):**
- Sky base: `#C3D6E3` (bakgrunnstopp kald)
- Warm surface: `#E8E1D8` (bakgrunnsbunn varm)
- Accent terracotta: `#C0632F` (CTA-element, dot-indikatorer)
- Ink: `#2B2B2B` (primær tekst)
- Schibsted Grotesk font

---

## 3. Hva som er bygget (state of play)

Live på: **https://wool-app.vercel.app**

**Hovedskjermer ferdig (Instrument-DNA):**
1. **HomeScreen** — vær-hero + 3D-avatar + recommendation + vogn-toggle + CTA
2. **GuideHubScreen** — primary-card "Finn antrekk" + ambient text-list
3. **PlanScreen (Uke)** — tab-toggle I dag / 10 dager + timeliste m/ lag-badges
4. **LayerDetailSheet (Påkledning)** — vertikal spine, lag-rader m/ orbit-ikoner
5. **SettingsScreen** — HERO + sections (eyebrow + barnenavn + ambient lister)

**Spesielle features:**
- **Trust layer:** "Hvorfor?"-button på Home åpner inline-panel som
  forklarer hvorfor X lag (Vær/Vind/Aktivitet + Konservativ-modus switch)
- **Dynamic gradient:** Bakgrunn skifter med temperatur (kald → varm)
- **Motion grammar:** Felles easing-bibliotek (iosDrawer 280ms,
  sheetEnter 400ms, sheetExit 280ms — exit kortere per Emil-design)
- **Avatar-animasjon:** breath 6.5s + sway variabel m/ vind + posture-
  shift basert på temp
- **A11y:** Schibsted Grotesk, sr-only "Minus X grader Celsius" på
  negativ temp, role=switch + aria-checked på Konservativ-modus,
  prefers-reduced-motion + forced-colors + prefers-contrast respekt

**Avatarer:** 7 stk (A1–A7), 3D-rendered babyer i ulike klær-tier:
- A1 sommer (15-22°C) → A7 ekstrem varme (>25°C)
- A6 brukes for kald (-15 til -5°C)

---

## 4. Tidligere AI-vurdering (Copilot, 2026-06-17)

Copilot ga denne brutale dommen — du kan referere til den eller utfordre
den:

> "Babyora har riktig premium-retning, men føles fortsatt som en veldig
> sterk solo-founder app med én fantastisk instrument-home — ikke helt
> som en gjennomkapitalisert designorganisasjon ennå."

**Hans 6 kritikkpunkter:**
1. **Screen-crafted, ikke platform-crafted** — Home er wow, sekundærskjermer god men ikke wow
2. **Information hierarchy fortsatt for tekstlig** — "Tallet viser hvor mange lag..." beviser at UI ikke bærer meningen selv
3. **Motion system mangler grammar** — bare avatar har motion, ikke segmentcontrols/sheets/CTAs/lister
4. **Component-craft ujevnt** — radius-konsistens, ikonvekter, baseline alignment, tabular nums
5. **Trust layer mangler** — bygd nå, ikke validert ennå
6. **"Instrument"-identiteten ikke hard nok i sekundærsystemene** — baby-app-fallgruve

**Hans dom på avatar:** Ikke pivot fra 3D — men gjør avataren mer
"display", mindre "character". "Måleinstrument med menneskelig varme."

---

## 5. URL-er du kan inspisere

| Skjerm | URL | Test |
|---|---|---|
| Hjem (Instrument) | https://wool-app.vercel.app | Sjekk vær-hero + avatar + CTA + "Hvorfor?"-trust-layer |
| Uke | https://wool-app.vercel.app — Uke-tab | Tab-toggle + timeliste |
| Guide | https://wool-app.vercel.app — Guide-tab | "Finn antrekk" + ambient lister |
| Innstillinger | https://wool-app.vercel.app — Innst.-tab | HERO + sections |
| Avatar-sammenligning | https://wool-app.vercel.app/avatars-runde-2-sammenligning.html | Eksisterende vs nye 3D-baby |
| Forside-mock (referanse) | https://wool-app.vercel.app/redesign-mocks/v20.html | Pure HTML/CSS-mock fra Claude Design |
| Rollback til gammel design | https://wool-app.vercel.app/?legacy=1 | Sammenligningspunkt |

---

## 6. Konkrete spørsmål jeg vil ha svar på

Vær brutal og ærlig. Jeg vil ikke ja-mann-svar.

### A. Premium-feel test
> Hvis jeg sa "denne appen er laget av et profesjonelt firma som har
> brukt millioner på design," hva er det første som ville fått deg til
> å TVILE på det? Pek på konkrete pixel/copy/interaksjon.

### B. Identity-test
> Hvis du ikke visste dette var en baby-app, hva ville appen sett ut
> som? (Apple Weather? Notion? Linear? Headspace?) Hva avslører den
> som baby-app, og er det godt eller dårlig?

### C. Bakgrunn-strategi
> Vi har dynamic temperatur-gradient (kjølig topp ved -6°C). Burde
> bakgrunnen heller være **flat warm sand** (`#DEDBD4`) som matcher
> iPhone-bezel-tonen for en mer ensartet "premium feel"? Eller er
> dynamic temperatur-respons det som gjør appen til et instrument?
> Argumenter begge sider.

### D. CTA-prinsipp
> Vår CTA er en glass-pille med "NESTE" eyebrow + "Se påkledning" +
> 46×46 accent-sirkel med glow-puls. Er det riktig for instrument-DNA
> ("naturlig neste steg, ikke knapp"), eller bør vi forenkle til en
> renere "Se påkledning →"-pille uten eyebrow og accent-sirkel?

### E. Trust layer-design
> Vi la til en "Hvorfor?"-button som åpner inline-panel som forklarer
> hvorfor X lag (Vær/Vind/Aktivitet + Konservativ-modus switch). Er
> dette riktig pattern for "system explainability" i et instrument,
> eller burde rasjonale være alltid synlig (ikke gjemt bak knapp)?

### F. 3D-avatar fortsatt riktig?
> Vi bruker 3D-render (gemini-3-pro-image) av en stilisert baby. Er
> 3D-render det riktige valget for Skandinavisk minimalisme + instrument-
> DNA? Eller burde vi pivotere til flat illustrasjon, SVG-mannequin,
> photoreal, eller noe helt annet?

### G. Hvis du var ansvarlig for dette designet — hva ville du gjort
> ANNERLEDES denne uka? Tre konkrete tiltak. Vær brutal.

### H. Babyora vs konkurrenter
> Hvis jeg viste deg denne appen og samtidig Apple Weather + Headspace +
> Things 3 — i hvilken kategori havner Babyora visuelt? Er det
> posisjonen vi vil ha?

---

## 7. Tekniske constraints du bør vite om

- **Stack:** Vite + React 19 + TypeScript 6, Capacitor for iOS, Vercel
  for web. Deploys på git push to main.
- **A11y:** WCAG 2.2 AA non-negotiable. Glass-pille har 1px solid
  rgba(0,0,0,.18) border for 1.4.11. Native `<dialog>` for sheets.
  prefers-reduced-motion respekt overalt. sr-only for negativ temp.
- **Skjermstørrelse:** Mobile-first 390px. Tablet/desktop ikke prio.
- **Språk:** Norsk (bokmål). lang="nb".
- **Vær-data:** met.no (gratis, robust). Geolocation via Capacitor.

---

## 8. Sammendrag — hva tilbakemeldingen skal hjelpe meg med

Jeg står ved et punkt der:
- Foundation er solid (komponenter, palette, motion-grammar)
- Hjem føles riktig (Copilot ga 8/10)
- Sekundærskjermer er funksjonelle men ikke wow
- Trust layer er nytt — vil vite om det treffer
- Avatar-runde 2 venter på validering

**Sluttspørsmål:** Hvis du måtte velge ETT tiltak for å løfte denne
appen fra "veldig god solo-founder-app" til "tydelig million-dollar-
design-org-app" — hva ville det vært, og hvorfor?

Vær konkret. Pek på pixler. Ikke abstrakt design-snakk.

---

*Brief generert av Claude Code 2026-06-18 etter F26-redesign-sesjon.
Sivert (founder) eier produktet og tar alle endelige beslutninger.*
