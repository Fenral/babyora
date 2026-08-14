# SN-W01 · Dom, forsøk 1

**Grunnlag:** `d83836d8cb8e7350b55cea37b02a57eddfbee32a` · `2026-08-14T16:05:18Z` · gren `snudly/bygg`
**Utgangspunkt:** `f52dbd3772b0c85088354e0ddb2e02dc048601a6`
**Type:** C · **Innsats:** maksimal

## Preflight

- HEAD og `origin/snudly/bygg` er synkrone (`0 0`). BATON peker på `SN-W01 · FORSOEK-1`.
- De to snapshotfilene som vises som `M` har tom `git diff` og er den allerede dokumenterte CRLF-statuseffekten. Ingen staged eller usporede filer finnes. Kontrollgrunnlaget er verifiserbart.
- Oppgavepakken er kontrollert fra `f52dbd3` til HEAD. Materialcommitene er `a438a54` og `2306126`; pakken inneholder i tillegg evidens-, request-, BATON- og LEDGER-commits.

## Portsjekk

| ID | Krav | Resultat | Evidens |
|---|---|---|---|
| G1 | Lint rent | BESTÅTT | `npm.cmd run lint` → exit 0 |
| G2 | Typer rene | BESTÅTT | `npx.cmd tsc --noEmit` → exit 0 |
| G3 | Tester grønne | BESTÅTT | `npm.cmd test` → 210 filer, 3168 bestått, 1 eksisterende todo, exit 0 |
| G4 | Bygget går | BESTÅTT | `npm.cmd run build` → hovedapp og bare-app bygget, exit 0; kjent chunk-advarsel reprodusert |
| G5 | Diffen er avgrenset | BESTÅTT | 15 filer: betalingskode/-tester og nødvendige loopfiler; ingen uvedkommende produksjonsfil |
| G6 | Commit sporbar | UNDERKJENT | `081d054`, `48e3e8b` og kontroll-HEAD `d83836d` mangler både `SN-W01:`-emne og påkrevde trailere; se funn 3 |
| G7 | Ingen hemmeligheter | BESTÅTT | Ingen nøkkel-, token- eller privatnøkkelmønstre i diffen; kun miljøvariabelnavn |
| G8 | Ingen rester | BESTÅTT | Ingen ny `console.log`, `debugger` eller umerket TODO; `console.error` er tilsiktet V5-logging |
| G9 | Avhengigheter begrunnet | BESTÅTT | Ingen pakke- eller lockfil endret |
| G10 | Evidens vedlagt | BESTÅTT | Forespørselen og sporede evidensfiler inneholder faktisk G1–G4-output; kontrollen reproduserte alle fire |
| C1 | Bundle-id urørt | BESTÅTT | Ingen diff i native konfig; `no.klemeg.app` står uendret |
| C2 | Apple-produkt-IDer | BESTÅTT | Nyere eiervedtak V2/V6 overstyrer den beviselig utdaterte C2-teksten: appen skal være produkt-ID-agnostisk; de faktisk provisjonerte ID-ene endres ikke i denne lokale kodediffen |
| C3 | Én sannhet om prøveperiode | UNDERKJENT | Kode/paywall lover 7 dager på begge planer, men ingen versjonert portalobservasjon dokumenterer at månedsplanen faktisk er konfigurert slik; se funn 2 |
| C4 | Ingen konsollhandling | BESTÅTT | Forespørselen erklærer kun lokal Git; ingen konsollendring er påstått eller funnet |
| C5 | Kjøpspåstander krever enhet | BESTÅTT | Ingen påstand om gjennomført fysisk kjøp; implementasjon og mocktester er korrekt avgrenset som kodebevis |
| SYS | Obligatorisk modellruting | UNDERKJENT | Requesten oppgir `Opus 4.7, høy`; entitlement-/betalingsarbeid krever Fable 5 Extra eller godkjent fallback Opus 4.8 Extra; se funn 5 |

## Funn

