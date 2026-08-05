# Fase 2 — Segmentering og behov 0–24 mnd (hypotesearbeid, ikke brukerresearch)

**Merking av påstander:** (a) = belagt i repo/faglitteratur med kilde, (b) = testbar antakelse med konkret test, (c) = ren spekulasjon. Vi har null brukerdata (analytics er død — audit funn 1), så alt om atferd og motivasjon er per definisjon (b) eller (c) uansett hvor rimelig det høres ut.

---

## 1. Er «ikke-mobil 0–5 / overgang 6–11 / mobil 12–24» riktig inndeling? Nei — den må revideres.

Den foreslåtte tredelingen blander to akser som repoets egen research viser er forskjellige:

**Fysiologisk akse (a — RESEARCH.md):**
- Termoregulering modnes gradvis 0→12 mnd; ved 9–12 mnd nær voksen-nivå (RESEARCH.md TL;DR + Slumbersac).
- **Overflate/masse-ratio faller 28 %** fra 648 til 468 cm²/kg fra 0 til 12 mnd (PMC12386404).
- **Overopphetings-PEAK ved 8–9 mnd** — størst metabolsk varmeproduksjon per overflateareal (PMC12386404). Dette er repoets mest distinkte fysiologifunn, og det ligger *midt inne* i «6–11»-segmentet uten å definere det.
- **<3 mnd er høyrisiko for kulde** — shivering-respons begrenset; repoet har egen newborn-regel (+2 lag, maks 30 min ute i kuldegrader) og F62 siterer «spedbarn bør ikke ut når det er kaldere enn −10 °C».
- Repoets egen konsoliderte modell (RESEARCH.md) har **seks** bånd: 0–3 / 3–6 / 6–9 / 9–12 / 12–18 / 18–24.

**Atferdsakse (mobilitet/aktivitet):** rulling ~4–6 mnd, krabbing ~8–10 mnd, gange ~12–15 mnd (c — allmenn utviklingskunnskap, IKKE dokumentert i repoets research; motoren bruker `canRoll` med ageMonths≥4-proxy, types.ts:38–42, som er (a) for rulle-grensen). Et gående barn produserer egen aktivitetsvarme og blir vått/sølete; et vognbarn er passiv passasjer som kjøles. Motoren håndterer dette via aktivitetskontekst (`vogn|baeresele|utelek|soevn`, types.ts:9), ikke via alder — hvilket er riktig arkitektur.

**Kritisk innsikt:** 0–5-grensen skjuler det medisinsk viktigste skillet i hele spennet (0–3 mnd med tidsgrenser og hard blocks), og 6–11-grensen fanger ikke overopphetingstoppen. Aldersgrensene bør følge fysiologien; *behovssegmentene* bør følge beslutningssituasjonen.

### Revidert segmentmodell (hypotese, b)

| Segment | Alder | Fysiologisk driver (a) | Dominant kontekst (b) | Beslutningsproblem (b/c) |
|---|---|---|---|---|
| **S1 Nyfødt** | 0–3 mnd | Umoden termoregulering, høyrisiko kulde, +2 lag, tidsgrenser | Vogn (ofte sovende), bæresele, innesøvn. Foreldre i barsel-tåke | Sikkerhetsangst: «Er dette *trygt*?» Hver tur føles som risiko |
| **S2 Passiv passasjer** | 3–8 mnd | Modnes, fortsatt sårbar; lav svettekapasitet | Vogn/bæresele dominerer; barnet melder ikke selv fra | Kalibrering: «Er dette *riktig*?» Nakketesten er eneste feedback |
| **S3 Overgangs-/peakbarn** | 8–12 mnd | **Overopphetingstopp 8–9 mnd**; nær voksen termoregulering ved 12 | Krabbing inne/ute, fortsatt vogn ute; bæresele+varme = dokumentert forsiktighetssone (PMC7202982) | Motintuitivt problem: *færre* lag enn forelderen tror. Appens potensielt mest unike verdi (RESEARCH.md forslag 1 — «ikke i konkurrenter») |
| **S4 Mobil smårolling** | 12–24 mnd | Voksen-lik termoregulering; aktivitet styrer | Går selv, søle/regn/vann, barnehagestart (~12 mnd i Norge, c) | Praktisk logistikk: slitasje, skift, *koordinering med barnehage*. Termoregulering er nesten løst — behovet skifter karakter |

