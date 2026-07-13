# Babyora F79 — Guide-seksjonen: UI/UX- og innholdsanalyse

Dato: 2026-07-02. Mandat (Sivert, verbatim): *«Det skal oppleves som lett tilgjengelig
informasjon for å lære mer. Eksempelvis: i en diskusjon med noen om hva barn bør ha på
skal 'kalkulatoren' oppleves som fasit.»*

Vurdert kode: `GuideHubScreen.tsx`, `FinnAntrekkScreen.tsx`, `TogGuideScreen.tsx`,
`VarmEllerKaldScreen.tsx`, `PlaggbibliotekScreen.tsx`, `MinGarderobeScreen.tsx`,
`data/garment-info.ts`, `lib/wool-layers/alternatives.ts` + F79-baseline.

---

## Score per dimensjon

| # | Dimensjon | Score | Én-linje-diagnose |
|---|---|---|---|
| 1 | Fasit-autoritet i kalkulatoren | **48/100** | Motoren er fasit-verdig; presentasjonen er et forslag nederst på siden. Ingen dom, ingen begrunnelse, ingen delbarhet. |
| 2 | Lett tilgjengelig læring | **62/100** | Hub-en er ren og veien kort (2 tap), men søk-knappen er død, og «Kunnskap» har bare 2 artikler. |
| 3 | Innholdsdekning (gap) | **40/100** | Plagg-nivået er godt dekket (garment-info + alternatives); situasjons-nivået («hva gjør jeg når…») er nesten tomt. |
| 4 | Troverdighets-signaler | **25/100** | Null kildehenvisninger i UI. Lullaby Trust og «norske barnesykepleier-anbefalinger» finnes kun i kodekommentarer og tester. |

**Snitt: 44/100** — konsistent med F79-baseline (40,8): innholdet og motoren er sterkere
enn presentasjonen.

---

## Fasit-autoritet: funn + topp-5-tiltak

### Funn

**(a) Visuell autoritet — svaret ser ut som en fotnote, ikke en dom.**
- I `FinnAntrekkScreen` er skjermens visuelle hierarki invertert i forhold til mandatet:
  temperatur-verdien får DM Serif 32px, mens selve svaret («Anbefalt antrekk») er en
  0.9375rem overskrift på et kort **nederst i scroll**, under tre slidere + radiogroup.
  I diskusjons-scenarioet må forelderen scrolle forbi alle inputs for å vise svaret.
- Kontrast internt i Guide: `TogGuideScreen` HAR instrument-følelsen — 84px serif-tall
  («3.5 tog»), komfortsone-linje, trygghetsregel. Kalkulatoren, som er hovedproduktet,
  har den ikke. Det finnes ingen aggregert dom («**3 lag**») — sr-only-meldingen
  (`Anbefaling: 3 lag mot kald`) inneholder faktisk den perfekte fasit-setningen, men den
  er kun synlig for skjermlesere (L261).
- Baseline-funnet «popup presenterer antrekket som kvittering» gjelder identisk her:
  output er en inventarliste med 60px-rader, ikke et komponert antrekk.

**(b) Begrunnelse — «hvorfor» finnes på feil nivå.**
- Per-plagg-hvorfor finnes (PlaggDetailSheet → garment-info `what`/`when` + alternatives
  pros/cons) og er godt innhold. Men i diskusjonen spør man ikke «hvorfor ullbody?»,
  man spør «hvorfor 3 lag / hvorfor ull i det hele tatt i dag?». Det finnes **ingen
  antrekk-nivå-begrunnelse** («Fordi det føles som −8° med denne vinden, og barn i vogn
  produserer ikke egen varme»). Motoren har alle data (feelsLike, vind-terskler,
  aktivitet) — de vises aldri.
- At begrunnelsen er gjemt bak tap-per-plagg betyr at man ikke kan *vise* den til
  motparten uten å navigere.

**(c) Delbarhet — ikke-eksisterende.**
- Ingen del/vis frem-funksjon, ingen skjermbilde-vennlig komprimert visning, ingen
  «vis dette til bestemor»-modus. Svaret er spredt over ~2 skjermhøyder og kan ikke
  rekkes over bordet som ett kort.

