# 11 — Independent Review-logg

> Én seksjon per review-runde. Fullt svar fra Work arkiveres i `appendix/`.

## Runde 1 — Fase 1 problemformulerings-review (2026-08-05)

**Reviewer:** ChatGPT Work, GPT-5.6 Sol / Ekstra høy.
**Tråd:** `https://chatgpt.com/c/6a727956-c348-83ed-bc61-e895026d8fe7` (ny tråd — sendingen
med 6 vedlegg opprettet ny samtale i stedet for å fortsette den festede; noteres som
driver-egenskap). Fullt svar: `appendix/fase1/sol-review-svar.md` (13 096 tegn).

**Verdikt: REVIDER.** Tese: sterk gjennomføringsevne, ubevist grunnpremiss. Problemet er
låst for tidlig til «vær inn → plaggliste ut»; den egentlige jobben kan være usikkerhet,
bekreftelse, læring eller koordinering. Fase 2 kan starte; fase 3 må ha mandat til å
forkaste dagens produktform. 6 P0, 4 P1, 7 P2/P3, 14 antakelser, 9 blindsoner,
3 alternative retninger (Verifiereren / Turprotokollen / Omsorgshandoff), 20 utfordrede
premisser.

### Claudes respons per P0/P1 (masterprompt-krav: implementer eller begrunnet avvis)

| Funn | Respons | Status |
| --- | --- | --- |
| P0-1 Sentral sannhet (treffsikkerhet) ikke validert | **AKSEPTERT.** Blind fagsammenligning av motorens råd + premisslogg tas inn som fase 2/3-krav; ingen designretning låses på «bedre råd»-premisset før det er bevist eller reformulert | Åpen → fase 2/3 |
| P0-2 Føles-som-inkonsistens Hjem vs Juster | **IMPLEMENTERT** (commit `7caf353`, etter at skjermløypa landet): Juster avleder nå føles-som med samme formel som Hjem (`met-no/feels-like`), låst med kildetest + ikke-vakuøsitetsbevis (−5 °C/8 m/s gir ulikt bånd rå vs. avledet) | ✅ Lukket |
| P0-3 Hard paywall før tillit kan opptjenes | **AKSEPTERT SOM DOKUMENTERT RISIKO.** Modellen er et eksplisitt eiervedtak (2026-07-31) og hører til eierporten i fase 6. Sols krav — «opplevelses-test som lar brukeren evaluere kvalitet før betaling» — tas inn som obligatorisk kandidat i fase 6-modellene, med dette funnet som motargument mot status quo | Til eierport fase 6 |
| P0-4 Paywall lover deling som ikke finnes | **IMPLEMENTERT NÅ.** «Del med alle som passer barnet» / «…alle som passer barnet ditt» erstattet med sanne løfter («Egen profil for hvert av barna dine») i `paywall-copy.ts`, `InnstillingerScreen.tsx` + tester oppdatert. 73/73 relevante tester + full build grønn | ✅ Lukket |
| P0-5 Analytics død / ingen læring | **AKSEPTERT.** To deler: (a) miljønøkler (`VITE_POSTHOG_KEY`) må settes i Codemagic — krever eier (PostHog-konto); (b) manglende events + `trial_started`-skjevheten fikses i kode. Forutsetning for fase 6-beslutninger | Åpen → eier + kodepakke |
| P0-6 GDPR-sletting ufullstendig | **IMPLEMENTERT NÅ.** Prefikslisten utvidet med `babyora.` (zustand), `metno:` (koordinater!), `nominatim:`, `native-settings:`, `ph_` + deterministisk test som seeder alle nøkkelfamilier og krever full eksport/sletting med fremmednøkler bevart | ✅ Lukket |
| P1-1 Personaliseringsteater | **AKSEPTERT.** Enten kobles kalibreringsloopen (den er ferdigbygget) eller så tones språket ned. Avgjøres i fase 3/7 sammen med JTBD-svaret | Åpen → fase 3 |
| P1-2 0–24 mnd som ett segment | **AKSEPTERT.** Fase 2 segmenterer (ikke-mobil / overgang / mobil) og skiller førstegangs-/erfarne foreldre | Åpen → fase 2 |
| P1-3 Engangs-orakel uten læringssløyfe | **AKSEPTERT.** Samme rot som P1-1; «ble barnet varmt/kaldt?»-loop inn i REMOVE/KEEP/TEST-listen | Åpen → fase 3 |
| P1-4 Begrens parallell skjermpolering | **DELVIS AKSEPTERT — LØFTES TIL EIER.** Ikke Design Labs myndighet alene: skjermløypa kjører på eget eiermandat. Sols argument (høy visuell ferdigstillelse gjør det psykologisk dyrere å forkaste feil produktform) formidles eier i statusrapporten | Til eier |

