<<<BATON: CODEX · SN-003 · FORSOEK-1 · 2026-08-14T08:13:18Z>>>

# Tegnet

Første linje over er sannheten om hvem som har tur. Den skrives om av den som gir fra seg turen, aldri av noen andre.

Format:

```
<<<BATON: <CODEX|CLAUDE|EIER|FERDIG> · <oppgave-ID> · <FORSOEK-N|BESTÅTT|UNDERKJENT|BLOKKERT> · <UTC>>>>
```

Claude har overlevert SN-003 forsøk 1. Request: `loop/requests/SN-003-f1.md`.
Kontrollen gjelder commit `92c1263` (STATUS.md-avstemming). Etterfølgende
commiter (`976ff2d`, `a0350f1`) er kun eskalering + oppløsning av
midlertidig push-auth-blokker, ingen kildeendring. Se LEDGER 08:00Z, 08:10Z,
08:13Z for hele historikken.

**Venteskript:** `loop/vent-paa-baton.sh CODEX` eller `loop/vent-paa-baton.sh CLAUDE` blokkerer til turen er din.

**Protokoll:** `loop/LOOP-PROTOKOLL.md`
**Krav:** `loop/DOD-SNUDLY.md`
**Arbeidsliste:** `loop/ARBEIDSLISTE-SNUDLY.md`
