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
- **Prioritert bevisliste:** 10 punkter, avhengighetsstyrt (rivning Del D) — analytics
  først (port for alt kvantitativt), deretter beslutningsøyeblikkets anatomi (høyest
  designavkastning per studie), faglig blindtest, paywall-moment, seremoni- og maskot-
  tillitstester, utendørs lesbarhet, handoff-MVH, garderobedekning, frekvens/graduation.

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

## 3. Kilevalget (Claudes anbefaling som Creative Director)

**Anbefalt inngangskile: FØRSTE-SESONG-FORSKRIVNING** — komplett påkledningsstøtte for
førstegangsforeldre gjennom barnets første reelle eksponeringssesong, som tidsavgrenset
intensivprodukt med ærlig exit («når sesongen er over, kan dere dette»).

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

**Kill-switches (kilen forkastes/pivoteres hvis):** kandidat-andel ≥60 % (→ validering
overtar som inngang); bruksfall uke 1→4 >50 % uten værkorrelasjon (→ sesongenheten er
feil, revurder hele fangstmekanismen); faglig blindtest gir ett eneste «app grønn /
fagperson rød» (→ forskrivningsautoritet er uetisk, omform til veiledende område);
beslutningsøyeblikk per kvalifisert dag < 1 median (→ intensivproduktet mangler
intensitet).

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
