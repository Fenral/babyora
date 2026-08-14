# Eskalering · SN-003 · Push blokkert (auth)

**Tidspunkt:** 2026-08-14T08:10:26Z (`date -u`)
**BATON:** `EIER · SN-003 · BLOKKERT`
**Blokkert commit:** `92c1263` (SN-003 f1)
**Gren:** `snudly/bygg`

## Hva som skjedde

Commit `92c1263` er laget lokalt og er grønn på G1–G4. Ved `git push
origin snudly/bygg` returnerer serveren:

```
remote: Invalid username or token. Password authentication is not
        supported for Git operations.
fatal: Authentication failed for 'https://github.com/Fenral/babyora.git/'
```

Etterfølgende push-forsøk henger uten output — Git Credential Manager
(`credential.helper = manager`) prøver å åpne interaktiv OAuth-flyt som
ikke er tilgjengelig i loop-konteksten. `GIT_TERMINAL_PROMPT=0` +
`GCM_INTERACTIVE=Never` gir:

```
fatal: Cannot prompt because user interactivity has been disabled.
fatal: could not read Username for 'https://github.com': terminal
       prompts disabled
```

## Diagnose

Forrige push (`f47ef40`, SN-002 FERDIG) gikk gjennom i denne økten uten
prompt, så cachet legitimasjon var gyldig tidligere. Nå avvises den —
enten fordi Personal Access Token eller SSH-token har utløpt eller
blitt rullet, eller fordi GCM har mistet cache-oppføringen. Fetch
(`git fetch origin snudly/bygg`) virker fortsatt, så read-nivået er OK;
det er write-nivået (push) som er brutt.

## Hva eier må gjøre

Ett av følgende:

1. **Fornye Personal Access Token og cache i GCM:**
   - Gå til <https://github.com/settings/tokens> og opprett en ny
     classic PAT med `repo`-scope (eller fine-grained med `Contents: RW`
     på `Fenral/babyora`).
   - I terminal: `git push origin snudly/bygg` og lim inn den nye
     tokenet når GCM spør.
2. **Bytte til SSH-remote:**
   - `git remote set-url origin git@github.com:Fenral/babyora.git`
   - Sikre at `~/.ssh/id_ed25519` er lagt til GitHub-kontoen.
   - `git push origin snudly/bygg`.
3. **Bruke `gh auth login` (GitHub CLI):**
   - `gh auth login` → HTTPS → Yes for auth Git.
   - `git push origin snudly/bygg`.

Så snart pushen er inne (`git rev-list --left-right --count
HEAD...origin/snudly/bygg` = `0 0`), settes BATON tilbake til
`CODEX · SN-003 · FORSOEK-1 · <UTC>` (per ruling 06:53Z, LEDGER linje
23) og loopen fortsetter.

## Hva som IKKE er endret

- Ingen produksjonskode berørt av dette (SN-003 er ren dokumentasjon).
- Ingen konsollhandling (C4 uendret).
- Ingen kredentialer eller hemmeligheter håndtert av byggeren.
- `credential.helper` og git-config er ikke rørt (AGENTS.md §git).
- `loop/SELVSJEKK-BYGGER.md`, snapshotfilene under
  `src/lib/**/__snapshots__/` og `loop/notater/SN-005-kartlegging.md`
  er fortsatt utenfor scope og staged/committed nei.

## Sporing

- LEDGER-linje appendes med samme UTC.
- BATON.md settes til `EIER · SN-003 · BLOKKERT · 2026-08-14T08:10:26Z`.
- Commit `92c1263` ligger klar til å pushes så snart auth er fikset.

---

# Endelig eiereskalering · SN-003 · tredje ordinære underkjennelse

**Tidspunkt:** 2026-08-14T09:43:15Z (`(Get-Date).ToUniversalTime()`)
**BATON:** `EIER · SN-003 · UNDERKJENT`
**Materialcommit:** `7e83c63b7f82fd1c48af30681dbd8a8ff9b54d0c`
**Dom:** `loop/verdicts/SN-003-f3.md`

Den tidligere auth-blokkeringen over er løst. Denne seksjonen er den gjeldende eskaleringen.

## Hva som er prøvd

1. **F1:** La inn en autoritativ avstemming i `STATUS.md`. Underkjent for nye SDK-nøkkelverdier i diffen, rekonstruert build-evidens, ufullstendig/uklar påstandsklassifisering, feil UTC-påstand og manglende eksplisitt navnekonflikt.
2. **F2:** Fjernet nøkkelverdiene fra ny tekst, forsøkte rå G1–G4-output, splittet flere påstander, korrigerte UTC og la inn E3. Underkjent fordi build-output og diffdata ikke stammet fra sluttgrunnlaget, klassifiseringen fortsatt ikke var atomisk, og en usporet lokal fil ble brukt som eierkilde.
3. **F3:** Kjørte portene på nytt, rettet hovedtallene, splittet flere rader og byttet til versjonert Snudly-kilde. G1–G10, G7 og kildepunktet er nå grønne. E1–E3 feiler fortsatt på selvmotsigende sluttdata, en «overlevert»-hendelse før commit/push, ufullstendig atomisk dekning og en uadressert provisjoneringsmotstrid mot `DECISION-LOG.md`.

## Egentlig hindring

Hindringen er ikke produksjonskoden; alle fire tekniske porter har vært grønne. SN-003 forsøker å gjøre ett historisk snapshot, en uttømmende faktarevisjon og selve kontroll-evidensen autoritative samtidig. Requesten og linjereferansene blir målt før dokumentet er stabilt, mens «hver enkelt påstand» gir et åpent dekningskrav som den manuelle tabellen fortsatt ikke oppfyller. Resultatet er at hver retting flytter eller introduserer nye målbare faktafeil.

I tillegg finnes en reell eierkonflikt: `docs/DECISION-LOG.md:211-213` sier at Apple/RevenueCat-provisjoneringen finnes, mens SN-003 klassifiserer konsolltilstanden som udokumentert antakelse. Kontrolløren kan ikke avgjøre hvilken virkelighetsbeskrivelse eier vil stå inne for.

## Eierbeslutning som trengs

SN-003 får ikke et fjerde forsøk. Eier må opprette en ny, avgrenset oppgave etter å ha valgt begge punktene:

1. Fastslå om provisjoneringspåstanden i `DECISION-LOG.md:211-213` fortsatt er sann, eller om den skal merkes historisk/ubekreftet.
2. Erstatt det åpne «hver påstand»-opplegget med en eksplisitt, endelig liste over atomiske påstander, eller flytt det historiske snapshotet til et ikke-autoritativt vedlegg og la én stabil matrise eie status.

Ny oppgave må ha eget ID og nytt grunnlag. Den skal ikke kalles SN-003 forsøk 4.
