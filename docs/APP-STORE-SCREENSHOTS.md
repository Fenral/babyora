# App Store-skjermbilder — konsept & plan

**Format:** 1290 × 2796 px (iPhone 6.9"), portrett. App Store viser de **3
første** i søk — de må bære verdien alene. 6–8 totalt.

## Hvorfor de skiller seg ut

De fleste baby-/vær-apper viser rå UI + en caption på hvit bakgrunn. Babyora
har tre ting nesten ingen andre har — vi leder med dem:

1. **Den gjennomgående clay-avataren** — en figur som kler seg etter været.
   Emosjonell og minneverdig i en kategori full av grensesnitt-skjermbilder.
2. **Temperatur-reaktive atmosfærer** — full-bleed bakgrunn som skifter
   kjølig→varm. Distinkt palett (natt-plomme + atmosfære), ikke hvit ramme.
3. **Redaksjonell serif** (Fraunces) i overskriftene — føles varmt og premium,
   ikke som en standard sans-caption.

**Grep:** full-bleed atmosfære per skjerm, avataren som helt, én fet serif-
overskrift, og et *glimt* av ekte UI (flytende kort/telefon-utsnitt) — aldri
en naken telefon-på-hvitt. Bruk de 24 R8-avatarene (`public/avatars/verified/`).

## Narrativ (scroller som en liten historie)

| # | Rolle | Overskrift (serif) | Visuell | Palett |
|---|---|---|---|---|
| 1 | **Kroken** (money shot) | «Hvor mange lag i dag?» | Clay-baby i vinterdress over kald atmosfære + grønn «Se dagens antrekk»-CTA | cold |
| 2 | **Ekte vær** | «Vi leser været der dere er» | Temp-mast −4°, «føles som −8°», met.no-merke, værikon | cold→mild |
| 3 | **Dybden/tillit** | «Ull innerst — ytterlag ytterst» | «Innerst først»-plagglista + avatar ved siden | nøytral sand |
| 4 | **Standout-bildet** | «Fra sommer til streng vinter» | SAMME baby i 3 antrekk (sommer/høst/vinter) side om side, hver over sin atmosfære | warm→cold triptyk |
| 5 | **Plus-verdi** | «Se dagene som kommer» | Planlegg-endringsrail (i morgen + fremover) | mild |
| 6 | **Gratis + tillit** | «Gratis hver morgen. Personvern først.» | Morgenvarsel-glimt + «sporer ikke posisjon» | warm |

Valgfrie 7–8: «Vogn eller bæring — ulik varme» (toggle), «Én Pluss, alle som
passer barnet» (når familie lander, R9).

## Design-tokens (fra COLOR-SYSTEM.md)

- **Bakgrunn:** atmosfære-gradient per bucket — cold `#BCCBD6→#E2DBCF`,
  mild `#CFD5D8→#F2E4D2`, warm `#D6DAD8→#F8E2CC`. Mørk variant: natt-plomme.
- **Overskrift:** Fraunces/serif, stor, `text-wrap:balance`, ink `#2B2522`.
- **Aksent/CTA:** granmynte-grønn (som i appen) + terracotta `#AD4B2A` sparsomt.
- **Avatar:** grunnskygge (radial) så figuren «sitter» i scenen.
- **Ingen** status bar (Apple legger til). Ingen cards-i-cards.

## Overskrifts-copy (korte, konkrete — sannferdige)

1. Hvor mange lag i dag?
2. Vi leser været der dere er
3. Ull innerst — ytterlag ytterst
4. Fra sommer til streng vinter
5. Se dagene som kommer *(Pluss)*
6. Gratis hver morgen · Personvern først

Unngå absolutte påstander («alltid riktig») og ekspert-påstander (jf.
veiledende-disclaimer). Copy-linten gjelder også her.

## Produksjon

- Kilde: ekte skjermer fra preview-bygget (deterministisk, seed=demo) +
  R8-avatarene, komponert med atmosfære-bakgrunn + serif-overskrift.
- Kan settes opp som en liten HTML→PNG-mal (1290×2796) med avatar + gradient +
  tekst, eller komponeres i Figma. Jeg kan generere konsept-mockups på
  forespørsel (bruker de 24 avatarene jeg allerede har).
- Lever 6 PNG-er i 1290×2796 til App Store Connect (+ 6.5"-sett hvis nødvendig;
  ASC skalerer ofte fra 6.9").

## Neste steg
1. Godkjenn konseptet (se artefakt-mockup).
2. Jeg bygger en 1290×2796-mal og komponerer de 6 (avatar + atmosfære + serif).
3. Finpuss overskrifter, eksporter, last opp i ASC.