**(d) Språklig sikkerhet — bra i kjernen, undergravd i rammen.**
- Bra: outputtitler hedger ikke («Anbefalt antrekk», «Anbefaling», «Slik kler du på»).
  Ingen «kanskje/bør vurdere» i selve svarstrengene. TOG-sonene bruker autoritativ form
  («Komfortsone for 18–21° · trygg fra 16°»).
- Undergravende strenger (faktiske):
  - Hub-hero: **«AI-drevet kleskalkulator»** + «Vi kombinerer vær, aktivitet og barnets
    alder» (GuideHubScreen L947–949). «AI-drevet» er anti-fasit i 2026 — i en diskusjon
    er «appen sier…» svakere enn «kalkulatoren basert på helsesøster-standarden sier…».
    Motoren er dessuten en deterministisk regelmotor, så påstanden er også upresis.
  - Undertittel: **«juster fritt»** (FinnAntrekk L320–321) — rammer verktøyet som
    lekegrind, ikke instrument.
  - Tomtilstand: **«Ingen anbefaling for denne kombinasjonen. Prøv et annet vær eller
    aktivitet.»** (L468) — en fasit har ikke hull i domenet sitt. Dette må aldri kunne
    vises for gyldige slider-verdier.
  - garment-info bruker gjennomgående «ca», «vanligvis», «God som» — akseptabelt på
    detaljnivå, men forsterker forslags-tonen når det er eneste begrunnelse som finnes.

### Topp-5-tiltak (fasit-autoritet)

1. **Verdikt-hero øverst i output:** stort serif-tall à la TOG-skjermen — «**3 lag**»
   (DM Serif 64–84px) + én dom-linje «mot frost, i vogn» + lag-rampen som visuelt
   fingeravtrykk (baseline-tiltak 6). Sr-only-strengen som allerede bygges på L261 er
   manuset; gjør den synlig.
2. **Én begrunnelses-linje under dommen, alltid synlig:** «Føles som −9° · vind krever
   vindtett lag · vogn = barnet lager ikke egen varme», med «Vis hvorfor»-ekspander som
   lister regel-utslagene fra motoren. Da kan forelderen peke på *hvorfor* midt i
   diskusjonen.
3. **Erstatt «AI-drevet kleskalkulator» med autoritets-copy:** f.eks. «Kleskalkulatoren
   — bygget på norske helsesøster-råd og TOG-standarden». Fjern «juster fritt» →
   «basert på været nå — juster og se svaret endre seg».
4. **«Vis frem»-modus / delbarhet:** ett tap på output-kortet → fullskjerms svar-kort
   (antrekk + dom + begrunnelse + kilde-linje) egnet for å holdes opp eller deles som
   bilde. Kombiner med bottom-sheet-arbeidet fra baseline-tiltak 3.
5. **Fjern tomtilstanden:** garantér i motor/UI at alle kombinasjoner i slider-domenet
   gir svar (guardrails-testene tyder på at motoren allerede klarer det — tomtilstanden
   er UI-frykt, ikke motor-realitet). Behold catch-fallback kun som logget feil.

---

## Læringstilgjengelighet: funn + tiltak

### Funn

- **Veien er kort:** Guide-tab → hub → svar er 2 tap. Hub-hierarkiet (Hero →
  VERKTØY → KUNNSKAP) er riktig prioritert, og kategori-navnene er
  spørsmåls-orienterte der de er best: «Varm eller kald?» og «Soving innendørs» er
  gode; «Plaggbiblioteket»/«Min garderobe» er klare verktøysnavn.
- **Søk-knappen i hub-en er død:** `onClick={() => triggerHaptic('light')}`
  (GuideHubScreen L922) — den vibrerer og gjør ingenting. For «jeg lurer på noe»-brukeren
  er dette den mest direkte inngangen, og den er en attrapp. Enten fjern eller lever.
- **Skann-barhet er god der innhold finnes:** VarmEllerKald er eksemplarisk
  svar-først-struktur (3 signaler → handling «Ta av/Behold/Legg til» + footnote som
  avliver kalde-hender-myten). TOG-guiden gir svaret (TOG-tallet) før forklaringen.
  garment-info er konsekvent `what`/`when` — skannbart.
