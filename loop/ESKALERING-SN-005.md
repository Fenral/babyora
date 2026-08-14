# Eskalering · SN-005

**Status:** EIER · tredje ordinære underkjennelse · `2026-08-14T13:08:18Z`
**Siste grunnlag:** `42e064f8aa6d00a6b4fc4953e0c4fb21e89ea8b1` på `snudly/bygg`

## Hva som er prøvd

1. **Forsøk 1:** Eierbeslutningene ble ført inn i `docs/DECISION-LOG.md`, men dommen fant feil konsollproveniens, fremtidig Snudly-navn beskrevet som implementert og portalpriser fremstilt som verifisert. Underkjent i `loop/verdicts/SN-005-f1.md`.
2. **Forsøk 2:** De tre materielle beslutningsloggfeilene ble rettet og E3 besto. Den signerte requesten oppga likevel feil aktør for en kildeendring og feil diffomfang (2/3 filer mot faktiske 6). Underkjent i `loop/verdicts/SN-005-f2.md`.
3. **Forsøk 3:** Den påkrevde attribusjonen og f2-difftallene ble korrigert. Leveransen introduserte nye E1-motstrider om egen diff, gjentok et uinnfridd BATON-diffstatløfte og brøt G6s eksplisitte `SN-005:`-format i begge commits. Underkjent i `loop/verdicts/SN-005-f3.md`.

## Egentlig hindring

Den materielle beslutningsloggoppgaven ser ut til å være ferdig fra forsøk 2. Hindringen er leveransens dokument- og sporbarhetsprosess: requesten bygges som et langt forhåndsdokument med fremtidige etter-commit-påstander, men blir ikke kontrollert på nytt mot den signerte committen og BATON-overleveringen. Det gir selvrefererende faktafeil i selve evidensen, selv når kjernedokumentet er rettet. G6-formatet ble heller ikke validert mekanisk før commit.

Et fjerde ordinært forsøk skal ikke opprettes. Eier må avgjøre om SN-005 kan godkjennes på det allerede verifiserte materielle innholdet med en separat administrativ opprydding, eller om oppgaven skal erstattes av en ny ID med en kort, etter-commit-generert request og automatisk validering av commit-emne/diffstat.

