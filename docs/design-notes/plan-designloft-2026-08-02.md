# Plan: Designløftet — fra veloppdragent til dyrt (2026-08-02)

Bakgrunn: eiers referansesammenligning (Ferrari/Any Distance/pinnsvin-app
m.fl.) + kritisk analyse 2026-08-02. Diagnose: gapet sitter i bildekvalitet,
lys som materiale og komposisjonsmot — ikke i reglene. Planen kombinerer
designløftet med den allerede vedtatte MVP-en (T1+T9A+T2+T2B+T4).

Stegvis godkjenning: hvert steg har synlig leveranse og STOPP der eier
velger. Godkjenning gjelder kun neste steg.

## Ligger fast uansett utfall

Fredningshierarkiet fra analysesløyfen: produktgrunnloven (sannhet,
flatenes jobber, tilgjengelighet, katalogsannhet, motorgrensen),
3,2 s-scannen, haptikk-kontrakten, no.klemeg.app, motoren røres aldri.
Bake-offen utfordrer MERKEVAREKONTRAKTEN (farger, atmosfære, bilder,
komposisjon) — det er nivået som KAN endres ved eksplisitt eierbeslutning,
og dette er den beslutningen.

## Fase A — Art direction-bake-off (ingen kodeendring)

**A1 Referansegrunnlag.** Eiers fem referanser + premium-mønstre fra
Mobbin settes opp som eksplisitt målestokk med kriterier (lys/atmosfære,
billedkvalitet, komposisjon, typografisk mot, materialfølelse).
Leveranse: referansetavle (artifact). Ingen STOPP — går rett i A2.

**A2 Fire verdener.** Samme tre skjermer (Hjem, resultat, Kle på) bygges
som high-fidelity mocks i fire ulike verdener, parallelle agenter +
smaksdommere som scorer MOT referansene (ikke mot egen doktrine):

| Verden | Tese |
|---|---|
| Atelier | Varmt studiolys, stoff-makro, maskoten i scene med kontaktskygge |
| Nattinstrument | Nesten-svart, selvlysende petrol-glass, LED-aktig tallmateriale |
| Scene | Maskoten bor i et renderert rom (à la pinnsvin-appen), UI oppå scenen |
| Monter+ | Dagens retning med atmosfærelag, materialrendret panel, scene-vitrine |

Begge temaer per verden (lys modus får egen tese, ikke inversjon).
Leveranse: artifact-galleri side-om-side med referansene.
**STOPP 1: eier velger verden (eller hybrid).**

**A3 Vinnerens designkontrakt.** DESIGN.md/tokens oppdateres: hva endres,
hva består. Leveranse: kontrast-/RM-verifisert tokenutkast + notat.
**STOPP 2: eier godkjenner kontrakten.**

## Fase B — Billedpipeline (størst «dyrt»-effekt)

**B1 Billedkontrakt + prøvebatch.** Bindende art direction for ALLE
bilder: lysrigg, kameravinkel, materialvokabular, skala, kontaktskygge,
bakgrunnsfarge for utklipp. Prøvebatch: 6 representative plagg + maskoten
re-rendret i vinnerverdenens lys. Leveranse: side-om-side gammel/ny.
**STOPP 3: eier godkjenner utseendet.**

**B2 Full batch.** Alle 60 plagg + 3 maskotposer + værikoner regenerert i
én batch med identisk rigg. Automatisert QA per Sol runde 7 (alfakutt,
normalisert skala, fargeprofil, backplate-klasse) + katalogintegrasjon.
Leveranse: komplett bildebibliotek-artifact. Ingen STOPP (kontrakten fra
B1 styrer).

## Fase C — MVP i vinnerverdenen

Rekkefølge per Sol runde 10, nå med designløftet vevd inn:

| Pakke | Innhold |
|---|---|
| C1 = T1 | Katalogsannhet: 5 mismatcher, 60/60 visningsnavn, B2-bildene inn, katalogfelt-validering (T1B) |
| C2 = T9A | Oppstart/datatilstand: cachematrise, resume ≠ ny prosess, fontberedskap |
| C3 = T2 | Hjem-troverdighet + vinnerens atmosfærelag og materialrendret panel |
| C4 = T2B | Kle på-flytens port: antrekks-avsløringen som komponert scene (Antrekkskart-idéen oppgradert, ikke slettet) |
| C5 = T4 | Scan v3.1: syntesebeat, «Vis antrekket nå», ærlig ventetilstand, samlet landing |

Hver pakke: grønne porter (test/lint/build/e2e) + smaksdommere med
referansebilder i prompten + Sol-sjekk + skjermbilder i full
enhetsoppløsning begge temaer + commit/push → TestFlight.
**STOPP 4: eier tester C1–C3 på telefon før C4–C5.**

## Prosessendringer (gjelder alt videre arbeid)

1. Hver skjerm benchmarkes mot navngitte referanser, ikke bare doktrine.
2. Dommerpaneler får egen smaks-lane med referansebilder i prompten.
3. Mocks vurderes i full enhetsoppløsning før de vises eier.
4. Ambisiøs variant bygges FØRST, doktrinen redigerer etterpå.
5. Billedarbeid skjer aldri uten billedkontrakten fra B1.
