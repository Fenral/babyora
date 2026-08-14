# SN-W02 · Dom, forsøk 3

**Grunnlag:** `a3d290980a98ed6dcca8ced2cdc3dd59e80a26fe` · `2026-08-14T17:48:08Z` · gren `snudly/bygg`
**Utgangspunkt:** `b1b735a11b23525e13ee45002bf995261b84fda9`
**Type:** E · **Innsats:** middels

## Preflight

- HEAD og `origin/snudly/bygg` er synkrone (`0 0`), og BATON peker på `SN-W02 · FORSOEK-3`.
- De to snapshotfilene som vises som `M` har tom innholdsdiff og er den dokumenterte Windows/CRLF-statuseffekten. Ingen staged eller usporede filer finnes.
- F3-pakken har fem commits fra `447ef63` til `a3d2909`; alle har `SN-W02:`-emne og trailerne `Review-Request: SN-W02` og `Forsoek: 3`.

## Portsjekk

| ID | Krav | Resultat | Evidens |
|---|---|---|---|
| G1 | Lint rent | BESTÅTT | `npm.cmd run lint` → exit 0 |
| G2 | Typer rene | BESTÅTT | `npx.cmd tsc --noEmit` → exit 0 |
| G3 | Tester grønne | BESTÅTT | Sekvensiell `npm.cmd test` → 210 filer, 3168 bestått, 1 eksisterende todo, exit 0 |
| G4 | Bygget går | BESTÅTT | `npm.cmd run build` → hovedapp og bare-app bygget, exit 0; kjent chunk-advarsel reprodusert |
| G5 | Diffen er avgrenset | BESTÅTT | 6 filer, +432/−10; kun request, tidligere dom, LEDGER/BATON og refanget evidens |
| G6 | Commit sporbar | BESTÅTT | Alle fem f3-commits har korrekt emne og begge påkrevde trailere |
| G7 | Ingen hemmeligheter | BESTÅTT | Ingen nøkkel-, passord- eller privatnøkkelmønstre i tillagte linjer |
| G8 | Ingen rester | BESTÅTT | Ingen produksjonskode, `console.log`, `debugger` eller umerket TODO lagt til |
| G9 | Avhengigheter begrunnet | BESTÅTT | Ingen pakke- eller lockfil endret |
| G10 | Evidens vedlagt | BESTÅTT | Forespørselen inneholder faktisk G1–G4-output; kontrollen reproduserte alle fire |
| E1 | Sant ved skrivetidspunkt | BESTÅTT | Begge f2-slicer, LEDGER-linjer og f3-prediksjonen er kryssjekket mot Git og matcher endelig HEAD |
| E2 | Datert og kildeført | BESTÅTT | Requesten binder påstandene til konkrete SHA-er, kommandoer og UTC-tider |
| E3 | Motstrid håndtert | BESTÅTT | Den signerte f2-feilen korrigeres eksplisitt uten å redigere f2-requesten; V4/V5 forblir urørt |

## Verifisert

1. Material-/evidens-slicen `a233142..4a5d928` har 2 commits, 6 filer, +81/−15 og LEDGER +2/−0: Codex' f1-domslinje og Claude f2-startlinjen.
2. Endelig f2-handoff `a233142..b1b735a` har 4 commits, 8 filer, +325/−16 og LEDGER +3/−0: de samme to linjene pluss f2-overleveringslinjen i BATON-commiten.
3. Endelig f3-pakke `b1b735a..a3d2909` har de forutsagte 5 commitene og 6 unike filene. `docs/DECISION-LOG.md`, den signerte f2-requesten og all produksjonskode er byte-urørt.

## Funn

Ingen funn som påvirker dommen.

Byggerens første G3-kjøring hadde en timeout under maskinbelastning. Den refangede kjøringen var grønn, og kontrollørens uavhengige sekvensielle kjøring passerte alle 210 testfiler uten timeout. Dette er derfor ikke et portbrudd i SN-W02.

## Dom

**BESTÅTT**