### Krav Sol stiller for neste review (utvalg, fullstendig i appendiks)

Revidert problemformulering uten løsningsord; ≥3 konkurrerende JTBD-hypoteser
(forskrivning/validering/koordinering); segmenterte kontekstintervjuer + 7-dagers
dagbokstudie (**reelle brukerstudier — kan ikke utføres av Claude; blir eiervendte
oppgaver eller merkes uverifisert per fase 2-DoD**); blind fagsammenligning av motoren;
normalisert værkontrakt; analytics ende-til-ende; claims-matrise (løfte→funksjon→test→bevis);
REMOVE/KEEP/TEST-liste for Planlegg, Familie, maskot, scan, navn-onboarding og prisplaner;
premisslogg med eier/frist/status. Ingen fase 3-godkjenning før hvert P0 er lukket eller
akseptert som dokumentert risiko.

## Runde 4 — Fase 4 trendkritikk (2026-08-05)

**Verdikt: REVIDER.** Fullt svar: `appendix/fase4/sol-review-svar-fase4.md`. Tese: sterkt
mulighetskart, ikke beslutningsgrunnlag — fire ulike beviskategorier blandet under
«trender»; Nørs, værtrial, adaptiv lys og H3-systemflater trukket lenger enn bevisene.

### Claudes respons per P0/P1

| Funn | Respons | Status |
| --- | --- | --- |
| P0 Nørs overtolket (leverandørtall; betaling diskvalifiserer ikke kanalen — sikkerhetsminimum bak betaling gjør) | **AKSEPTERT.** Korrigert i 05-revisjonsblokken; tre kanalmodeller (rent forbrukerprodukt / gratis offentlig sikkerhetskjerne / kommunalt finansiert nytteflate) bygges i fase 6-underlaget | ✅ Revidert |
| P0 «Sikkerhetslag gratis» mangler operasjonell grense | **AKSEPTERT — tyngste enkeltfunn.** Entitlement-matrise (gratis/evaluering/betalt/utløpt/offline/utdatert) kreves; erkjent at grensen kan tvinge frem ny forretningsmodell. → fase 6-portmateriale til eier | → fase 6 |
| P1 Værskifte-trial ≠ StoreKit-trial | **AKSEPTERT.** Reformulert til gratis evalueringsperiode før kjøp («to relevante situasjoner, senest 14 dager») | ✅ Revidert |
| P1 Adaptiv lys-default forkastes | **AKSEPTERT.** Erstattet med testbar eksplisitt utendørsmodus innenfor systemtema; kreativ lysrisiko flyttes til semantisk lag | ✅ Revidert |
| P1 H3 er kanalpakke, ikke produktmodell | **AKSEPTERT.** Stale-safe-kontrakt + plattformparitet + selvstendig-verdi-vilkår lagt på H3; nedgraderes til distribusjonslag hvis den ikke består | ✅ Vilkår satt |
| P1 «Ingen prisvinnere bruker seremoni» er trendretorikk | **AKSEPTERT.** Skillet presisert: falskt arbeid avvises, sannferdig «pust» med progressiv begrunnelse beholdes som særpreg-kandidat | ✅ Revidert |

P2/P3 innarbeidet: sesongpass testes mot engangskjøp/abonnement/gratis kjerne (ikke bare
mot tre planer); 65 %-ASO-tallet nedgradert til billig opsjon; M3 kun som dokumentasjon;
MET/Yr-anatomi reservert reelle avvik (alarm-budsjettet gjelder også anatomien); App Clip
gjenåpnet som senere motkandidat for mottakerfriksjon; maskot-fravær (ikke bare taushet)
på sikkerhetsflater. 12 nye antakelser inn i premissloggens univers via appendiks.

### DoD-kvittering fase 4

- [x] Sporbar trendrapport med kilder (41 oppføringer, omklassifisering pålagt og planlagt)
- [x] Eksplisitt Babyora-beslutning per trend
- [x] Sols dokumenterte kritikk av de fem viktigste trendvalgene foreligger og er besvart

## Runde 3 — Fase 3 motpart-review av brief-utfordring og kilevalg (2026-08-05)

