# Klemeg — kritiske funn for helsesøster-validering

Disse 8 punktene gjelder temperatur-terskler, safety-regler eller sikkerhets-kommuniserende tekst. **Ingen er endret.** Hvert punkt har: hva motoren gjør i dag, hvorfor det er flagget, kilde, og foreslått endring. Trenger faglig OK før noe røres.

## 1. `pyjamas` — tekst↔logikk

- **Funn:** «Når»-teksten («18-21 °C med sovepose ca 1.0 TOG») beskriver et scenario der motoren velger tynn-pyjamas, ikke pyjamas. Pyjamasens faktiske bruksområde er 5-15 °C med 2,5 TOG. Brukerflaten motsier motoren, med risiko for at forelder underkleder barn i kjølige rom.
- **Foreslått endring:** Endre when-tekst til noe à la «Kjøligere soverom, ca 5-15 °C, sammen med langermet body og sovepose 2.5 TOG» — eller juster baseTable hvis intensjonen var 18-21 °C. Legg til en CI-sjekk som sammenligner when-tekstens temperaturbånd/TOG mot baseTable-oppslaget for hvert plagg.
- **Claude ga:** 80/100 · **Fable ga:** 63/100

## 2. `regntrekk` — seleksjon vs kilder

- **Funn:** PRAM_COVER_RE (safety.ts linje 55) matcher ikke 'regntrekk', så HB-8 (linje 229-248, fjerning ved feels >= 22 °C) får aldri virke. Kombinert med at modifiers.ts:143-145 trigger uten temperaturbetingelse kan tett plasttrekk anbefales i tropisk/varm-band ved regn — kjent drivhus-/overopphetingsrisiko (Lullaby Trust/SIDS).
- **Foreslått endring:** Forslag (ingen tall/terskler endres): utvid PRAM_COVER_RE til å inkludere 'regntrekk' (og norske synonymer som 'regnfilm', 'vogntrekk'), slik at eksisterende HB-8 omfatter plagget. Alternativt: legg et eksplisitt overoppheting-flagg på regntrekk i varm-band til medisinsk gjennomgang er gjort.
- **Claude ga:** 83/100 · **Fable ga:** 57/100

## 3. `sauekinn-i-vogn` — seleksjon vs kilder

- **Funn:** Soevn-ekskluderingen dekker ikke vognlur: spedbrn sover de facto i vogn, og saueskinn velges i alle kuldebånd uten alders-gate. Claudes 'hoy' undervurderer at det eneste tekniske sikkerhetsnettet (soevn-flagget) er irrelevant for den vanligste risikosituasjonen.
- **Foreslått endring:** Innfør håndhevd alders-gate (softBlock eller hard gate) for alder < 4 mnd, vurder utvidelse til < 12 mnd i tråd med trygt-sovemiljø-veiledning; alternativt krev eksplisitt bekreftelse ('barnet er våkent og under tilsyn') før plagget vises for spedbarn.
- **Claude ga:** 78/100 · **Fable ga:** 64/100

## 4. `sovepose-1-0-tog` — tekst↔logikk

- **Funn:** «Når»-teksten («18–21 °C») motsier motorens faktiske seleksjon (kun 22–23 °C); ved 18–21 °C velger motoren 2.5 TOG. Forelder som følger teksten kan velge for tynn pose i kjølig rom.
- **Foreslått endring:** Endre «Når» til «Romtemperatur 22–23 °C» slik at tekst og motor samsvarer, ELLER (produktbeslutning, ikke min terskel-endring) vurder om motorens vindu skal utvides mot standard TOG-tabeller (1.0 TOG ≈ 21–24 °C). Tekst og motor må uansett peke på samme intervall.
- **Claude ga:** 77/100 · **Fable ga:** 57/100

## 5. `sovepose-2-5-tog` — seleksjon vs kilder

- **Funn:** 2.5 TOG velges urørt i kjølig-båndet (5-9 °C romtemp) uten minimums-TOG-gulv og uten advarsel om at rommet er under trygt spedbarnsnivå. Lullaby Trust/NHS-rammeverket tilsier 3.5 TOG + ekstra lag allerede under ~16 °C.
- **Foreslått endring:** Innfør eskaleringsregel i kjølig-båndet: anbefal varmeste tilgjengelige pose + ekstra lag, OG vis en eksplisitt 'rommet er kaldere enn anbefalt for barn'-advarsel. Ikke endre eksisterende terskler — legg til håndtering for båndene som i dag faller gjennom.
- **Claude ga:** 70/100 · **Fable ga:** 51/100

## 6. `to-ullsett` — tekst↔logikk

- **Funn:** 'When'-teksten ('Streng frost og lavere') lover bruk fra -8, men CK-6 erstatter plagget med 'ullsett tykt' ved feels > -15. Foreldre som følger teksten manuelt overkler barnet i nettopp det intervallet motoren beskytter mot — med svette-i-kulde-risiko.
- **Foreslått endring:** Omformuler when til å speile faktisk guard, f.eks. 'Ekstrem kulde — når tykt ullsett ikke strekker til.' Ingen terskler endres.
- **Claude ga:** 75/100 · **Fable ga:** 67/100

## 7. `tynn-pyjamas` — tekst↔logikk

- **Funn:** Claude klassifiserte tekst↔motor-avviket som «hoy», men det bør være kritisk: teksten («>22 °C + sovepose lett») inverterer motorens faktiske vindu (16-21 °C + 2,5 TOG) på begge parametre, og kan lede foreldre til å bruke tynn pyjamas i varme rom der motoren bevisst fjerner den. Total på 80/100 var for snill gitt at dette er et sikkerhetskommuniserende felt.
- **Foreslått endring:** Skriv when om til faktisk logikk, i søsken-malen: «Romtemperatur 16-21 °C, sammen med langermet body og sovepose 2,5 TOG.» Ingen endring i motor/terskler.
- **Claude ga:** 80/100 · **Fable ga:** 65/100

## 8. `tynt-teppe` — tekst↔logikk

- **Funn:** App-teksten ('Varme dager i vogn — som lett tildekking') anbefaler eksplisitt tildekking av vogn i varme, i strid med HB-8, notes.stroller.noBlanket og pediatrisk veiledning om overoppheting/redusert lufting. Teksten er synlig for brukere uavhengig av motorens seleksjon og utgjør dermed et frittstående feilråd.
- **Foreslått endring:** Skriv om when/whyForGarment til kjølige/milde forhold (f.eks. som lag over bena i mild temperatur, aldri over kalesjen, aldri over ansiktshøyde) og legg til samme sikkerhetsformaning som dunteppe/saueskinn har.
- **Claude ga:** 67/100 · **Fable ga:** 44/100


_Generert fra Fable 5-verdiktene i Stadium B. Se REPORT.md for full kontekst._
