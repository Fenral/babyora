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