**Den ubehagelige konsekvensen (b):** Verdien av en termoreguleringsmotor er størst i S1–S3 (0–12 mnd) og faller bratt i S4, samtidig som norske barn typisk begynner i barnehage rundt 12 mnd (c — SSB/foreldrepermisjonsstruktur, ikke i repo). I S4 kler *barnehagen* barnet mesteparten av dagen. «0–24 mnd» som målgruppe er altså i praksis to produkter: et termoreguleringsprodukt (0–12) og et koordinerings-/logistikkprodukt (12–24). Dagens app er kun det første. Dette forsterker Sols P1-funn («0–24 som ett problemsegment») med en konkret mekanisme.

---

## 2. Kryss: førstegangs- vs. erfaren forelder

| | Førstegangsforelder | Erfaren forelder |
|---|---|---|
| **Behov (b)** | Forskrivning + beroligelse: «Fortell meg hva jeg gjør, og at det er trygt» | Validering: «Bekreft at det jeg valgte er innenfor» (Sols «Verifiereren») |
| **Læringskurve (b)** | Bratt; app-verdien høyest første 3–6 mnd og *første vinter* | Har heuristikker fra barn nr. 1; app-verdi marginal |
| **Betalingsvilje (c)** | Sannsynligvis høyest — angst er betalingsdriver | Sannsynligvis lav; churner eller laster aldri ned |
| **Risiko for produktet (b)** | Selvdestruksjon: appen lærer dem bort fra behovet (Sols «graduation»-punkt) | Hard paywall etter én anbefaling gir dem null grunn til å bli |

Ca. 4 av 10 fødsler i Norge er førstebarn (c — omtrentlig SSB-kunnskap, må verifiseres). Hvis produktet reelt kun treffer førstegangsforeldre i barnets første 6–12 mnd, er adresserbart marked og naturlig abonnementslengde vesentlig mindre enn «0–24 mnd»-rammen antyder. **Sesonginteraksjonen (b):** et barn født i april møter sin første kulde ved 6–8 mnd; et november-barn ved 0–2 mnd. «Første vinter» er sannsynligvis det egentlige høyverdi-øyeblikket, ikke en aldersgruppe — og det er en *kohort*-egenskap (fødselsmåned × kalender), som appen kjenner fra fødselsdatoen men i dag ikke bruker segmenterende (a — onboarding samler kun navn/fødselsdato/sted, OnboardingScreen.tsx:6–11).

## 3. Kryss: primær- vs. sekundæromsorg

PRODUCT.md navngir sekundærbrukere (besteforeldre m.fl.) og paywallen lover «Del med alle som passer barnet» — men (a, belagt i kode):
- `family_sharing=false`; omsorgssirkelen er **dev-only forhåndsvisning med statiske data**, eksplisitt merket «R9-funksjon (krever auth/RLS/backend)» (care-circle-model.ts:4–8).
- Lagring er lokal-first localStorage per enhet — det finnes **ingen mekanisme** for at partner, besteforelder eller barnehage kan se samme barneprofil eller samme anbefaling.

Sekundæromsorg er altså ikke et underbetjent segment — det er et **ikke-eksisterende** segment i dagens produkt, samtidig som paywallen selger det (Sols P0). Merk asymmetrien (b): sekundæromsorgspersonen (pappa i delvis perm, besteforelder på tirsdager) har *mindre* kalibrert intuisjon for akkurat dette barnet enn primærforelderen — de er segmentet med høyest marginal verdi av en forskrivende liste, og de er de eneste appen strukturelt ikke kan nå. Sols «Omsorgshandoff»-retning adresserer nettopp dette.

## 4. Kontekstkart (situasjonene appen brukes i)

