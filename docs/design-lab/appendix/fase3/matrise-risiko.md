# Fase 3 — Challenge the Brief: Aktør×øyeblikk-matrisen + separat risikomodell

> Utarbeidet 2026-08-05. Kilder: `docs/design-lab/02-current-product-audit.md`, `03-user-reality.md` (revidert), `premisslogg.md`, `appendix/fase2/sol-review-svar-fase2.md` (bindende krav), `PRODUCT.md`, samt direkte kodeverifikasjon med fil:linje. Merking: **(a)** belagt (kode/dokument verifisert), **(b)** testbar antakelse, **(c)** spekulasjon. Regel som gjelder hele dokumentet: **motor-tilstedeværelse er ikke brukerbevis, og ingen kodebasert bruksmåling er brukerbevis før analytics er aktiv** — analytics er i dag død i praksis (a, audit funn 1).

---

## Leveranse 1 — Aktør×øyeblikk-matrisen

### 1.1 Definisjoner

**Aktører** (fra Sols krav + rekrutteringslisten):
- **A1** Primærforelder, førstegangs
- **A2** Primærforelder, erfaren (barn nr. 2+, eller høy klimakompetanse)
- **A3** Partner/medforelder (inkl. pappaperm-scenario)
- **A4** Besteforelder
- **A5** Annen episodisk omsorg (barnevakt, avlastning, delt bosted-andre-hjem, «forelder som pakker til barnehage» som grensesnitt)

**Øyeblikk** (Sols syv): **M1** planlegge · **M2** velge · **M3** validere · **M4** pakke · **M5** overføre · **M6** justere underveis · **M7** lære etterpå.

**Beviskoder per celle:** `R` = repo-flate eller motorfunksjon finnes (a — men dette er *produktbevis*, aldri brukerbevis) · `F` = faglitteratur belegger *sikkerhetsinnholdet* i øyeblikket (a for kildenes eksistens — men sier ingenting om aktørens atferd eller behov) · `S` = strukturelt samfunnsbelegg for at øyeblikket finnes (f.eks. NAV-fedrekvote — svekket av Sol r2) · `Ø` = ingen bevis. **Brukerbevis-kolonnen er tom i alle 35 celler** — det finnes per i dag null brukerdata (a).

### 1.2 Matrisen

| | M1 Planlegge | M2 Velge | M3 Validere | M4 Pakke | M5 Overføre | M6 Justere underveis | M7 Lære etterpå |
|---|---|---|---|---|---|---|---|
| **A1 Førstegangs** | R (Planlegg-fane, morgen-notifikasjon) · Fo · **DELVIS** | R+F (Hjem-kjerneflyt, hard blocks) · Fo · **JA** | Ø · Va · **NEI** | Ø · Ko/egen jobb · **NEI** | Ø (CareCircle dev-only) · Ko · **NEI** | R-delvis (aktivitetstoggle; vogn-søvn/bilstol ukablet) · Fo/Va · **DELVIS** | Ø (kalibreringsloop ukablet) · alle · **NEI** |
| **A2 Erfaren** | R (samme flate) · Fo · **DELVIS** | R+F (samme flate) · Fo(?) · **DELVIS** | Ø · Va · **NEI** | Ø · Ko · **NEI** | Ø · Ko · **NEI** | R-delvis · Va · **DELVIS** | Ø · alle · **NEI** |
| **A3 Partner** | Ø (ingen synk/konto) · Fo · **NEI** | Ø/R (kun ved egen installasjon, uten delt profil-historikk) · Fo · **NEI** | Ø · Va · **NEI** | Ø · Ko · **NEI** | S-svekket (NAV-fedrekvote; premiss 18) · Ko · **NEI** | Ø · Fo · **NEI** | Ø · alle · **NEI** |
| **A4 Besteforelder** | Ø · Fo · **NEI** | Ø (kun prosa i PRODUCT.md «Secondary») · Fo · **NEI** | Ø · Va · **NEI** | Ø · Ko · **NEI** | Ø · Ko · **NEI** | Ø · Fo · **NEI** | Ø · alle · **NEI** |
| **A5 Episodisk** | Ø · Fo · **NEI** | Ø · Fo · **NEI** | Ø · Va · **NEI** | Ø · Ko · **NEI** | Ø · Ko · **NEI** | Ø · Fo · **NEI** | Ø · alle · **NEI** |