1. **En feilkonfigurert native build gir falsk kjøpssuksess og gratis Premium.** `src/components/PaywallDialog.tsx:925-934` slår sammen «ingen RevenueCat-nøkkel» og web/dev. På native med manglende nøkkel kaller den `setPremium(true)`, logger konvertering/trial og lukker paywallen som suksess. Dermed nås aldri den nye `purchasePlan()`-grenen `not_configured` i `src/lib/billing/revenuecat.ts:128-132`, og brukeren får ikke den ærlige feilen V5 krever. Dette er brukerskade og et direkte betalings-/entitlementbrudd, ikke en preferanse.
2. **C3 mangler portaldekning.** `src/lib/premium/products.ts:34-48` og `src/lib/premium/paywall-copy.ts:47-90` sier at både måned og år har sju gratisdager. `loop/referanse/EIER-FUNN-PROVISJONERING-2026-08-14.md:68-73` dokumenterer ikke prøveperioder, mens `STATUS.md:66-67,114` eksplisitt beskriver den uløste motstriden mellom kode og tidligere ASC-snapshot. Type C-porten krever identisk omfang i kode, paywall og dokumentert App Store-konfigurasjon.
3. **G6 har ingen dokumentert «admin»-unntaksregel.** `081d054`, `48e3e8b` og den leverte kontroll-HEAD-en `d83836d` starter med `[admin]` og mangler `Review-Request`/`Forsoek`. `loop/requests/SN-W01-f1.md:379-384` gjengir selv faktaskriptets «G6-format BRUDD — dette alene underkjenner», men viser bare til en tidligere praksis. DOD og protokollen gir ikke dette unntaket.
4. **Forespørselen har to faktapåstander uten dekning.** `loop/requests/SN-W01-f1.md:105-108` sier at fallback `299/39` stemmer med `babyora_*` og observasjonen, men produktnavnet er `babyora_monthly_49`, og primærkilden sier uttrykkelig at prisene ikke er verifisert. Linje 338-340 tilskriver dessuten portalobservasjonen eier; primærkilden linje 4 sier at Claude/Fable 5 observerte på eiers instruks, ikke eier. Selve utsettelsen av prisrettingen til SN-W03 underkjennes ikke; de usanne beskrivelsene gjør det.
5. **Obligatorisk modellruting er brutt.** `loop/requests/SN-W01-f1.md:6` oppgir `Opus 4.7, høy`. `docs/CLAUDE-START-HERE.md:17` krever Fable 5 Extra for entitlement og godkjenner bare Opus 4.8 Extra som fallback; høyrisikoarbeid kan ikke nedgraderes stille.

### Standardakse

Én hard feil: modellrutingen i funn 5. Tre vurderingsmerknader uten domsvirkning: plantypen er spredt over flere parallelle tabeller (mulig shotgun surgery/data clump), `PLAN_DISPLAY_NAME` og `PLAN_ARIA_NAME` er duplisert, og flere RevenueCat-tester gjentar samme annual/offering-oppsett.

### Spesifikasjonsakse

Én hard feil: V5 er delvis implementert fordi native `not_configured` blir falsk suksess i PaywallDialog (funn 1). V1 og V2 er ellers implementert uten materiell scope creep. V3/V4/V6 er korrekt fordelt til andre oppgaver.

**Aksesammendrag:** Standarder: 1 hard feil + 3 merknader; verst er obligatorisk modellruting. Spesifikasjon: 1 hard feil; verst er falsk native kjøpssuksess.

## Dom

**UNDERKJENT**

## Ved UNDERKJENT: eksakt hva som må rettes

1. La web/dev-mock være eksplisitt ikke-native. På native skal kjøpsknappen alltid gå gjennom `purchasePlan(plan)`; manglende RevenueCat-konfigurasjon skal vise `not_configured`, aldri kalle `setPremium(true)`, aldri sende konverterings-/trial-event og aldri lukke som suksess. Legg til en regresjonstest som feiler på dagens native snarvei.
2. Lukk C3 uten gjetning: legg ved versjonert portalbevis for prøveperiodens faktiske omfang og samkjør kode/paywall med det. Hvis dette fortsatt eies av SN-008, gjør SN-W01 avhengig av den verifiserte rettelsen og lever f2 etterpå; ikke endre prøveperioden ad hoc i SN-W01.
3. Rett f2-requesten til å si at 39 kr er en eksisterende, uverifisert fallback som SN-W03 eier, og at portaldataene er agentobservert på eiers instruks. Ikke påstå at 39 matcher `babyora_monthly_49` eller at eier utførte lesingen.
4. Lever f2 slik at hver ny commit i oppgavepakken, også evidens/LEDGER/BATON, følger G6 med `SN-W01:`-emne, `Review-Request: SN-W01` og `Forsoek: 2`. Ikke skriv om delt historikk.
5. La en modell tillatt for entitlement-/betalingsarbeid gjennomføre f2 og en selvstendig kontroll av f1-koden: Fable 5 Extra, eller eksplisitt godkjent Opus 4.8 Extra-fallback. Dokumenter modellen og resultatet i f2-requesten.
