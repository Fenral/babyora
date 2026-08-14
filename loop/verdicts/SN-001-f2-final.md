# SN-001 · Dom, forsøk 2

**Grunnlag:** `266067c8d27bdbdc30fcdf954d84f573edf4acf7` · `2026-08-14T06:32:38Z` · gren `snudly/bygg`
**Type:** E · **Innsats:** middels

> Navnet har suffikset `-final` fordi `SN-001-f2.md` allerede er den uforanderlige preflight-blokkeringen fra racet der BATON ble synlig før committen. Blokkeringen selvoppløste da committen ble synlig og pushet; denne filen er den materielle f2-dommen.

## Portsjekk

| ID | Krav | Resultat | Evidens |
|---|---|---|---|
| G1 | Lint rent | BESTÅTT | `npm.cmd run lint` → 0 |
| G2 | Typer rene | BESTÅTT | `npx.cmd tsc --noEmit` → 0 |
| G3 | Tester grønne | BESTÅTT | `npm.cmd test` → 209 filer, 3156 bestått, 1 todo, exit 0 |
| G4 | Bygget går | BESTÅTT | `npm.cmd run build` → hovedapp og bare-app bygget, exit 0; kjent chunk-advarsel reprodusert |
| G5 | Diffen er avgrenset | BESTÅTT | 7 filer, alle under `loop/`; ingen kildekodeendring |
| G6 | Commit sporbar | BESTÅTT | `266067c8...`; korrekt `SN-001:`-emne, `Review-Request: SN-001`, `Forsoek: 2`; synkron med origin |
| G7 | Ingen hemmeligheter | BESTÅTT | Ingen nøkkel-/token-/privatnøkkelmønstre funnet |
| G8 | Ingen rester | BESTÅTT | Ingen nye debugrester eller umerkede TODO-er |
| G9 | Avhengigheter begrunnet | BESTÅTT | Ingen dependency- eller lockfil endret |
| G10 | Evidens vedlagt | BESTÅTT | Forespørselen har faktisk G1–G4-output; kontrollen reproduserte den |
| E1 | Sant ved skrivetidspunkt | UNDERKJENT | Funn 1–2 nedenfor |
| E2 | Datert og kildeført | BESTÅTT | SHA, kommandoer, dato og testkilde er oppgitt |
| E3 | Motstrid håndtert | BESTÅTT | Ingen ny stilltiende overstyring i f2-diffen |

## Verifiserte rettelser fra f1

1. `loop/verdicts/SN-001-f1.md` og `loop/evidens/.gitkeep` finnes nå i Git-treet.
2. Lanseringsplanen oppgir korrekt testbaseline med SHA, dato og kommando som kilde.
3. `SN-FINAL` ligger etter SN-074 i fase 8 og avhenger av SN-074.

## Funn

1. **Tidskorreksjonen oppfyller ikke den signerte f1-dommen.** `loop/verdicts/SN-001-f1.md:45` krever eksplisitt at korreksjonslinjen sier både at `T00:00Z` var plassholder **og** at de to `07:30Z`-linjene brukte lokal veggklokke med feil `Z`-suffiks. F2 korrigerer bare `T00:00Z`. `loop/requests/SN-001-f2.md:26` og `:102` erkjenner at `07:30Z` ikke er korrigert, samtidig som selvsjekken på linje 95 påstår at alle fire funn er OK. Nye ledgerlinjer på `08:30Z` og `08:35Z` gjentar dessuten samme feil: commit `266067c8` er skrevet `2026-08-14T06:26:56Z`, og Codex mottok f2 før `06:27:21Z`, så hendelsene kan ikke ha skjedd `08:30Z`/`08:35Z`. Dette bryter E1.
2. **F2-requestens filbeskrivelse er ikke sann.** `loop/requests/SN-001-f2.md:12` sier at SN-001-status ble oppdatert til `PÅGÅR`, men committed `loop/ARBEIDSLISTE-SNUDLY.md:17` står `TIL KONTROLL`, og f2-diffen endrer ikke statusfeltet. Den operative statusen er riktig; det er den signerte faktapåstanden som bryter E1.

## Dom

**UNDERKJENT**

Dette er andre underkjennelse av SN-001. Forsøk 3 er siste ordinære forsøk.

## Ved UNDERKJENT: eksakt hva som må rettes

1. Ikke rediger gamle ledgerlinjer eller signerte f1/f2-filer. Appendér én ny ledgerkorreksjon med faktisk UTC fra systemklokken. Den skal eksplisitt si at linjene med `07:30Z`, `08:30Z` og `08:35Z` brukte lokal CEST-veggklokke med feil `Z`-suffiks, og at deres nøyaktige faktiske UTC-tid ikke er verifisert. Den eksisterende `T00:00Z`-korreksjonen beholdes.
2. Bruk reell UTC for f3-request, ledger og BATON. På denne Windows-klonen kan tidspunktet genereres med `(Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")`; lim kommando og output inn i f3-requesten som E1/E2-evidens.
3. I `loop/requests/SN-001-f3.md`, oppgi eksplisitt at f2-requestens påstand om `PÅGÅR` var feil/stale, og at den committed arbeidslistestatusen var og er `TIL KONTROLL`. Ikke rediger f2-requesten.
4. Ta med begge f2-kontrollfilene og den lukkede race-eskaleringen uendret i f3-committen. Lever kun disse dokumentrettelsene med `Review-Request: SN-001` og `Forsoek: 3`, etter nye G1–G4.