(Fo = forskrivning, Va = validering, Ko = koordinering — JTBD-hypotesene fra fase 2, alle fortsatt ubeviste hypoteser.)

### 1.3 Celle-notater med belegg

**A1×M2 (velge) er den eneste cellen med full produktdekning (a).** Hjem-kjerneflyten fungerer (audit §4, screenshots 02/06), og innholdet er delvis fagkilde-belagt via 10 hard blocks (`src/lib/wool-layers/safety.ts`, AAP/NHS/Lullaby Trust m.fl.). Men merk: fagkildene belegger *sikkerhetsgrensene*, ikke at anbefalingen er treffsikker — treffsikkerhet er hverken helsefaglig signert (`tables.ts:5–7`: «MÅ valideres av helsesøster») eller brukermålt (a). Og om *velge* faktisk er det hyppigste/viktigste øyeblikket for A1 er ubevist (b — dagbokstudie, premiss 1–3).

**A1×M1 (planlegge):** Planlegg-fanen med I dag/I morgen/Uke er bygget og visuelt utviklet (a), men verdien er ubevist og eksplisitt utfordret (premiss 14: «ta med et ekstra lag» kan dekke behovet; 595 kB chunk for ubevist verdi). DELVIS betyr her: flaten finnes, behovet gjør kanskje ikke.

**A1×M3 (validere):** Ingen kandidat-inngang finnes. Juster-drillet (FinnAntrekk) er *forskrivning med justerte innganger*, ikke validering av et antrekk forelderen selv har valgt (a). Sols terskel for at validering i det hele tatt kan konkurrere: kandidat-input p75 ≤ 8 sekunder med barn på armen (b). I tillegg har Juster-drillet i dag temperaturbånd-inkonsistensen (audit funn 5: `feelsLikeC = tempC` rå slider) — validering på en flate som kan gi annet svar enn Hjem for samme vær er en tillitsrisiko (a for inkonsistensen, c for konsekvensen).

**A1×M4 (pakke):** Ingenting. Sol P2 slår fast at barnehage-pakking er en reell foreldrejobb selv om barnehagen ikke er mottaker (b). Nærmeste flate er «I morgen»-widgeten, som ikke er en pakkeliste (a).

**A1/A3×M5 (overføre):** Strukturelt umulig i dag: lokal-only uten backend, `family_sharing=false`, ingen delknapp; CareCircle-previewen er dev-only bak `import.meta.env.DEV` (`InnstillingerScreen.tsx:1932`) og merket «Ikke aktiv ennå» (a, verifisert i fase 2). Konkurransen er en fire-sekunders tekstmelding (b). NAV-belegget for pappaperm-byttet som fast overføringspunkt er svekket (premiss 18 — uttak varierer i lengde/gradering/tidspunkt).

**A1×M6 (justere underveis):** Aktivitetstoggle med inline-recalc finnes (a). Men to av motorens tre situasjonssensitive sikkerhetsregler kan aldri fyre: `vognMode` er hardkodet `'awake'` i `HjemScreen.tsx:433` og `UkeScreen.tsx:390` (a — vogn-søvn-rådene er utilgjengelige), og ingen produksjonskode setter `context.bilstol = true` (a — HB-9 er død kode i praksis). Sols «overgangsreise» (hjem→bilstol→vogn→butikk→ute→soving) er udekket som kjede (a for fravær).

**A1×M7 (lære etterpå):** Kalibreringsloopen (feedback→bias) er implementert og testet men ingen skjerm kabler den (a, audit funn 2). Sol: etter-tur-øyeblikket er der kalibrering kan skje, men også der motivasjonen for å åpne appen er lavest (c — plausibel, umålt).

**A2-raden:** Appen har ingen erfaringsdimensjon i profilen — A2 behandles identisk med A1 (a). Hypotesen om at A2s jobb oftere er validering (Sol r2: erfaren mor ved første kuldeperiode) er ubevist (b). Derfor DELVIS på M2: flaten finnes, men produktformen (autoritativ forskrivning) matcher muligens feil jobb.