- **Men «Kunnskap» = 2 kort.** Seksjonen heter «Lær det vesentlige» og inneholder to
  emner. Det vesentlige for målgruppen er minst 8–10 emner (se gap-listen). Hub-en
  skalerer visuelt fint til flere rader — det er innhold som mangler, ikke IA.
- **Pseudo-interaktivitet forvirrer:** status-radene i VarmEllerKald er `<button>` som
  kun fyrer haptikk (L124–127) — de ser tappbare ut, ingenting skjer. Samme mønster som
  den døde søk-knappen: interaktive affordances uten payload svekker tilliten til hele
  seksjonen.
- **Hardkodet barn i TOG-guiden:** hero-eyebrow viser «For Lo · 4 mnd» (TogGuideScreen
  L880) uansett hvilket barn som er aktivt. FinnAntrekk bruker `active.name` korrekt.
  For en forelder med barn som heter noe annet er dette et umiddelbart
  autoritets-havari («appen vet ikke engang hvem barnet mitt er»).

### Tiltak

1. Fiks/fjern død søk-knapp; hvis den beholdes: enkel fuzzy-søk over kunnskapskort +
   garment-info (alle strengene finnes allerede strukturert).
2. Bytt «For Lo · 4 mnd» til aktivt barn (`useChildren` er allerede mønsteret i
   FinnAntrekk).
3. Gjør VarmEllerKald-radene ekte: tap → utvid med «hva gjør jeg nå»-detalj (f.eks.
   «Ta av: start med lue/ytterste lag, sjekk igjen etter 5 min») — eller gjør dem
   ikke-interaktive.
4. Utvid KUNNSKAP med gap-innholdet under; behold kort-formatet (farge-stripe +
   ikon + én-linjes spørsmålstittel). Titler som spørsmål («Er det for kaldt ute?»)
   matcher «jeg lurer på noe»-inngangen bedre enn substantiv.
5. Alle nye kunnskapssider følger VarmEllerKald-malen: svaret/regelen først (visuelt
   dominant), forklaring under, myte-avlivende footnote nederst.

---

## Innholds-gap topp 8

Rangert etter hvor ofte spørsmålet oppstår hos norske nybakte foreldre (0–3 år).
Guide svarer i dag godt på «hva skal barnet ha på ute nå» og «TOG inne» — nesten alt
annet er udekket.

| # | Spørsmål | Status i dag | Kommentar |
|---|---|---|---|
| 1 | **Sove ute i vogn — hvor kaldt er greit, og hvordan kle?** | Ikke dekket | Norsk kjernepraksis (barnehage + hjemme). Daglig spørsmål oktober–mars. Naturlig søster-side til «Soving innendørs» — navnet antyder at «Soving utendørs» skulle finnes. |
| 2 | **Tegn på overoppheting — og hvorfor det er farligere enn kulde** | Delvis (nakke-sjekk sier «for varm», ikke konsekvens/øvrige tegn) | SIDS-koblingen er grunnen til at TOG-reglene finnes; i dag er sikkerhetsbudskapet én setning i TOG-guiden. Rød flush, rask pust, klam hud, uro. |
| 3 | **Bilstol-regelen: aldri tykk dress i selen** | Motoren har guardrail (HB-9 i tester!) men **null bruker-innhold** | Sikkerhetskritisk, vinter-hverdag. Appen vet regelen — den forteller den aldri. |
| 4 | **Vogn vs bæresele — hvorfor kle ulikt?** | Implisitt (aktivitetsvalg finnes) men aldri forklart | Kalkulatoren skiller lek/vogn, men forklarer ikke logikken (stillesittende barn + bærers kroppsvarme). Én forklarende side gjør kalkulator-svaret forståelig. |
| 5 | **Ull-vask og stell** | Ikke dekket | Appen anbefaler ull i nesten hvert svar og nevner «skånsom vask» som ulempe (alternatives.ts) — uten å noen gang forklare hvordan. Lavthengende, høy frekvens. |
| 6 | **Sol: solhatt, solkrem under 1 år, UV og skygge** | Kun garment-info-en-linje om solhatt | Hele sommerhalvåret. Helsedirektoratet har klare råd (ikke solkrem < ~6 mnd, skygge først). |
| 7 | **Regntøy på baby: kondens, pust, hvor lenge** | Kun «Når det regner» i garment-info | Regntøy-regler (lufting, ull under skall, ikke tett plast rett på) er klassisk usikkerhet. |
| 8 | **Feber/sykt barn — kle mer eller mindre?** | Ikke dekket | Høyfrekvent panikk-spørsmål første leveår; kobler direkte til varm/kald-sjekken som allerede finnes. |