**Verdikt: REVIDER.** Fullt svar: `appendix/fase3/sol-review-svar-fase3.md`. Tese: briefen
er reelt utfordret, men kilevalget er «eksisterende Babyora omformulert som tidsavgrenset
produkt» — implementerbarhet forkledd som strategi.

### Claudes respons per P0/P1

| Funn | Respons | Status |
| --- | --- | --- |
| P0 Kilen valgt på implementerbarhet, ikke problemstyrke | **AKSEPTERT.** Jeg flagget selv statusquo-risikoen men lot den likevel bære anbefalingen — Sols diagnose holder. Kilen nedgradert til H1; Beslutningsrouteren (H2) og Delta-tjenesten (H3) tatt inn som likeverdige produktmodeller; briefmålet omskrevet til «finn sterkeste inngangsjobb og distribusjonsform» | ✅ Revidert |
| P0 Hard paywall forurenser kiletesten | **AKSEPTERT.** Researchprototyper (fase 4/5-testing) kjøres uten hard paywall; produktrisiko og research holdes adskilt. Berører IKKE eiervedtaket om paywall i produksjonsappen (fase 6-port) | ✅ Bindende for research |
| P0 Sikkerhetskritisk info underordnet (A20/A21) | **AKSEPTERT.** Løftet foran seremoni/maskot/tema i bevislisten; kontrolltegn/gyldighetsvindu/overstyring/risikoforklaring er kjerneleveranse i alle tre produktmodeller | ✅ Revidert |
| P0 «Første sesong» blander marked, trigger og produktform | **AKSEPTERT.** Kohorten beholdes som rekrutteringsramme; produktform avgjøres av fase 4/5-funn + H2-routerens preferansedata | ✅ Revidert |
| P1 Installasjonsargumentet er utestet kanalpåstand | **AKSEPTERT.** Handoff-akkvisisjon (mottaker installerer) og før-problemet-kanaler (graviditet, helsestasjon, vinterdress-kjøp) inn i fase 4-research; router-fravær er P2-arkitekturgjeld, ikke jobbevis | → fase 4 |
| P1 Livsløpsretorikk lever videre i kilevalget | **AKSEPTERT.** H2-routeren måler jobbpreferanse spontant i stedet for å anta sekvens | ✅ Revidert |
| P1 Exit-løfte kolliderer med årsplan (A27 strategisk) | **AKSEPTERT.** Prisarkitektur løftes til strategisk fase 6-spørsmål; testes etter at brukeren har observert minst ett reelt utfall | → fase 6 |
| P1 Lab-fritak fra Monter (A24) | **AKSEPTERT.** Etableres som teknisk pakke før fase 7 | → før fase 7 |
| P1 Kill-switchene isolerer ikke årsak | **AKSEPTERT.** Alle seks revidert per Sols spesifikasjon (signal+spontanvalg, kvalifisert beslutningsmulighet, adjudikasjon, verdiport, nullmodell-baseline, 90 %-garderobe) | ✅ Revidert |

P2/P3: R1/R3 støttet; R2 (Planlegg) og R6 (prisarkitektur) omgjort fra forhåndsbeslutning
til fase 7-retning/fase 6-test; R5 omformulert til progressiv innhenting; A18 nedprioritert
til verifiserbar presentasjonsbeslutning; A7 nedgradert til P2-arkitekturgjeld. Sols
blindsonar (nullmodell, designfordel til polert forskrivning i prototypetester,
akkvisisjon før problemet, verdi ≠ frekvens, etter-tur-bias) er innarbeidet i bevislisten.

### DoD-kvittering fase 3

- [x] ≥20 utfordrede antakelser (28), ≥10 muligheter (12), ≥5 fjerningskandidater (6)
- [x] Prioritert bevisliste (revidert til Sols rekkefølge)
- [x] Motparten har krevd og fått alternative produktmodeller — to av Sols tre motmodeller er opphøyd til likeverdige hypoteser (H2/H3)

## Runde 2 — Fase 2 red-team av brukerbildet (2026-08-05)

**Verdikt: REVIDER.** Fullt svar: `appendix/fase2/sol-review-svar-fase2.md`. Tese: fase 2 er
vesentlig bedre enn fase 1, men brukerbildet er «fortsatt for narrativt» — kjeden alder →
fysiologisk fase → JTBD → produktform er ubevist, og segmentene blander akser.

### Claudes respons per P0/P1