**A3/A4/A5-radene:** Strukturelt usynlige. Ingen konto, ingen synk, ingen delingsflate; en partner som installerer selv får en tom, ukalibrert profil uten historikk (a). PRODUCT.md nevner besteforeldre som sekundærbrukere — det er persona-prosa, ikke bevis (a for at det kun er prosa). Sols utvidelse gjelder for hele denne blokken: aleneforeldre, delt bosted, stefamilier, medmødre, foster-/adoptivforeldre og husholdninger med daglige besteforeldre har andre handoff-mønstre enn kjernefamilien — ingen av dem er modellert (a for fravær).

### 1.4 Ærlig oppsummering av bevisbildet

- **Brukerbevis: 0 av 35 celler.** Analytics er død, ingen brukerkontakt er gjennomført (a).
- **Repo-flate finnes i 6 av 35 celler** — alle i A1/A2-radene (a). Repo-flate beviser at produktet *tilbyr* noe, ikke at noen *trenger* det.
- **Faglitteratur berører innholdet i 2 kolonner** (velge, justere underveis — via hard/soft blocks-kildene) men belegger sikkerhetsgrenser, aldri aktøratferd (a).
- **29 av 35 celler har ingen bevis av noe slag** utover det svekkede NAV-belegget i A3×M5 (a).
- Konsekvens for kilevalget (Sols krav om ÉN inngangskile): valget må tas på *hypotesekvalitet og testbarhet*, ikke på bevis — for bevis finnes ikke ennå. Matrisen viser hvor bevisinnhentingen (dagbokstudie med aktør×øyeblikk-koding) må treffe bredest: kolonnene M3–M5 og radene A2–A5 er blanke sider.

---

## Leveranse 2 — Separat risikomodell (sikkerhetslag, UAVHENGIG av JTBD)

**Prinsipp (Sol-krav, bindende):** medisinske risikofaktorer skal ikke blandes med brukersegmentering. Risikolaget skal fyre for *enhver* aktør i *ethvert* øyeblikk, uansett hvilken inngangskile fase 3 velger. Pipeline i dag: modifiers → conflicts → soft blocks → hard blocks (`src/lib/wool-layers/recommend.ts:63–71`), med `finalizeSafety` som siste grense etter bruker-overrides (a).

### 2.1 Søvn / TOG

**Finnes i motoren (a):**
- HB-1 hodeplagg under søvn fjernes (`safety.ts:126–138`, AAP-2022/NHS/LT-RT)
- HB-2 teppe + sovepose aldri samtidig (`safety.ts:141–155`)
- HB-3 aldri flere soveposer (`safety.ts:158–169`)
- HB-5 tomt seng-prinsipp (`safety.ts:187–199`)
- HB-10 snorer/løse halsplagg under søvn (`safety.ts:255–267`)
- SB-3 romtemp ≥24 °C capper påkledning (`softBlocks.ts:96–125`)
- TOG-tabell per romtemperatur med kildereferanser (`src/lib/research/tog-table.ts:37–101`, oppslag `togForRoomTemp` :108–115) + `TogGuideScreen.tsx` som UI
- Vogn-søvn: `vognMode: 'awake' | 'sleeping'` (`types.ts:60`) ruter base-oppslag til soevn-tabellen med utendørs-modifikatorer beholdt (`recommend.ts:58–60`)

**Mangler (a):** vogn-søvn er ukablet — `vognMode` hardkodes `'awake'` i `HjemScreen.tsx:433` og `UkeScreen.tsx:390`, så trolig en svært vanlig 0–8 mnd-situasjon (b — «vanligste» er forbudt uten måling) får aldri søvn-sikkerhetslogikken. Romtemperatur er ikke en input i hovedflyten (TOG-veiledning lever kun i guiden). Ingen helsefaglig signatur.

**Skal IKKE hevdes:** «trygt å sove»-sertifisering; SIDS-forebygging som produktløfte; at TOG-rådet erstatter Lullaby Trust/helsestasjonens veiledning.

### 2.2 Prematuritet / korrigert alder

**Finnes i motoren: ingenting (a).** Motoren kjenner kun kronologisk `ageMonths`; Motor 2.0 deler i `newborn`/`mobile_baby`/`young_toddler` på kronologisk alder (`clothing-engine-v2/age.ts:14`). Søk på prematur/korrigert i `src/` gir null relevante treff.

**Mangler:** input for korrigert alder, en scope-regel (b — foreslått: prematuritet under en definert grense ruter til «snakk med helsestasjonen», ikke til justerte råd), og prematuritet som egen rekrutteringsgruppe i studiene (Sol-krav, bindende).

