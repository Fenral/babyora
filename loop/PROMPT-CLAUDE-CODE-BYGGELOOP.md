# Startprompt til Claude Code · bygger i Snudly-byggeloopen

Du bygger Snudly ferdig til App Store. Codex kontrollerer hver oppgave. Loopen går til hele arbeidslisten står `FERDIG` og `SN-FINAL` er bestått.

Du er ikke ferdig når du har levert én oppgave. Du er ferdig når produktet er ferdig.

## Modell og innsats

Fable 5 er utilgjengelig. **Opus 5 er hovedmodell.**

| Arbeid | Modell | Innsats |
| --- | --- | --- |
| Hovedloopen, oppgavevalg, dømmekraft, syntese | Opus 5 | høy |
| Motor, betaling, personvern, sikkerhet | Opus 5 | maks |
| Skjermarbeid, komponenter, motion | Opus 5 | høy |
| Rutinemessig implementasjon med tydelig fasit | Opus 5 | middels |
| Mekaniske sveip: filklassifisering, tekstbytte, opptelling | Sonnet | lav |
| Rene filoperasjoner uten vurdering | Haiku | lav |
| Kontroll og dom | Codex | maks på B og C, ellers høy |

Flytt aldri en oppgave nedover et nivå hvis den kan påvirke hva brukeren får se eller hva motoren anbefaler. Oppgi alltid i forespørselen hvilken modell og innsats som ble brukt hvis du avvek fra tabellen.

## Første gang du starter

```bash
git clone https://github.com/Fenral/babyora.git snudly
cd snudly
git checkout -b snudly/bygg 71084992fecb3722c7f900b80ae7152050eeec0e
mkdir -p loop/requests loop/verdicts loop/evidens
# kopier inn loop-dokumentene og skriptet, gjør skriptet kjørbart
chmod +x loop/vent-paa-baton.sh
```

Les `loop/LOOP-PROTOKOLL.md`, `loop/DOD-SNUDLY.md` og `loop/ARBEIDSLISTE-SNUDLY.md` i sin helhet. Legg `snudly-mock.html` og `SNUDLY-DESIGNSYSTEM.md` i `loop/referanse/` — de er fasit for alt visuelt.

Sett første tegn og start:

```
<<<BATON: CLAUDE · SN-001 · FORSOEK-1 · <UTC>>>>
```

## Syklusen

1. Ta øverste oppgave med status `KLAR` og alle avhengigheter `FERDIG`. Sett `PÅGÅR`. Hopp over `EIER`-oppgaver og gå videre nedover.
2. Bygg den. For alt med logikk: test først, se den feile, så implementer. For alt visuelt: sammenlign mot mocken underveis, ikke først til slutt.
3. Kjør alle globale porter selv. **Send aldri noe til kontroll som ikke passerer dine egne porter** — det koster et forsøk og du har bare tre.
4. Skriv `loop/requests/SN-###-f<N>.md` med faktisk kommandoutput. Skjermbilder til `loop/evidens/SN-###/`.
5. Commit med trailer `Review-Request: SN-###` og `Forsoek: <N>`. Push til `snudly/bygg`.
6. Sett `BATON: CODEX`, skriv én linje i `LEDGER.md`, og kall `loop/vent-paa-baton.sh CLAUDE`.
7. **BESTÅTT:** sett oppgaven `FERDIG`, ta neste. **UNDERKJENT:** rett nøyaktig det dommen krever — ikke mer, ikke mindre — øk forsøksnummer, tilbake til steg 3.

Du stopper ikke for å spørre meg mellom oppgaver. Du har mandat til å kjøre hele listen.

## Forespørselen

```markdown
# SN-### · Forespørsel, forsøk <N>

**Oppgave:** <hva som skulle gjøres>
**Type:** <A–E> · **Modell/innsats:** <hva som ble brukt>
**Filer:** <liste, med én linje om hva som endret seg i hver>

## Porter kjørt
```
$ npm run lint
<faktisk output>
$ npx tsc --noEmit
<faktisk output>
$ npm test
<faktisk output — antall tester før og etter>
$ npm run build
<faktisk output>
```

## Avgjørelser underveis
<Rulings: hva som ble bestemt, hvorfor, hva det koster hvis feil>

## Avvik fra mock eller designsystem
<Ingen, eller listet med begrunnelse>

## Det jeg er minst trygg på
<Ærlig. Dette er ikke en svakhet, det er der Codex skal se nøyest.>
```

Siste linjen er ikke pynt. En forespørsel som påstår at alt er trygt, får en kontrollør som må lete blindt.

## Dynamiske workflows

Bruk fan-out der arbeidet er parallelliserbart og etterprøvbart. Én agent per uavhengig område, aldri delt tilstand mellom dem.

| Navn | Når | Form |
| --- | --- | --- |
| **W-VERIFY** | Hver type A-oppgave før kontroll | Parallelt: lint+typer, tester, skjermbilde lys, skjermbilde mørk, kontrastmåling, trykkflater. Samles til én evidensblokk. |
| **W1 Navnesjekk** | SN-006 | Parallelle søkere: App Store, Play, domene, varemerke, håndtak → én syntese med GO/NO-GO |
| **W-GREN** | SN-007 | Én agent per gren, dømmer mot mocken, ingen ser hverandres dom → syntese |
| **W3 Navnesveip** | SN-012 | Filene klassifiseres parallelt i endre / aldri endre / usikker. Usikre eskaleres, resten endres i egen commit med diff-gjennomgang |
| **W4 Skjermbilder** | SN-043 | Seks bilder rendres parallelt, kontroll per bilde, kontaktark til slutt |
| **W5 Feilstater** | SN-052 | Matrise: feilstat × tema × tekststørrelse som pipeline, skjermbilde per celle |
| **W-DOK** | SN-003, SN-004 | Én leser per dokument mot kode/konsoll, funn → rettelser → uavhengig etterkontroll |

Regler: maks femten agenter i én workflow, hvert funn skal ha filreferanse, en kontrolleragent avslutter alltid, og ingen workflow utfører irreversible handlinger.

## Grenser

Du har fullt mandat i byggegrenen: commit, push, refaktorering, filoppretting, avhengigheter du kan begrunne.

Du stopper og setter `BATON: EIER` ved:

- **Kostnad over 500 kr.** Skriv estimatet i eskaleringen.
- **Tre underkjente forsøk** på samme oppgave.
- **Teknisk blokkering** der alle veier videre er gjetning.
- **Irreversible handlinger uten pengeverdi:** Play-produkt-IDer, App Store-innsending, sletting av data eller grener, endring av bundle-id eller Apple-produkt-IDer.

Alt annet avgjør du selv, og fører beslutningen i `LEDGER.md` som en ruling.

## Låst grunnlag

- Designfasit er `snudly-mock.html`: fire faner, lys som standard. Repoets design-lab-beslutninger om tre faner og dark-first er overstyrt av eier 14.08 og skal ikke gjenopplives.
- Bundle-id `no.klemeg.app` og Apple-produkt-IDene endres aldri. Snudly er visningsnavn.
- Motor v2 forblir avslått til fagsignatur foreligger.
- Prøveperiode: 7 dager på alle planer.
- Rust betyr klesbytte. Situasjonsmerket er status, ikke knapp. Ingen nøstede kort.

## Works plandom

`SNUDLY-LANSERINGSPLAN-V2.md` kontrolleres av ChatGPT Work parallelt. Når kritikken kommer, legg hvert `ENDRE`/`AVVIS` inn som ny oppgave med prefiks `SN-W###` og fortsett. Bare sikkerhets-, personvern- eller betalingsblokkere stopper loopen.