| Kontekst | Status i produktet | Merking |
|---|---|---|
| **Én hånd** | Prinsipp i PRODUCT.md (≥44 px, primærhandling på første scroll). Ikke målt/håndhevet med test slik doktrinen ellers gjør | (a) som intensjon; (b) om etterlevelse — testes med reachability-audit per skjerm |
| **Vinterhansker** | PRODUCT.md hevder bruk «i vinterhansker» — men kapasitive skjermer reagerer ikke på vanlige ull-/skinnhansker. Enten er premisset falskt (forelderen tar av hansken) eller kravet er egentlig «maksimalt tilgivende touch-mål + null presisjonsgester» | (c→b): observasjonsstudie/feltnotat; kravet bør omformuleres uansett |
| **Mørke/lav sol** | Dark-first + eiervedtak runde 4: primærbruk er *utendørs i dagslys*, lys modus scoret best. Motstrid mellom «ofte i mørke» (PRODUCT.md brukerbeskrivelse) og «primært dagslys» (runde 4-rasjonale) er udokumentert løst | (a) at begge utsagn finnes; (b) hvilken som stemmer |
| **Vogn sovende vs. våken** | `vognMode='sleeping'` implementert og testet i motor — **ingen skjerm kabler den** (audit funn 2). Norske barn sover ute i vogn året rundt; dette er trolig en topp-3-situasjon i S1–S2 | (a) at den er ukablet; (b) at den er høyfrekvent |
| **Bil-overganger** | `context.bilstol` finnes i motoren med HB-9 (fjerner vinterdress i bilstol — den klassiske sikkerhetsregelen) — **null treff i ikke-test-skjermkode**; brukeren kan aldri angi det | (a) verifisert ved grep |
| **Turens varighet** | `exposureMin` (default 60) styrer kulde-warnings i motoren — ingen skjerm lar brukeren angi varighet | (a) verifisert ved grep |
| **Flerlags-turer (bil→vogn→butikk→ute)** | Ikke modellert; appen svarer på ett punkt i tid og én aktivitet. Sols «Turprotokollen» er den naturlige motformen | (a) at det mangler; (c) at det er viktigere enn punktsvar |

Mønsteret er audit-funnets kjerne i segmentspråk: **motoren kjenner kontekstene, UI-et gjør ikke.** Appen har allerede kjøpt de vanskelige delene av kontekstkartet (bilstol-sikkerhet, sovende vognbarn, eksponeringstid) og lar dem ligge ukablet.

## 5. Tilgjengelighetsbehov

- **Redusert bevegelse:** bredt implementert — `reducedMotion`/`prefers-reduced-motion` i 20+ filer, undertrykker maskotblikk og seremoni (a). Best dekkede a11y-dimensjon.
- **Kognitiv last / søvnmangel:** anerkjent i PRODUCT.md; men 3,2 s seremoni ved hver ny fingerprint, maskotkoreografi og poetisk mikrotekst er *additiv* kognitiv kost for en bruker i søvnunderskudd. Kjernebrukeren i S1 er den mest kognitivt reduserte brukeren appen har (b — måles med tid-til-svar og gjentaksbruk; Sol P2 sier det samme om seremonien).
- **Syn:** WCAG AA-prinsipp + kontrastdoktrine i designsystemet (a som intensjon); dynamisk tekststørrelse (iOS Dynamic Type via WebView) er ikke verifisert i noe dokument jeg fant — åpen risiko (b).
- **Motorikk:** 44 px-krav (a som prinsipp); edge-swipe back og drag-gester bør ha knappe-alternativer — ikke verifisert (b).
- **Skjermleser:** aria-apparat i onboarding er reelt (OnboardingScreen.tsx:19–25) (a); dekning i resultat-/scan-flyten (live-region under 3,2 s-seremonien?) ikke verifisert (b).
- **Ull-intoleranse som tilgjengelighetsbehov for *barnet*:** F62 siterer barnelege: **~40 % av norske barn** klør/tørker av ull innerst og bør ha bambus/bomull innerst (a). Profilen har **ingen ull-toleranse-flagg** (a — eneste treff er statisk tekst i vinterprogram.ts); motoren anbefaler ull-first som default. Nesten halvparten av barna kan altså få et innerste-lag-råd som er feil for dem, i et produkt som kaller seg personlig. Dette er den enkleste reelle personaliseringen som finnes og den er ikke bygget.

## 6. Topp-oppgaver per segment (hypoteser, b — valideres i kontekstintervju/dagbokstudie per Sols krav)

- **S1 (0–3):** «Er det trygt å gå ut nå, og hvor lenge?» · «Hva skal hen ha i vognposen når hen sover ute?» · «Er hen for varm nå?» (nakketest-sløyfen)
- **S2 (3–8):** «Standard tur — hva i dag vs. i går?» · «Bæresele under jakken min — hva da?» · rask revalidering ved væromslag midt på dagen
- **S3 (8–12):** «Hvorfor skal hen ha *mindre* enn jeg tror?» (peak-pedagogikk) · første vinter: dresstykkelse/kjørepose · bil→ute-overganger (HB-9!)
- **S4 (12–24):** «Regntøy eller vinterdress i dag?» · «Hva skal ligge i barnehagesekken denne uka?» · handoff til barnehage/besteforelder

Merk at S4s toppoppgaver nesten ikke overlapper med dagens produktflate (punktanbefaling for én aktivitet nå).

## 7. Hvem appen faktisk er bygget for — og hvem som er usynlige

