# Åpningens kontinuitetskontrakt (Sol-runde 2, 2026-08-01)

Status: HISTORISK grunnkontrakt med eier-override 2026-08-08. Den opprinnelige
beslutningen står urørt nedenfor for sporbarhet; overstyringen her har forrang
der punktene er i konflikt.

## Eier-override 2026-08-08 — ny åpningssignatur

- Native launch og web-handoff bruker én sentrert Babyora-signatur på solid,
  temariktig lerret (`#F9F5EB` lyst / `#1E140C` mørkt).
- `maskot-resultat-sveip.webp` er hovedmotivet. `vaer-delvis-skyet.webp` lander
  oppå den åpne høyrehånden, med de ytterste fingrene malt foran skyen, slik
  at været leses som holdt i stedet for plassert bak armen.
- BABYORA-ordmerket står i et varmt navneskilt barnet lener seg over. Skiltet
  bruker den offisielle reverse-SVG-en; ingen typesatt erstatning.
- Værmotivet ligger over armen og under fingertuppene, slik at sky/sol leses
  som fysisk holdt. Ingen ekstra slagord, gradient, lyd, haptikk eller vent.
  Web viser skilt → barn → vær med 80 ms forskyvning; Reduce Motion er statisk.
- `?launch-preview=slow` er en query-gatet design-review: produksjonsbevegelsen
  spilles 5× saktere, fullføres på 3 s og pauser i skjult fane. Flaten slipper
  på vårets faktiske `animation.finished`, deretter 200 ms fade. Den påvirker
  aldri vanlig appstart; Reduce Motion får normal statisk handoff.
- Den gamle §1-regelen om venstrejustering, «aldri maskot» og maks 1 pt mellom
  ordmerkeposisjoner er dermed opphevet. Sentrum, rekkefølge og trygg beskjæring
  er kontinuitetsankeret nå. Øvrige deler av kontrakten gjelder fortsatt der de
  ikke strider mot denne overstyringen.

Kontrakten erstattet klatre-sekvensen (fjernet ved tidligere eier-override — se
`aapningssekvens-2026-08-01.md` som nå er historikk). Hjem er statisk til CTA;
dokumentet styrer overgangen native launch → første web-frame og onboarding →
Hjem.

## 1. Ordmerket er broen — med universell ankring

- Native launch screen = ren espressoflate + BABYORA-ordmerket. ALDRI panel
  eller maskot i native launch (Apple HIG: Launching).
- Ordmerket er en ikke-lokalisert SVG/asset (ikke typesatt tekst) og har
  IDENTISK ankring i alle flater: **venstrejustert på det globale gridet** i
  launch, onboarding (alle steg) og Hjem. Dagens tilstand bryter dette
  (onboarding sentrert, Hjem venstre) — onboarding flyttes til venstre.
- Ordmerket flytter seg maks 1 pt mellom native og web.
- Ingen fullskjerm-rasterbilde i native launch; én eksakt espresso-token,
  adaptiv launch-layout (ikke statisk skjermdump).

## 2. Onboarding → Hjem: forskjøvet crossfade (ikke lik 300 ms, ikke retning)

Dette er fullføring av en tilstand, ikke navigasjon — derfor crossfade:

| Fase | Timing |
|---|---|
| Onboarding-innhold ut | 100–120 ms |
| Hjem inn | 180–200 ms |
| Overlapp | ~40 ms |
| Totalt | 260–280 ms |

- Ordmerket står helt stille. Panelet setter seg 6 px opp.
- Stående maskot kuttes først under ~20 % opacity; hengende maskot inn etterpå.
- Reduce Motion: direkte bytte eller maks 100 ms ren opacity uten transform.
- Begrunnelse mot lik 300 ms: symmetrisk fade gir «dobbelt grensesnitt»/ghosting.

## 3. Lyd: aldri ved passiv oppstart

Babyora brukes ved sovende barn. Launch, værankomst og onboarding er lydløse.
Haptikk kun etter brukerutløst CTA.

## 4. Font-kontrakt (erstatter font-display: optional)

`font-display: optional` gir ikke garantien vi trenger (fallback kan bli
stående hele økten). Kontrakt:

1. BABYORA som identisk SVG/asset i native og web (uavhengig av webfont).
2. Lokalt pakket, subset WOFF2; preload av nøyaktig brukte vekter.
3. Metrisk tilpasset fallback (`size-adjust`, ascent/descent-overrides).
4. Temperatur og øvrige værverdier materialiseres først når Fraunces er klar.
5. Ingen tekst endrer bredde eller baseline etter første synlige frame.

## 5. Cachematrise for kaldstart («Henter vær» er siste utvei)

| Cache-tilstand | Oppførsel |
|---|---|
| Fersk | Vis umiddelbart |
| Gammel | Vis umiddelbart + «Sist oppdatert …», revalider i bakgrunnen |
| Ingen | Reserverte felt + «Henter vær …», CTA deaktivert |
| Feil | Behold strukturen; tilby sist kjente råd eller tydelig ny prøving |

Ingen layout-shift når værdata kommer (reserverte felt).

## 6. Varmstart: resume ≠ ny prosess

- Resume fra bakgrunn: appen står NØYAKTIG der brukeren forlot den (også
  Planlegg/Familie/åpne ark) — tilstandsgjenoppretting per Apple HIG.
- Ny prosess: cachet Hjem etter produktregelen.
- Ny bruker: launch → onboarding DIREKTE, aldri Hjem-glimt.

## 7. Pose-separasjon (adoptert umiddelbart)

- `maskot-nysgjerrig.png` er RESERVERT scan-koreografien («Babyora
  undersøker»). Gjenbruk som idle-glimt ville utvannet eierskapet.
- Idle-glimt bruker egen rolig pose: `public/monter/maskot-glimt.png`
  (hodet oppreist, kun blikket til siden; generert 2026-08-01, kuttet med
  flood-fill-pipelinen, alfa-bbox x99–436 y87–402 cx267,5 — identisk
  gripelinje som maskot.png/maskot-nysgjerrig.png).
- Idle-glimt kanselleres ved enhver aktivitet: scan/recalc, åpne ark/paywall/
  dialog, tastatur oppe, visibilitychange, første 30 s etter resume.
  Reduce Motion = normalposen permanent.

## 8. Akseptansekriterier

- Ingen hvit, svart eller feil-tematisert mellomframe.
- Ordmerket maks 1 pt forskyvning native↔web.
- Ingen synlig font-/baseline-swap på fysisk iPhone.
- Ingen layout-shift ved værdata-ankomst.
- Oppstart forsinkes aldri kunstig.
- Ny bruker ser onboarding direkte uten Hjem-glimt.
- Reduce Motion erstatter 6 px-settling med ren fade.
