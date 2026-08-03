# Lærdom fra Hjem — hva som var engangskostnad og hva som var sløsing

Skrevet 2026-08-03 på eiers spørsmål: *«Jeg opplever at vi bruker veldig mye tid på
detaljer på hjem. Får vi inn alt i .md så vi lærer av feilene? Vil det ta like mye tid
på de andre sidene i appen?»*

Ærlig svar: **nei, de andre sidene tar ikke like lang tid — men bare hvis feilklassen
under blir stoppet systematisk.** Uten det gjentar den seg per skjerm.

---

## Den ene feilen som kostet mest

**En port som ikke kan STRYKE, er ikke en port.** Den har nå opptrådt sju ganger i
dette arbeidet. Hver gang så testene grønne ut mens tingen de skulle måle var feil, og
hver gang var det eieren — ikke instrumentene — som oppdaget det.

| # | Porten | Hva den påsto | Hva som faktisk var galt |
|---|---|---|---|
| 1 | `verify-hjem` v1 | 7 av 8 grønne | Funksjonen den testet fantes ikke ennå |
| 2 | port 7, `[data-screen]`-teller | «én flate synlig» | Telte et element som alltid var 1 |
| 3 | port 1 | «maskoten står stille» | Målte bildene (`inset:0`, alltid 0), ikke ankeret som eier geometrien |
| 4 | port 1, manglende nullpunkt | «1 posisjon» | Ingen prøve FØR trykket — endringen skjedde i selve trykkøyeblikket |
| 5 | port 6 | «stryker på 3214 ms» | Leste avmontering av DOM-noder som bevegelse |
| 6 | `depth.test.ts` | «CTA-skyggen er dempet» | Skyggen er 3,3× LYSERE enn lerretet i mørk modus — den demper en glød og kaller det dybde |
| 7 | `p8-light-mode.test.ts` | «ingen hardkodet hex» | Greper etter hex-litteraler og er derfor strukturelt blind for fire `var()`-baserte kontrastfeil i samme fil |

Nr. 6 og 7 ble funnet av Impeccable 2026-08-03, etter at 1–5 alt var dokumentert i art
bible. **Doktrinen alene stoppet den ikke.** Prosa håndhever ikke seg selv — det er
samme lærdom som `project_babyora_designverifikasjon`, og den gjelder porter like mye
som skjermer.

### Regelen som gjelder fra nå

En ny port får ikke rapportere grønt før den er **mutasjonstestet**: injiser feilen den
skal fange, og se den stryke. Uten det er det grønne lyset uten verdi.

Konkret, slik det ble gjort for port 5 og 6:

```
port 5 ekte (eased)  : 20 vinkler / 22 prøver  andel 0,91  -> BESTÅR
port 5 TRAPP steps(3):  3 vinkler / 18 prøver  andel 0,17  -> STRYKER
port 5 MOMENTANT     :  1 vinkel  /  1 prøve   andel 0,00  -> STRYKER

port 6 ekte          : stillhet 687 ms -> BESTÅR
port 6 med 3400 ms-animasjon injisert: stillhet 14 ms -> STRYKER
```

Og en tilleggsregel fra Impeccables spørsmål: **porten for en regel bør ikke skrives av
den som skrev regelen.** Hver av de sju portene sjekket akkurat det forfatteren tenkte
på, og var taus om det doktrinen faktisk krevde.

---

## Terskler skal ikke måle maskinen

To porter hadde krav på formen «> 8 distinkte verdier». Det måler **bildefrekvens**, ikke
bevegelse: et hopp gir 2 verdier uansett hvor rask maskinen er, mens ekte interpolasjon
på en treg maskin kan gi 8 og stryke. Byttet til **andel** nye verdier mens bevegelsen
pågår. Verifisert på 1×, 4× og 6× CPU-struping: andelen står på 0,91 i alle tre.

Regel: en terskel som endrer seg når maskinen blir tregere, måler feil ting.

---

## Skjermbilder fra desktop-Chromium lyver om toppen