Bobler under topp 8: «hvor lenge kan vi være ute i −10°», «votter som blir våte»,
«str-guide / hvor stort skal yttertøy kjøpes», «barnehagens krav vs appens råd».

---

## Troverdighet/kilder

**Status: 0 kildehenvisninger i brukerflaten.**

- `tempToTog()` dokumenterer «Følger Lullaby Trust + norske barnesykepleier-anbefalinger»
  — i en kodekommentar (TogGuideScreen L54–57). Testene heter «Lullaby-Trust
  søvn-TOG-binning (norsk helsesøster-standard)». Brukeren ser aldri noe av dette.
- alternatives.ts er «grunnet i materialforskning (jun 2026)» — også kun i kommentar.
- met.no krediteres kun i Uke-fanens footer, ikke i Guide/kalkulatoren der været faktisk
  driver svaret.

**Bør det ha kilder? Ja — dette er selve fasit-mekanismen.** I diskusjons-scenarioet
vinner ikke appen på design alene; den vinner når svaret kan avsluttes med «…og det er
Helsedirektoratets/Lullaby Trusts anbefaling». For en app som gir råd om spedbarn og
søvn er kildeløshet dessuten en reell tillitsrisiko ved omtale/anmeldelser.

**Hvordan uten å bli akademisk tungt — tre nivåer:**

1. **Kilde-linje (én linje, alltid):** diskret under svaret/TOG-tallet:
   «Basert på Lullaby Trust-standarden og norske helsesøster-råd · vær fra met.no».
   Ingen lenker, ingen fotnoter — bare avsender-autoritet. Kost: én streng per skjerm.
2. **«Hvorfor stoler vi på dette?»-sheet:** ett felles bottom-sheet (gjenbruk
   PlaggDetailSheet-mønsteret) fra kilde-linjen: 3–5 kilder med én setning hver om hva
   de dekker (Lullaby Trust → TOG; Helsedirektoratet/helsenorge → søvn/sol;
   met.no → vær; materialforskning → ull vs alternativ). Skrives én gang, lenkes overalt.
3. **Inline-attribusjon kun ved sikkerhetsregler:** «Trygg-natt-regelen» og kommende
   bilstol-/overopphetings-innhold får eksplisitt kilde i selve kortet — det er der
   foreldre dobbeltsjekker mot Google.

Unngå: akademiske referanselister, DOI/år i løpende tekst, mer enn én kilde-linje per
skjerm.

---

## Anbefalt prioritering (hva løftes i F80)

**P1 — Verdikt-hero + begrunnelse i kalkulatoren** (fasit-tiltak 1+2).
Størst effekt mot mandatet: «3 lag» som serif-dom øverst, én synlig hvorfor-linje,
«Vis hvorfor»-ekspander. Gjenbruker TOG-skjermens allerede fungerende instrument-mønster
og lag-rampen fra baseline-tiltak 6. Uten dette forblir kalkulatoren et forslag.

**P2 — Kilde-linje + copy-fix** (fasit-tiltak 3 + troverdighet nivå 1–2).
Billigst per autoritets-poeng: bytt «AI-drevet»-hero-copy, fjern «juster fritt» og
tomtilstanden, legg kilde-linje under svaret i FinnAntrekk + TOG. Ren streng-jobb +
ett delt sheet.

**P3 — Tillits-bugs:** død søk-knapp, hardkodet «For Lo · 4 mnd», pseudo-tappbare
rader i VarmEllerKald. Små fikser som fjerner aktive autoritets-lekkasjer.

**P4 — To nye kunnskapskort:** «Sove ute i vogn» (gap #1) og «Bilstol-regelen»
(gap #3 — regelen finnes allerede i motoren, den mangler bare ord). Etter VarmEllerKald-
malen: svar først, footnote-myteavliving sist.

**Utsettes til F81+:** delbart «vis frem»-kort (bør ri på bottom-sheet-redesignet fra
baseline-tiltak 3), fullt søk, resten av gap-listen (#4–#8).
