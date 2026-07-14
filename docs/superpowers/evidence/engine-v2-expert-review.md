# Motor 2.0 — faglig kontrollpakke (Task 16)

**Status: IKKE SIGNERT.** Ekstern faglig gjennomgang er en lanseringsport — verken `engine_v2_infant` (0–11 mnd) eller `engine_v2_young_toddler` (12–24 mnd) kan aktiveres før relevant kohort er signert `approved`. Fagpersonen godkjenner prinsipper og scenarioer, ikke kildekode.

## Innhold

- **Scenariofilen:** [engine-v2-scenarios.json](./engine-v2-scenarios.json) — alle 36 gullscenarioer (G01–G36), generert deterministisk fra motoren med `npm run engine:v2:review`. Per scenario: input, termisk behov før materialvalg, valgte plaggroller/materialer, sikkerhetsflagg m/norsk tekst, forskjell fra dagens motor, og blanke felter for `approved` / `approved_with_copy_change` / `rejected` + begrunnelse/navn/dato/signatur.
- **Kildegrunnlag og avgrensning:** validerings-spec §3 (Helsenorge, AAP, Reima) — kildene støtter prinsippene; kun faglig gjennomgang kan godkjenne konkrete kombinasjoner.

## Tekster som krever faglig blikk (HIGH/CRITICAL)

**Porterte fra dagens motor (byte-identiske — allerede i produksjon):**
HB-9 (bilstol), HB-1 (søvn/hodeplagg), CK-9 (bæresele-i-jakke), SB-7 (ekstrem varme < 6 mnd), SB-8 (frostskade-sjekk).

**NYE i Motor 2.0 (ny copy — må godkjennes eksplisitt):**
| Kode | Alvorlighet | Tekst |
|---|---|---|
| HB-V2-HEAT | HIGH | «Varmt vær — mellomlag og isolasjon er tatt bort for å unngå overoppheting.» |
| HB-V2-EXTREME-HEAT | HIGH | «Veldig varmt — pauser i skygge og rikelig drikke betyr mer enn plaggvalget nå.» |
| HB-V2-EXTREME-COLD | HIGH | «Ekstrem kulde — hold turen svært kort. Påkledning alene er ikke nok i denne kulda.» |
| HB-V2-NB-COLD | HIGH | «Spedbarn under 3 mnd: maks 30 min ute i kuldegrader. Sjekk nakke og rygg ofte.» (≤ 3 mnd, legacy-semantikk) |
| HB-V2-POUCH | MEDIUM | «Mildt vær — vognpose er tatt bort så vognen ikke blir en varmefelle.» |

## Strukturelt umulige legacy-regler (til orientering, ikke godkjenning)

V2-katalogen inneholder ingen tepper, soveposer, svøp eller vektede produkter — HB-2/3/4/5/6/7/10 og CK-1/3/4/5/8 kan derfor ikke trigges i V2 og er garantert av katalogvalidering + sikkerhetsportens idempotens. Søvn/TOG forblir eget verktøy på dagens motor.

## Kjente presiseringer til gjennomgangen (fra uavhengig teknisk dom)

1. V2-CK-9 fjerner alt ytterlag i bæresele-i-jakke (legacy fjernet kun «barnejakke») — semantisk utvidelse, vurderes eksplisitt.
2. HB-V2-POUCH er defensiv redundans (egen pipeline legger aldri vognpose ≥ 18 °C) — ikke en aktiv produksjonsregel.
3. Shadow-klassifisereren bruker foreløpig tekstlig regnbeskyttelses-sjekk; flyttes til strukturelle felter før shadow-porten (Task 17) lener seg på den.

## Prosess

1. Fagperson går gjennom scenariofilen side for side og fyller `faglig`-feltene.
2. `rejected` scenarioer går tilbake til relevant task med failing regresjonstest.
3. Kun `approved` kan aktivere en kohort — 0–11 først (`engine_v2_infant`), 12–24 som egen signatur og egen commit (Task 17).
