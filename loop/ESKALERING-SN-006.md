# Eskalering · SN-006

**Status:** Tre ordinære forsøk er underkjent. Ingen f4 er tillatt uten nytt eiervedtak.
**Siste grunnlag:** `ac3cf618f9a82730ffb38ef90526976eba678669` · `2026-08-14T15:02:43Z`

## Hva som er prøvd

1. **Forsøk 1:** Leverte full navnerapport. Underkjent fordi `.no`-kvoten var feil og App Store-, varemerke- og håndtakstilgjengelighet ble konkludert sterkere enn kildene dekket.
2. **Forsøk 2:** Rettet de tre rapportfunnene. Underkjent fordi den signerte f1-dommen ikke var versjonert, Play-delen blandet visningsnavn, Android-`applicationId` og Apple-produkt-ID-er, og LEDGER inneholdt fabrikkert `date -u`-output.
3. **Forsøk 3:** Versjonerte dommene, skilte identifikatorene og appenderte korrekt tidsforklaring. Alle fire tekniske porter bestod. Underkjent fordi rapporten fortsatt gir feil råd om at `.aab`-opplasting er eneste package-navnkontroll, og fordi request/commitlogg feilaktig tilskriver Codex en skriptendring.

## Egentlig hindring

Hindringen er ikke bygg, tester eller rapportstruktur. Den er vedvarende **fakta- og proveniensdisiplin**: Når et eksplisitt funn rettes, introduseres eller beholdes nye påstander som går lenger enn primærkilden, og selve revisjonssporet beskriver feil hvem som gjorde en endring. Dermed kan kontrolløren ikke signere E1/G6 selv om hoveddelen av navnerapporten nå er brukbar.

## Risiko ved å overstyre

- Eieren kan bli ledet til feil Play Console-handling for `no.klemeg.app`.
- Git-historikken vil feilaktig kreditere Codex for en endring kontrolløren ikke gjorde.

## Eierbeslutning nødvendig

Velg enten en eierstyrt, eksplisitt korreksjon uten nytt ordinært forsøk, eller avslutt/erstatt SN-006 med en ny avgrenset oppgave. Signert historikk skal ikke omskrives.
