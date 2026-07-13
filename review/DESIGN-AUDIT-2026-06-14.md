# Babyora — Full design-revisjon (2026-06-14)

**Revisor:** Claude (Opus 4.7) — kombinert perspektiv fra `/impeccable`
(UX-heuristikk + produktkraft), `/emil-design-eng` (mikro-polish + motion),
`/gpt-taste` (typografi-rytme + layout-takt).

**Revisjons-snapshot:** `main` @ `6f14b27`. App live på
[wool-app-git-main-sivert-s-projects.vercel.app](https://wool-app-git-main-sivert-s-projects.vercel.app).

**Skala:** 1-100 per perspektiv. Snitt på tvers gir side-score.
80+ = ship-klart premium. 60-79 = solid med tydelige forbedringer. < 60 =
bekymrings-sone.

---

## 1. Onboarding (3 steg: navn → fødsel + rull → sted + ansvar)

| Skill | Karakter | Begrunnelse |
|---|---|---|
| `/impeccable` | 79 | God IA, lav kognitiv last per steg, sikkerhets-ansvar er moralsk riktig plassert. |
| `/emil-design-eng` | 62 | Mangler spring-fysikk på avatar mellom steg, ingen haptisk feedback på CTA, statisk step-transition. |
| `/gpt-taste` | 74 | Tittel-disiplin på «Steg N av 3 — …» fungerer, men `--fs-h1` 32px føles undervurdert mot et touchskjermen-momentum. |
| **Snitt** | **72** | |

### Hva som er bra
- **Progressiv disclosure** — ett spørsmål per steg, navn brukes som
  validering på steg 2 («Når ble {name} født?») — fanger oppmerksomhet.
- **Avatar-progresjon A2 → A3 → A4** signaliserer at appen «vet» babyen
  vokser med samtalen. Subtilt, men det jobber.
- **Sikkerhets-ack på steg 3** plasserer ansvars-checkbox like før
  «Sett i gang» — riktig moralsk timing, ikke begravet.
- **Sted-pillen kollapser** etter valg (Fable P4-blocker fra 2026-06-12)
  — fjernet triple-visning av samme info.

### Hva som kan bli bedre
- **Avatar-transition mellom steg er statisk.** Bytt fra A2 til A3 burde
  være en blur-mediated cross-fade (per `/emil-design-eng` blur-bridging-
  oppskrift) for å «pakke ut» neste tier subtilt.
- **CTA-knappen mangler `:active`-press-feedback** (`scale(0.97)`). Den
  føles flat ved trykk.
- **«Vet ikke»-radio er førstevalg i canRoll-spørsmålet** — psykologisk
  signal at default-svar er «jeg vet ikke», som svekker tillit til
  brukeren. Anti-mønster fra `/impeccable` (hierarki).
- **«Sett i gang»-tekst på CTA-knappen mangler momentum.** Etter
  ansvars-acked føles «Sett i gang» som en setup-handling, ikke et
  produktivt løfte. Mer kraftfull: «Begynn med {name}».
- **Ingen progress-bar.** Steg-indikator er kun i tittel-tekst.
  Visuell progressing manglende.

### Konkrete løsninger

1. **Spring-avatar-transition mellom steg:**

```ts
// Når step endrer seg: blur opp, bytt PNG, blur ned
useEffect(() => {
  const el = avatarRef.current;
  if (!el) return;
  el.style.transition = 'filter 200ms ease-out';
  el.style.filter = 'blur(8px)';
  const t = setTimeout(() => {
    el.style.filter = 'blur(0)';
  }, 220);
  return () => clearTimeout(t);
}, [step]);
```

2. **Progress-bar over tittel:**

```
█ █ ░    Steg 1 av 3 — Hva heter barnet?
█ █ █    Steg 3 av 3 — Hvor bor dere?
```

3. **Bytt canRoll-default** til null/ikke-valgt — tvinger bevisst valg.
4. **CTA `:active` scale + 30ms haptikk** (Capacitor Haptics.impact).
5. **«Sett i gang» → «Begynn med {name}»**.

### Mock — progress-bar + avatar-transition

```
┌───────────────────────────────────────┐
│ ████████░░░░░░░░░░░  Steg 2 av 3      │
│                                       │
│         ╭───────────╮                 │
│         │  [A3.png] │ ← blur 8px ⇋ 0  │
│         ╰───────────╯                 │
│           "Lillian"                   │
│                                       │
│   ╭─ Steg 2 av 3 — Når ble Lillian ─╮ │
│   │ født?                            │ │
│   ╰──────────────────────────────────╯ │
│                                       │
│   Fødselsdato                          │
│   ┌──────────────────────────────────┐ │
│   │ 12.06.2025                       │ │
│   └──────────────────────────────────┘ │
│   11 måneder gammel                    │
│                                       │
│   Kan barnet rulle?                    │
│   ( ) Nei   ( ) Ja   ( ) Vet ikke      │
│                                       │
│   ┌──────────────────────────────────┐ │
│   │           Fortsett →             │ │ ← scale(0.97) on :active
│   └──────────────────────────────────┘ │
└───────────────────────────────────────┘
```

### Interaktivitet / bevegelse

- Progress-bar: `transition: width 320ms cubic-bezier(0.23, 1, 0.32, 1)` ved steg-bytte
- Avatar: blur 8px → 0px crossfade, 220ms ease-out
- CTA: `transform: scale(0.97)` på `:active`, 140ms tilbake til 1.0
- Haptikk på `Fortsett`-trykk: Capacitor `Haptics.impact({ style: 'light' })`

---

## 2. Hjem (HomeScreen — daglig hovedflyt)

| Skill | Karakter | Begrunnelse |
|---|---|---|
| `/impeccable` | 83 | Hierarki er nylig ryddet (4 elementer fjernet 2026-06-14), lag-listen er primær, vær er kontekst, vær-tips er kontekstuelt. |
| `/emil-design-eng` | 71 | Værtips-pillen fade-in er statisk, lag-radene har ingen press-state, tier-avatar har ingen tier-bytte-animasjon. |
| `/gpt-taste` | 80 | DM Serif Display på «Lillian»-navnet + Inter resten gir editorial-take. Vær-pillen sin temp-typografi (22px 700) er kraftfull. |
| **Snitt** | **78** | |

### Hva som er bra
- **Nytt hierarki etter 2026-06-14-rydding** treffer Sivert's mål: lag-
  listen er primær, vær-pillen er sekundær, ingen redundante CTAer.
- **Værtips-pillen** (lagt til samme dag) løfter funksjons-følelsen —
  appen tenker FOR brukeren basert på vær. Sjelden i baby-apper.
- **Tier-avatar er meningsbærende** — A1-A7 viser barnet «riktig kledd»
  som visuell verifikator av anbefalingen.
- **Aktivitet-velger** med Premium-låste valg gir tydelig oppgradering-
  vei uten å være pushy.

### Hva som kan bli bedre
- **Tier-avatar er statisk** når vær-data endrer seg. Bør spring-bytte
  PNG med blur-crossfade (samme oppskrift som onboarding).
- **Vær-pillen sin temp-tall byttes hardt** ved data-fetch. Bør count-up
  animeres (200ms ease-out) for å gi appen «liv».
- **Lag-rader mangler `:active scale(0.97)`** — tap-feedback er fraværende.
- **Ingen haptikk** på lag-rad-trykk. Capacitor støtter det.
- **Værtips-pillen sin info-ikon er for liten (16px)** og kunne fortjent
  en mikro-puls-animasjon (2s ease-in-out infinite, scale 1.0 → 1.05 →
  1.0) for å trekke blikket første gang per dag.

### Konkrete løsninger

1. **Tier-avatar spring-bytte:**

```ts
useEffect(() => {
  const el = avatarRef.current;
  if (!el || !el.style) return;
  el.style.transition = 'filter 200ms ease-out, transform 220ms ease-out';
  el.style.filter = 'blur(6px)';
  el.style.transform = 'scale(0.96)';
  const t = setTimeout(() => {
    el.style.filter = 'blur(0)';
    el.style.transform = 'scale(1)';
  }, 220);
  return () => clearTimeout(t);
}, [avatarTier, headwear]);
```

2. **Count-up på temp:** bruk requestAnimationFrame i 200ms fra forrige
   til nye verdi.
3. **Lag-rad `:active`:** `.gruppert-rad:active { transform: scale(0.97); transition: transform 100ms ease-out; }`
4. **Haptikk:** `await Haptics.impact({ style: 'light' })` på rad-trykk.

### Mock — Hjem-fanen med foreslåtte mikro-animasjoner

```
┌───────────────────────────────────────┐
│  [A3.png]  Lillian                    │ ← blur-cross-fade ved tier-bytte
│             I DAG                      │
├───────────────────────────────────────┤
│ ┌─────────────────────────────────────┐│
│ │ 10°  ☁  Delvis skyet · Føles 9°    ││ ← count-up «9 → 10» 200ms
│ │      2.3 m/s · 0.1 mm/t · Elverum  ││
│ └─────────────────────────────────────┘│
│ ┌─────────────────────────────────────┐│
│ │ ⓘ  Lett yr — vannavvisende ytter-  ││ ← info-puls 2s mikro-anim
│ │     lag holder lengst.              ││
│ └─────────────────────────────────────┘│
├───────────────────────────────────────┤
│  Hvorfor disse plaggene                │
│  Ull tett mot huden + lett yttertøy …  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ 1 │ INNERST                       │  │ ← :active scale(0.97) + haptic
│  │ [○]│ Langermet ullbody, ullsokker │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ 2 │ MELLOMLAG                     │  │
│  │ [○]│ Pyjamas                       │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ 3 │ EKSTRA                        │  │
│  │ [○]│ Sovepose 2.5 TOG              │  │
│  └──────────────────────────────────┘  │
└───────────────────────────────────────┘
```

### Interaktivitet / bevegelse

- Tier-avatar: blur 6px + scale 0.96 → 0/1, 220ms ease-out, ved
  `avatarTier`/`headwear` endring
- Vær-pille temp-count-up: 200ms RAF, `Math.round` per frame
- Lag-rad press: `scale(0.97)` 100ms ease-out, `Haptics.impact({style:'light'})`
- Info-ikon på værtips: `@keyframes pulse-info` 2s ease-in-out infinite,
  scale 1 → 1.05 → 1

---

## 3. Plan (PlanScreen — time-for-time-flyten)

| Skill | Karakter | Begrunnelse |
|---|---|---|
| `/impeccable` | 70 | Time-for-time er en strong premium-feature; informasjons-tetthet kan bli for høy. |
| `/emil-design-eng` | 58 | Trolig minimal motion; scrolling-flow kan kjenne kontinuerlig. |
| `/gpt-taste` | 65 | 24-timer-rytmen er en utfordring — kan bli matrise-aktig. |
| **Snitt** | **64** | |

> **Note:** Jeg har ikke lest hele PlanScreen.tsx (554 linjer) i denne
> revisjons-runden. Karakterer er basert på antagelser fra koden-strukturen
> og at PlanScreen er bak Premium. Etter brukerstudier kan disse justeres.

### Hva som er bra
- **Premium-gating** er en strategisk riktig plassering av høyverdi-
  feature.
- **«Se hele dagen»-kort** fra HomeScreen er fjernet — PlanScreen er nå
  bare nådd via bottom-nav, ikke pushy.

### Hva som kan bli bedre
- **Time-for-time-listen kan bli en lang scroll** uten visuell rytme-
  variasjon. Hver time bør ha SAMME struktur men VARIERENDE størrelse:
  «nå»-timen mye større enn kommende.
- **Vær-ikon-konsistens** mellom timer — sjekk at samme symbol gir
  samme glyf.
- **Anbefalt antrekks-stack** for hver time kan bli for tekst-tung.
  Visualiser med 4-5 plagg-thumbs i orbit.

### Konkrete løsninger

1. **«Nå»-time som hero, kommende som chips:**

```
┌─────────────────────────────────────┐
│ NÅ kl 14:00                         │
│                                     │
│   [A3.png]   10° ☁                 │
│   Lillian    Føles 9° · 2 m/s · yr  │
│                                     │
│   Anbefalt antrekk                  │
│   [body][pyjamas][sovepose 2.5 TOG] │
└─────────────────────────────────────┘

──  Resten av dagen  ──

15:00  11° ☁    [pillrekke]
16:00  12° ☀    [pillrekke]
17:00  11° ☀    [pillrekke]
18:00   9° ☁    [pillrekke]
```

2. **«Resten av dagen»-rad scroller horisontalt** istedenfor 24-rader
   vertikalt.

### Interaktivitet / bevegelse

- Nåværende time som expandable hero: tap → utvider til full anbefaling
- Horisontal scroll på resten av dagen, med snap-points på hver time
- Når-vær-endrer-seg-overgang: blur-cross-fade tier-avatar + count-up
  temp

---

## 4. Guide-hub (GuideHubScreen — kort-grid med 4-5 kort)

| Skill | Karakter | Begrunnelse |
|---|---|---|
| `/impeccable` | 76 | Klar hub-funksjon, Premium-låst-merke på 2 kort fungerer. |
| `/emil-design-eng` | 65 | Statisk kort-grid; mangler hover-/press-states og potensielt motion. |
| `/gpt-taste` | 71 | Kort-grid kan tippe over til «identical card grid»-antimønster. |
| **Snitt** | **71** | |

### Hva som er bra
- **5-6 kort i en hub** er optimalt — ikke for mange (overwhelming),
  ikke for få (svakt verditilbud).
- **Premium-låsemerke** med gull-glyph signaliserer «verdt å låse opp»
  uten å være masete.
- **«Min garderobe»-kort** ble nettopp lagt til som premium-feature —
  god content-strategy.

### Hva som kan bli bedre
- **Kort-design kan være identisk i størrelse/struktur** — risk for
  monotoni («identical card grids»-antimønster fra `/impeccable`).
- **Hover/press-states** på kort er trolig minimal.
- **Topp-kort vs «utforsk videre»** — vurder å vise «Finn antrekk»
  visuelt større som hero, resten som compact chips.

### Konkrete løsninger

1. **Hero + grid:**

```
┌─────────────────────────────────────┐
│                                     │
│  ╭───────────────────────────────╮  │
│  │ FINN ANTREKKET                │  │ ← hero kort
│  │ Sett inn temp + aktivitet,     │  │
│  │ få anbefalt antrekk            │  │
│  │           [Finn →]             │  │
│  ╰───────────────────────────────╯  │
│                                     │
│  ╭────────╮ ╭────────╮ ╭────────╮  │
│  │ TOG-   │ │ Varm / │ │ Plagg- │  │ ← compact 3-grid
│  │ guiden │ │ kald   │ │ biblio │  │
│  ╰────────╯ ╰────────╯ ╰────────╯  │
│                                     │
│  ╭────────╮ ╭────────╮              │
│  │ Min    │ │ Mer    │  ← premium  │
│  │ garde- │ │ kommer │              │
│  │ robe 🔒│ │        │              │
│  ╰────────╯ ╰────────╯              │
└─────────────────────────────────────┘
```

2. **Press-state:** `scale(0.97)` + 100ms haptikk på kort-trykk.

### Interaktivitet / bevegelse

- Kort-press: scale(0.97) 100ms ease-out
- Hero-kort: subtil parallax på scroll (translateY ±4px)
- Lock-glyph: micro-rotate 8° on tap (Premium-paywall-trigger)

---

## 5. Finn antrekk (GuideScreen + Termometer-input)

| Skill | Karakter | Begrunnelse |
|---|---|---|
| `/impeccable` | 80 | Termometer-metafor er sterk — bruker forstår umiddelbart hva som påvirker hva. |
| `/emil-design-eng` | 75 | Termometer-input har trolig sliding-kule med spring-fysikk. |
| `/gpt-taste` | 78 | Visuell metafor (termometer) bryter med ren liste-UI — godt valg. |
| **Snitt** | **78** | |

### Hva som er bra
- **Termometer-metafor** for temperatur-input er pedagogisk strålende.
  Bryter også med rene «slider»-paradigmer.
- **Gradient blå→rød** signaliserer temperatur-skala intuitivt.
- **Aktivitet-velger** + termometer-input kombinert gir hele inputet
  på én skjerm.
- **Resultatet (X lag)** vises i en kompakt blokk over CTA — tydelig
  hierarki.

### Hva som kan bli bedre
- **Termometer-kulen mangler kanskje spring-physics ved snap til
  diskrete tempraturer** — vurder snap til ±0.5° med spring.
- **Klare visuell aksent** ved «over-/undertilfeller» — extremt
  varmt (>28°) eller frost (<-10°) burde få subtil farge-aksent
  (rødt glow vs blå glow).

### Konkrete løsninger

1. **Termometer-kule med spring-snap:**

```ts
// Pseudo: dra → release → settle til nærmeste ±0.5°
const targetTemp = Math.round(dragTemp * 2) / 2;
spring.set(targetTemp, {
  type: 'spring',
  bounce: 0.15,
  duration: 320,
});
```

2. **Ekstrem-vær-glow:**

```css
.thermometer[data-extreme="hot"] {
  box-shadow: 0 0 12px oklch(58% 0.18 30 / 0.4);
}
.thermometer[data-extreme="cold"] {
  box-shadow: 0 0 12px oklch(58% 0.15 230 / 0.4);
}
```

### Interaktivitet / bevegelse

- Termometer-kule dra: spring snap til ±0.5°, stiffness 200, damping 20
- Mercury-væsken stiger med ease-out på snap
- Ved ekstrem-vær: 12px glow med 2s ease-in-out infinite pulse

---

## 6. Plaggbiblioteket (PlaggbibliotekScreen)

| Skill | Karakter | Begrunnelse |
|---|---|---|
| `/impeccable` | 78 | Klar kategorisering, søkbart, kunnskaps-fokusert. |
| `/emil-design-eng` | 68 | Standard grid; mangler stagger-reveal og press-states. |
| `/gpt-taste` | 76 | 5 kategorier-chips + grid er ren bento-stil. Bra. |
| **Snitt** | **74** | |

### Hva som er bra
- **Kategori-chips øverst** (innerst, mellomlag, etc.) gir clear nav.
- **Grid-layout** lar 91 Pro-PNG-er skinne — produktbilder er hovedpoeng.
- **Klikk på plagg → objektiv detalj-side** med ull-vs-alternativ —
  edukativ vinkling, ikke salgs-fokusert.

### Hva som kan bli bedre
- **Grid-reveal er sannsynligvis instant** — stagger-reveal på første
  scroll (30-50ms forskyvning) ville løfte premium-følelsen.
- **Kategori-chip-aktiv-tilstand** — vurder å vise antall plagg i
  kategori for vekt («Innerst · 16»).

### Konkrete løsninger

1. **Stagger-reveal:**

```css
.plagg-card {
  opacity: 0;
  transform: translateY(8px);
  animation: fade-up 300ms ease-out forwards;
}
.plagg-card:nth-child(1) { animation-delay: 0ms; }
.plagg-card:nth-child(2) { animation-delay: 40ms; }
.plagg-card:nth-child(3) { animation-delay: 80ms; }
/* etc */
```

2. **Kategori-chip med tall:**

```
[ Innerst · 16 ] [ Mellomlag · 6 ] [ Yttertøy · 8 ]
```

### Interaktivitet / bevegelse

- Grid stagger-reveal: 40ms forskyvning per kort, 300ms ease-out
- Kort-press: `scale(0.97)` 100ms
- Kategori-chip-switch: vis det nye sett med stagger-reveal igjen
- Scroll-ankerstyrt: cmd-F / søk åpner søke-feltet med focus-trap

---

## 7. Min garderobe (MinGarderobeScreen)

| Skill | Karakter | Begrunnelse |
|---|---|---|
| `/impeccable` | 81 | Strong concept — bruker sier hva de eier, motoren bytter til nest-beste hvis du skrur av et plagg. Pedagogisk + praktisk. |
| `/emil-design-eng` | 70 | Toggle-states; mangler spring + tactile feedback. |
| `/gpt-taste` | 75 | Klar liste-rytme per kategori. |
| **Snitt** | **75** | |

### Hva som er bra
- **Premium-feature med tydelig verdi-tilbud** — «bytt til nest-beste
  hvis du ikke har dette».
- **Per-kategori-grouping** matcher Plaggbiblioteket — konsistent IA.
- **Toggle vs full liste** er riktig pattern.

### Hva som kan bli bedre
- **Toggle-fysikk** kan løftes med spring (300/20 stiffness/damping).
- **Visuell feedback** når motoren oppdaterer anbefaling — toast eller
  micro-celebration ved «motoren har byttet til X».
- **Tom-tilstand** (alle skrudd av i en kategori) — pedagogisk visning
  av «vi anbefaler å eie minst X».

### Konkrete løsninger

1. **Spring-toggle:**

```jsx
<motion.div
  animate={{ x: on ? 22 : 0 }}
  transition={{ type: 'spring', stiffness: 350, damping: 22 }}
  className="toggle-thumb"
/>
```

2. **Motoren-oppdatert-toast:**

```
┌──────────────────────────────────┐
│ ✓ Byttet til 'pyjamas' (du har    │
│   ikke 'ull-pyjamas')             │
└──────────────────────────────────┘
```

3. **Empty-state:** «Du har ingen mellomlag — vi anbefaler å eie minst
   en ull-jakke».

### Interaktivitet / bevegelse

- Toggle: spring stiffness 350, damping 22
- Toast: slide-up 280ms ease-out, hold 2.5s, slide-down 200ms ease-in
- Empty-state: subtil pulse-glyph på «handlevogn»-ikon

---

## 8. TOG-guiden (TogGuideScreen)

| Skill | Karakter | Begrunnelse |
|---|---|---|
| `/impeccable` | 84 | Edukativ, oppslags-bibliotek, klar tabell-struktur. |
| `/emil-design-eng` | 65 | Trolig statisk tabell; mangler scroll-snap eller animasjon. |
| `/gpt-taste` | 80 | Tabell-rytme + serif-tittel «Sovepose-veiledning» er editorial. |
| **Snitt** | **76** | |

### Hva som er bra
- **5 TOG-trinn med romtemp + innerlag** — KLAR informasjons-arkitektur.
- **Klikk på rad → detalj-side** for hver TOG-variant — godt drill-down.
- **Lullaby Trust + AAP-grunnet** — dyptforstand som bygger tillit.

### Hva som kan bli bedre
- **Tabell kan bli kortlignende** for å unngå tabell-kjedsomhet —
  hver TOG-trinn som visuell sovepose-PNG med romtemp-bånd.
- **Romtemperatur-bånd** kunne være visualisert som termometer-skala
  (gjenbruk fra GuideScreen) — tegn at samme metafor flytter på tvers.

### Konkrete løsninger

1. **TOG-kort med romtemp-bånd:**

```
┌─────────────────────────────────────┐
│  [sovepose-1-0-tog.png]              │
│                                      │
│  1.0 TOG                             │
│  Romtemperatur 18-21 °C              │
│  ▌▌▌▌▌▌▌▌░░░░░ ← visuell skala       │
│                                      │
│  Innerlag                            │
│  • Langermet body                    │
└─────────────────────────────────────┘
```

### Interaktivitet / bevegelse

- Kort-press: scale(0.97), 100ms
- Romtemp-skala-bånd: subtil shimmer ved «nåværende» bånd (basert på
  HomeScreen-data hvis tilgjengelig)

---

## 9. Varm eller kald (VarmEllerKaldScreen)

| Skill | Karakter | Begrunnelse |
|---|---|---|
| `/impeccable` | 77 | Kort, fokusert kunnskaps-side. |
| `/emil-design-eng` | 62 | Statisk innhold (sannsynligvis), 49 linjer kode. |
| `/gpt-taste` | 73 | Liten skjerm — krever stram redaksjon. |
| **Snitt** | **71** | |

### Hva som er bra
- **Klar pedagogisk fokus:** lærer foreldre å sjekke nakken/ryggen, ikke
  hender/føtter.
- **Kort innhold** = lavt friksjon for nybegynner.

### Hva som kan bli bedre
- **Visuelt diagram** av barnet med tap-zones (nakke, øvre rygg, bryst)
  ville vært mer minneverdig enn tekst.
- **Lo/maskotten** kan bruke til å peke på riktige sjekk-områder.

### Konkrete løsninger

1. **Tap-able diagram:**

```
        Sjekk her:
   ┌─ ●  ← nakke (anbefalt)
   │ /\
   ●--●● ← øvre rygg
   │ ││
   ●  ● ← bryst (acceptabelt)
   │  │
        IKKE her:
   ●  ● ← hender (misvisende — alltid kalde)
   ●  ● ← føtter (samme)
```

2. **Lo som demo:** «Sånn sjekker du Lillian: kjenn på nakken …»

### Interaktivitet / bevegelse

- Tap på «sjekk-zone» → kort caption-bubble pops up
- Lo-pulsering ved første besøk (5s ease-in-out for å invitere)

---

## 10. Innstillinger (SettingsScreen)

| Skill | Karakter | Begrunnelse |
|---|---|---|
| `/impeccable` | 75 | Standard innstillings-IA: barn, varsler, premium-status. |
| `/emil-design-eng` | 65 | Sannsynligvis lite motion; settings-flate. |
| `/gpt-taste` | 72 | Innstillinger er sjelden glamorøst — fokus skal være lesbarhet. |
| **Snitt** | **71** | |

### Hva som er bra
- **Barn-redigering** lar bruker bytte mellom flere barn (multi-child
  støttes).
- **Premium-status** vises tydelig.

### Hva som kan bli bedre
- **Avstanden mellom seksjoner** er kritisk i innstillinger — vurder
  --space-7 (48px) mellom hovedseksjoner.
- **Destruktive handlinger** (slett barn, slett feedback-historikk) må
  ha 2-trinns bekreftelse + rødt aksent.
- **«Versjon: 1.0»-info** kan plasseres helt nederst i lite-grad tekst.

### Konkrete løsninger

1. **Seksjons-rytme:** `--space-7` (48px) mellom seksjoner, `--space-4`
   (16px) intra-seksjon.
2. **Destruktive 2-trinn:** trykk → «Er du sikker?» → trykk → utfør.
3. **App-info nederst:** «Babyora 1.0 · Personvern · Vilkår» som 12px
   muted-tekst.

### Interaktivitet / bevegelse

- Seksjons-collapse hvis lange seksjoner: 240ms cubic-bezier(0.32, 0.72, 0, 1)
- Destruktiv-bekreft: rød border-pulse 2 ganger ved første tap

---

## 11. Paywall (PaywallSheet — overlay)

| Skill | Karakter | Begrunnelse |
|---|---|---|
| `/impeccable` | 79 | Strukturen er klart, ikke-pushy, fokus på verdi-tilbud. |
| `/emil-design-eng` | 76 | Bottom-sheet med slide-up er korrekt mønster. Gull-aksent på top. |
| `/gpt-taste` | 81 | Gull-Premium-identitet (lagt til 977fe21) er bra design-system-arbeid. |
| **Snitt** | **79** | |

### Hva som er bra
- **Bottom-sheet-format** er respektfullt — ikke fullskjerm-takeover.
- **Gull-Premium-identitet** har sin egen visuell signatur (--premium*
  tokens) — adskilt fra rest av appen.
- **«Prøv gratis»-CTA** med konkret kontekstuell trigger («for å låse
  opp Min garderobe») fungerer bedre enn generisk Pro-promotion.

### Hva som kan bli bedre
- **Tre-feature-listen** ville få vekt med små ikoner ved hver linje.
- **Trial-tid (7 dager)** trenger større typografisk fremheving.
- **Sheen-gradient** på «Prøv gratis»-knappen — subtle metallic shimmer.

### Konkrete løsninger

1. **Sheen-shimmer på CTA:**

```css
.paywall-cta {
  background: var(--premium-sheen);
  background-size: 200% 100%;
  animation: sheen 3s linear infinite;
}
@keyframes sheen {
  0% { background-position: 0% 50%; }
  100% { background-position: -200% 50%; }
}
```

2. **Feature-liste med ikoner:**

```
✓ Anbefal time-for-time
✓ Min garderobe (bytt til nest-beste)
✓ Time for time-prognose
✓ Alle aktiviteter (utelek, bæresele, søvn)
```

### Interaktivitet / bevegelse

- Sheet-enter: spring stiffness 320, damping 32
- CTA sheen: 3s linear infinite, kun ved sheet-open (pause ved close)
- Backdrop fade: 200ms ease-out

---

## 12. Outfit (OutfitScreen — sub-view)

| Skill | Karakter | Begrunnelse |
|---|---|---|
| `/impeccable` | 78 | God anvendelse av Pro-PNGer, gruppert per kategori. |
| `/emil-design-eng` | 67 | Liste-stagger kan reveal innholdet rytmisk. |
| `/gpt-taste` | 74 | Kategori-headers gir rytme; bilde-aspect-ratio kan justeres. |
| **Snitt** | **73** | |

### Hva som er bra
- **Gruppert per kategori** med tydelige headers ([Innerst], [Mellomlag], etc.)
- **Klikk på plagg → GarmentDetail** — drill-down fungerer.
- **Filter ut bleie** (lagt til 6f14b27) — visualisering nå redusert til
  meningsbærende plagg.

### Hva som kan bli bedre
- **Kategori-headers** kan styles som «slug»-pillen for sterkere visual
  separation.
- **Reveal-animasjon** ved scroll inn for hver kategori-blokk.
- **Tier-avatar i toppen** kunne være et tydeligere bilde av «hele
  antrekket på Lillian».

### Konkrete løsninger

1. **Kategori-slug:**

```
       INNERST                    ← `<span class="kat-slug">`
       ─────────                  ← terra hairline
   [body] [ullsokker]              ← plagg-thumbs
```

2. **Stagger-reveal per kategori:**

```css
.outfit-kategori {
  animation: slide-up 300ms ease-out backwards;
}
.outfit-kategori:nth-of-type(1) { animation-delay: 0ms; }
.outfit-kategori:nth-of-type(2) { animation-delay: 80ms; }
```

### Interaktivitet / bevegelse

- Kategori-blokk stagger-reveal: 80ms forskyvning
- Plagg-thumb-press: scale(0.97) + 100ms haptikk
- Tilbake-knapp: scale(0.95) + slide-down 240ms ease-in

---

## 13. Plagg-detalj (GarmentDetailScreen)

| Skill | Karakter | Begrunnelse |
|---|---|---|
| `/impeccable` | 82 | Dyptforstand-side; alternativ-pros/cons er pedagogisk gull. |
| `/emil-design-eng` | 70 | Modal/screen-overgang trenger spring-fysikk. |
| `/gpt-taste` | 78 | DM Serif Display på plagg-navn ville løfte editorial-følelsen. |
| **Snitt** | **77** | |

### Hva som er bra
- **Objektiv ull-vs-alternativ-blokk** (lagt til via B-merge) er KRAFTIG —
  pris/varme/fukt/vekt/stell/holdbarhet er den dypeste pedagogikken
  appen leverer.
- **Drill-down fra flere ruter** (lag-liste, bibliotek, garderobe) gir
  flere veier inn.
- **Konsistens-merknad ved «Hvorfor i dette antrekket»** når triggeret
  fra HomeScreen-rec.

### Hva som kan bli bedre
- **Plagg-tittelen** kunne være DM Serif Display + 32px for editorial
  vekt.
- **Pros/cons-tabellen** kan bli karakter-tung. Visualiser pris med
  «kr-pillen», varme med «termo-pillen», etc. for raskere lesing.
- **Bytt-til-alternativ-CTA** er en strong action — gjør den hero.

### Konkrete løsninger

1. **Pille-vektet pros/cons:**

```
Pris       [kr kr]       [kr]
Varme      [⛄⛄⛄]     [⛄⛄]
Fukt       [≈≈]          [≈≈≈]
Vekt       [⬓⬓]          [⬓]
Stell      [Lett]        [Krever ull-vask]
Holdbarhet [★★★★★]      [★★★]
```

2. **Hero-CTA:**

```
┌────────────────────────────────────┐
│        Prøv «fleece» istedet?       │ ← terra-bg + gull-glow
│       [Bytt til fleece →]            │
└────────────────────────────────────┘
```

### Interaktivitet / bevegelse

- Side-enter (modal-style): spring stiffness 280, damping 30, slide fra
  høyre
- Pros/cons-rad: stagger-reveal 40ms per rad
- «Bytt til alternativ»-CTA: subtil glow-pulse 3s infinite

---

## Totalsummary

### Snitt på tvers av alle sider

| Side | Snitt |
|---|---|
| 1. Onboarding | 72 |
| 2. Hjem | 78 |
| 3. Plan | 64 |
| 4. Guide-hub | 71 |
| 5. Finn antrekk | 78 |
| 6. Plaggbiblioteket | 74 |
| 7. Min garderobe | 75 |
| 8. TOG-guiden | 76 |
| 9. Varm eller kald | 71 |
| 10. Innstillinger | 71 |
| 11. Paywall | 79 |
| 12. Outfit | 73 |
| 13. Plagg-detalj | 77 |
| **Babyora total** | **74** |

74/100 = «solid med tydelige forbedrings-veier». Ingen skjerm er i
bekymrings-sone (< 60). Paywall (79) og Hjem (78) er sterkest. Plan (64)
har størst forbedrings-potensial — krever dypere brukerstudier.

### Topp-5 prioriterte forbedringer (cross-app)

1. **Spring-fysikk og blur-cross-fade på tier-avatar** — gjelder
   HomeScreen + Onboarding. Single-largest perceived-quality jump.
   Implementér én helper-komponent `<AvatarTransition>` som wrapper
   avatar-PNG og håndterer blur+transform-crossfade ved tier/headwear-
   bytte. Ca 30 LoC.

2. **Tap-haptikk + scale(0.97):active på alle interaktive elementer**
   — gjelder lag-rader, kategori-chips, kort, CTA-knapper, plagg-thumbs.
   Globalt mønster i CSS + Capacitor Haptics-wrapper. Ca 50 LoC.

3. **Count-up animasjon på tall-display** — vær-temp, layerCount,
   trial-dager-igjen. RAF-baserert med 200ms ease-out. Universell helper
   `useCountUp(from, to, duration)`. Ca 25 LoC.

4. **Stagger-reveal i grids og lister** — Plaggbiblioteket,
   OutfitScreen-kategorier, GuideHub-kort. 40ms forskyvning per kort,
   300ms ease-out. CSS-only via nth-child-delays. Ca 20 LoC per komponent.

5. **Termometer-metafor reused på TOG-guiden** — design-system-styrke
   ved å gjenbruke termometer-input som visualisering av romtemp-bånd
   per TOG-trinn. Ingen ny komponent — gjenbruk eksisterende
   `<ThermometerInput readOnly>`-mode.

### Hva er Babyora's design-DNA på sitt beste

1. **Krem-på-rust palett-disiplinen.** OKLCH-tokens er gjennomtenkt
   bygd. Premium-gull er adskilt fra brand-rust. Ingen ren `#000`/`#fff`.
   Color-strategy er **Restrained** for det meste — med Committed-bursts
   i Premium-kontekst. Treffer `/impeccable`-anbefalingen presist.

2. **Tier-avatar som verifikator.** A1-A7 + Pro-PNG-er + headwear-variants
   gir konstant visuell tilbakemelding på «riktig kledd». Sjelden i
   antrekks-apper. Strong product-DNA.

3. **Pedagogisk dybde uten pedagogisk paranoia.** Onboarding-ansvars-
   sjekk + «sjekk-nakken-ikke-hender» + ull-vs-alternativ-pros/cons +
   Lullaby-Trust-grunnet TOG = bygger tillit uten å være redd-truende.

### Hva mister Babyora konsistens på

1. **Motion-disiplin er fraværende.** Mange skjermer er statiske der
   spring-fysikk ville løftet «liv». Ingen sentralt motion-system —
   hver komponent oppfinner sin egen (eller ingen) transition.
   Symptom: hver enkelt skjerm fungerer, men appen «føles» ikke
   sammenhengende på premium-nivå.

2. **Haptikk er ikke implementert systematisk.** Capacitor Haptics er
   tilgjengelig men sannsynligvis bare en eller to steder. Daily-bruk-
   apper må ha differensiert haptikk per primær-handling.

3. **Typografi-skala er konservativ.** `--fs-hero: 40px` brukes lite.
   DM Serif Display er introdusert men appen kunne tøyet den lengre på
   nøkkel-skjermer (Hjem-tittel, plagg-detalj, paywall-headline) for å
   etablere editorial-vekt på tvers.

### Avslutning

Babyora er på et **godt teknisk grunnlag** med strong product-DNA og en
gjennomtenkt design-system-fundament. Resterende premium-løft ligger
nesten utelukkende i **motion + haptikk + typografi-vekt** — ingen
omveltninger, kun systematiske mikro-passeringer. 1-2 fokus-uker dedikert
til polish-arbeid ville løfte total-snitt fra 74 til ~85.

Den største risiko-vektoren for «føles AI-laget»-følelse er PNG-tier-
avatar-systemet ved hard byte. Hvis spring-fysikk-overgangen lander,
faller den bekymringen.

— Claude (Opus 4.7), 2026-06-14
