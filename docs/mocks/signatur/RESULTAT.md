# Signaturgrep — hvilke klær skal barnet ha på seg

Kjørt 2026-08-11, 08:43–09:05. 6 mekanikker bygget parallelt, deretter 3 blinde dommere.
Data: Iver, 9 mnd, Trondheim, 11°, føles 8°, bris 4,2 m/s, lettskyet, vognsøvn ute.
Fasit: 5 lag — 1 tynt ullsett · 2 fleecesett · 3 vinddress · 4 tynn lue · 5 ullsokker.

Dommerne fikk kun `*-naken.png` (all tekst usynlig) og ett spørsmål:
«Hvor mange lag skal barnet ha, og i hvilken rekkefølge?» De så aldri briefen.

## Tabell

| Grep | Naken-treff (0–3) | Snitt sikkerhet | «Tydeligst»-stemmer | Gråtone holder | Min score |
|---|---|---|---|---|---|
| **snor** | **3/3 rekkefølge** | **68** | **2** | **ja** | **82** |
| lagsnitt | 3/3 rekkefølge | 62 | 1 | **nei** | 48 |
| ringer | 3/3 rekkefølge | 37 | 0 | ja | 55 |
| stabel | 0/3 (retning tvetydig) | 43 | 0 | **nei** | 40 |
| funksjon | 0/3 (antall spriker 3/4/5) | 21 | 0 | ikke vurdert | 45 |
| termometer | **0/3 — to sa «uleselig»** | **5** | 0 | ikke vurdert | 20 |

«Naken-treff» = antall dommere som leste **rekkefølgen** innerst→ytterst riktig.
Ingen kolonne er fylt med gjetning; termometer fikk faktisk 0, 0 og 15 i sikkerhet.

## Vinner: `snor`

[snor.html](snor.html) · [snor.png](snor.png) · [snor-naken.png](snor-naken.png) · [snor-gra.png](snor-gra.png)

To av tre dommere pekte på den uoppfordret som den letteste å lese, den hadde høyest
sikkerhet av alle seks (55/70/78), og alle tre leste rekkefølgen riktig: venstre = tynn og
lys innerst, høyre = tykk og mørk ytterst, med lue og sokker i tillegg.

Den er ikke den peneste. `funksjon` er penere og `ringer` skalerer bedre til ikon. Men den
er den eneste som svarer på alle tre spørsmålene samtidig: **hvor mange**, **hvilke plagg**
(silhuettene er gjenkjennelige — heldress, lue, sokker), og **i hvilken rekkefølge**.

Gråtonetesten bekreftet den. Jeg spådde at tre grønne heldresser ville kollapse i gråtone —
**det var feil**. Valørrampen lys → mid → mørk overlever helt, og lue og sokker holder seg
adskilt. `lagsnitt` og `stabel` kollapser derimot til én grå masse i gråtone.

## Det viktigste funnet: ingen av grepene kommuniserer «5»

Alle tre dommerne svarte **3** på snor, lagsnitt, stabel og ringer. Ikke én sa 5.

Men de tok ikke feil — de skrev alle uoppfordret «pluss lue og sokker». De leser altså
**3 kroppslag + 2 tilbehør**, ikke 5 likestilte lag. Det er sannsynligvis den riktige mentale
modellen for en forelder: du trer tre ting over kroppen, og så tar du på lue og sokker.

Da er det datamodellen som er feil, ikke grepet. En liste på «5 lag» matcher ikke måten en
forelder faktisk tenker påkledning. Dette bør avgjøres før grepet bygges ferdig.

## Termometer er dødt — og det var min feil å tro noe annet

Jeg ga `termometer` 70 av 100 på øyemål. Den blinde testen ga den **5**.

To av tre dommere svarte «umulig å lese — jeg ser staver, ikke klær». Den tredje gjettet 5
med sikkerhet 15. En dommer fanget dessuten en feil ingen av oss så: skalaen leser **baklengs**
— markøren står ved den korteste, lyseste staven, så bildet sier «kaldt = færrest klær».

Dette er hele grunnen til at den blinde testen finnes. Mitt eget øye rangerte den nest best;
måling rangerte den sist. Uten dommerne hadde jeg anbefalt feil grep.

## To feil jeg gjorde underveis

1. **Feil diagnose, meldt som fakta.** Da naken-bildene kom ut tomme, sa jeg at årsaken var
   en CSS-regel i min egen brief (`html.naken * { fill: transparent }`). Jeg sjekket etterpå:
   alle seks filene hadde den **riktige** smale regelen `html.naken text{fill:transparent}`.
   Agentene fulgte advarselen. Den virkelige årsaken var timing — `playwright screenshot`
   skyter ved `load`, mens grepene animerer inn over opptil 1200 ms. Jeg fotograferte
   animasjonenes startbilde. Fikset med `--wait-for-timeout=1800`.
2. **Feil filsti-form.** `file://$PWD/...` gir `/c/Users/...` i Git Bash, som Chromium ikke
   finner. Riktig form er `file:///C:/Users/...`.

## Hva som må gjøres videre

1. **Avgjør datamodellen: 5 lag eller 3 + 2?** Se funnet over. Dette er en eierbeslutning og
   den blokkerer resten.
2. **`snor` mangler ikon-test.** `ringer` beviste 32×32 i hjørnet; `snor` gjorde det ikke. En
   klessnor på 32 px blir trolig grøt. Må testes før den kan bli signaturmerke.
3. **Palettkonflikt.** Du ba om dyp petrol/espresso + ullkrem. DESIGN.md §Glass A (godkjent
   2026-08-10) er blek mint `#F4F7F5` + sage `#3F7067`, og kaller den varme mørke retningen
   «superseded … retained as the optional dark theme». Jeg fulgte din palett fordi du navnga
   verdiene — men da matcher mockene **ikke** appens godkjente lyse tema.
4. **`snor` har «Iver 9 mnd»** — akkurat på 3-ordsgrensen. Vurder om navnet bærer sin plass.
5. **Lua i `snor` er svak.** Byggeagenten flagget selv at den hengende lua kan leses som en
   bjelle eller pose. Dommer 1 kalte sokkene «futter/votter». Silhuettene for lue og sokker
   bør tegnes om.

## Hva jeg ikke rakk

- Gråtone er vurdert for `snor`, `lagsnitt`, `ringer` og `stabel`. **`funksjon` og
  `termometer` er ikke gråtonevurdert** — jeg prioriterte de fire som fortsatt var i spill.
- `bygg:lagsnitt`-agenten døde på en API-feil (ENOTFOUND) etter at den hadde skrevet fila.
  `lagsnitt` fikk derfor aldri steg c (lese egen PNG og rette den). At den likevel kom på
  andreplass i rekkefølge-lesing er verdt å merke seg.
- Ingen av grepene er testet i bevegelse av et menneske; animasjonene er kun verifisert som
  sluttbilde.
