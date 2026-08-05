# 03 — User Reality (Fase 2)

> **REVIDERT 2026-08-05 etter Sols runde 2-review (verdikt REVIDER, `appendix/fase2/sol-review-svar-fase2.md`):**
> (1) «Overopphetingstopp 8–9 mnd» og «~40 % ull-intoleranse» er TRUKKET fra faktalaget —
> begge står nå som omstridte hypoteser i premissloggen med kildekrav før gjenbruk.
> (2) S1–S4 er omklassifisert fra «segmentmodell» til **foreløpig kohorthypotese** — den
> blander fysiologi-, rolle-, kontekst- og institusjonsakser og er fire kuraterte historier,
> ikke gjensidig utelukkende segmenter. (3) Livsløpssyntesen er nedgradert til
> **ekspansjonshypotese**: jobbene er mer sannsynlig aktør- og situasjonsavhengige enn
> alderssekvensielle, og syntesen får ikke erstatte fase 3-kravet om å velge ÉN inngangskile.
> (4) Falsifiseringsterskler skjerpet (se §4). Original tekst under er beholdt der den
> fortsatt gjelder; alt som leser som fakta skal krysswhiskes mot premissloggen.

> Utført 2026-08-05 av Claude (CD/TL) med fire parallelle hypotese-agenter (288k tokens).
> Fullanalyser i `appendix/fase2/`. **Dette er hypotesearbeid, ikke brukerresearch** —
> analytics er død og null brukerkontakt er gjort. Hver påstand i appendiksene er merket
> (a) belagt, (b) testbar antakelse eller (c) spekulasjon. Premissene med felt for
> bevis/test/eier ligger i `premisslogg.md`.

## 1. Tre konkurrerende jobb-hypoteser (Sols krav)

| Hypotese | Jobben i én setning | Sterkeste argument | Eksistensiell risiko |
| --- | --- | --- | --- |
| **Forskrivning** (dagens produkt) | «Fortell meg nøyaktig hva barnet skal ha på, så jeg slipper å tvile» | Reell fysiologisk vanskelighet 0–12 mnd; fagkildene spriker, så lekfolks usikkerhet er rasjonell | Konkurrenten er en ni-ords regel («ett lag mer enn deg selv»); behovet er **pulser** (sesong-/faseskifter), ikke daglig strøm — appen har selv kodet det inn via fingerprint-cachen |
| **Validering** («Verifiereren») | «Bekreft at det jeg selv valgte er trygt — og si fra hvis ikke» | Merkevarens egen tone lover allerede dette («parent knows their child best»); løser garderobeproblemet strukturelt; billigst å teste (inngangsinversjon over samme motor) | Grønt lys er en *sertifisering* — falsk trygghet skjerper kravet til fagsignatur, ikke reduserer det; inputfriksjon ved døren (>15 s dreper modellen) |
| **Koordinering** («Omsorgshandoff») | «Sørg for at alle som passer barnet gjør samme vurdering — uten at jeg må instruere» | Eneste hypotese som overlever «graduation» (hver ny omsorgsperson nullstiller behovet); norsk pappaperm-bytte er en strukturelt garantert kompetanseoverføring midt i overopphetings-peaken | Konkurrenten er en fire-sekunders tekstmelding; arkitekturen er delings-udyktig i dag; barnehage-scenariet er sannsynligvis en annen jobb (pakking) og må avgrenses bort |

**Syntese-hypotesen — NEDGRADERT til ekspansjonshypotese etter runde 2:** vi foreslo at
jobbene er faser av samme livsløp (forskrivning → validering → koordinering). Sol felte
sekvensen: jobbene kan eksistere samme dag i samme husholdning (erfaren mor validerer ved
første kuldeperiode; besteforelder trenger forskrivning ved 18 mnd; koordinering starter ved
første omsorgsbytte) — de er **aktør- og situasjonsavhengige**, ikke alderssekvensielle.
Konsekvens for fase 3: syntesen kan beholdes som ekspansjonshypotese, men **fase 3 MÅ velge
én inngangskile** (første-sesong-forskrivning / kandidatvalidering ved døren / tur- og
overgangsplanlegging / omsorgshandoff) og eksplisitt si hva som ikke er primærjobben.
Aktør×øyeblikk-kartet (planlegge/velge/validere/pakke/overføre/justere/lære) erstatter
sekvensantakelsen som arbeidsmodell.

