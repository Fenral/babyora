# 00 — Master brief: Babyora Design Lab

> Opprettet 2026-08-05. Kilde: eiers masterprompt
> `C:\Users\siver\Documents\Codex\2026-08-05\referenced-chatgpt-conversation-this-is-an\outputs\babyora-design-lab-masterprompt-creative-director-review-board.md`
> Dette dokumentet er den bindende orkestreringsplanen for Design Lab-arbeidet. Ved konflikt
> med eldre prosessdokumenter i `docs/` gjelder masterprompten for Design Lab-løpet;
> `AGENTS.md` sine sikkerhets-, kostnads- og git-regler gjelder alltid.

## Mandat

Komplett program for produktstrategi, native UX, visuell identitet, etisk monetisering,
implementering og validering. Målet er en kategoridefinerende native app som profesjonelle
designere opplever som både overraskende og åpenbart bedre i bruk. Ikke optimaliser for å
være annerledes — optimaliser for å være genuint bedre.

## Roller

| Rolle | Aktør | Mandat |
| --- | --- | --- |
| Creative Director + Technical Lead (hovedorkestrator) | Claude Code — Claude Fable 5, maks effort på irreversible valg | Retning, research, konsepter, arkitektur, implementering, kvalitetsporter |
| Independent Design Review Board | ChatGPT Work — GPT-5.6 Sol, maks reasoning | Utfordre, angripe antakelser, avvise middelmådighet. Verdikt: AVVIS / REVIDER / PASS |
| Eier | Sivert | Godkjenner kun: (1) endelig designretning, (2) freemium/pris/paywall, (3) representativ prototype, (4) full utrulling/lansering |

Claude kan foreslå retning men ikke selv erklære den validert. Alle vesentlige kreative,
produktmessige og visuelle valg reviewes av Work før de låses. Claude må implementere eller
begrunnet avvise hvert P0/P1-funn fra Work. Uenighet logges i `08-decision-log.md`.

## Bindende arbeidsregler

1. Repositoryet er autoritativ hukommelse — ikke samtaler eller faner.
2. Ingen fase avsluttes uten dokumentert DoD.
3. Historiske produktvalg bevares ikke uten eksplisitt begrunnelse.
4. Referanser analyseres, tilpasses eller forkastes — aldri kopieres.
5. Optimaliser for tillit, klarhet, tilgjengelighet, varig verdi og betalingsvilje — aldri mørke mønstre.
6. Full app bygges ikke før representativ prototype har passert review-loop + eierport.
7. Uenighet dokumenteres; konsensus kan ikke lates som.

## Faseoversikt

| Fase | Navn | Eierport |
| --- | --- | --- |
| 0 | Environment & Capability Audit | — |
| 1 | Product Audit | — |
| 2 | User Reality | — |
| 3 | Challenge the Brief | — |
| 4 | Global Native Design Research | — |
| 5 | Mobbin Research | — |
| 6 | Challenge the Business | ✅ monetiseringsretning |
| 7 | Three Radical Directions | — |
| 8 | Feasibility & Decision Gate | ✅ endelig designretning |
| 9 | Representative Prototype | — |
| 10 | Independent Visual Review | — |
| 11 | Review Loop | ✅ godkjenn prototype |
| 12 | Full Implementation | — |
| 13 | Launch Readiness | ✅ lansering |

Fasenes fulle DoD-krav står i masterprompten (kilden over). `state.json` viser aktiv fase.

## Review-kontrakt (Work)

Hver forespørsel til Work inneholder: fase, beslutning, brukerproblem, suksesskriterier,
bevismateriale, begrensninger, Claudes hypotese, åpne spørsmål. Hvert svar følger formatet:

```text
Verdikt: AVVIS | REVIDER | PASS
Kort tese / P0-P1-funn / P2-P3-funn / Antakelser som må bevises /
Hva Claude ikke har vurdert / Alternative retninger / Krav for neste review
```

PASS er kun gyldig når Work eksplisitt begrunner det og bekrefter null åpne P0/P1-funn.
Claude kan ikke omskrive Works verdikt.

## Arbeidsflater

- **Claude:** dette repoet + web-preview (vite preview + Playwright screenshots) + Mobbin MCP.
- **Work:** ChatGPT Work-tråden «Designkritikk Babyora App», nås maskinelt via
  Playwright-daemonen (se `01-environment-audit.md` § ChatGPT-driver).
- Feiler automatiseringen: dokumentér, skriv `20-next-handoff.md`, fortsett ublokkert arbeid,
  aldri fabrikker Work-svar.
