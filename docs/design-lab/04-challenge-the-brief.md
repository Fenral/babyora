# 04 — Challenge the Brief (Fase 3)

> Utført 2026-08-05 av Claude (CD/TL) med seks parallelle agenter (434k tokens):
> fire kile-advokater, én rivningsagent, én matrise-/risikomodellbygger.
> Fullrapporter i `appendix/fase3/`. Status: **TIL SOL-REVIEW (motpart)** —
> kileanbefalingen under er Claudes forslag, ikke et låst vedtak; eierport for
> retning er fase 8.

## 1. DoD-kvittering (masterprompt-krav)

- **≥20 utfordrede antakelser:** 28 leverte (A1–A28, `appendix/fase3/rivning.md` Del A) —
  alle nye vinkler, eksplisitt avgrenset mot Sols 20 fra fase 1. Spenner onboarding
  (null-input-alternativet, scope-gate-plassering), navigasjon (tab-chassis, router-fravær
  som deep-linking-sperre), anbefalingsmodell (delta vs. absolutt, usikkerhetsrepresentasjon,
  punkt vs. forløp), maskot (plassering ≠ eksistens, cream-body i vinterkontekst), seremoni
  (iscenesatt beregning av en øyeblikkelig motor), lys (dark-first mot eiers eget
  dagslys-rasjonale), hierarki (kritisk flatet med trivielt; forklaringene demotert),
  typografi (webfont-spørsmålet; tabular-tall mot egen anti-referanse), doktrine
  (håndhevingsapparat som fase 7-konservatisme) og premiummodell (paywall før første
  verifikasjonsøyeblikk; tre-plans forpliktelsesprising).
- **≥10 nye produktmuligheter:** 12 leverte (B1–B12): delta-anbefaling, widget/varsel som
  primærflate, verifier-inngang, handoff-kort, varighet i anbefalingen, etter-turen-
  mikrosjekk, garderobe-lite («har ikke → substitusjon»), sesongpass-innramming, sovende
  vognbarn-modus, grensevær-ærlighet, barnehage-pakkeliste, gyldighetsvindu på hvert svar.
- **≥5 fjerningskandidater:** 6 leverte (R1–R6): 3,2 s-seremonien → ærlig rask transisjon;
  Planlegg-fanen → kort+varsel; Juster-drillen (eller minimum: kontrakt-fiks — allerede
  gjennomført som Sol-P0-2, commit `7caf353`); maskotens bevegelsesapparat → én statisk
  positur; onboarding → 2 felt; tre prisplaner → én + sesongpass. Pluss ukontroversielt:
  294 MB urefererte bilder og døde avhengigheter.
- **Prioritert bevisliste (REVIDERT rekkefølge per Sols runde 3):** (1) beslutningsøyeblikk
  og eksisterende atferd, (2) risikogrense + faglig scenariokorpus, (3) spontan jobb-/
  inngangspreferanse (H2-routeren som instrument), (4) prototypetest mot nullmodell,
  (5) analytics på valgt instrument (infrastruktur, ikke brukerbevis), (6) verifikasjon
  og tillitsdannelse, (7) betalingsmoment og pris. **A20/A21 (sikkerhetshierarki på
  resultatflaten) er løftet foran seremoni, maskot og tema** — demoteres kontrolltegn,
  gyldighetsvindu, overstyring og risikoforklaring, testes en autoritær plaggliste, ikke
  trygg forskrivning. Lab-fritak fra Monter-doktrinen etableres FØR fase 7 (A24, støttet
  av Sol som P1).

## 2. Aktør×øyeblikk-matrisen og risikomodellen (Sols bindende r2-krav)