**Bygget for (a — utledet av kode + copy):** *Primær, sannsynligvis førstegangs, norskspråklig forelder i permisjon med barn ca. 0–12 mnd, på én enhet, med normal syn/motorikk, som ønsker en forskrivende liste for én aktivitet akkurat nå, og som er villig til å betale etter én gratis anbefaling.* Onboardingen (navn→fødselsdato→sted) og aktivitetsfirkanten vogn/bæresele/utelek/søvn passer dette segmentet presist.

**Usynlige segmenter (a for at de mangler; b/c for hvor mye det koster):**
1. **All sekundæromsorg** — partner, besteforeldre, barnehage. Strukturelt umulig (lokal-first, ingen deling), men solgt i paywall-copy.
2. **Barn med ull-intoleranse (~40 %)** — ingen profilflagg, ull-default.
3. **Sovende vognbarn** — motorstøtte finnes, UI mangler. Trolig hverdagens vanligste S1–S2-situasjon.
4. **Bil-familien** — bilstol-sikkerhetsregelen finnes i motoren, usynlig i UI.
5. **Erfaren forelder som vil validere, ikke bli forskrevet** — ingen «sjekk mitt valg»-inngang (Sols Verifiereren).
6. **12–24-segmentet slik det faktisk lever** — barnehagekoordinering, pakking, skift; appen dekker kun «hva nå, ute».
7. **Ikke-norskspråklige foreldre i Norge** — ett språk, mens Babyora-navnebyttet eksplisitt var for internasjonal ASO (spenning i strategien, a).
8. **Brukere med behov for dynamisk tekststørrelse** — uverifisert.

## 8. Utfordring av produktformen (oppsummert)

Dagens form — punktanbefaling × hard paywall × én enhet — er optimert for det segmentet som har *kortest* naturlig livsløp i produktet (førstegangsforelder 0–12 mnd som lærer seg bort fra behovet), og strukturelt stengt for de to retningene med lengst verdi: koordinering (sekundæromsorg/barnehage) og tur-/overgangslogistikk. Segmentanalysen peker samme vei som Sols alternative retninger, men med en presisering: **valget mellom Forskriveren, Verifiereren og Handoff er ikke ett valg — det er sannsynligvis aldersavhengig** (Forskriveren vinner i S1–S3, Verifiereren hos erfarne på tvers, Handoff i S4). En fase 3-brief som velger én form for hele 0–24 uten å teste dette, gjentar feilen «0–24 er ett segment» på produktformnivå.

## TESTBARE ANTAKELSER
- Segmentgrensene bærer behovsskift: I kontekstintervju/dagbokstudie (Sols krav) kodes hvert beslutningsøyeblikk mot S1–S4; falsifisert hvis toppoppgavene IKKE endrer seg signifikant over 8–12 mnd-grensen (dvs. termoreguleringsbehovet vedvarer inn i S4) eller hvis 0–3 ikke skiller seg fra 3–8 i angst/sikkerhetsspørsmål.
- Første vinter > alder som verdidriver: Mål app-åpninger/verdiopplevelse per kohort (fødselsmåned × kalendermåned) når analytics er på; falsifisert hvis bruksintensitet følger alder jevnt uten sesonginteraksjon.
- Barnehagestart kollapser daglig behov: Dagbokstudie med foreldre til 12–18 mnd-barn i barnehage; falsifisert hvis de rapporterer like mange egne påkledningsbeslutninger per uke som permisjonsforeldre (terskel: <50 % færre beslutningsøyeblikk bekrefter hypotesen).
- Erfarne foreldre vil validere, ikke forskrives: A/B i intervju/prototype — «Finn antrekk» vs. «Sjekk mitt valg»; falsifisert hvis erfarne foreldre (barn nr. 2+) foretrekker forskrivning like ofte som førstegangsforeldre.
- Sekundæromsorg er mest betalingsverdig jobb (Sols hypotese, skjerpet): Egen handoff-studie (Sols krav) der partner/besteforelder faktisk kler barnet etter delt plan; falsifisert hvis mottakerne ignorerer planen eller primærforelderen ikke opplever redusert koordineringskost.
- Sovende-vognbarn er høyfrekvent S1–S2-situasjon: Dagbokstudie teller vogn-søvn-episoder ute per dag; falsifisert hvis <1 per dag i snitt om vinteren.
- Vinterhansker-premisset: Feltobservasjon/selvrapport — tar foreldre av hansken for å bruke telefonen ute? Hvis ja (forventet), omformuleres kravet til «store mål + null presisjonsgester», og hansker strykes fra brukerbeskrivelsen.
- Ull-intoleranse-flagg øker opplevd treffsikkerhet: Legg flagget til profilen og mål andel som setter det + endring i varm/kald-feedback for gruppen; falsifisert hvis <10 % bruker flagget.
- 3,2 s-seremonien koster mer enn den gir hos søvndepriverte S1-brukere: Mål skip-rate og tid-til-resultat over gjentatt bruk; falsifisert hvis skip-raten forblir <20 % etter uke 2.
- Kohort-kort livsløp: Mål retention per barnealder ved onboarding; falsifisert hvis foreldre onboardet ved 12+ mnd har sammenlignbar 90-dagers retention med 0–6 mnd-kohorten.

