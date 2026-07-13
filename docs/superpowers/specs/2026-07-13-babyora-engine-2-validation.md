# Babyora Motor 2.0 – validerings- og fagpakke

**Status:** Intern planleggingskontroll ferdig. Ekstern faglig signering gjenstår og er en lanseringsport, ikke en kodeoppgave.

## 1. Formål

Dette dokumentet er den felles kontrollflaten for utvikler, produktansvarlig og fagperson. Det definerer hva som skal testes, hva en fagperson skal ta stilling til, og hvilke grenser som må bestås før Motor 2.0 kan vises for en ny aldersgruppe.

Motoren skal være deterministisk og forklare funksjonelle behov. Den skal ikke fremstille scenarioene under som individuell medisinsk rådgivning.

## 2. Verifisert utgangspunkt 13. juli 2026

Kommandoene ble kjørt i `C:\Users\siver\Documents\Apper 2026\wool-app-main` uten å endre appkode.

| Kontroll | Resultat | Tolkning |
|---|---|---|
| Installerte avhengigheter | Finnes | Repoet kan testes lokalt. |
| `npm test` | Bestått: 27 testfiler, 222 tester | Eksisterende tester er grønt utgangspunkt. |
| `npm run audit:test` | Bestått: 6 testfiler, 19 tester | Revisjonsverktøyet har grønt utgangspunkt. |
| `npm run build` | Bestått, inkludert bare-bygg | TypeScript og begge bygg fullføres. |
| `npm run lint` | Feilet: 17 feil, 2 advarsler | Lint er kjent teknisk gjeld og må være grønn før Motor 2.0 integreres. |
| Git | Ingen `.git`-mappe i denne kopien | Før koding må brukeren enten åpne originalrepoet eller godkjenne initialisering av Git. |

Lintfeilene ligger i `scripts/garment-audit.workflow.js`, `scripts/generate-rules-docs.ts`, flere React-hooks/skjermer, `ownership.ts`, `HjemScreen.tsx`, `UkeScreen.tsx` og `children-store.tsx`. De skal behandles i en egen baseline-oppgave før funksjonsarbeid, slik at nye feil ikke blandes med gammel gjeld.

## 3. Kildegrunnlag og begrensning

