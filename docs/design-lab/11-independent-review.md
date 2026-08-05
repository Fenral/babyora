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

### DoD-kvittering fase 1

- [x] Alle viktige flyter og begrensninger dokumentert (`02` + appendiks)
- [x] Screenshots dekker onboarding, hjem, anbefaling/resultat, premiumflyt (+ plan/familie)
- [x] Work har levert separat liste med utfordrede premisser (20 stk.)
- [x] Claude har svart på eller logget hvert vesentlige review-funn (tabellen over)
