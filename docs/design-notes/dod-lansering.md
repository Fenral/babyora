# DoD-lansering — faser med Definition of Done

Vedtatt 2026-08-04. Mønsteret er lånt fra eiers byrå-eksempel (fase-skopet
agentloop med normativ spec) og tilpasset det vi har: vedtak.json som
beslutningsregister og mutasjonstest som beviskrav.

Dømt av to uavhengige dommere 2026-08-04:
- **Impeccable** (produktregisteret): fem blokkere → innarbeidet → godkjent.
- **Sol** (tråd «Verifikasjon og godkjenning», 5.6 Ekstra høy): sju blokkere →
  innarbeidet → «GODKJENT SOM PROFESJONELL, EKSEKVERBAR PLAN» per hennes egne
  vilkår. Der dommene overlappet er den strengeste varianten valgt.

## Arbeidsloopen (gjelder hver fase)

1. **PLAN**: velg neste uavkryssede DoD-punkt i gjeldende fase. Én setning om
   hva denne iterasjonen gjør.
2. **IMPLEMENTER**: lite og fokusert — ett DoD-punkt om gangen.
3. **VERIFISER**: kjør kommandoen som står på punktet. Et punkt uten kjørt
   verifikasjon KAN IKKE krysses av.
4. **RAPPORTER**: hva ble gjort, hva viste verifikasjonen, hvilket punkt er nå
   avkrysset.
5. **STOPP-SJEKK**: er alle punkter i fasen grønne → meld «FASE n FERDIG»
   med evidenspakken. **Fase 1, 2, 2B, 3 og 5 fortsetter automatisk** — eier
   får rapporten, men trenger ikke svare for at arbeidet skal gå videre.

   **TRE ekte eierporter** (revidert fra seks):
   - Påkledning-grenvalget før fase 4 *(tatt 2026-08-04)*
   - Låsing av funnlisten etter 6A-auditen
   - Endelig release go/no-go

**Mutasjonskontrakten** (revidert 2026-08-04 — TO ledd, ikke tre):
1. injiser bruddet porten skal fange → porten er RØD;
2. gjenopprett koden → porten er GRØNN.

Det tredje leddet («deaktiver parseren → mutasjonstesten rød») er fjernet:
det er å teste testen av testen, per port. Det erstattes av EN sentral regel:

**IKKE-VAKUØSITET.** Hver port rapporterer *filer skannet*, *mål funnet* og
*assertions kjørt*. **Null mål = RØDT.** En port som ikke fant noe å måle,
har ikke bestått — den har vært taus.

Ikke teori: port 6 sporet `.hjm-synth`, en selektor med null treff i `src/`,
og manglet `.hjm-s-spin` som snurrer `infinite` gjennom hele det påståtte
holdet. Den meldte 674 ms stillhet. Riktig utvalg gir 8 ms. Eieren
rapporterte den manglende stoppen to ganger og fikk grønt begge gangene.

**Baseline/ratchet-regelen** (Sol-blokker 1): porter som avdekker
*eksisterende* brudd fødes med en baseline av dagens antall. CI feiler kun ved
ØKNING. Fase 3 ratsjer hvert tall ned mot null; null blir deretter nytt låst
gulv. Uten dette ville fase 2 vært rød ved fødsel og regelen «ingen fremdrift
på rødt» umulig.

Regler ellers: spec-en er normativ (DESIGN.md + art bible + vedtak.json).
Avgjørelser som ikke er dekket → rimelig skjønn, ført i vedtak.json med kilde,
aldri bare i prosa. Feiler en verifikasjon: **et DoD-punkt kan ikke lukkes, merges eller
releases mens verifikasjonen for DEN endringen er rød** — uavhengig arbeid
kan fortsette. Motor-mappene røres aldri.

**Lokal gate vs. CI:** lokalt kjøres *berørt* suite; full suite +
`verify:hjem` i CI, og lokalt kun ved faseavslutning og release. Full lokal
gate er målt til 165 s, hvorav 127 s er motorens suite.

---

## FASE 1 — Tokenlinjene og folden (Hjem sann først)

