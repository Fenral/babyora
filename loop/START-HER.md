# Start byggeloopen

Du trenger to terminaler: én for Claude Code (bygger), én for Codex (kontrollør). De snakker sammen gjennom filer i `loop/`, ikke direkte.

## 1. Sett opp klonen

I en tom mappe der du vil ha byggingen:

```bash
git clone https://github.com/Fenral/babyora.git snudly
cd snudly
git checkout -b snudly/bygg 71084992fecb3722c7f900b80ae7152050eeec0e
mkdir -p loop/requests loop/verdicts loop/evidens loop/referanse
```

Kopier hele `loop/`-mappen fra denne leveransen inn i `snudly/loop/`, og legg designfasiten i referansemappen:

```bash
cp "…/discussion/snudly-mock.html"        loop/referanse/
cp "…/discussion/SNUDLY-DESIGNSYSTEM.md"  loop/referanse/
cp "…/discussion/SNUDLY-LANSERINGSPLAN-V2.md" loop/referanse/
chmod +x loop/vent-paa-baton.sh
git add loop && git commit -m "Loop: protokoll, krav og arbeidsliste på plass"
```

## 2. Start Claude Code

I mappen `snudly`:

```
claude
```

Lim inn hele `loop/PROMPT-CLAUDE-CODE-BYGGELOOP.md` som første melding. Den inneholder alt: modellvalg, arbeidsliste, grenser, workflows.

Sett modell til Opus 5 med høy innsats. Fable 5 er utilgjengelig og skal ikke velges.

## 3. Start Codex

I en annen terminal, i samme mappe:

```
codex
```

Lim inn hele `loop/PROMPT-CODEX-KONTROLLOOP.md`. Første handling Codex gjør er å kalle venteskriptet — den blokkerer til Claude Code har levert noe.

## 4. La den gå

Fra nå av kjører loopen selv. Den stopper bare når:

- noe koster mer enn 500 kr,
- samme oppgave er underkjent tre ganger,
- en oppgave krever fysisk enhet, konsolltilgang eller innsending,
- eller alt er ferdig.

Da står det `BATON: EIER` i `loop/BATON.md`, og det ligger en `ESKALERING-*.md` som forteller hva som trengs.

## Slik ser du hvor det står

```bash
head -1 loop/BATON.md                  # hvem har tur akkurat nå
tail -20 loop/LEDGER.md                # hva som har skjedd
grep -c "FERDIG" loop/ARBEIDSLISTE-SNUDLY.md   # hvor mange oppgaver er ferdige
ls loop/verdicts/                      # alle dommer
```

## Hvis noe låser seg

Begge parter venter på tegnet, så en lås viser seg som at `BATON.md` ikke endrer seg. Sjekk i denne rekkefølgen: står det `EIER` (da venter den på deg), kjører begge prosessene ennå, og har venteskriptet timet ut. Ved timeout: start den parten som mangler på nytt med samme prompt — tilstanden ligger i filene, ikke i samtalen.

## Når Work leverer plandommen

Legg `18-WORK-PLANKRITIKK-RUNDE-1.md` i `loop/referanse/` og si til Claude Code at den er der. Den legger inn nye oppgaver med prefiks `SN-W###` og fortsetter uten å starte på nytt.