## 2. Foreløpig kohorthypotese (IKKE segmentmodell — omklassifisert etter runde 2)

Sols tredeling (ikke-mobil/overgang/mobil) ble prøvd og forkastet med begrunnelse; vår
firedeling under er selv felt av Sol for å blande akser (fysiologi + foreldrerolle +
kontekst + institusjon). Den beholdes kun som **kohorthypotese for rekruttering** til
studiene. Sols alternative modell — flerdimensjonal tilstandsmodell (barn × eksponering ×
beslutningstaker × husholdning, med alder som én variabel) + aktør×øyeblikk-kart
(planlegge/velge/validere/pakke/overføre/justere/lære) — tas inn som arbeidsmodell i fase 3.
En separat **risikomodell** (søvn, prematuritet, korrigert alder, sykdom-ut-av-scope) skal
holdes adskilt fra JTBD-arbeidet.

| Segment | Alder | Driver (belagt i repo-research) | Beslutningsproblem |
| --- | --- | --- | --- |
| S1 Nyfødt | 0–3 mnd | Umoden termoregulering, kulderisiko, tidsgrenser | Sikkerhetsangst: «Er dette *trygt*?» |
| S2 Passiv passasjer | 3–8 mnd | Modnes; barnet melder ikke fra; nakketest eneste feedback | Kalibrering: «Er dette *riktig*?» |
| S3 Peakbarn | 8–12 mnd | ~~Overopphetingstopp 8–9 mnd~~ **OMSTRIDT** (repoets kilde PMC12386404 vs. Sols SUDI-innvending: sårbarhet peker mot 2–4 mnd, og søvnevidens ≠ utekledning) — avgjøres i faglig blindtest, brukes ikke som grense før da | Motintuitivt-hypotesen står, men uten tallfestet peak |
| S4 Mobil smårolling | 12–24 mnd | Voksen-lik termoregulering; barnehagestart ~12 mnd | Logistikk/koordinering — behovet skifter karakter |

**Ubehagelig konsekvens (moderert i runde 2):** termoreguleringsverdien er størst 0–12 mnd
og behovet skifter karakter mot logistikk/koordinering når barnehagen overtar. Sols P3 står:
«to produkter» er for tidlig — det kan like gjerne være to verdiforslag, fire situasjoner
eller ett produkt med progressiv modus; produktgrensen følger ikke automatisk aldersgrensen.
«Første vinter» beholdes som **rekrutterings- og personaliseringshypotese** (kohort =
fødselsmåned × kalender, som appen kjenner men aldri bruker) — men den skal testes mot tre
motkandidater (første kuldeperiode, første omsorgsbytte, første søvn-/aktivitetsovergang),
ikke krones på forhånd.

## 3. Usynlige segmenter og ukablet kontekst

Appen er i dag presist bygget for: *primær, førstegangs, norskspråklig forelder i permisjon,
barn 0–12 mnd, én enhet, forskrivende liste nå, betaler etter én gratis anbefaling.* Usynlige:
all sekundæromsorg (strukturelt umulig — CareCircle-previewen med fiktive «Deler»-statuser
er dog dev-only, gated på `import.meta.env.DEV` i InnstillingerScreen.tsx:1932 OG eksplisitt
merket «Forhåndsvisning … Ikke aktiv ennå» — Sols P0-3-krav var dermed allerede oppfylt,
verifisert 2026-08-05), barn som unngår ull (~~40 %~~ prevalenstall TRUKKET etter runde 2 —
hudreaksjon/sensorisk ubehag/foreldrepraksis/allergi er fire ulike fenomener som må måles
separat; behovet modelleres som **toleranse-/preferansevalg**, ikke diagnose; intet
profilflagg finnes, ull-first-default består), sovende vognbarn (`vognMode='sleeping'` bygget,
ukablet — trolig hverdagens vanligste S1–S2-situasjon), bil-familien (HB-9 bilstol-regelen
bygget, usynlig), erfarne som vil validere, 12–24-hverdagen, ikke-norskspråklige, Dynamic
Type-brukere. Mønsteret fra fase 1 igjen: **motoren kjenner kontekstene, UI-et gjør ikke.**

## 4. Kritiske brukerantakelser (DoD-krav: ≥5 testbare — her er de ti viktigste)

