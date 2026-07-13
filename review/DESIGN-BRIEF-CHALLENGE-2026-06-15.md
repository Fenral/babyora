# Babyora — Design-utfordring til Claude Design

**Forfatter:** Sivert Skotvold
**Dato:** 2026-06-15
**Mål:** få et frittenkende, alternativt design-blikk på Babyora-appen.
Du er IKKE forpliktet til å bygge videre på dagens valg — utfordre dem.

## Hva Babyora er

Babyora er en norsk hverdagsapp for foreldre av 0-3-åringer. Den
besvarer ett spørsmål raskt og presist: **«Hva skal {barnet} ha på seg
ute akkurat nå?»**

- Stack: React 19 + Vite + Capacitor 7 (iOS + Android). Web som
  primær-flyt, native som ferdigpakkning.
- Repo: [Fenral/wool-app](https://github.com/Fenral/wool-app) (privat).
- Live web: https://wool-app-git-main-sivert-s-projects.vercel.app
- Live native: TestFlight (Apple), Internal Track (Google Play).
- App ID: `no.klemeg.app`.

## Bruks-kontekst

- 12-40 sekunder per økt, 1-3 ganger om dagen.
- Forelder under tidspress (skal ut av huset). Distraksjon høy. En hånd
  ledig.
- Sannhet om barnet endrer seg dag for dag (alder, om de kan rulle,
  klær de eier).
- Sannhet om været endrer seg time for time (vind, regn, frost).

## Dagens design-DNA

Det vi har bygget tror vi treffer disse tre tingene:

1. **Krem-på-rust palett.** OKLCH-tokens: `--paper: oklch(97.5% 0.008 85)`
   (#FAF6EF varm krem), `--terra-deep: oklch(42% 0.11 35)` (rust som
   primær), `--ink: oklch(22% 0.015 35)` (mørk rust som tekst).
   Premium-funksjoner har sin egen gull-identitet (`--premium: oklch(74% 0.12 90)`).
2. **Tier-avatar som verifikator.** Babyen vises «riktig kledd» som
   visuell konfirmasjon av motorens anbefaling. 7 tiers (A1-A7) +
   headwear-varianter. Genererte med Gemini 3 Pro Image (claymation
   3D-stil).
3. **Pedagogisk dybde uten paranoia.** Onboarding har sikkerhets-ack,
   garderobe-tekster grunner i Lullaby Trust + AAP-2022. Ull-vs-alternativ-
   blokken viser pris/varme/fukt/vekt/stell/holdbarhet objektivt.

## Skjermer og deres rolle

| Skjerm | Rolle | Hovedflyt |
|---|---|---|
| Onboarding (3 steg) | Navn → fødsel + rull → sted + sikkerhets-ack | Mount-only |
| Hjem | Daglig hovedflyt: vær-pille + lag-liste + aktivitet | Default tab |
| Plan | Time-for-time-prognose (Premium) | Sjelden brukt |
| Guide-hub | Hub for 4-5 kort: Finn antrekk, TOG-guide, Varm/kald, Plaggbibliotek, Min garderobe | Drill-down |
| Finn antrekk | Termometer-input + aktivitet → anbefaling | Bevisst utforsking |
| Plaggbiblioteket | 91 plagg gruppert per kategori | Slå opp |
| Min garderobe (Premium) | Toggle eierskap; motoren bytter til nest-beste | Konfigurer |
| TOG-guide | Sovepose-veiledning (0.5-3.5 TOG) | Søvn-relatert |
| Varm eller kald | «Sjekk nakken, ikke hender» | Sikkerhet |
| Innstillinger | Konto, varsler, abonnement | Sjelden brukt |
| Paywall | Premium-upsell (7-dagers trial) | Trigger-basert |

## Hva vi vil at du skal utfordre

Ikke polér det vi har. Vis oss alternativer vi ikke har vurdert.

### Spørsmål 1: er hjem-flowen riktig?

I dag: tier-avatar + vær-pille + vær-tips + grupperte lag-rader +
aktivitet-velger. Lag-listen er primær, vær er sekundær (per
brukerstudie 2026-06-14).

**Spørsmål til deg:** finnes det en mer **inkomprehensibel** form for
samme info? F.eks. én visuell tegning som svarer på alt på en gang?
Et termometer-illustrert barn? En isometrisk «dagens kit»? En
gif/animasjon? Tegneserie-rute?

Gi oss 3 helt forskjellige hjem-konsepter:
- **A:** «Mer redaksjonell» — magazine-spread-aktig, type-hero-vekt
- **B:** «Mer leke-aktig» — barnevennlig, mer karakter/scene-basert
- **C:** «Mer instrument» — datavisualisering, gauge/instrument-følelse

### Spørsmål 2: er Plan-screen reddbar?

I dag: 24-timer-rad nedover. Føles matrisig. Premium-feature.

**Spørsmål til deg:** kan time-for-time-prognose VISES på en måte som
folder seg ut **vannrett** (swipe gjennom dagen) i stedet for vertikalt?
Eller som et **klokke-display** der nåværende time er hero og resten
spirer ut? Eller som **vær-stripe** med plagg-aksenter når noe endrer
seg signifikant?

Vis oss et hovedforslag + ett vilt alternativ.

### Spørsmål 3: hva med motion-narrativet?

I dag har vi:
- `cubic-bezier(0.23, 1, 0.32, 1)` standard ease-out-quart
- Spring-følelse på toggle (back-out-cubic 240ms)
- Blur-cross-fade på tier-avatar (220ms)
- TapTarget med scale(0.97) + Capacitor-haptikk på alle interaktive
  elementer
- Count-up på temp + feels (200ms)
- Stagger-reveal i grids (0..300ms)
- Vær-tips-pille slides under vær-pille

**Spørsmål til deg:** har vi underspillet motion noe sted? Er det noe
som burde være «alive» som er statisk? Hvilke 2-3 motion-grep gir
størst perceived-quality-løft fra dagens nivå?

### Spørsmål 4: identitet og brand-DNA

I dag: krem-bg, rust som ink + accent, gull bare for Premium, terracotta
som plagg-aksent. Stoler på color-strategy: **Restrained** med
Committed-burst kun i Premium-overflater. DM Serif Display på primær-
tittler, Inter resten. Lo-maskotten finnes (støvkanin-figur) men er
ikke prominent.

**Spørsmål til deg:** er paletten BRA fordi den er trygg, eller KJEDELIG
fordi den er trygg? Vis oss en alternativ palett-strategi (f.eks.
Committed på hovedflate, Full palette på Guide, eller Drenched på onboarding-
intro). Skal Lo-maskotten få mer plass?

### Spørsmål 5: brutalt — hva ville du KASTET ut?

Hvis du fikk redesigne Babyora fra null med samme funksjons-spec, hva
ville du forkastet av det vi har bygget? Tre konkrete eksempler.

## Format på leveranse

Helst HTML-mocks vi kan åpne i nettleser. Eller:

- ASCII-mocks (jeg kan visualisere)
- Inline-SVG-skisser
- Figma-skisser (gi link)

For hvert konsept:
- Hvilket spørsmål adresserer det
- Hva du valgte og hvorfor
- 1-2 setninger om motion + haptikk-tilnærming
- En setning som er en kritikk av dagens valg

Ikke vær diplomatisk. Hvis dagens valg suger, si det. Hvis det er bra,
si det også — vi lærer av det.

## Kontekst-filer hvis du vil se på koden

- Repo (les-tilgang via Sivert): `Fenral/wool-app`
- Live web: https://wool-app-git-main-sivert-s-projects.vercel.app
- Galleri (alle 91 PNG-er): https://wool-app-git-main-sivert-s-projects.vercel.app/gallery.html
- Design-audit jeg gjorde 2026-06-14: `review/DESIGN-AUDIT-2026-06-14.md`
- Motion-system jeg dokumenterte: `docs/motion-system.md`

Krev gjerne flere screenshots eller spørsmål før du leverer.

## Hva vi IKKE vil at du jobber med

- Engine-logikk (wool-layers) — ortogonal
- Plagg-PNG-er — nylig regenerert, ikke endre
- Premium-pricing eller paywall-strategi
- A11y-grunnpilarer (de er allerede på plass)
- Lokalisering (kun norsk for v1)

---

Ferdig?  Si fra om du trenger mer kontekst, ellers er vi spent på å se
hva du foreslår.
