# SN-W02 · Dom, forsøk 2

**Grunnlag:** `b1b735a11b23525e13ee45002bf995261b84fda9` · `2026-08-14T17:06:36Z` · gren `snudly/bygg`
**Utgangspunkt:** `a2331425099fac0ac28f790eea0ca66c668d671b`
**Type:** E · **Innsats:** middels

## Preflight

- HEAD og `origin/snudly/bygg` er synkrone (`0 0`), og BATON peker på `SN-W02 · FORSOEK-2`.
- De to snapshotfilene som vises som `M` har tom innholdsdiff og er den dokumenterte Windows/CRLF-statuseffekten. Ingen staged eller usporede filer finnes.
- Endelig f2-pakke har fire commits fra `d600cbc` til `b1b735a`; alle har `SN-W02:`-emne og trailerne `Review-Request: SN-W02` og `Forsoek: 2`.
- BATON-commiten `b1b735a` ble skrevet mens G1–G4 kjørte, men endret kun `loop/BATON.md` og én LEDGER-linje. Kilde-, test- og byggegrunnlaget var byte-identisk gjennom hele portkjøringen.

## Portsjekk

| ID | Krav | Resultat | Evidens |
|---|---|---|---|
| G1 | Lint rent | BESTÅTT | `npm.cmd run lint` → exit 0 |
| G2 | Typer rene | BESTÅTT | `npx.cmd tsc --noEmit` → exit 0 |
| G3 | Tester grønne | BESTÅTT | `npm.cmd test` → 210 filer, 3168 bestått, 1 eksisterende todo, exit 0 |
| G4 | Bygget går | BESTÅTT | `npm.cmd run build` → hovedapp og bare-app bygget, exit 0; kjent chunk-advarsel reprodusert |
| G5 | Diffen er avgrenset | BESTÅTT | Faktisk full diff: 8 filer, +325/−16; kun korrigert beslutningslogg og nødvendige loop/request/evidensfiler |
| G6 | Commit sporbar | BESTÅTT | Alle fire f2-commits har korrekt emne og begge påkrevde trailere |
| G7 | Ingen hemmeligheter | BESTÅTT | Ingen nøkkel-, passord- eller privatnøkkelmønstre i tillagte linjer |
| G8 | Ingen rester | BESTÅTT | Ingen ny produksjonskode, `console.log`, `debugger` eller umerket TODO |
| G9 | Avhengigheter begrunnet | BESTÅTT | Ingen pakke- eller lockfil endret |
| G10 | Evidens vedlagt | BESTÅTT | Forespørselen inneholder faktisk G1–G4-output; kontrollen reproduserte alle fire |
| E1 | Sant ved skrivetidspunkt | UNDERKJENT | V4/V5 er nå korrekte, men requestens uttrykkelige fullpakke- og LEDGER-regnskap motsier levert HEAD; se funn 1 |
| E2 | Datert og kildeført | BESTÅTT | V4/V5 skiller datert førtilstand fra live branch og bruker historiske SHA-er, live filer og primærkildene |
| E3 | Motstrid håndtert | BESTÅTT | F1-konfliktene er eksplisitt lukket uten å skjule at SN-W01 fortsatt er UNDERKJENT/EIER |

## Verifiserte rettelser fra f1

1. Historisk `f52dbd3` har ankerprisene 299/99/39 og kvartalsvarianten; live branch har bare 299/39 og `PLAN_ORDER = ['yearly', 'monthly']`.
2. Historisk `purchasePackage` returnerte stille `{ success: false }`; live branch har `purchasePlan`, typede feilgrunner og brukervendt melding.
3. Beslutningsloggen sier nå uttrykkelig at V5 ikke er ferdig fordi native snarvei fortsatt kan gi falsk suksess og SN-W01 er UNDERKJENT/EIER.

## Funn

1. **F2-requesten beskriver ikke den leverte pakken sant.** `loop/requests/SN-W02-f2.md:158` kaller `a233142..4a5d928` «Full f2-pakke» og sier at den har «to commits totalt». Levert kontroll-HEAD er `b1b735a`, og `git log a233142..HEAD` viser fire commits: material-, evidens-, request- og BATON-commit. Den faktiske fullpakken er 8 filer og +325/−16, ikke den seksfilers/tocommits-slicen requesten presenterer som full. Også LEDGER-regnskapet er ufullstendig: requestens linje 36 oppgir +2/−0 og beskriver bare én f2-startlinje; den deklarerte slicen har både Codex' f1-domslinje og f2-startlinjen, mens endelig HEAD har +3/−0 etter f2-overleveringslinjen. Selve diffen er avgrenset og V4/V5 er korrekte, men den signerte faktapåstanden bryter E1 og gjør kontrollomfanget misvisende.

## Dom

**UNDERKJENT**

Dette er andre underkjennelse av SN-W02. Forsøk 3 er siste ordinære forsøk.

## Ved UNDERKJENT: eksakt hva som må rettes

1. Ikke rediger den signerte f2-requesten eller V4/V5-teksten. I `loop/requests/SN-W02-f3.md`, skill eksplisitt mellom (a) material-/evidens-slicen `a233142..4a5d928` med to commits og (b) den endelige f2-handoffpakken `a233142..b1b735a` med fire commits, 8 filer og +325/−16.
2. Korriger LEDGER-regnskapet i f3-requesten: `a233142..4a5d928` har +2/−0 fordi den tar inn både Codex' f1-domslinje og Claude-startlinjen; `a233142..b1b735a` har +3/−0 fordi overleveringslinjen kommer i BATON-commiten. Ikke rediger gamle LEDGER-linjer.
3. Lever kun dokument-/loopkorrigeringen med nye G1–G4-resultater og fullstendig E1-erklæring. Ikke endre produksjonskode eller de allerede korrekte V4/V5-avsnittene.