Fullstendig liste med terskler i appendiksene; felt for bevis/eier/status i `premisslogg.md`.
**Terskler skjerpet etter Sols runde 2:** frekvens måles som *beslutningsøyeblikk per
kvalifisert dag* (definert uavhengig av app-åpning), ikke åpninger; autoritetsaksept
erstattes av **kalibreringstest** (følg korrekte advarsler OG avvis plantede tvilsomme råd —
blind lydighet er ikke suksess); verifier-input p75 ≤ **8 sekunder** målt med barn på armen
(15 var for snilt mot konkurrentene null-input og tekstmelding); garderobekrav hevet til
**≥90 %** kategoriekvivalens eller umiddelbar substitusjon; MVH-deling måles per
**kvalifisert handoff** (mål: 20–25 %), ikke per uke; faglig blindtest må rapportere
scenarioantall, konfidens og uenighetshåndtering — ikke bare null røde; «første vinter»
testes mot tre motkandidater (første kuldeperiode, første omsorgsbytte, første
søvn-/aktivitetsovergang); ingen kodebasert bruksmåling omtales som brukerbevis før
analytics er aktiv.

1. **Frekvens:** «3–8 åpninger/dag» (PRODUCT.md) er aldri målt. Testbar: median ≥2 åpninger
   per aktiv dag når analytics er på; falsifisert ved <1 — da faller hele abonnementslogikken.
2. **Usikkerhets-prevalens:** ≥50 % av førstegangsforeldre <6 mnd rapporterer reell
   usikkerhet ≥3 av 7 dager (dagbokstudie). <30 % → friksjonsproblem, ikke usikkerhetsproblem.
3. **Kandidat-antrekk-andel:** ≥60 % av beslutningsøyeblikk starter MED kandidat →
   validering er jobben; <40 % → forskrivning. Avgjør produktform.
4. **Autoritetsaksept:** ved konflikt app vs. magefølelse/bestemor følger ≥50 % appen;
   ellers er produktet de facto validering uansett UI.
5. **Handoff-frekvens:** median ≥2 øyeblikk/uke der en annen kler barnet og forelderen vil
   påvirke; MVH-test (delknapp, native share): ≥5 % av aktive deler ukentlig.
6. **Graduation-hastighet:** bruksfall uke 1→4 <30 % kontrollert for vær; >50 % uten
   værkorrelasjon → læring spiser behovet raskere enn abonnementet fanger verdi.
7. **Garderobedekning:** ≥70 % av anbefalinger gjennomførbare med plagg husholdningen eier.
8. **Faglig blindtest:** motor vs. ≥2 uavhengige fagpersoner på definert scenariosett;
   nulltoleranse for «app grønn / fagperson rød».
9. **Segmentgrensene bærer behovsskift:** toppoppgaver endres over 8–12 mnd-grensen og
   0–3 skiller seg fra 3–8 i sikkerhetsangst.
10. **Vinterhansker-premisset:** kapasitive skjermer virker ikke med ullhansker — enten er
    persona-prosaen falsk eller kravet må omformuleres til «store mål + null presisjonsgester».

**Merket UVERIFISERT (kan ikke avgjøres av Claude):** alle antakelser som krever dagbokstudie,
kontekstintervjuer, handoff-felttest eller fagpanel er reelle brukerstudier — eiervendte
oppgaver. Design Lab kan forberede protokoller og prototyper, ikke erstatte dataene.

## 5. Emosjonelle behov og tilgjengelighet (sammendrag)

Frykt — ikke bekvemmelighet — er trolig drivstoffet i S1–S2 (asymmetrisk nedside, SIDS-
koblet overoppheting); sosial dom («ingen skal kunne si jeg kledde barnet feil») er en
undervurdert mekanisme som gjør verdiktet *siterbart* viktigere enn følt. Tilgjengelighet:
reduced-motion er godt dekket (20+ filer); kognitiv last hos søvndepriverte S1-brukere
er den svakeste dimensjonen (3,2 s-seremonien er additiv kost for appens mest reduserte
bruker); Dynamic Type og skjermleser i scan-/resultatflyt er uverifisert; ull-intoleranse
er reelt et tilgjengelighetsbehov for barnet — udekket.

## 6. Work-review

Red-team-review av brukerbildet sendt til Sol (se `11-independent-review.md` runde 2 når
den foreligger). Fase 2-DoD lukkes først når Sol har vurdert blindsonene og analysen er
oppdatert eller avvik begrunnet.