Matrisen (5 aktører × 7 øyeblikk, `appendix/fase3/matrise-risiko.md`) er brutalt ærlig:
**brukerbevis i 0 av 35 celler.** Repo-flate finnes i 6 (alle hos primærforelderen);
29 celler er blanke sider. Eneste celle med full produktdekning er A1×M2 (førstegangs ×
velge). Kolonnene validere/pakke/overføre og radene partner/besteforelder/episodisk er
strukturelt usynlige i dagens produkt. Konsekvens: **kilevalget må tas på hypotesekvalitet
og testbarhet — bevis finnes ikke ennå, og dagbokstudien må kode aktør×øyeblikk.**

Risikomodellen er skilt ut som sikkerhetslag uavhengig av JTBD (Sol-krav): søvn/TOG
(8 hard/soft blocks + TOG-tabell finnes; vogn-søvn ukablet; romtemp ikke input i
hovedflyt), prematuritet/korrigert alder (ingenting finnes — scope-gate i onboarding
foreslått, A3), sykdom/feber (ut-av-scope-deteksjon mangler), nyfødt-tidsgrenser (finnes),
bilstol (HB-9 finnes, død i praksis). Produktet skal eksplisitt IKKE hevde å kunne gi:
medisinske råd, råd for premature uten korrigering, råd under sykdom/feber.

## 3. Inngangsjobb-hypotesene (REVIDERT etter Sols runde 3-motpartreview)

> **Sols verdikt REVIDER (`appendix/fase3/sol-review-svar-fase3.md`) er innarbeidet:**
> kilevalget under er NEDGRADERT fra anbefaling til **H1** — Sol påviste at det var valgt
> på implementerbarhet, ikke problemstyrke («status quo-bias når brukerbevis finnes i
> 0 av 35 celler»). Briefens mål omskrives til: **finn sterkeste inngangsjobb OG
> distribusjonsform** — ikke «design første-sesong-forskrivning». Fase 4/5 undersøker
> installasjonsutløsere og alternativer FØR visuelle preferanser; fase 7 må produsere tre
> retninger som avviker i PRODUKTMODELL (forskrivning / verifier-router / delta-
> distribusjon), ikke tre estetiske varianter. Researchprototyper testes UTEN hard paywall
> (P0: paywallen forurenser ellers kiletesten), med lik merkevarekvalitet på tvers av
> modeller, og mot en NULLMODELL (værapp + ni-ords-regel + tekstmelding).

**H1 — Første-sesong-forskrivning** — komplett påkledningsstøtte for
førstegangsforeldre gjennom barnets første reelle eksponeringssesong, som tidsavgrenset
intensivprodukt med ærlig exit («når sesongen er over, kan dere dette»).

**H2 — Beslutningsrouteren (Sols motmodell, likeverdig):** første flate spør etter
situasjonen, ikke barnets navn: «Jeg vet ikke hva barnet trenger» / «Jeg har valgt et
antrekk» / «Vi skal være ute en stund» / «Noen andre skal passe barnet». Samme motor og
sikkerhetslag bak alle innganger. En reell produktmodell som gir umiddelbar verdi OG
måler spontan jobbpreferanse uten å tvinge forskrivning — høyest læringsverdi, lavest
irreversibel feilrisiko, mot kostnad av synlig kompleksitet.

**H3 — Delta-tjenesten (Sols motmodell, likeverdig):** aldri full plaggliste — kun hva
som har endret seg og hvilken handling det utløser («To grader kaldere enn i går — legg
til mellomlaget» / «Samme antrekk holder»), levert primært som varsel/widget/hjemkort.
Utfordrer daglig beregning, installasjonsseremonien, Planlegg-fanen og selve
app-installasjonen som premiss.

**Verifier-first** består som egen inngang i H2 og som fase 7-retning 2, med Sols
skjerpede porter (p75 ≤8 s, input-frafall ≤15 %).

**Begrunnelse (med merking):**
1. **Installasjonsøyeblikket eies av egen usikkerhet.** Selv handoff-advokaten innrømmer
   at første nedlasting trolig drives av forskrivningsbehov — handoff bærer retention,
   ikke akkvisisjon (appendix: kile-handoff, svakhet 1). Validering forutsetter et
   kandidat-antrekk vi ikke vet at flertallet har (premiss 3, umålt). Turprotokoll er et
   dobbelt innsideargument (Sol-observasjon + motorkapabilitet, null brukerfunn). (b/c)
