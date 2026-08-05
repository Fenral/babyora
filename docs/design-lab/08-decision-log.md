# 08 — Decision log (Design Lab)

> Format: dato · fase · beslutning · begrunnelse · reversibilitet · hvem.
> Uenighet mellom Claude (CD/TL) og Work (Review Board) logges her eksplisitt.
> Eldre produktbeslutninger (navn, scope, prosess) ligger i `docs/DECISION-LOG.md` — de
> bevares ikke automatisk: hver av dem skal re-begrunnes eller utfordres i Fase 1–3.

| Dato | Fase | Beslutning | Begrunnelse | Reversibel | Hvem |
| --- | --- | --- | --- | --- | --- |
| 2026-08-05 | 0 | ChatGPT-daemonen restartet med samme profil | Daemon svarte, men nettleservinduet var lukket («Target page closed»). Restart gjenbrukte innlogget økt; verifisert mot Sol-tråden etterpå | Ja | Claude |
| 2026-08-05 | 0 | `daemon.mjs` kopiert inn i repoet (`tools/chatgpt-driver/`) | Masterprompt krever repo som autoritativ hukommelse; driveren lå kun i en midlertidig scratchpad. Profil/innlogging holdes utenfor repo (sensitiv) | Ja | Claude |
| 2026-08-05 | 0 | Uncommittet «Fase 4»-arbeid fra forrige økt ikke rørt | Bygg + tester er grønne med endringene; disposisjon (commit/forkast) hører til Fase 1-auditen, ikke miljøauditen | Ja | Claude |
| 2026-08-05 | 0 | `ui-ux-pro-max`-suiten oppdatert til v2.11.0 | Eksplisitt eierinstruks midt i økten; gammel versjon backupet i `~/.claude/skills-backup-2026-08-05\` | Ja | Eier → Claude |
| 2026-08-05 | 0 | Ingen re-klon av Fenral/babyora | Eier sendte `gh repo clone Fenral/babyora`; repoet finnes allerede lokalt, er i sync med origin og har uncommittet arbeid som en re-klon ville skygget. Verifiserte remote + fetch i stedet | Ja | Claude |
| 2026-08-05 | 0 | Fase 0 erklært ferdig uten Work-review | Masterprompten unntar Fase 0 fra review med mindre miljøvalg begrenser produktvalg — ingen slike valg ble tatt | Ja | Claude |
