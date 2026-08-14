# SN-001 · Dom, forsøk 3

**Grunnlag:** `d1a692212a7aeebd965862a1f26c5e397383a3da` · `2026-08-14T07:01:27Z` · gren `snudly/bygg`
**Kontroll-HEAD:** `7c3413c58828f008cc8cfb21360e0499e0a610e4` · synkron med `origin/snudly/bygg`
**Type:** E · **Innsats:** middels

> Navnet har suffikset `-final` fordi `SN-001-f3.md` er den uforanderlige preflight-blokkeringen fra BATON/commit-racet. Denne filen er den materielle dommen for forsøk 3.

## Preflight

- Oppgavecommitten `d1a6922` har forelder `266067c8`, korrekt emne og trailerne `Review-Request: SN-001` og `Forsoek: 3`.
- HEAD er den etterfølgende administrative committen `7c3413c`, som sporer race-oppløsningen og eiers kappløpsvakt. Den er inspisert separat, er synkron med origin og tilfører ingen ny SN-001-rettelse; oppgavedommen er derfor bundet til `d1a6922` som BATON-konteksten angir.
- Arbeidstreet har de to tidligere dokumenterte snapshotmarkeringene og to usporede kartleggingsnotater for SN-002/SN-005. `git diff --quiet` er 0 for snapshotfilene, og ingen av artefaktene overlapper f3-committen. Kontrollgrunnlaget er verifiserbart, og artefaktene påvirker ikke dommen.

## Portsjekk

| ID | Krav | Resultat | Evidens |
|---|---|---|---|
| G1 | Lint rent | BESTÅTT | `npm.cmd run lint` → exit 0 |
| G2 | Typer rene | BESTÅTT | `npx.cmd tsc --noEmit` → exit 0 |
| G3 | Tester grønne | BESTÅTT | `npm.cmd test` → 209 filer, 3156 bestått, 1 eksisterende todo, exit 0 |
| G4 | Bygget går | BESTÅTT | `npm.cmd run build` → hovedapp og bare-app bygget, exit 0; kjent chunk-advarsel reprodusert |
| G5 | Diffen er avgrenset | BESTÅTT | `266067c8..d1a6922`: 6 filer, alle under `loop/`; ingen produksjonskode eller avhengigheter endret |
| G6 | Commit sporbar | BESTÅTT | `d1a6922`; emne starter `SN-001:` og har riktige review-/forsøkstrailere |
| G7 | Ingen hemmeligheter | BESTÅTT | Diffen inneholder ingen nøkler, tokens, private nøkler eller private URL-er |
| G8 | Ingen rester | BESTÅTT | Ingen nye `console.log`, `debugger` eller umerkede TODO-er |
| G9 | Avhengigheter begrunnet | BESTÅTT | Ingen pakke- eller lockfil endret |
| G10 | Evidens vedlagt | BESTÅTT | Forespørselen inneholder faktisk G1–G4-output; kontrollen reproduserte alle fire |
| E1 | Sant ved skrivetidspunkt | BESTÅTT | LEDGER-korreksjonen dekker `07:30Z`, `08:30Z` og `08:35Z`; f2-requestens stale `PÅGÅR`-påstand korrigeres eksplisitt til committed `TIL KONTROLL` |
| E2 | Datert og kildeført | BESTÅTT | UTC-avlesninger, SHA-er, kommandoer og testgrunnlag er oppgitt og kontrollert |
| E3 | Motstrid håndtert | BESTÅTT | Ingen ny stilltiende overstyring; de to f2-avvikene er eksplisitt korrigert uten å redigere signerte filer |

## Funn

Ingen funn som bryter porter eller skader bruker, sikkerhet eller personvern.

### Merknader uten betydning for dommen

1. Den administrative post-handoff-committen `7c3413c` har samme review-trailere som f3. BATON-teksten og committeksten avgrenser likevel entydig den materielle kontrollen til `d1a6922`; eierens race-retting underkjennes ikke som del av SN-001.
2. De usporede kartleggingsnotatene og snapshotmarkeringene må fortsatt holdes utenfor fremtidige oppgavecommits med mindre den aktuelle oppgaven uttrykkelig trenger dem.

## Dom

**BESTÅTT**