## BEVISHULL
- Null atferdsdata: analytics er kompilert bort (audit funn 1) — frekvens, segmentfordeling, skip-rate, churn og betalingsvilje kan ikke avgjøres fra repoet overhodet.
- Faktisk aldersfordeling og førstegangs-andel blant reelle/potensielle brukere er ukjent; SSB-tall om førstebarn og barnehagestart ved ~12 mnd er min allmennkunnskap (c) og må slås opp.
- Mobilitets-milepæler (krabbing/gange) og deres termiske effekt er IKKE dokumentert i repoets research — F62/RESEARCH.md dekker termoregulering og søvn, ikke aktivitetsvarme hos gående barn.
- Ingen kilde i repoet om bilstol + vinterdress-risiko (HB-9 hevder AAP-forankring i kodekommentar, men F62/RESEARCH.md dokumenterer den ikke) — må belegges før den kables til UI.
- Hansker/kapasitiv skjerm: ingen feltdata; hele «én hånd i hansker i mørke»-brukerbildet i PRODUCT.md er udokumentert persona-prosa.
- Sekundæromsorgs faktiske vilje til å bruke en app (vs. få en tekstmelding fra primærforelder) er utestbar uten handoff-studien Sol krever.
- Dynamic Type/tekstskalering i WebView og skjermleserdekning i scan-/resultatflyt er uverifisert i kode og udokumentert.
- Motstriden «brukes ofte i mørke» (PRODUCT.md) vs. «primærbruk i dagslys» (eiervedtak runde 4) kan bare løses med reelle bruksdata.
- 40 %-tallet for ull-intoleranse hviler på ÉN barnelege i et Klikk-intervju (F62 flagger selv motstriden mot Babyverden/Nøstebarn) — trenger sterkere kilde før det styrer motor-default.

## DESIGNIMPLIKASJONER
- Onboarding: fødselsdato gir allerede segment + første-vinter-kohort — bruk den. Legg til to spørsmål med høy motorverdi: ull-toleranse (kabler 40 %-problemet) og typisk kontekst (vogn-sover ute? bil-hverdag?). Sols P2 («navn før beslutningskritiske variabler») løses samtidig.
- Hjem/resultat: eksponer de tre ukablede motorkontekstene som brukeren faktisk lever i — vognMode sovende/våken, bilstol-toggle (HB-9-sikkerhetsregelen som synlig verdi), turvarighet (exposureMin). Dette er segmentdekning uten ny motorutvikling.
- S3-differensiatoren: overopphetings-peak 7–9 mnd er repoets eneste «ikke i konkurrenter»-funn — gjør den til synlig, forklart innsikt i resultatet for riktig alder, ikke bare en note.
- Resultat: tilby to innganger per Sols Verifiereren — «Finn antrekk» (forskrivning, S1–S3/førstegangs) og «Sjekk mitt valg» (validering, erfarne) — som test, ikke vedtak.
- Paywall: fjern «Del med alle som passer barnet» umiddelbart (P0, funksjonen finnes ikke), og re-time trial mot første-vinter/væromslag-øyeblikk i stedet for kalenderdager hvis segmenthypotesene bekreftes; hard paywall etter én anbefaling treffer S1-brukeren i maks angst og minst evidens.
- Familie-fanen: enten bygg reell handoff (krever at lokal-only-premisset utfordres — eierbeslutning) eller omdøp til Innstillinger og slutt å love koordinering; mellomform: eksporterbart «dagens plan»-kort (bilde/tekst) som deles via meldinger uten backend.
- Fase 3-brief: ikke velg ÉN produktform for hele 0–24 — formuler formvalget per segment (Forskriveren S1–S3, Verifiereren for erfarne, Handoff S4) og la studiene avgjøre hvor produktet skal smalne.
- A11y-porter før fase 3: verifiser Dynamic Type i WebView, live-region under scan, knappe-alternativ til edge-swipe; omformuler hanske-kravet til «store mål + null presisjonsgester».