Eieren husket at «avataren var ca. på midten og at det meste var lenger ned på skjermen».
Han hadde rett, og feilen lå i **måleriggen min**, ikke i appen.

`.hjem-monter` bruker `padding-top: max(24px, calc(env(safe-area-inset-top,0px) + 12px))`.
Desktop-Chromium rapporterer `env(safe-area-inset-top)` som **0**, så alle skjermbildene
manglet 20–59 px på toppen.

| | mock | skjermbilde uten safe-area | med ekte safe-area |
|---|---|---|---|
| maskot-topp (430×932) | 94 | 22 | **69** |
| panel-topp | 250 | 174 | **221** |

Avviket mot mocken er altså 28 px, ikke 75. Og iPhone SE er 8 px **verre** enn meldt:
CTA-en ligger −48 px under fold, ikke −40.

Regel: **hvert skjermbilde som skal vurderes av et menneske, må ha safe-area simulert.**
`tools/skjermbilde-hjem.mjs` gjør det ikke ennå — det er en åpen oppgave.

---

## Kontrakter uten forbrukere

`--dw-depth-*` ble skrevet etter eierfunnet «den lyse føles flatere enn den mørke», ble
testet for strukturell integritet — og hadde **null forbrukere** i `src/`. Skjermen som
utløste funnet stod utenfor kontrakten funnet skapte.

Impeccable fant samme mønster ett nivå opp: `--dw-lys-vinkel`, `--dw-kant-key` og
`--dw-kant-fill` fra portdom 27 refereres kun av testen som sjekker at de finnes.

Regel: en test som sjekker at et token EKSISTERER, må også sjekke at noe FORBRUKER det.
Ellers dokumenterer den en intensjon, ikke en tilstand.

---

## Vedtak som blir liggende uportert

Portdom 23 («slå sammen til én linje, fjern bare *sjekk antrekket …*») ble vedtatt i
B1-proofen og aldri portet til appen. Den ble funnet fordi eieren spurte om teksten,
ikke fordi noe fanget den.

Regel: en vedtatt portdom skal ha en **åpen linje i arbeidslisten til den er portert og
verifisert i appen**, ikke bare noteres i proof-notatet.

---

## Hva som var engangskostnad (og altså IKKE gjentas per skjerm)

Dette finnes nå og gjelder alle skjermer:

- **Dybdekontrakten** `--dw-depth-*` med tema-flipp og strukturtest
- **Bevegelsestokenene** `--dw-m-*` / `--dw-ease` og ratchet-testen mot hardkodede varigheter
- **Lysvektoren** (øvre venstre) som doktrine, med målemetode for både flater og assets
- **Klippepipelinen** for plagg (flood-fill + erosjon + skyggediskriminator + hullfyll)
- **Måleinstrumentene**: `verify-hjem` (9 porter, nå CI-gate), `retningslys`,
  `asset-rig-check`, `gradient-retning`, `vitrine-blindtest`, `skjermbilde-hjem`
- **Maskotens trelagsstruktur** (anker → positur → bilder) og krysstoningsregelen
- **Fingerprint-modellen** for CTA-en, utfallsbasert og ikke inndatabasert
- **Art bible** som bindende dokument, med portdommene inne

## Hva som var sløsing

- Omarbeid forårsaket av de sju blinde portene
- To plagg regenerert på feil premiss (referansebildet overstyrte prompt-lyset)
- Tre commits med rød CI fordi jeg leste `tail -3` av testutskriften og aldri så
  oppsummeringslinjen. **Les `Test Files`-linjen, aldri `tail`.**
- Skjermbilder uten safe-area, som ga eieren feil bilde av appen i flere runder

## Hva som fortsatt er ekte arbeid per skjerm

Ca. det samme som Hjem tok *etter* at kontraktene fantes: tokens forbrukes, tilstandene
(tom / laster / feil) tegnes, kontrast måles i begge tema, og skjermen får sine egne
porter. Ikke doktrineutvikling. Ikke instrumentbygging.

Se også [[art-bible-2026-08-02]].