| Funn | Respons | Status |
| --- | --- | --- |
| P0-1 «Overopphetingstopp 8–9 mnd» kan ikke være medisinsk segmentgrense | **AKSEPTERT.** Trukket fra faktalaget i `03`; står som OMSTRIDT i premisslogg (repoets kilde PMC12386404 vs. Sols SUDI-innvending) — avgjøres i faglig blindtest, brukes ikke som grense før da | ✅ Revidert |
| P0-2 «~40 % ull-intoleranse» må trekkes som prevalenstall | **AKSEPTERT.** Trukket; behovet remodellert som toleranse-/preferansevalg (fire fenomener måles separat). Profilflagg-idéen består uten tallet | ✅ Revidert |
| P0-3 Fiktive CareCircle-statuser skal fjernes/merkes NÅ | **ALLEREDE OPPFYLT — BEGRUNNET AVVIK FRA «FJERN».** Verifisert 2026-08-05: komponenten er dobbelt sikret — `import.meta.env.DEV`-gate (aldri i produksjon) OG eksplisitt caption «Forhåndsvisning — kommer med familiedeling. Ikke aktiv ennå» (InnstillingerScreen.tsx:1930–1949). Sols eget krav var «fjernes ELLER tydelig merkes» — merkingen fantes | ✅ Lukket m/bevis |
| P1 Segmentmodellen blander akser | **AKSEPTERT.** Omklassifisert til foreløpig kohorthypotese; Sols tilstandsmodell + aktør×øyeblikk-kart tas inn som fase 3-arbeidsmodell; separat risikomodell (prematuritet/korrigert alder/sykdom) opprettes | ✅ Revidert |
| P1 Prematuritet/korrigert alder mangler | **AKSEPTERT.** Inn i risikomodellen + rekrutteringskravene | → fase 3 |
| P1 Pappaperm ikke strukturelt garantert ved 8–9 mnd | **AKSEPTERT.** «Strukturelt garantert» strøket; NAV-variasjonen anerkjent; scenariet består som hypotese med intervjukrav | ✅ Revidert |
| P1 Livsløpssyntesen smugler sekvens | **AKSEPTERT.** Nedgradert til ekspansjonshypotese; fase 3 forpliktes til å velge én inngangskile | ✅ Revidert |
| P1 Metodespråket overselger («strukturelt garantert», «vanligste», «mest differensierende») | **AKSEPTERT.** Formuleringene strøket/moderert i `03`; regelen «motor-tilstedeværelse ≠ brukerbevis» føres videre | ✅ Revidert |
| P1 Terskler måler produktbruk, ikke problemverdi | **AKSEPTERT.** Alle terskler skjerpet (se `03` §4): beslutningsøyeblikk per kvalifisert dag, kalibreringstest i stedet for lydighetsprosent, p75 ≤8 s, ≥90 % garderobe, MVH per kvalifisert handoff 20–25 %, blindtest med konfidensrapportering | ✅ Revidert |

P2/P3 (første vinter må konkurrere, fingerprint ≠ brukerbevis, barnehage-jobben er pakking,
share-terskel, valideringens inputfriksjon, ull som preferanse, hanske-premisset snudd,
«to produkter» for tidlig) er alle innarbeidet i `03` eller premissloggen. Sols blindsone-
liste (familiestrukturer, sosioøkonomi, klimakompetanse uten proxy-antakelser, tvillinger,
sykdom-ut-av-scope, etter-turen-øyeblikket, substitusjon, overgangsreisen, emosjonell
friksjon utover usikkerhet) er lagt til rekrutterings-/protokollkravene for studiene.

### DoD-kvittering fase 2

- [x] Tydelige målgrupper og toppoppgaver (som kohort-/arbeidshypoteser, ærlig merket)
- [x] ≥5 kritiske brukerantakelser testbare eller merket uverifisert (10, med skjerpede terskler)
- [x] Work har vurdert blindsoner; Claude har oppdatert analysen eller begrunnet avvik (tabellen over — ett begrunnet avvik: P0-3 var allerede oppfylt)

### DoD-kvittering fase 1

- [x] Alle viktige flyter og begrensninger dokumentert (`02` + appendiks)
- [x] Screenshots dekker onboarding, hjem, anbefaling/resultat, premiumflyt (+ plan/familie)
- [x] Work har levert separat liste med utfordrede premisser (20 stk.)
- [x] Claude har svart på eller logget hvert vesentlige review-funn (tabellen over)
