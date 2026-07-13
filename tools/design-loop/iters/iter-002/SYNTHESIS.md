# Iter-002 — Aggregert syntese

Commit: `4eb3a6c`
Preview: wool-app-git-redesign-instrument-level-sivert-s-projects.vercel.app

## Score-konsensus

| Perspektiv | Total | Δ iter-001 |
|---|---|---|
| /impeccable | 71 | +13 |
| /emil-design-eng | 64 | +6 |
| /color-expert | 71 | +13 |
| M365 Copilot | 68 | +25 |
| **Aggregert** | **~69/100** | **+15** |

**Stopp-trigger ikke aktivert** — score < 95, ingen survivor-konvergens, alle 4 anbefaler samme retning for iter-003.

## Hva ble løst i iter-002

- Palett-pivot Court Clay → warm-paper + grafitt-ink + #D8541F (+13 til +25 alle perspektiver)
- DM Serif fjernet fra runtime
- Vær-pill krympet til hairline
- Body bg renset for tunge gradient-radials

## Største gjenstående problem (4/4 konsensus)

**HOVED-USP er fortsatt ikke visuelt selvforklarende.**

| Perspektiv | Formulering |
|---|---|
| /impeccable | «Baby leser som astronaut/robot, ikke baby med lag» |
| /emil | «Hero er grå firkant med hodesirkel, ingen lag-stabling synlig» |
| /color-expert | «Konturlinjer smelter sammen til én form, kontur-linjer mangler luftmellomrom» |
| Copilot | «Konturlinjer leses som sonar/ring/UI-outline, ikke som plagg-lag» |

## Nye problemer identifisert (color-expert: kritiske a11y-bugs)

1. **Tall 1/2/3** i Lag-for-lag bruker `--accent #D8541F` på 14-16px → APCA Lc 52, **FAIL AA**.
2. **Hairline `#DDD5CB`** mot `--surface`: 1.7:1, **under 3:1 UI-component-krav** (WCAG 1.4.11).
3. **`--surface-elevated #F3EFE9`** vs `--surface`: ΔL=0.034, **under JND** — hero «drukner» uten depth-skygge.
4. **`--accent #D8541F`** vs **`--accent-deep #BE4818`**: ΔL=0.06, **for nære** — fill/tekst-skille kollapser perseptuelt.
5. **«+ lite bevegelse»** — for kryptisk som primær hero-tekst (emil + copilot).
6. **Bottom-nav layout-bug** — «Sover/Våken»-toggle blir overskrevet av nav-bar (emil).

## Copilot-unike innsikter (ikke fanget av interne)

- **Strukturell mismatch hero ↔ «Lag for lag»**: skal være ett system, oppleves som to. **Slå dem sammen til ÉN komposisjon**.
- **Orange har 8 forskjellige semantiske jobber** — mister presisjon. Disiplinér til ÉN: aktiv tilstand.
- **Heroen har for lav «didaktisk payoff»** for plassen den tar.

## Iter-003 — tre prioriterte grep (Copilot, validert av andre)

### 1. Hero v4: faktisk lag-bygging (kritisk)
Drop 3-kontur-idéen. Bygg en hero hvor lagene er TYDELIG forskjellige plagg-former:
- innerst: body tett på kroppen
- mellomlag: pyjamas litt utenfor, mikro-offset
- yttertøy/ekstra: sovepose som klart omslutter begge
- forbind med tynne connect-lines til 1/2/3 i listen under (hero + liste = ett system)

### 2. Orange-diett (color-expert + a11y-fixes)
- Tall 1/2/3 → `--ink` (svart, 18px medium, tabular-nums)
- INNERST/MELLOMLAG/EKSTRA-labels → `--ink-muted #66707A` 11px tracking-wide
- Hero-border → drop, bruk hairline eller `--ink-tint` skygge i stedet
- Lillian-headline → `--ink`
- Behold `--accent` KUN på: aktiv Vogn-pill + «Se hele dagen»-link + ev. ÉN nøkkelaccent på hero (chevron)

### 3. A11y-token-fix (color-expert)
- `--hairline` fra `#DDD5CB` til `oklch(0.82 0.012 80)` (~#CFC5B7) — passerer 3:1
- `--surface-elevated` fra `#F3EFE9` til `oklch(0.93 0.006 80)` (~#EBE6DE) — ΔL ≈ 0.06
- Drop `--accent-deep` ELLER demoter den til `--ink` (kollapser perseptuelt mot `--accent`)
- Legg subtil skygge på hero: `0 1px 2px rgba(20,24,31,0.04), 0 8px 24px rgba(20,24,31,0.06)`

### 4. Hjem-struktur-fix
- Slå sammen hero + lagliste til ett kort (visuelt forbundet, ikke to separate moduler)
- Fjern Lillian-headline ELLER krymp til 14px caption — recommendation er produktet
- Fix «Sover/Våken»-overlap med bottom-nav (margin-bottom for å unngå nav-skygge)

## Konvergens-sjekk

Alle 4 perspektiver anbefaler SAMME tre grep (hero-redesign + accent-diett + sammenslåing). Ingen survivor-design er sklid gjennom uten endring. Ingen stopp-trigger.

→ Klar for iter-003.

## Anti-mønstre å unngå i iter-003

- Justere konturlinjer marginalt («dette er for svakt idégrunnlag» — Copilot)
- Beholde accent på tall/labels/border i håp om at «det vil se rolig nok ut»
- La hero og lagliste forbli to separate moduler
- Ignorer a11y-bugs flagget av color-expert (3 kritiske)
