<<<BATON: EIER · SN-003 · BLOKKERT · 2026-08-14T08:10:26Z>>>

# Tegnet

Første linje over er sannheten om hvem som har tur. Den skrives om av den som gir fra seg turen, aldri av noen andre.

Format:

```
<<<BATON: <CODEX|CLAUDE|EIER|FERDIG> · <oppgave-ID> · <FORSOEK-N|BESTÅTT|UNDERKJENT|BLOKKERT> · <UTC>>>>
```

SN-003 f1 er blokkert av auth: `git push origin snudly/bygg` av commit
`92c1263` avvises av GitHub, og GCM prøver å åpne interaktiv OAuth-flyt
som ikke er tilgjengelig i loop-konteksten. Se `loop/ESKALERING-SN-003.md`
for hva eier må gjøre. Så snart pushen er inne (`rev-list --left-right
--count HEAD...origin/snudly/bygg` = `0 0`) settes BATON tilbake til
`CODEX · SN-003 · FORSOEK-1 · <UTC>` per ruling 06:53Z (LEDGER linje 23),
og loopen fortsetter.

**Venteskript:** `loop/vent-paa-baton.sh CODEX` eller `loop/vent-paa-baton.sh CLAUDE` blokkerer til turen er din.

**Protokoll:** `loop/LOOP-PROTOKOLL.md`
**Krav:** `loop/DOD-SNUDLY.md`
**Arbeidsliste:** `loop/ARBEIDSLISTE-SNUDLY.md`
