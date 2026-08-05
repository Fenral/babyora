# 05 — Global Native Design Research (Fase 4)

> Utført 2026-08-05 av Claude (CD/TL) med fire research-agenter med webtilgang (285k
> tokens, kilder oppgitt per rapport). Fullrapporter med trendtabeller og kilder i
> `appendix/fase4/`. 41 trender klassifisert (etablert/fremvoksende/eksperimentelt/
> fallende), hver med begrunnet Babyora-beslutning (adopt/adapt/reinvent/reject) mot
> H1/H2/H3. Rekkefølge per Sols r3-krav: distribusjon FØR visuelle preferanser.

## 1. Distribusjon og installasjon (Sols førsteprioritet) — hovedfunn

1. **Helsestasjonskanalen er Norges sterkeste distribusjonsmaskin — og hard paywall
   diskvalifiserer trolig Babyora fra den.** Nørs: 101 kommuner anbefaler, ~85 % av
   førstegangsfødende, 200 000+ brukere — med invertert modell (kommunen betaler,
   gratis for foreldre), og Rådet for sykepleieetikk protesterer allerede mot premium-
   varianter i kanalen. Direkte bevismateriale til premiss 6. En tredjedel av partnerne
   er aktive Nørs-brukere — relevant for matrisens blanke partner-rad.
2. **Anskaffelsesøyeblikket ligger FØR behovet** — nedlastingsvinduet er positiv
   graviditetstest/første kontroll; gravidappene konverterer til babymodus og eier
   hjemskjermen før Babyoras naturlige utløser inntreffer. H1 må enten inn i
   graviditeten eller vinne et skarpere senere øyeblikk (hjemreise i kulde, første
   trilletur, første kuldeperiode — fase 2-motkandidatene).
3. **ASO-nisjen ser åpen ut** (ingen konkurrent på selve påkledningsjobben i norsk App
   Store; 65 % av nedlastinger følger søk) — men søkevolum er umålt og skal ikke siteres
   som fakta. **Reima-presedensen** beviser kategorien (vær-til-antrekk for barn,
   subsidiert av klessalg) og at vinterdress-kjøpet er et anskaffelsesøyeblikk.
4. **Widget-nyanseringen som korrigerer H3:** Locket beviser at widgeten kan BÆRE
   produktidentiteten — men den fjerner ikke installasjonen, den forutsetter den.
   Værutløste varsler har ~52 % opt-in i kategorien → H3 kan aldri leve i varselet
   alene; trenger widget/hjemkort-fallback. **Delt weblenke (Partiful-modellen) er den
   billigste sterke loopen** — mottaker får full verdi uten konto/installasjon; kortet
   MÅ ligge utenfor paywallen. App Clips/Instant Apps forkastes (Play Instant legges
   ned; dårlig Capacitor-match); PWA er mottaksflate, ikke primærdistribusjon.

## 2. De mest konsekvensrike beslutningene på tvers (utvalg av 41)