**Skal IKKE hevdes:** at rådene gjelder premature eller barn med lav fødselsvekt. Inntil korrigert alder finnes i modellen må dette være eksplisitt ut-av-scope, ikke stilltiende inkludert — i dag får en prematur 2-måneder gammel baby samme råd som en fullbåren (a for mekanismen).

### 2.3 Sykdom / feber (ut-av-scope-deteksjon)

**Finnes i motoren: ingenting (a).** Null treff på feber/fever/sykdom i `src/` (tidligere treff var substrenger som «vaskesyklus»).

**Mangler:** en ut-av-scope-*erklæring*, ikke en diagnosemotor (Sol: «appen må gjenkjenne når standardmotoren ikke skal brukes, uten å begynne å diagnostisere»). Minimum (b — designforslag til fase 7): synlig scope-tekst ved profil/resultat («Ved feber eller sykdom gjelder ikke standardrådene — kontakt helsestasjon/lege»), eventuelt et frivillig «barnet er sykt i dag»-flagg som *skrur av* anbefalingen med henvisning, aldri justerer den.

**Skal IKKE hevdes:** medisinske råd av noe slag; febertilpasset påkledning; råd ved eksem/hudsykdom — ull-toleranse modelleres som preferansevalg, ikke diagnose (premiss 17, prevalenstallet trukket). Dette er allerede anti-referanse i PRODUCT.md («not authoritative medical advice»), men det er prosa — ingen kode håndhever det (a).

### 2.4 Nyfødt-tidsgrenser

**Finnes i motoren (a):**
- <3 mnd + kuldegrader → «maks 30 min ute» (`modifiers.ts:496–505`; flaggdefinisjon `research/safety-flags.ts:48` `newborn-cold-limit`)
- SB-7: <6 mnd + ekstrem hete → «maks 15 min ute uten skygge» (`softBlocks.ts:185–189`)
- SB-8: frostskadesjekk ved utelek/vogn, feels ≤ −10 og eksponering >30 min, med aldersgate (`softBlocks.ts:192–202`)
- Motor 2.0 har paralleller (`clothing-engine-v2/safety.ts:142` og `:185–190`) — men Motor 2.0 er 100 % avslått i påvente av fagsignatur (a)

**Mangler (a):** grensene er *tekstnotater*, ingen aktiv tids-/eksponeringsflate i UI (ingen timer, ingen «hvor lenge skal dere ut»-input i hovedflyten; `exposureMinutes` finnes som motorparameter). Tallene 30/15 min er usignerte (`tables.ts:5–7`-forbeholdet gjelder hele regelverket).

**Skal IKKE hevdes:** at tidsgrensene er helsefaglig validerte terskler — de er policyverdier med kildehenvisning som venter på fagsignatur (premiss 5: HARD BLOKKER før lansering).

### 2.5 Bilstol

**Finnes i motoren (a):** HB-9 fjerner vinterdress/tykk dunjakke når `context.bilstol === true`, med korrekt rådtekst («tynne lag + sele tett, dress over som teppe») og NHTSA/AAP-HC-kilder (`safety.ts:269–282`).

**Mangler (a):** ingen produksjonskode setter `context.bilstol = true` (kun tester) — regelen er i praksis død kode. Bilstol finnes ikke som situasjon i UI, og Sols overgangsreise (bilstol som ledd i en kjede) er umodellert. Dette er sikkerhetsmessig den mest anmassende av de ukablede funksjonene: en forelder som bruker anbefalingen «kjøredress» rett i bilstolen får ingen advarsel i dag (b — konsekvensen forutsetter at bilturer forekommer i målgruppens hverdag, hvilket er rimelig men umålt).

**Skal IKKE hevdes:** bilsikkerhet utover påkledning — ikke selemontering, ikke stolvalg, ikke kjøreretning.

### 2.6 Tverrgående konklusjon for risikomodellen

