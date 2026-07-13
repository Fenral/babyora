# F81 — Prisbeslutning «Babyora Pluss» (2026-07-03)

## Kontekst

Babyora har kjørt med placeholder-priser fra P10.0 (349/59/699 + 7 dagers
trial, se `review/P10-MASTER-CHECKLIST.md`) siden 2026-06-13, ankret i
`src/lib/premium/products.ts` og `src/data/pricing.ts` (sistnevnte en
tidligere, ubrukt 39/99/299-modell — slettet i F81.1). Før første reelle
lansering av abonnementet «Babyora Pluss» måtte pris, trigger-sett og
freemium-grensen låses. 4 panelister ble kjørt adversarielt mot hverandre,
Fable 5 syntetiserte, Sivert låste.

## Panelistenes hovedposisjoner

- **Skeptiker** — 39/249/449: «59 kr er for dyrt for en ny app uten track
  record; WOM (word-of-mouth) er alt i denne fasen, ikke marginen per bruker.»
- **Verdi-forkjemper** — 69/399/899: «Underprising er irreversibel — det er
  mye lettere å senke en pris senere enn å heve den etter at brukerne har
  forankret seg på et lavt tall.»
- **Freemium-arkitekt** — ingen konkrete tall, men to strukturelle dommer:
  skarpt skille mellom «NÅ gratis»/«FREMTID Pluss» må kommuniseres per
  funksjon (ikke luring), 3-plagg-grensen på garderobe-registrering er et
  dark pattern (straffer vanlig bruk, ikke luksus), og `soevn_inne` kolliderer
  med sikkerhetsregelen — søvn/TOG-innhold kan aldri stå bak betalingsmur.
- **Benchmark** — 49/279/499, pekte på Carrot Weather som pristak-referanse
  for værtilpassede apper og argumenterte for at årsplanen (ikke
  månedsplanen) er selve produktet — månedsplanen finnes kun som anker.

## Fable-syntesen

Landet mellom skeptiker og benchmark, ikke ved verdi-forkjemperens tall:
en ny app uten anmeldelser (jf. «App Store-rating-terskel»-praksis — ingen
stjerner synlig før 50+ anmeldelser) tåler ikke verdi-forkjemperens
prispunkt uten track record, men skeptikerens 39/249 er unødvendig lavt gitt
at 299-året allerede underpriser mot referansetotalen (49×12=588 → «spar
49 %» er en ærlig, sterk claim). 299 rundes opp fra benchmarkens 279 for at
«spar 49 %»-badgen skal bli et rundt, troverdig tall — ikke for å presse
margin. Livstidsproduktet flyttes fra generisk «lifetime» til et navngitt
løfte, «Barnetiden», fordi non-consumable-kjøp selger bedre på identitet
(«hele småbarnstiden») enn på et regnskapsord. Freemium-arkitektens to
strukturelle dommer aksepteres fullt ut: 3-plagg-grensen fjernes (F81.1),
og `soevn_inne` strykes som trigger permanent. `uke_dag`, `mine_plagg_4` og
`feedback_proaktiv` droppes samtidig — ingen av dem overlever «NÅ vs
FREMTID»-testen som en overbevisende, ikke-masete paywall-grunn.

## Låste valg

| Dimensjon | Verdi |
|---|---|
| Månedlig (anker) | 49 kr/mnd, autoRenews, ingen trial |
| Årlig (HERO) | 299 kr/år, autoRenews, 7 dagers gratis trial, «spar 49 %» |
| Engangskjøp | 499 kr «Barnetiden» — non-consumable, «alle barna dine, hele småbarnstiden 0–3 år» |
| Trial | 7 dager, kun på årsplanen |
| Paywall-stil | Kontekstuell + teaser (forhåndsvisning av det du prøvde å gjøre, ikke generisk blokk) |
| Abonnementsnavn | Babyora Pluss |
| Triggere (kun disse 4) | `imorgen`, `morgenvarsel`, `garderobe_tilpasning`, `barn_2` |
| Droppede triggere | `uke_dag`, `mine_plagg_4` (erstattet av `garderobe_tilpasning`), `soevn_inne` (sikkerhetskollisjon), `feedback_proaktiv` |

### Freemium-matrisen (endelig, låst av Sivert 2026-07-03)

Prinsipp: **NÅ er gratis, FREMTID er Pluss.** Alt som handler om dagens
beslutning er gratis for alltid; planlegging, automatisering og
personalisering av fremtiden er Pluss. Sikkerhet gates aldri
(håndhevet av `copy-lint.ts`).

| Funksjon | Nivå |
|---|---|
| Dagens anbefaling + avatar + påkledningsanimasjon | Gratis |
| Påkledning-popup m/plagg-detaljer + ull/fleece-alternativer | Gratis |
| Uke: time-for-time I DAG | Gratis |
| Uke: i morgen + 10-dagers plan | **Pluss** (`imorgen` — teaser: vær-ikoner synlige, antrekk låses, inline CTA) |
| Finn antrekk-kalkulator | Gratis (sikkerhetsventil: ingenting er umulig gratis, bare automatisert i Pluss) |
| TOG-guide + Varm/kald + all sikkerhet | Gratis ALLTID |
| Plaggbibliotek | Gratis |
| Min garderobe: registrering | Gratis, UBEGRENSET (3-grensen fjernet i F81.1) |
| Min garderobe: aktiv tilpasning + hull-analyse | **Pluss** (`garderobe_tilpasning`) |
| Barn 1 | Gratis |
| Barn 2+ (profil kan opprettes, anbefaling låses) | **Pluss** (`barn_2`) |
| Morgenvarsel push | **Pluss** (`morgenvarsel` — trial-flaggskipet: 7 morgener der appen tenkte for deg) |

## Implementert i F81.0 + F81.1

- `src/lib/premium/products.ts`: nye product-ID-er
  (`babyora_yearly_299`/`babyora_monthly_49`/`babyora_barnetiden_499`),
  nye priser/tekster, redusert `PAYWALL_TRIGGERS` til de 4 låste.
- `src/data/pricing.ts` slettet (ubrukt, gammel 39/99/299-modell).
- `src/lib/garments/ownership.ts`: `FREE_LIMIT`-gating fjernet —
  garderobe-registrering er ubegrenset gratis. `ownership-override.ts`
  (selve tilpasningen) er urørt — premium-gating der er F81.5.