| Beslutning | Klasse | Konsekvens |
| --- | --- | --- |
| **Systemflate-distribusjon (widgets/Live Activities/StandBy): ADOPT** | etablert | H3s form; Live Activity med utløp ER gyldighetsvinduet B12. Krever native Swift-lag oppå Capacitor — kostnadssettes FØR fase 8-porten |
| **App Intents/intent-first: ADOPT** | fremvoksende | Strukturelt identisk med H2-routeren — routerens fire innganger designes intent-eksponerbare |
| **Iscenesatt latens: REJECT** | fallende | Ekstern motvind til 3,2 s-seremonien i tillegg til R1: HIG-normen er ærlig respons; ingen ADA-vinner bruker fake-beregning |
| **Adaptiv lys-default: REINVENT** | fremvoksende | Utendørspraksis er samstemt om lys i dagslys (Tide Guide-mønsteret); Monter har alt maskinhåndhevet lys modus → kontekststyrt default (sol/klokke) med manuell overstyring, mørk identitet består om kvelden. Testpunkt før fase 8, ikke stille vedtak |
| **Dynamic Type: ADOPT (doktrinehull)** | etablert | Typeskalaen er fast px — avvik ved uhell; rem-basert skala + systempreferanse inn i doktrinen uansett vinnende hypotese |
| **M3 Expressive dominans-hierarki: ADAPT** | fremvoksende | Googles 46-studiers research (4× raskere lokalisering) er ekstern støtte til A20/A21-prioriteten: én dominant form per skjerm, sikkerhetselementer i egen klasse |
| **Værskifte-trial: REINVENT** | etablert | Trial-lengde påvirker knapt konvertering — verdiopplevelse gjør; trial defineres som N kvalifiserte beslutningsøyeblikk (min. ett værskifte + én verifisert tur), kalendertak 14 dager |
| **Ikke-fornyende sesongpass (Slopes-modellen): ADOPT** | fremvoksende | Implementerbart i App Store, løser H1s graduation-ærlighet og A27; testes i premiss 7-eksperimentet ved fase 6-porten |
| **Tre-plans årsanker: REINVENT** | etablert | Årsplan mot kjent 4–6 mnd behov priser mot glemt fornyelse — bryter etikk-mandatet; → sesongpass primært + månedlig fleksibelt |
| **Apple/Google familiedeling: ADOPT** | etablert | Null arkitekturkost, lokal-first-kompatibel, betjener partner-cellene uten å forskuttere handoff-jobben |
| **Mørke mønstre: REJECT m/ forbudsliste** | fallende | 7-punkts eksplisitt forbudsliste, inkl. Babyora-regelen: barnets sikkerhet er aldri konverteringsagn |
| **Farevarsel-anatomi (MET/Yr-konvensjonen): ADOPT** | etablert | Handling → konsekvens → gyldighetsperiode som fast struktur for hvert sikkerhetsutsagn — norsk konvensjon brukerne alt er kalibrert mot; svarer direkte på A20/A21 |
| **Alarm-budsjett + reservert kritisk formspråk: ADOPT** | etablert | Én fargesemantikk eksklusiv for sikkerhet; **kollisjon avdekket: oransje er CTA-farge i søsterdoktrine og farevarsel-farge i norsk konvensjon — avklares i fase 7** |
| **Maskot som omsorgsobjekt: ADAPT m/ grense** | etablert | Maskoten kan være følgesvenn i sesongfortellingen, men ALDRI avsender av verdikt/sikkerhet (to stemmer-prinsippet); skyld-mekanikk (trist ved fravær) avvises — fravær kan bety mestring |
| **Skamfri tekstdoktrine: ADOPT** | etablert | Aldri evaluere fortidige valg, alltid neste handling; viktigst i H2 der rød dom over eget valg er mest skam-utsatt |
| **Sikkerhetslag aldri bak paywall: ADAPT (grensedragning)** | etablert | Verdilaget kan gates (eiervedtak består); sikkerhetslaget (hard blocks, TOG-grenser, ut-av-scope) rendres ALLTID, også i låst tilstand og i varselkanal |
| **Sosial proof på sikkerhetsflater: REJECT** | etablert | 0,6 % av anmeldelser handler om faglig korrekthet — popularitet er feil bevisform for sikkerhetsdommer |
| **Gamification/streaks: REJECT** | fallende | Målgruppen er i skyld-overskudd; redusert bruk kan bety mestring — engasjementspress motarbeider H1s ærlige exit |

Fullstendige tabeller (41 trender) med kilder: `appendix/fase4/*.md`.

## 3. De fem viktigste trendvalgene (til Sols kritikk — DoD-krav)

1. **Monetiseringsklyngen** (værskifte-trial + sesongpass + paywall-plassering etter
   første verifikasjonsøyeblikk): flytter i praksis paywall-vedtakets tyngdepunkt —
   størst forretningskonsekvens, og delvis i spenning med eiervedtaket fra 2026-07-31.
2. **Adaptiv lys-default** mot dark-first: utfordrer et identitetsbærende eiervedtak med
   bruksmiljø-evidens; reinvent-formen (kontekststyrt, ikke omkamp) må tåle kritikk.
3. **Seremoni-reject:** nå både internt (R1/A16) og eksternt (HIG/ADA) begrunnet — men
   eiers rasjonale («ingen ser arbeidet») er ikke besvart med data ennå.
4. **Sikkerhetslag-grensedragningen** mot hard paywall: hvor går linjen konkret mellom
   verdilag og sikkerhetslag i en app der anbefalingen ER sikkerhetsbærende?
5. **Systemflate-adopsjonen for H3:** binder H3 til native Swift-utvikling oppå
   Capacitor — arkitekturell kostnad tatt på presedens (Moonlitt/Locket), ikke på målt
   norsk brukeratferd.

## 4. Work-review

Sendt til Sol for trendkritikk (fase 4-mandat: hvilke funn er overflate, etterligning
eller uegnet; hvor er kreativ risiko verdt å ta). Verdikt: `11-independent-review.md`
runde 4.