| Kilde | Brukes til | Brukes ikke til |
|---|---|---|
| [Helsenorge – sikkerhet for små barn](https://www.helsenorge.no/forstehjelp/sikkerhet-for-sma-barn/) | Lag-på-lag, aktivitet, vind/fukt og kontroll av barnets temperatur. | Eksakte plagg ved hver temperatur. |
| [American Academy of Pediatrics – Winter Safety](https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Winter-Safety.aspx) | Flere tynne/tørre lag, kulde, våthet og aktivitet. | Norske temperaturtabeller eller produktspesifikke råd. |
| [American Academy of Pediatrics – Car Seats](https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Car-Safety-Seats-Information-for-Families.aspx) | Tynne lag i bilstol og unngå tykke plagg under selene. | Valg av konkret bilstol eller godkjenning av tredjepartsprodukter. |
| [Reima – Warm Layers](https://shopify-ca-test.reima.com/category/warm-layers) | Praktiske materialroller: ull/syntet innerst, ull/fleece mellomst og skall ytterst. | Uavhengig helsefaglig dokumentasjon eller produktrangering. |

Kildene støtter prinsippene. Bare en faglig scenariogjennomgang kan godkjenne Babyoras konkrete kombinasjoner og formuleringer.

## 4. Alders- og situasjonsmatrise

| Aldersstadium | Måneder | Primærvalg i UI | Sekundærvalg | Ugyldig input som skal avvises |
|---|---:|---|---|---|
| `newborn` | 0–5 | Vogn, bæresele, våken ute | Søvn inne | Aktiv lek, rolig ute, blandet dag |
| `mobile_baby` | 6–11 | Vogn, bæresele, våken ute | Aktiv lek, søvn inne | Rolig ute, blandet dag |
| `young_toddler` | 12–23 | Aktiv lek, vogn, blandet dag | Rolig ute, søvn inne | Bæresele og våken-lite-bevegelse som standardvalg |
| `toddler` | 24–35 | Aktiv lek, vogn, blandet dag | Rolig ute | Bæresele, søvn i Motor 2.0 |
| `preschool` | 36–71 | Aktiv lek, rolig ute, blandet dag | Ingen nødvendig i første versjon | Vogn, bæresele, søvn i Motor 2.0 |

Produktgrensene beskriver ikke utviklingsmilepæler. UI kan senere støtte en eksplisitt mobilitetsinnstilling, men første Motor 2.0-versjon bruker situasjonen forelderen velger og avviser ugyldige kombinasjoner.

## 5. Materialbeslutninger

| Forhold og rolle | `best_for_conditions` | `prefer_wool` | `avoid_wool` | Må forklares |
|---|---|---|---|---|
| Kaldt/fuktig innerlag | Ull eller fukttransporterende syntet | Ull hvis øvrige krav er like | Fukttransporterende syntet | Fukttransport og hudkontakt. |
| Aktiv lek innerst | Fukttransporterende syntet eller lett ull | Lett ull hvis det ikke gir for mye varme | Fukttransporterende syntet | Aktivitet reduserer isolasjonsbehov. |
| Varmt/tørt/rolig innerst | Lett bomull, lett ull eller syntet | Lett ull bare når det passer varmen | Lett bomull eller syntet | Soldekning og letthet foran materialidentitet. |
| Kaldt mellomlag | Ull eller fleece | Ull | Fleece | Varme, tørketid og plass under skall. |
| Våt/skiftende isolasjon | Syntetisk isolasjon | Syntetisk isolasjon | Syntetisk isolasjon | Ullpreferanse overstyrer ikke funksjonen. |
| Tørt/kaldt isolasjonsplagg | Dun eller syntetisk isolasjon | Dun eller syntetisk isolasjon | Dun eller syntetisk isolasjon | Fukt, volum og aktivitet avgjør. |
| Regn/vind ytterst | Skall | Skall | Skall | Materialpreferanse påvirker ikke værbeskyttelse. |

Invarianter:

1. `avoid_wool` kan aldri gi `material: 'wool'`.
2. `prefer_wool` er en rangering, ikke et krav.
3. Bomull er aldri standard når våthet, lang kuldeeksponering eller mye svette er sentralt.
4. Et skall beskrives etter vind-/vanntetthet og pusteevne, ikke bare som «syntetisk».
5. Manglende ullfri variant er en synlig resolverfeil, ikke en skjult tekstendring.

## 6. Boundary-tester

Hver grense testes på begge sider. Eksakte temperaturgrenser beholdes først fra dagens `bandForTemp()` og endres bare i en separat, faglig godkjent beslutning.

| Område | Verdier som minst skal testes |
|---|---|
| Alder | `-1`, `0`, `5`, `6`, `11`, `12`, `23`, `24`, `35`, `36`, `71`, `72` måneder |
| Temperaturbånd | Én hundredel under, nøyaktig på og én hundredel over hver eksisterende grense |
| Vind | Ingen vind, eksisterende modifikatorgrense på begge sider og sterk vind |
| Nedbør | `0`, eksisterende lett-regn-grense på begge sider og kraftig nedbør |
| Eksponering | `0`, standard 60 minutter, hver kuldevarselgrense på begge sider og lang eksponering |
| Kalibrering | `-1`, `0`, `1`, med og uten sikkerhetspåkrevd plagg |
| Materialpreferanse | Alle tre enum-verdier samt manglende og ukjent lagret verdi |
| Situasjon | Alle gyldige og minst én ugyldig situasjon per aldersstadium |

Negativ alder, ikke-endelige tall og ukjente enum-verdier skal gi en typet valideringsfeil. Motoren skal aldri runde en ugyldig alder inn i et gyldig stadium.

## 7. Gullscenarioer

Tabellen definerer forventede egenskaper, ikke endelig markedsføringstekst. Hvert scenario skal bli én navngitt testfixture og én rad i fagpersonens kontrollskjema.

| ID | Scenario | Input i korte trekk | Forventet kjerne |
|---|---|---|---|
| G01 | Nyfødt mild vogn | 2 mnd, vogn, +12 °C, tørt, rolig | Kroppsdekkende lett base; ingen unødvendig tung isolasjon. |
| G02 | Nyfødt kjølig vogn | 2 mnd, vogn, +4 °C, tørt | Base + isolasjon + vindvurdering; mer varme enn G01. |
| G03 | Nyfødt frost og vind | 3 mnd, vogn, −6 °C, vind | Høy alvorlighet/kuldebeskjed, vindbeskyttelse og begrenset eksponering. |
| G04 | Nyfødt i bæresele under jakke | 4 mnd, bæresele, +2 °C, `innerJakke` | Foreldrekropp/jakke reduserer isolasjon; frie luftveier forklares. |
| G05 | Nyfødt i bæresele utenpå jakke | 4 mnd, bæresele, +2 °C, ikke `innerJakke` | Mer værbeskyttelse enn G04. |
| G06 | Mobil baby varm dag | 9 mnd, våken ute, +22 °C, sol | Lett antrekk og solbeskyttelse; overopphetingsvakt. |
| G07 | Mobil baby kort aktiv lek | 10 mnd, aktiv lek, +14 °C, tørt | Lavere isolasjon enn samme barn i vogn. |
| G08 | Mobil baby regn i vogn | 10 mnd, vogn, +8 °C, regn | Vanntett vognutstyr/skall uten å gjøre barnet unødvendig varmt. |
| G09 | Ung smårolling kald vogn | 15 mnd, vogn, 0 °C | Stillesittende profil og aldersriktig plaggform. |
| G10 | Ung smårolling aktiv kulde | 15 mnd, aktiv lek, 0 °C | Mindre isolasjon enn G09, men samme nødvendige værbeskyttelse. |
| G11 | Ung smårolling blandet barnehagedag | 20 mnd, blandet dag, +7 °C, skiftende | Robust kombinasjon og forklaring av hva som kan tas av/på. |
| G12 | Ung smårolling varm og våt | 22 mnd, aktiv, +18 °C, regn | Lett base og regnbeskyttelse uten tungt mellomlag. |
| G13 | Smårolling aktiv høst | 30 mnd, aktiv lek, +9 °C, tørt | Todelt/heldress etter rolle; aktivitet reduserer varme. |
| G14 | Smårolling rolig høst | 30 mnd, rolig ute, +9 °C, tørt | Minst like mye isolasjon som G13. |
| G15 | Smårolling blandet regndag | 30 mnd, blandet dag, +6 °C, regn | Fuktrobust base/mellomlag og vanntett skall. |
| G16 | Smårolling vogn ved behov | 35 mnd, vogn, +3 °C | Gyldig, stillesittende anbefaling; ikke identisk med aktiv lek. |
| G17 | Førskolebarn aktiv vinter | 48 mnd, aktiv lek, −5 °C, tørt | Aktivitetstilpasset isolasjon, vind-/kuldevakt. |
| G18 | Førskolebarn rolig vinter | 48 mnd, rolig ute, −5 °C, tørt | Minst like varmt som G17. |
| G19 | Førskolebarn våt vinter | 54 mnd, blandet dag, −1 °C, vått | Fuktrobust isolasjon og vanntett skall. |
| G20 | Førskolebarn varm sommer | 60 mnd, aktiv, +24 °C, sol | Minimal varme, solbeskyttelse og væske-/pausecopy uten ulltvang. |
| G21 | Øvre støttet alder | 71 mnd, blandet dag, +5 °C | Gyldig `preschool`-anbefaling. |
| G22 | Ustøttet alder | 72 mnd, valgfri utendørssituasjon | `unsupported_age`, ingen anbefaling. |
| G23 | Ullfri kulde | 18 mnd, vogn, −4 °C, `avoid_wool` | Syntetisk base/fleece; null ullvarianter. |
| G24 | Ullfri aktiv regndag | 42 mnd, aktiv, +6 °C, regn, `avoid_wool` | Fukttransporterende syntet + fleece ved behov + skall. |
| G25 | Ullpreferanse kaldt/tørt | 18 mnd, vogn, −4 °C, `prefer_wool` | Ull rangeres i base/mellomlag, men funksjonelt ytterlag beholdes. |
| G26 | Ullpreferanse vått ytterlag | 42 mnd, blandet, +5 °C, regn, `prefer_wool` | Ull kan brukes under; skall og eventuell syntetisk isolasjon overstyrer preferansen. |
| G27 | Balansert aktiv og svett | 48 mnd, aktiv, +8 °C, høy fukt | Syntet/lett ull rangeres etter fukttransport; bomull ikke standard. |
| G28 | Balansert varm og rolig | 48 mnd, rolig, +21 °C, tørt | Lett bomull er gyldig alternativ; ingen moralsk materialrangering. |
| G29 | Bilstol etter tur | 12 mnd, +1 °C, bilstolkontekst | Ingen tykk dress under selene; trygg alternativ løsning beskrives. |
| G30 | Kalibrering mot varmere | 20 mnd, kaldt, kalibrering `+1` | Maks ett varmetrinn; sikkerhetsregler kjøres etterpå. |
| G31 | Kalibrering mot kjøligere | 20 mnd, mildt, kalibrering `-1` | Maks ett varmetrinn; nødvendig skall/sol/kuldesikring fjernes ikke. |
| G32 | Ekstrem varme spedbarn | 5 mnd, vogn, ekstremt varmt | `HIGH`/`CRITICAL` etter eksisterende policy; pause/skygge fremfor flere plagg. |
| G33 | Ekstrem kulde spedbarn | 5 mnd, vogn, ekstrem kulde | `HIGH`/`CRITICAL`, eksponeringsbegrensning; antrekk alene fremstilles ikke som tilstrekkelig. |
| G34 | Manglende illustrasjon | Gyldig anbefaling med ny syntetvariant | Nøytralt ikon og korrekt tekst; aldri feil ullillustrasjon. |
| G35 | Ugyldig situasjon | 60 mnd, bæresele | `invalid_situation_for_age`, ingen gjetting/fallback til aktiv lek. |
| G36 | Determinisme | Samme komplette input kjøres 100 ganger | Identisk semantisk resultat og fingerprint hver gang. |

## 8. Globale motorinvarianter

Disse testes egenskapsbasert i tillegg til gullscenarioene:

1. Aktiv lek kan ikke gi høyere `insulationWarmth` enn rolig ute med identisk øvrig input, med mindre en navngitt sikkerhetsregel forklarer avviket.
2. Økende nedbør kan ikke fjerne nødvendig vannbeskyttelse.
3. Økende vind kan ikke fjerne nødvendig vindbeskyttelse.
4. Kalibrering kan ikke fjerne et sikkerhetspåkrevd plagg, utstyr eller varsel.
5. `equipment` teller aldri som plagg på barnet.
6. `RecommendationV2` inneholder ingen navn, dato, koordinater eller konto-ID.
7. To inputs som bare skiller seg i barnets navn eller ID gir samme fingerprint.
8. Ingen resolver bruker norsk labeltekst til å avgjøre materiale eller funksjon.
9. Alle valgte plagg er gyldige for aldersstadiet.
10. Alle plagg har stabil rolle, materialfamilie og illustrasjons-ID eller eksplisitt `null`.

## 9. Kompatibilitetskontroll mot dagens motor

Shadow-sammenligning skal skille mellom:

- `equivalent`: samme funksjonelle roller og sikkerhetsnivå;
- `expected_improvement`: bevisst material-, alders- eller forklaringsforbedring;
- `needs_review`: uforklart tap/tillegg av varme, skall, utstyr eller alvorlighet;
- `legacy_bug_preserved`: dagens resultat er kjent feil og må ikke kopieres ukritisk.

For 0–23 måneder kreves:

- alle eksisterende 222 tester fortsatt grønne;
- alle eksisterende guardrail-scenarioer kartlagt til V2;
- null `needs_review` i godkjent scenariofil;
- eksplisitt produktbeslutning for hvert `expected_improvement`.

## 10. Faglig gjennomgang

Fagpersonen får en eksport med én side per gullscenario:

- input og aldersstadium;
- termisk behov før materialvalg;
- valgt plaggrolle og materialfamilie;
- sikkerhetsflagg og norsk tekst;
- forskjell fra dagens motor for 0–23 måneder;
- felt for `approved`, `approved_with_copy_change` eller `rejected`;
- begrunnelse og fagpersonens navn/dato/signatur.

Status før ekstern gjennomgang er **ikke signert** for alle scenarioer. Det er ærlig nåtilstand og betyr at `engine_v2_toddler` og `engine_v2_preschool` skal forbli av.

## 11. Lanseringsporter

| Port | Infant 0–23 | Toddler 24–35 | Preschool 36–71 |
|---|:---:|:---:|:---:|
| Typecheck/build/test/audit/lint grønt | Kreves | Kreves | Kreves |
| Alle relevante gullscenarioer automatisert | Kreves | Kreves | Kreves |
| Eksisterende guardrails består | Kreves | Kreves | Kreves |
| Faglig scenario-signatur | Kreves før produksjon | Kreves | Kreves |
| Korrekte illustrasjoner eller nøytrale fallbackikoner | Kreves | Kreves | Kreves |
| Shadow-sammenligning uten uforklarte avvik | Kreves | Kreves | Kreves |
| Fysisk enhet og tilgjengelighetskontroll | Kreves | Kreves | Kreves |
| Dokumentert rollback | Kreves | Kreves | Kreves |

Ingen poengscore eller visuelt mål på 90+ kan overstyre disse portene.