Mål: de målte tokenfeilene rettet + CTA over fold på minste støttede enhet.

- [x] `--dw-sh-*-cta` får mørk-verdier som komposittert over `--dw-canvas` er
      MØRKERE enn lerretet (varm-nøytral espresso, ikke amber — Sols dom B fra
      2026-08-03). Verifiser: ny assertion i `design-tokens-v2.depth.test.ts`
      som komposittert-luminans-sjekker ALLE `--dw-sh-*` i begge tema;
      mutasjonskontrakt alle tre veier (dagens verdier er injeksjonen).
- [ ] `--dw-accent-300`-feilbruken repareres på FORBRUKERNIVÅ (Sol-blokker 3:
      300 er kant/lys, aldri tekst — tokenet omdefineres ikke for å redde feil
      bruk). Tog og Varm/kald flyttes til riktig teksttoken. Ny port: forbud
      mot `--dw-accent-300` i `color`. Verifiser: målt ≥ 4,5:1 der 1,87:1 og
      1,47:1 ble målt; porten mutasjonstestet.
- [ ] CTA ≥ 12 px klaring til tabbar på 375×667 med simulert safe-area, i
      Sols rekkefølge: skjul trust-linjen ved kompakt høyde → overheng
      130→108 uten å skalere maskoten → mål; bare hvis < 12 px: flytt
      Lillian-linjen inn i panelets metadataområde. Verifiser: ny port i
      `verify-hjem` som måler CTA-bunn mot tabbar-topp (med baseline før
      trykk), grønn på 375/390/430; mutasjonskontrakt.
- [x] EIER VALGTE 2026-08-04: INGEN av grenene — begge er gammelt design.
      «Dette kan du bare slette» + «Ingen av disse var de vi jobbet med i
      går.» Skjermen gjenoppbygges i fase 4 i monter-språket fra Hjem.
      Ført i vedtak.json som `paakledning-gjenoppbygges`.
- [ ] `vedtak.json`: `skygge-fortegn` og `cta-over-fold` → `laast`, gulvet
      heves. Verifiser: vedtak-register-testen.

## FASE 2 — Portene ser koden (før noe migreres)

Mål: ingen skjerm kan lenger bestå ved fravær. Feilklassen har opptrådt åtte
ganger. Alle porter her fødes med baseline (se regelen over) og full
mutasjonskontrakt.

- [ ] **Skjermmanifest** (Sol-blokker 6): `docs/design-notes/skjermmanifest.md`
      lister alle 11 shipping-skjermer med filstier, hvilke ni som migreres,
      hvorfor to er unntatt, ansvarlig fase og godkjente unntak per skjerm.
      GENERERES fra skjermregisteret; kun unntak skrives for hånd.
      «T-01-lista», «adresselista» og «kosmetisk-lista» løftes fra
      lanseringsstatusen inn i manifestet som konkrete fil/linje-punkter.
      Manifestet er valideringsgrunnlaget for portene under.
- [ ] Doktrine-linten leser `src/**/*.{css,tsx}` (inline `CSSProperties`
      inkludert), ikke `docs/mocks/`. Verifiser: feller minst tre kjente funn
      fra lanseringsstatusen; baseline; mutasjonskontrakt.
- [ ] Bevegelsesdetektoren leser `.tsx`. Verifiser: feller hardkodet `300ms`
      i en inline style; baseline; mutasjonskontrakt.
- [ ] Evighetsregel i bevegelsesdetektoren: `infinite` utenfor dokumentert
      unntaksliste felles (Impeccable-blokker 4a — `neck-orb-pulse` overlever
      i dag både ms-greppet og tokeniseringen). Verifiser: feller
      `VarmEllerKaldScreen.tsx:384`; mutasjonskontrakt.
- [ ] Panel-tekstrampe-port med SEMANTIKK-UNNTAK (Sol-blokker 4): ordinære
      instrumentverdier i panel-skopet får ikke bruke `--dw-ink-hi/mid/low`,
      `--dw-hairline` eller semantiske farger — men eksplisitte
      statuskomponenter (stale-badge, offline, feil) står på en navngitt
      allowlist og skal bruke semantikk. Verifiser: feller de tre kjente
      bruddene, godkjenner statuskomponentene; mutasjonskontrakt.