2. **Tidsavgrensningen løser produktets ærligste selvmotsigelse.** Graduation er dødelig
   for evig abonnement men *designet utfall* for et sesongprodukt — og ærlig prising er
   tillitsbærende for et helsenært produkt. (b — premiss 7-eksperimentet avgjør)
3. **Kortest vei til falsifiserbar prototype.** Null avstand mellom bygget flate og
   kile betyr at fase 9-prototypen tester HYPOTESEN, ikke byggekapasiteten. Jeg flagger
   selv statusquo-bias-risikoen her (advokatens egen svakhet 1): dette er et
   testbarhetsargument, IKKE brukerbevis. (a for avstanden, c for vektingen)
4. **Kilen samler riktig data ved fall.** Faller den på kandidat-andelen, er dataene
   nøyaktig dem valideringskilen trenger for å overta. (c)

**Eksplisitt IKKE primærjobb (Sols krav):**
- **Koordinering/handoff** — nedprioritert til testinstrument: handoff-kortet (B4, native
  share, null arkitektur) bygges som falsifiseringsinstrument i prototypen, men «Familie»
  markedsføres ikke som deling før 20–25 %-terskelen per kvalifisert handoff er målt.
- **Full validering-inversjon** — venter på kandidat-andel-data; delta-anbefalingen (B1)
  og etter-turen-mikrosjekken (B6) bygges inn som *modus* i forskrivningen, ikke som egen
  produktform.
- **Turprotokoll som produktform** — foldes ned til to konkrete forbedringer (varighet
  som input B5, gyldighetsvindu B12) i stedet for egen protokollflate.
- **Barnehage** — kun pakkejobben (B11), aldri instruksjon av personale.

**Kill-switches (revidert per Sols runde 3 — årsaksisolering, ikke tekniskheter):**
- *Kandidatandel* ≥60 % er kun et signal; validering overtar først hvis brukerne også
  spontant velger valideringsinngangen (H2-routeren måler dette) OG den gir minst like
  god forståelse/tillit med lavere beslutningstid.
- *Frafall* måles per kvalifisert beslutningsmulighet med eksplisitt skille mellom
  læring, stabilt vær, paywall og UX-friksjon — ikke rå uke-retention.
- *Fagkonflikt:* ett bekreftet sikkerhetskritisk «app grønn / fagperson rød» stanser
  forskrivning umiddelbart; mindre uenighet utløser adjudikasjon, ikke modellskifte.
- *Verdiport* erstatter intensitetsterskelen: antall usikre øyeblikk × konsekvens ×
  opplevd lettelse × betalingsvilje — frekvens alene er ikke verdi.
- *Baseline:* kilen drepes hvis den ikke slår ni-ords-regelen målbart på beslutningstid,
  forståelse eller korrekt håndtering (nullmodellen er obligatorisk sammenligning).
- *Garderobe:* drepes/omformes under 90 % kategoriekvivalens/substitusjon.

## 4. Konsekvensregel for låste vedtak

Ingen av dagens låste vedtak (3,2 s-seremoni, maskotstil, dark-first, tab-struktur,
hard paywall-plassering, tre prisplaner) hviler på gjennomført bevis — premissloggen
viser ÅPEN/SVEKKET/OMSTRIDT på alle tilhørende premisser. De er legitime eiervedtak, men
re-prøves ved fase 8-porten mot bevislisten i §1; det som da ikke er bevist, merkes
akseptert risiko med motkandidatplikt (samme mekanisme som premiss 6).

## 5. Work-review

Sendt til Sol som MOTPART (fase 3-mandat: angrip problemdefinisjonen, krev alternativ
produktmodell hvis premissene er svake). Verdikt og respons: `11-independent-review.md`
runde 3.
