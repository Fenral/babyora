# Babyora Motor 2.0 – planpakke

## Beslutningen

Motoren skal støtte utendørs påkledning fra fødsel til skolestart, definert som `0–71` måneder. `72+` er utenfor støttet område. Søvn/TOG forblir separat og avgrenset til `0–24` måneder.

Motoren beregner først funksjonelt behov og velger deretter materiale og plaggform. Ull, fukttransporterende syntet, fleece, bomull, skall, syntetisk isolasjon, dun og blandingsmaterialer er legitime valg med ulike roller.

Brukeren kan velge per barn:

- Velg etter forholdene – standard.
- Foretrekk ull når det passer.
- Unngå ull – hard begrensning.

Dette er gratis og skal ikke kreve garderoberegistrering.

## Arkitekturen

```text
vær + alder + situasjon + eksponering + kalibrering
                         ↓
                  termisk behov
                         ↓
               funksjonelle materialvalg
                         ↓
             aldersriktige plagg og utstyr
                         ↓
                   sikkerhetsregler
                         ↓
                 RecommendationV2
                         ↓
       adapter til dagens UI mens appen migreres
```

Motor 2.0 bygges ved siden av dagens motor. Shadow mode sammenligner resultatene uten å vise V2 til brukeren. Deretter aktiveres spedbarn, smårolling og førskolebarn hver for seg.

## Ferdige dokumenter

- [Designspesifikasjon](C:/Users/siver/Documents/Apper%202026/wool-app-main/docs/superpowers/specs/2026-07-13-babyora-engine-2-design.md)
- [Validerings- og fagpakke](C:/Users/siver/Documents/Apper%202026/wool-app-main/docs/superpowers/specs/2026-07-13-babyora-engine-2-validation.md)
- [Detaljert implementeringsplan](C:/Users/siver/Documents/Apper%202026/wool-app-main/docs/superpowers/plans/2026-07-13-babyora-engine-2-plan.md)
- [Oppdatert masterplan](C:/Users/siver/Documents/Apper%202026/wool-app-main/docs/superpowers/plans/2026-07-13-babyora-90-plus-master-plan.md)

## Kontrollgrunnlag

- 36 navngitte gullscenarioer.
- Aldersgrenser testet på begge sider.
- Alle situasjoner validert per aldersstadium.
- Materialmatrise for alle tre preferanser.
- Globale invarianter for aktivitet, vind, regn, kalibrering, personvern og determinisme.
- Eksisterende sikkerhetsregler må bestå.
- Legacy-adapter, feature flags og rollback er del av planen.
- Fagpersonen vurderer scenarioer, ikke kildekode.

## Verifisert baseline

- `npm test`: bestått, 27 testfiler og 222 tester.
- `npm run audit:test`: bestått, 6 testfiler og 19 tester.
- `npm run build`: bestått, inkludert bare-bygg.
- `npm run lint`: feilet med 17 feil og 2 advarsler; dette er registrert som første oppryddingsoppgave.
- Denne repo-kopien mangler `.git`; ingen kode bør endres før Git-porten er løst.

## Det som fortsatt krever andre enn kodeagenten

1. Brukeren velger originalt Git-repo eller godkjenner initialisering.
2. Relevant fagperson signerer gullscenarioene før nye aldersgrupper aktiveres.
3. Navn/varemerke/domene kontrolleres før offentlig navnebytte.
4. Fysiske iOS-/Android-enheter brukes for haptikk, widget og tilgjengelighet.
5. Nye illustrasjoner godkjennes visuelt; nøytrale fallbackikoner brukes fram til da.