- [ ] Forbruker-port med TOKENKLASSER (Sol-forbedring av Impeccables port:
      «brukt minst én gang» kan tilfredsstilles av tilfeldig bruk og beviser
      ingenting). Hvert token klassifiseres i tokenfilen som
      `obligatorisk-kontrakt` / `primitiv` / `reservert` / `deprecated`.
      Klassifisering på PREFIKS/FAMILIE, ikke per token — kun `reservert` og
      `deprecated` føres som eksplisitte lister. Primitiver kan stå ubrukt. Verifiser: feller `--dw-lys-vinkel`-trioen i dag
      (reservert uten begrunnelse); mutasjonskontrakt.
- [ ] Kontrastmatrisen sjekkes inn som CI-TEST med baseline (Impeccable-
      blokker 5 + Sols ratchet: en måling ratsjeteres ikke — det var slik
      dybdekontrakten kunne stå «låst» med feil fortegn). Regner WCAG av
      tokenverdiene etter fokus-testens mønster. Verifiser: feller de kjente
      1,78–2,88:1-parene; mutasjonskontrakt. Føres som `kontrastmatrise-ci`.
- [ ] Portdom-23-port: handlingsdelen («sjekk antrekket») kan ikke komme
      tilbake i hviletilstanden. Verifiser: mutasjonskontrakt.
- [ ] **PROOF-DIFF-EN, kjørt ÉN gang ved B1→T2-aksept** (ikke stående
      CI-port; kjøres på nytt kun når scan-geometri, timing eller maskot
      endres). Kjør B1-proofen og appen side om side i Playwright,
      sample transform/opacity per frame gjennom hele scan-seremonien, og
      rapporter hvert avvik. Dagens terskelporter måler håndgli, dekning og
      stillstand — de fanget IKKE at panelet åpner seg i proofen og står låst
      i appen. Hvert avvik ender som dokumentert avvik i vedtak.json eller som
      etterslep i fase 3. Verifiser: porten feller den kjente panel-divergensen
      i dag; mutasjonskontrakt. Fører `animasjon-males-mot-proofen` → `laast`.
- [ ] `vedtak.json`: `panel-tekstrampe`, `kontrakt-har-forbruker`,
      `portdom-23-en-linje` → `laast`, gulvet heves.

## FASE 2B — Systemgrunnmuren (Sol-blokker 5; FØR migreringen)

Mål: det sveipen skal migrere TIL, finnes. Bygges før fase 3 så de ni
skjermene ikke må refaktoreres to ganger. (Impeccable la dette som fase 3
punkt 0/1; Sol krevde egen fase — strengeste variant valgt. Tokenklassene fra
fase 2 løser forbruker-port-konflikten: ny skala fødes som `primitiv`.)

- [ ] `--dw-space-*`-skala defineres, med eksplisitt unntaksliste for optiske
      plasseringer, safe-area og målte maskotankere (Sol: «ikke tokeniser
      hvert særtilfelle»). Radhøyde-gulvet (≥ 62 px) og 44×44-målet
      tokeniseres samtidig — de er i dag prosa uten noe å migrere til.
- [ ] `Button`/`ActionButton`-primitiv ekstraheres FRA hjem-monter.css
      (referansen på 88 %). CTA-en finnes i dag i ≥ 3 varianter; DESIGN.md
      krever selv ekstraksjonen. Felles kontrakt for press/loading/disabled/
      focus/Reduce Motion er del av primitiven.
- [ ] `Sheet`-ramme-primitiv (flere ark lanseres).
- [ ] SEMANTISKE radvarianter der struktur beviselig deles (`SettingsRow`,
      `GarmentRow`) — IKKE en generisk Row (Sol: en universell rad skjuler
      reelle forskjeller). Full states-matrise for toggle/tabs/strip står
      bevisst på venteliste, dekket av port «ingen lokal CTA-styling utenfor
      primitivet» (mutasjonskontrakt).

