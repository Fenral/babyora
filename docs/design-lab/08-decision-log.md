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
| 2026-08-05 | 0 | Sameksistens med parallell skjermøkt dokumentert | Parallell økt committet `0d7cfb2` under auditen (WIP-en + design-lab-stubbene). Design Lab redigerer ikke `src/screens`/`src/styles` uten fersk `git status`-sjekk; skjermløypa fortsetter uforstyrret | Ja | Claude |
| 2026-08-05 | 1 | Fase 1-review sendt til Sol; verdikt **REVIDER** | 6 P0/4 P1/20 utfordrede premisser — se `11-independent-review.md` + `appendix/fase1/sol-review-svar.md`. Fase 2 kan starte; fase 3 får mandat til å forkaste dagens produktform | — | Sol → Claude |
| 2026-08-05 | 1 | P0-4 implementert: paywall-løftet «Del med alle som passer barnet» fjernet | Lovet deling som ikke finnes (`family_sharing=false`, lokal-only). Erstattet med sant løfte («Egen profil for hvert av barna dine») i paywall + Innstillinger. Masterprompt-regel: aldri villedende monetisering | Ja | Sol → Claude |
| 2026-08-05 | 1 | P0-6 implementert: GDPR-prefiksliste utvidet + deterministisk test | Innsyn/sletting dekket ikke `babyora.`-zustand-nøkler, `metno:`-koordinatcache, `nominatim:`, `native-settings:`, `ph_`. Nå full dekning med regresjonstest | Ja (men sletting er irreversibel for bruker — derfor testplikt) | Sol → Claude |
| 2026-08-05 | 1 | P0-3 (hard paywall) akseptert som dokumentert risiko, ikke endret | Eksplisitt eiervedtak 2026-07-31 og eierport i fase 6; Claude overstyrer ikke eierbeslutninger ensidig. Sols motargument arkivert som obligatorisk kandidatinput til fase 6 | — | Claude |
| 2026-08-05 | 6 | **EIERPORT 1 PASSERT — monetiseringsrammer (reversibelt risikovalg)** | Eier rangerte mål: **REKKEVIDDE OG TILLIT** øverst. Alle fire rammer tillatt videre: A Evalueringsport (betinget — må bestå amputasjonstest/tredelt port), B Gratis sikkerhetskjerne, C Institusjonell finansiering, Delta-komponenten. Konsekvens av målrangeringen: **B er primærhypotese** (målkongruent + Sols standardgrense), **A er motkandidat**. Pris/paywall låses IKKE før fase 7-prototyper er testet; dato/budsjett for primærhypotesen settes av eier senere; kill-switches per modellkort gjelder | Ja (reversibelt per Sols portform) | **Eier** |
