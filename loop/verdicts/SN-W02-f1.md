# SN-W02 · Dom, forsøk 1

**Grunnlag:** `a2331425099fac0ac28f790eea0ca66c668d671b` · `2026-08-14T16:46:34Z` · gren `snudly/bygg`
**Utgangspunkt:** `aaced3e`
**Type:** E · **Innsats:** middels

## Preflight

- HEAD og `origin/snudly/bygg` er synkrone (`0 0`), og BATON peker på `SN-W02 · FORSOEK-1`.
- De to snapshotfilene som vises som `M` har tom innholdsdiff og er den dokumenterte Windows/CRLF-statuseffekten. Ingen staged eller usporede filer finnes.
- Oppgavepakken består av fire commits fra `e34a23f` til `a233142`; alle har `SN-W02:`-emne og trailerne `Review-Request: SN-W02` og `Forsoek: 1`.

## Portsjekk

| ID | Krav | Resultat | Evidens |
|---|---|---|---|
| G1 | Lint rent | BESTÅTT | `npm.cmd run lint` → exit 0 |
| G2 | Typer rene | BESTÅTT | `npx.cmd tsc --noEmit` → exit 0 |
| G3 | Tester grønne | BESTÅTT | `npm.cmd test` → 210 filer, 3168 bestått, 1 eksisterende todo, exit 0 |
| G4 | Bygget går | BESTÅTT | `npm.cmd run build` → hovedapp og bare-app bygget, exit 0; kjent chunk-advarsel reprodusert |
| G5 | Diffen er avgrenset | BESTÅTT | Full pakke: 10 filer, kun beslutnings-/loopdokumenter og nødvendig request/evidens/BATON; ingen produksjonskode eller avhengighet endret |
| G6 | Commit sporbar | BESTÅTT | Alle fire commits har korrekt `SN-W02:`-emne, `Review-Request: SN-W02` og `Forsoek: 1` |
| G7 | Ingen hemmeligheter | BESTÅTT | Ingen nøkkel-, token-, passord- eller privatnøkkelmønstre i diffen |
| G8 | Ingen rester | BESTÅTT | Ingen ny `console.log`, `debugger` eller umerket TODO |
| G9 | Avhengigheter begrunnet | BESTÅTT | Ingen pakke- eller lockfil endret |
| G10 | Evidens vedlagt | BESTÅTT | Requesten og sporede evidensfiler inneholder faktisk G1–G4-output; kontrollen reproduserte alle fire |
| E1 | Sant ved skrivetidspunkt | UNDERKJENT | To «i dag»-påstander i den nye beslutningsloggen motsier live kode på kontrollgrunnlaget; se funn 1–2 |
| E2 | Datert og kildeført | BESTÅTT | Ny entry ligger under 2026-08-14 og peker eksplisitt på eiervedtaket og den versjonerte portalobservasjonen |
| E3 | Motstrid håndtert | BESTÅTT | Konflikten med 2026-07-15-entryen, gammel C2, Barnetiden, spar-badge og tidligere oppgaveeierskap er eksplisitt behandlet |

## Funn

1. **V4 beskriver ikke branchens tilstand ved skrivetidspunktet.** `docs/DECISION-LOG.md:99` sier «Dagens ankerpriser i koden er 299/99/39 kr». På oppgavens utgangspunkt `aaced3e` og kontroll-HEAD finnes bare `299` og `39` i `src/lib/premium/products.ts:36,43`; kvartalsvarianten og 99-ankeret er allerede fjernet, og `src/lib/premium/paywall-copy.ts:24` har bare `yearly` og `monthly`. Formuleringen var sann da eiervedtaket beskrev førtilstanden, men er usann som udaterte «dagens»-data i en entry skrevet etter SN-W01-f1. Dette bryter E1 og kan gi SN-W03 feil startbilde.
2. **V5 beskriver også en fjernet førtilstand som nåtid.** `docs/DECISION-LOG.md:105-108` sier at `purchasePackage` «returnerer i dag `{ success: false }` uten forklaring». Live kode har ikke lenger denne hjelperen: `src/lib/billing/revenuecat.ts:91-110,128-150` bruker `purchasePlan`, typede feilgrunner og en melding; `src/components/PaywallDialog.tsx:1126-1129` har en synlig feilregion. SN-W01 er fortsatt underkjent/EIER fordi native snarvei omgår denne grenen, så V5 er ikke ferdig — men den konkrete «i dag»-påstanden er likevel usann. Requestens E1-erklæring på `loop/requests/SN-W02-f1.md:133` og «INGEN AVVIK» på linje 181 har derfor ikke dekning.

## Merknad uten domsvirkning

`loop/ARBEIDSLISTE-SNUDLY.md` endrer også SN-W01 fra `KLAR` til `EIER`, selv om filbeskrivelsen i requesten bare nevner SN-W02-statusen. Endringen følger eierens ruling i LEDGER `16:16Z` og er riktig; den påvirker ikke dommen, men bør oppgis i f2-requestens fullstendige diffbeskrivelse.

## Dom

**UNDERKJENT**

## Ved UNDERKJENT: eksakt hva som må rettes

1. I den nye V4-teksten: skill historisk førtilstand fra live branch. Oppgi at koden hadde 299/99/39 da vedtaket ble fattet, men at SN-W01-f1 allerede har fjernet kvartal/99 slik at kontrollgrunnlaget har 299/39; begge gjenværende tall er fortsatt uverifiserte fallbacks som SN-W03 eier.
2. I den nye V5-teksten: beskriv stille `{ success: false }` fra `purchasePackage` som defekten ved vedtakstidspunktet. Oppgi at live branch nå har `purchasePlan` med typet feil, men at V5 fortsatt ikke er godkjent fordi SN-W01-f1 er underkjent/EIER og native snarvei fortsatt kan gi falsk suksess.
3. Lever `loop/requests/SN-W02-f2.md` med fullstendig diffbeskrivelse, nye G1–G4-resultater og korrigert E1-erklæring. Ikke endre produksjonskode som del av SN-W02.