## FASE 3 — Token-migreringen (ÉN runde, ni skjermer)

Mål: systemet har mer enn én forbruker, og fase 2-baselinene ratsjes til null.
Kjøres som én feiesveip per mønster på tvers av alle skjermer i manifestet.

- [ ] Legacy-tokens → `--dw-*` (manifestets T-01-punkter).
- [ ] `var(--font-sans)` → `var(--dw-font-ui)`.
- [ ] Egne skyggestabler → `var(--dw-depth-*)` (manifestets adresseliste).
- [ ] Rå font-size → `var(--dw-text-*)`; vekt- og linjehøydetokens defineres
      samtidig (284 rå font-weight og 161 rå line-height målt — seks
      størrelser alene er et halvt system, Impeccable funn A2).
- [ ] Marger/padding → `--dw-space-*`-skalaen fra 2B.
- [ ] Hardkodede ms/kurver → `var(--dw-m-*) var(--dw-ease)`.
- [ ] Plaggplater → `var(--dw-plate)` + kant + `--dw-depth-selected`.
- [ ] Gjettede bunn-tall → `var(--dw-tabbar-clearance)`.
- [ ] CTA-er → `ActionButton`-primitiven; ark → `Sheet`.
- [ ] `:focus-visible` med riktig `--dw-focus` overalt; `outline:none` uten
      erstatning er forbudt.
- [ ] **SIDESKIFTENE bygges** (eierfunn 2026-08-04). `--dw-m-push`/
      `--dw-m-push-back` har null forbrukere; appen bytter skjerm uten
      bevegelse. Port fra B1-proofens `pushTo()`: begge flater beveger seg
      samtidig, kun transform (aldri scrollTop), viewporten klippes, neste
      side forhaandsrendres, gjentatte trykk laases mens en overgang paagaar,
      sveip starter aldri i iOS' venstre kantsone (foerste 24 px tilhoerer
      tilbake-gesten). Skallet og lyspoolen staar stille; poolen KRYSSTONER
      (300 ms) i stedet for aa gli med pushen. Reduced Motion kollapser til
      direkte bytte. Verifiser: port som maaler at BEGGE flater har
      transform under skiftet og at ordmerket staar stille;
      mutasjonskontrakt. Fører `sideskift-er-fysiske` → `laast`.
- [ ] Inline stiler flyttes til CSS-fil der mønsteret krever det
      (`::before`-kantlys, `:focus-visible`, media queries).
- [ ] SLUTT: alle fase 2-baselines = 0, og null settes som nytt låst gulv.
      Verifikasjon for alle punktene: fase 2-portene grønne, grep-tellinger
      = 0 utenfor manifestets unntak, kontrastmatrise-testen grønn i begge
      tema, full suite + `verify:hjem`.

## FASE 4 — Påkledning gjenoppbygges (eiervedtak 2026-08-04)

Mål: kjerneleveransen (18 % av vekten, i dag 32 %) gjenoppbygges i
monter-språket fra Hjem — ingen av de gamle grenene beholdes.

- [ ] Ny Påkledning-visning bygges av monter-komponentene: plaggrader med
      utskårne bilder (`MonterGarmentRow`), plater (`--dw-plate`),
      værstripe-mønsteret, dybdekontrakten, primitivene fra 2B.
- [ ] **KLE PÅ-STEPPEREN bygges** (eierfunn 2026-08-04: «hvert plagg kom opp
      med Neste eller swipe etter CTA»). I dag heter knappen
      `ResultSurface.tsx:84` «Kle på, steg for steg» og fører til en visning
      som gir ALT på én gang — knappen lover noe destinasjonen ikke har.
      Per art bible: ett plagg per steg, ETT materialpoeng med amber-punkt,
      Bytt-inngang som hevet rad med overlappende miniatyrer, ingen «Hopp
      over», horisontal sveip 1:1 med 120-260 ms settling, skallet står
      stille, Reduce Motion kollapser til direkte bytte.
      Verifiser: port som måler at stegantallet = antall plagg, at sveip
      følger fingeren 1:1, og at «Hopp over» ikke finnes; mutasjonskontrakt.