Mønsteret fra fase 1 gjentar seg presist i sikkerhetslaget: **bygget men ikke koblet**. Av de fem risikoområdene har tre motorstøtte (søvn/TOG, nyfødt-tidsgrenser, bilstol), men to av tre er helt eller delvis ukablet fra UI, og to områder (prematuritet, sykdom) mangler totalt — begge er *scope-avgrensninger*, ikke funksjoner, og kan derfor leveres som copy + ett flagg uten ny motorlogikk (b). Hele laget er usignert helsefaglig. Anbefalt fase 3-vedtak (c — mitt forslag): risikomodellen defineres som egen leveranse med egen faglig blindtest-protokoll (scenarioantall, konfidens, uenighetshåndtering per Sols krav), og kabling av HB-9 + vogn-søvn + de to scope-ut-erklæringene prioriteres uavhengig av hvilken JTBD-kile som vinner — sikkerhetslaget skal være identisk i alle kile-kandidater.

## KJERNEPÅSTANDER
- (a) Brukerbevis finnes i 0 av 35 celler i aktør×øyeblikk-matrisen — analytics er død og ingen brukerkontakt er gjennomført; repo-flater finnes kun i 6 celler, alle i primærforelder-radene.
- (a) A1×M2 (primærforelder velger nå) er eneste celle med full produktdekning, men innholdets treffsikkerhet er hverken helsefaglig signert (tables.ts:5–7) eller brukermålt.
- (a) Vogn-søvn-sikkerhetslogikken kan aldri fyre i produksjon: vognMode er hardkodet 'awake' i HjemScreen.tsx:433 og UkeScreen.tsx:390 til tross for full motorstøtte i recommend.ts:58–60.
- (a) HB-9 (bilstol: fjern vinterdress, safety.ts:269–282) er død kode i praksis — ingen produksjonskode setter context.bilstol = true.
- (a) Prematuritet/korrigert alder og sykdom/feber har null støtte i kodebasen — motoren kjenner kun kronologisk ageMonths, og PRODUCT.md-avgrensningen mot medisinske råd håndheves ikke av noen kode.
- (a) Nyfødt-tidsgrensene (maks 30 min <3 mnd i kulde, modifiers.ts:496–505; maks 15 min <6 mnd i ekstrem hete, softBlocks.ts:185–189) er usignerte tekstnotater uten aktiv tids-/eksponeringsflate i UI.
- (b) Kolonnene validere/pakke/overføre og radene partner/besteforelder/episodisk omsorg er blanke bevissider — dagbokstudien med aktør×øyeblikk-koding må dekke disse for at kilevalget skal kunne etterprøves.
- (b) De to manglende risikoområdene (prematuritet, sykdom) er scope-avgrensninger som kan leveres som copy + ett av-flagg uten ny motorlogikk.
- (c) Risikomodellen bør vedtas som kile-uavhengig leveranse: identisk sikkerhetslag i alle inngangskile-kandidater, med egen faglig blindtest-protokoll.

## SVAKHETER (egeninnrømmet)
- Matrisens dekningsvurderinger (JA/DELVIS/NEI) er mine skjønnsvurderinger av flate-eksistens, ikke målt dekning — en celle merket DELVIS kan i praksis være verdiløs eller tilstrekkelig; bare brukerdata kan skille.
- JTBD-plasseringen per celle (Fo/Va/Ko) arver fase 2-hypotesene som selv er ubeviste — matrisen kan gi et falskt inntrykk av struktur der både rader (aktørinndelingen) og jobb-etikettene er hypoteser oppå hypoteser.
- Aktørlisten på fem er en forenkling som ikke fullt ut svarer på Sols utvidelse (aleneforeldre, delt bosted, medmødre, foster/adoptiv, flerspråklige er klemt inn under A3/A5) — rekrutteringskravene er bredere enn matrisens rader.
- Fil:linje-belegget beskriver commit-tilstanden nå; en parallell økt jobber i src/screens/, så vognMode/bilstol-kablingen kan endre seg og bør re-verifiseres ved fase 3-port.
- Påstanden om at HB-9-ukablingen er sikkerhetsmessig viktigst hviler på en umålt antakelse om bilbruk i målgruppen — jeg har ingen frekvensdata for noen av risikosituasjonene.
- Forslaget om sykdoms-scope som «copy + flagg» kan undervurdere problemet: feil plassert scope-tekst kan lese som medisinsk rådgivning i seg selv og bør forbi samme fagsignatur som resten.
- Jeg har ikke lest hele modifiers.ts/conflicts.ts linje for linje — det kan finnes flere risikorelevante regler (f.eks. UV/sol) som burde inngått i risikomodellens inventar.