- [ ] FØRST når erstatningen er grønn: begge gamle grener slettes
      (PlannedPaakledningScreen-fallbacken OG CurrentPaakledningScreen),
      sammen med `Antrekkskart.css` sine 13 rå hex og legacy-tokenene.
      «Se hele antrekket» peker aldri på ingenting underveis.
- [ ] Sjekk som håndhever vedtaket: skjermen bruker monter-komponentene og
      null legacy-tokens; `paakledning-gjenoppbygges` → `laast`.
      Verifiser: fase 2-porter + kontrastmatrise + e2e grønne.

## FASE 5 — Juster-feilene (eneste skjerm der bruker kan stå fast)

- [ ] Opacity-demoteringen erstattes med `--dw-ink-demoted`-token + port som
      forbyr opacity-demping også på espresso-siden (Impeccable funn A1:
      panelet har forbudet, espresso har det ikke). ≥ 4,5:1 verifisert av
      kontrastmatrise-testen.
- [ ] Skip-knapp + aria-live i seremonien (gjenbruk `ScanStatusBlock`).
- [ ] Stale-låsen tvinger ikke ny seremoni for et svar appen har.
- [ ] Gauge-kontrasten opp til målt ≥ 4,5:1.
      Verifiser: kontrastmatrise + full suite.

## VED HVER FASEAVSLUTNING — endringsstyrt visuell røykpakke

Ny kontroll. Ingen lint kan avgjøre om en CTA har ravglød eller om 60 px luft
føles feil.

- [ ] Git-diffen bestemmer berørte flater. Den BYGDE appen rendrer dem i
      relevante temaer, viewporter og tilstander — med video der bevegelse er
      berørt — og eier får ett før/etter-ark. Menneskelig dom på det binære
      porter ikke kan se.

## FASE 6A — Sluttrevisjon (analyse, ikke utbedring)

- [ ] Innstillinger-revisjonen kjøres på nytt (falt på API-feil 2026-08-03);
      funnene føres inn i skjermmanifestet.
- [ ] Full revisjonsrunde mot manifestet; BLOKKERER-lista i lanserings-
      statusen avstemt — hvert punkt er enten grønt eller står med begrunnet
      unntak (Impeccable-blokker 4b: FAB-bak-tabbar har ingen tall å greppe).
- [ ] EIER LÅSER funnlisten. (Sol-blokker 7: «revisjonen kjøres og funn
      legges til» er analyse, ikke ferdigtilstand — derfor delt fase.)

## FASE 6B — Utbedring + release-porten

- [ ] Alle låste 6A-funn utbedret, verifisert per punkt.
- [ ] Min garderobe: eiers vedtak (sletting eller port) gjennomført.
- [ ] Sydvesten: manuell maske.
- [ ] **RELEASE-PORTEN** (Sol-blokker 6, siste DoD-punkt før lansering):
      - build, typecheck, lint, full testpakke + `verify:hjem` grønne på samme SHA
      - skjermregresjon i alle fire tematilstander (mørk/lys × auto/manuell)
      - 375×667, 390×844 og 430×932 med simulert safe-area
      - Dynamic Type, Reduce Motion, VoiceOver/fokusrekkefølge, trykkmål ≥ 44×44
      **FØRSTE lansering:** full kontroll — begge telefoner, begge temaer,
      mørkt rom ved 1–5 % lysstyrke for Hjem, scan og Påkledning.

      **SENERE lanseringer, risikobasert:**
      - automatisert release-port på samme SHA, hver gang
      - 5 min røyktest av pakket app på ÉN fysisk telefon, hver gang
      - to telefoner + mørkt rom KUN ved endringer i tema, globale tokens,
        dybde, safe-area/fold, scan, maskot, navigasjonsbevegelse, Påkledning
      - eldste støttede iPhone ved layout-, ytelses- eller WebView-endringer
      - ikke fullt nattlaboratorium for tekst-, data- eller motorendringer
