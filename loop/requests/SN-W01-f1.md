# SN-W01 · Forespørsel, forsøk 1

**Oppgave:** Betaling — appen skal spørre RevenueCat om plantype (måned/år), ikke
om Apples produkt-ID; kvartal fjernes; kjøp skal aldri feile stille. Kilde:
`loop/referanse/EIERVEDTAK-BETALING-2026-08-14.md` (V1/V2/V5).
**Type:** C (kode + tester, ingen konsollhandlinger). **Modell/innsats:** Opus 4.7, høy.
**Bygger fra:** `f52dbd3772b0c85088354e0ddb2e02dc048601a6`
(`[admin] SN-W01/W02/W03 eiervedtak om betaling og oppdatert arbeidsliste`).
**Utgangspunkt for f1-diff:** `f52dbd3..48e3e8b` (fire commits i samme f-runde;
begge material-commits bærer `Review-Request: SN-W01` og `Forsoek: 1`; evidens-
commitene er `[admin]`-commits uten trailere per prosjektkonvensjon).

## 1. Hva ble bygget, og hvordan det møter eiervedtaket

**V1 — kun to planer (måned og år). Kvartal utgår.**

- `src/lib/premium/products.ts` (−40/+17): `PRODUCTS` er nå `Record<PlanKey, …>`
  med kun `yearly` (299 kr, 7 dagers trial) og `monthly` (39 kr, 7 dagers trial).
  Typen `ProductKey` er borte, erstattet av `PlanKey = 'yearly' | 'monthly'`.
  `PRODUCT_IDS`-konstanten (med Apple-produkt-ID-strengene `no.klemeg.app.*`) er
  fjernet fra fila i sin helhet — appen kjenner ikke lenger Apples produktnavn.
  `DEFAULT_PLAN` er `'yearly'`; `priceTransparencyText('monthly')` gir nå
  «Deretter 39 kr/mnd. Avslutt når som helst.» (7 dagers trial).
- `src/lib/premium/paywall-copy.ts` (−48/+21): `PLAN_ORDER = ['yearly', 'monthly']`;
  aria-labels, plan-noter (`Fornyes månedlig` for måned), fornyelses-kadens og
  spar-utregning trukket ned til to planer. Månedlig-ekvivalent for år
  regnes fortsatt fra `PRODUCTS.yearly.description` og gir 24,90 kr/mnd (299/12).
- `src/components/PaywallDialog.tsx` (−9/+16): `selectedPlan` er nå
  `PlanKey | null`, plan-radene rendres via `PLAN_ORDER` (to rader), og
  aria/tekst-referanser til «Kvartal / 99 kr / per kvartal» er borte.
  Snapshots av eksisterende v2-designkontrakt (fylt radio ved `:checked`,
  breakdown vises bare når en plan er valgt, m.m.) står uendret — kun antall
  plan-rader er endret fra 3 til 2.

**V2 — appen spør RevenueCat om PLANTYPE, ikke Apple-produkt-ID.**

- `src/lib/billing/revenuecat.ts` (−20/+106): `purchasePackage(id: string)` er
  erstattet av `purchasePlan(plan: PlanKey)`. Oppslaget går via
  `PACKAGE_TYPE.ANNUAL` / `PACKAGE_TYPE.MONTHLY` i det aktive tilbudet:
  ```
  const wantedType = PLAN_TO_PACKAGE_TYPE[plan];
  const pkg = offering.availablePackages.find(
    (p) => p.packageType === wantedType,
  );
  ```
  RevenueCat-tilbudet avgjør hvilket faktisk butikk-produkt det er per plattform.
  `PLAN_TO_PACKAGE_TYPE` er eksportert (Ruling 4, seksjon 5) slik at V1-testen
  kan bekrefte fravær av kvartal på runtime-nivå (ikke bare i TS-unionen).

**V5 — kjøp skal aldri feile stille. Alle avslag har typet grunn og brukertekst.**

- `PurchaseResult` er nå en diskriminert union:
  ```
  export type PurchaseFailureReason =
    | 'not_configured'
    | 'no_offering'
    | 'plan_unavailable'
    | 'no_entitlement'
    | 'user_cancelled'
    | 'store_error';

  export type PurchaseResult =
    | { success: true; customerInfo: CustomerInfo }
    | { success: false; reason: PurchaseFailureReason; message: string };
  ```
  Hver grunn er slått opp i `REASON_MESSAGE` inne i `revenuecat.ts` — den er
  ETT sannhetspunkt for brukervendte V5-tekster (Ruling 2, seksjon 5).
  Alle logg-linjer i `purchasePlan` inneholder reason-koden (`no_offering`,
  `plan_unavailable`, `store_error`, `no_entitlement`) slik at loggen er ærlig
  og maskinlesbar. `user_cancelled` avledes fra `err.userCancelled` fra
  RevenueCat-plugin uten å logges som feil.
- `src/components/PaywallDialog.tsx`: kjøpsgrenen kaller `purchasePlan(plan)`
  og viser `result.message` i alert-panelet, unntatt for `user_cancelled` som
  fjerner feilmeldingen (avbrudd er ikke feil) og hopper over feil-haptikk.
  Analytics-hendelsene (`paywall_converted`, `trial_started`) og
  `setPremium(true)` er urørt fra tidligere.

**Testdekning i f1-pakken.**

- Ny fil `src/lib/billing/__tests__/revenuecat.test.ts` (+355) dekker fire
  aspekter i 14 tester: (a) V1 plantyper — `PLAN_TO_PACKAGE_TYPE` inneholder
  KUN yearly/monthly (runtime-verifikasjon av at kvartal er borte), og
  `purchasePlan('yearly')` plukker faktisk en pakke med `PACKAGE_TYPE.ANNUAL`;
  (b) V2 plantype-lookup med regresjon som verifiserer at appen ikke matcher
  på lookalike Apple-produkt-ID (`no.klemeg.app.yearly` som `product.identifier`,
  men ikke `packageType === ANNUAL` → `plan_unavailable`); (c) V5 hver
  feilgren mapper til typet reason + tekst + logg; (d) suksess-banen returnerer
  `{ success: true, customerInfo }` og entitlement-mangel gir `no_entitlement`
  (ikke stille `false`).
- `src/lib/premium/__tests__/products.test.ts` (−26/+15): tester for kvartal
  og `PRODUCT_IDS` fjernet; nye negative assertions verifiserer at
  `PRODUCT_IDS`, `no.klemeg.app`, `quarterly`, `pappaperm` og `3 mnd` ikke
  lenger opptrer som kildetekst.
- `src/lib/premium/__tests__/paywall-copy.test.ts` (−6/+1): «kvartal aria-label»
  slettet; «alle tre produkter har trial» endret til «begge produkter».
- `src/components/__tests__/PaywallDialog.test.tsx` (−5/+4): plan-rad-tellingen
  gikk fra 3 til 2, assertions for `>Kvartal<` / `per kvartal` / `33 kr` / `99 kr`
  er borte (positive negasjoner verifiserer også at de er fjernet).

**Ikke rørt i f1 (bevisst utenfor scope).**

- V3 er en *observasjon* om reelle Apple-produkt-IDer (`babyora_yearly_299`,
  `babyora_monthly_49`). De hører til RevenueCat-tilbudet, ikke appkoden;
  poenget i V2 er at appen ikke skal bry seg om Apples navn i det hele tatt.
- V4 (priser LESES, ikke antas) er kvittert som eieroppgave (SN-W03); f1
  beholder ankerpriser 299/39 som fallback per V4 andre avsnitt («ekte pris
  skal alltid komme fra RevenueCat»). Tallene stemmer med `babyora_*` og med
  eiers observasjon.
- V6 (DoD C2 + DECISION-LOG) er allerede fordelt til SN-W02.
- `AppPaywallGate`, onboarding-copy, telemetri-payloads og RevenueCat init/
  restore-flow er urørt. Bundle-id `no.klemeg.app` (DoD C1) er ikke berørt.

## 2. Filer i f1-diffen (numstat, ikke skalert graf)

```
$ git diff --numstat f52dbd3..48e3e8b
5	0	loop/evidens/SN-W01/g1-lint.txt
1	0	loop/evidens/SN-W01/g2-tsc.txt
14	0	loop/evidens/SN-W01/g3-test.txt
76	0	loop/evidens/SN-W01/g4-build.txt
16	9	src/components/PaywallDialog.tsx
4	5	src/components/__tests__/PaywallDialog.test.tsx
355	0	src/lib/billing/__tests__/revenuecat.test.ts
106	20	src/lib/billing/revenuecat.ts
1	6	src/lib/premium/__tests__/paywall-copy.test.ts
15	26	src/lib/premium/__tests__/products.test.ts
21	48	src/lib/premium/paywall-copy.ts
17	40	src/lib/premium/products.ts
```

12 filer, +631/−154. Herav 4 evidens-filer (+96) og 8 material-filer (+535/−154).

**Commits i f1-pakken (fire stykker, i tidsrekkefølge):**

| SHA | Emne | Innhold |
|---|---|---|
| `a438a54` | «SN-W01: appen kjøper plantype, ikke Apple-produkt-ID; kjøp feiler aldri stille» | Første material-commit (+527/−152 over 8 filer); trailer `Review-Request: SN-W01`, `Forsoek: 1` |
| `081d054` | «[admin] SN-W01 f1 G1-G4 evidens» | Første evidens-runde (+91 over g1-g4); ingen trailere per admin-konvensjon |
| `2306126` | «SN-W01: retter selvsjekk-funn — JSDoc, dead PURCHASE_ERROR_MESSAGE, V1-tautologi, dead try/catch» | Andre material-commit (+41/−35 over 4 filer); retter fire funn fra rødt lag mot HEAD 081d054; trailer `Review-Request: SN-W01`, `Forsoek: 1` |
| `48e3e8b` | «[admin] SN-W01 f1 G1-G4 evidens rekjørt mot post-fix HEAD» | Andre evidens-runde (+37/−32); g1/g2 var byte-identiske og ikke i denne diffen |

**Grep-verifikasjon av at Apple-produkt-ID ikke lenger nevnes i PRODUKSJONSkode:**

```
$ git grep -n "no.klemeg.app" -- \
    src/lib/billing/revenuecat.ts \
    src/lib/premium/products.ts \
    src/lib/premium/paywall-copy.ts \
    src/components/PaywallDialog.tsx
(ingen treff)
```

Testfilene i samme mappetre inneholder strengen bevisst — regresjonstesten i
`src/lib/billing/__tests__/revenuecat.test.ts:199,205` bruker
`product.identifier = 'no.klemeg.app.yearly'` som lokkefugl for å bevise at
oppslaget ikke matcher på produktnavn (V2-krav), og
`src/lib/premium/__tests__/products.test.ts:90` er en negativ assertion om at
strengen ikke lenger opptrer i products.ts-kilden. En bredere grep
(`-- src/lib/billing/ src/lib/premium/ src/components/PaywallDialog.tsx`) gir
derfor tre treff — alle i testfiler, ingen i produksjonskode. Bundle-id-strengen
`no.klemeg.app` finnes fortsatt i `android/app/build.gradle:6,13` og
`docs/DECISION-LOG.md` — det er DoD C1 (bundle-id) som skal stå urørt, ikke
DoD C2 (produkt-ID) som er den som er feil og SN-W02 sitt scope.

## 3. Leveransefakta (rått fra `loop/leveranse-fakta.sh SN-W01`)

```
=== LEVERANSEFAKTA SN-W01 ===
generert: 2026-08-14T15:53:29Z  (date -u)

--- HEAD ---
sha:      48e3e8b0dfe7c13909b0e16c235432dbf015c1bb
emne:     [admin] SN-W01 f1 G1-G4 evidens rekjørt mot post-fix HEAD
forfatter:2026-08-14T17:53:16+02:00

--- trailere ---
MANGLER TRAILERE

--- G6-format ---
BRUDD: emnet starter IKKE med 'SN-W01: ' — dette alene underkjenner (G6)

--- diff mot forelder ---
 2 files changed, 37 insertions(+), 32 deletions(-)

--- per fil (numstat: eksakt, ikke skalert graf) ---
3	3	loop/evidens/SN-W01/g3-test.txt
34	29	loop/evidens/SN-W01/g4-build.txt

--- dommer og evidens som må være sporet ---
OK sporet:   loop/evidens/SN-W01/g1-lint.txt
OK sporet:   loop/evidens/SN-W01/g2-tsc.txt
OK sporet:   loop/evidens/SN-W01/g3-test.txt
OK sporet:   loop/evidens/SN-W01/g4-build.txt
(alt relevant er sporet)

--- synk mot origin ---
HEAD:     48e3e8b0dfe7c13909b0e16c235432dbf015c1bb
upstream: 48e3e8b0dfe7c13909b0e16c235432dbf015c1bb
OK: pushet og synkron

rev-list --left-right --count HEAD...@{upstream}:
0	0

=== SLUTT SN-W01 ===
```

**Merknad om «MANGLER TRAILERE» / «G6-format BRUDD»:** faktaskriptet inspiserer
kun HEAD (som er evidens-committen `48e3e8b`, en `[admin]`-commit uten
Review-Request-trailere per prosjektkonvensjon — samme mønster som SN-006 f3
`[admin]`-evidens-commit `f830f13` som *også* mangler trailere i sin
faktaskript-inspeksjon). De to material-commitene bærer trailerne:

```
$ git log -1 --format='%B' a438a54 | tail -n 3
Review-Request: SN-W01
Forsoek: 1

$ git log -1 --format='%B' 2306126 | tail -n 3
Review-Request: SN-W01
Forsoek: 1
```

## 4. Porter kjørt (sitater fra `loop/evidens/SN-W01/`; ANSI-koder strippet i g4-sitatet)

```
$ tail -n 6 loop/evidens/SN-W01/g1-lint.txt

> babyora@0.1.0 lint
> eslint .

EXIT=0
```

```
$ tail -n 4 loop/evidens/SN-W01/g2-tsc.txt


EXIT=0
```

```
$ tail -n 8 loop/evidens/SN-W01/g3-test.txt


 Test Files  210 passed (210)
      Tests  3168 passed | 1 todo (3169)
   Start at  17:49:31
   Duration  158.93s (transform 10.39s, setup 0ms, import 35.57s, tests 446.77s, environment 30ms)

EXIT=0
```

```
$ sed 's/\x1b\[[0-9;]*m//g' loop/evidens/SN-W01/g4-build.txt | tail -n 6
computing gzip size...
dist/bare/index.html                  0.54 kB │ gzip:  0.35 kB
dist/bare/assets/index-NIgpWZ0E.js  281.23 kB │ gzip: 87.18 kB

✓ built in 150ms
EXIT=0
```

Testtelling: 3168 bestått + 1 todo på 210 filer (opp fra 3156+1 / 209 i SN-006 f3).
Differansen er 12 nye tester i `src/lib/billing/__tests__/revenuecat.test.ts`
(14 nye tester minus 2 slettede kvartal-tester i products/paywall-copy).
Ingen tester er endret eller fjernet utenfor kvartal-scopet.

## 5. Avgjørelser underveis

- **Ruling (2026-08-14T15:20Z):** Reason-koden `not_configured` returneres både
  når RevenueCat-nøkkelen mangler (`isRevenueCatConfigured() === false`) og når
  vi kjører på web (`Capacitor.isNativePlatform() === false`), for å gi paywallen
  ett stabilt kall å svare på. Alternativet var to separate reasons; valgt løsning
  gir én brukervendt tekst og én kodesti å teste. Kostnad hvis feil: brukeren får
  «kjøp ikke aktivert» også for web-utviklingsbygg — akseptabelt, web er ikke
  kjøpsplattform.
- **Ruling (2026-08-14T15:25Z):** `PLAN_TO_PACKAGE_TYPE` bruker enum-verdiene
  `PACKAGE_TYPE.ANNUAL`/`MONTHLY` fra `@revenuecat/purchases-capacitor` direkte i
  stedet for hardkodede strenger, slik at plugin-versjonsdrift ikke stille bryter
  oppslaget. Testene mocker enumen (via `vi.importActual` spread) slik at test-
  fixturene får identisk verdi.
- **Ruling (2026-08-14T15:30Z):** Mockingen av `@capacitor/core` gjøres via
  `vi.importActual` og spread (`{ ...real, Capacitor: { ...real.Capacitor, … } }`)
  fordi `@revenuecat/purchases-capacitor` importerer `registerPlugin` fra
  `@capacitor/core` — en flat objekt-mock ville brutt plugin-registreringen.
  Første forsøk krasjet nettopp på den grunnen; rettet i samme f-runde uten
  produksjonskode-endring.
- **Ruling (2026-08-14T15:35Z):** Evidens legges i egen `[admin]`-commit
  (`081d054`) etter material-commit (`a438a54`) — samme mønster som SN-006 f3
  bruker. Alternativet var å amende inn i material-committen; det ville brutt
  «foretrekk ny commit fremfor amend»-regelen fra git-safety og gjort at
  trailerne (som skal peke på material, ikke evidens) hadde blitt tvetydige.
- **Ruling (2026-08-14T15:48Z) — post-fix runde etter rødt lag mot 081d054:**
  Rødt lag fant fire funn som ble rettet i material-commit `2306126` og
  evidens-commit `48e3e8b` innenfor samme f-runde (`Forsoek: 1`), i stedet
  for å eskalere til `Forsoek: 2` eller la funnene stå igjen som «kjent
  åpent». Begrunnelse: dommeren (Codex) skal se det ferdige selvsjekkede
  arbeidet, ikke halvferdige mellomtrinn; funnene var småfunn (JSDoc, en
  eksportert-men-ubrukt tabell, en tautologisk test, en død try/catch) uten
  atferdsendring utad. Fire retninger:
  1. `PaywallDialog.tsx:35` modul-JSDoc pekte på det gamle `purchasePackage`-
     symbolet. Erstattet med `purchasePlan`. Ingen kall-side-effekt — bare
     dok-drift.
  2. `paywall-copy.ts` eksporterte `PURCHASE_ERROR_MESSAGE` som ingen
     konsumerer (grep i hele `src/` bekrefter ett treff — selve
     erklæringen). De samme tekstene ligger i `REASON_MESSAGE` inne i
     `revenuecat.ts`, og PaywallDialog leser `result.message` derfra. To
     parallelle kilder kunne drive fra hverandre stille. Slettet tabellen
     og dens JSDoc-blokk; én sannhetskilde per V5-tekst.
  3. `revenuecat.test.ts` V1-suiten hadde en tautologi
     (`expect(['yearly','monthly']).toContain('yearly')`) som passerte
     uavhengig av kode. Erstattet med to reelle prøver:
     `PLAN_TO_PACKAGE_TYPE` inneholder KUN yearly/monthly, og
     `purchasePlan('yearly')` plukker en pakke med `PACKAGE_TYPE.ANNUAL`.
     `PLAN_TO_PACKAGE_TYPE` er nå eksportert fra `revenuecat.ts` slik at
     V1-testen kan bekrefte fravær av kvartal på runtime-nivå (ikke bare i
     TS-unionen).
  4. `revenuecat.ts` hadde en død try/catch rundt `getOfferings()` —
     funksjonen fanger sine egne feil internt og returnerer `null`. Fjernet
     catch-grenen; null-sjekken under bærer `no_offering`-stien alene.

  Kostnad hvis feil: to ekstra commits i f1-pakken (én material, én evidens);
  det er samme mønster som SN-005 f1-pakken har (to material-commits: `d31d55c`
  og `4d5f8f1`), så det er innenfor prosjektets aksepterte f-runde-struktur.

## 6. Avvik fra mock eller designsystem

Ingen. Paywall v2-designet (`docs/mocks/monter/paywall-v2*.html` +
`docs/design-notes/sol-duel-2026-07-31.md §8`) og CSS-kontrakten er urørt.
Antall plan-rader gikk fra 3 til 2, som er en direkte konsekvens av V1 og som
mocken tåler uten omdesign. Ingen nye komponenter, ingen nye tokens.

## 7. C4-erklæring — Type C, ingen konsollhandlinger

Ingen endringer er utført i App Store Connect, Google Play Console,
RevenueCat-webportalen, Apples utviklerkonto eller andre eksterne systemer i
f1. Oppgaven er Type C (kode + tester), og hele scopet er lokal Git.
V3-observasjonene (`babyora_yearly_299`, `babyora_monthly_49`) er innhentet av
eier og lagret i `loop/referanse/EIER-FUNN-PROVISJONERING-2026-08-14.md` før
f1 begynte; f1 leser dem ikke — koden er bevisst produkt-ID-agnostisk (V2).
V4-lesing av faktiske priser fra ASC er skilt ut til SN-W03 som eieroppgave
(krever eiers innlogging).

## 8. Det jeg er minst trygg på

- **`not_configured` vs `no_offering` grenser mot hverandre.** Hvis
  `Purchases.configure` har gått gjennom (initialized=true) men RevenueCat
  senere returnerer *ingen* aktive tilbud (for eksempel fordi entitlementen
  «premium» er koblet feil i portalen), får brukeren `no_offering` med teksten
  «Kunne ikke hente prisene fra butikken. Sjekk nettilkoblingen …». Nettverket
  kan være helt fint — problemet kan være en portal-feilkonfigurasjon. Bedre
  ordlyd er mulig, men jeg valgte å ikke skille mellom «nett nede» og «tomt
  tilbud» i UX-teksten, fordi brukeren uansett ikke kan agere annerledes.
- **`PACKAGE_TYPE` enum-verdiene er ikke lest fra runtime i produksjonskoden.**
  Jeg stoler på at `@revenuecat/purchases-capacitor@^11` (versjonen i
  `package.json`) holder `PACKAGE_TYPE.ANNUAL === 'ANNUAL'` og `MONTHLY === 'MONTHLY'`.
  Hvis pluginens SDK-versjon i en fremtidig oppdatering endrer enum-strengene
  under bakken (usannsynlig — det er en public SDK-kontrakt), vil oppslaget
  stille returnere `plan_unavailable`. Testen fanger dette hvis versjonen
  hopper, men bare hvis mocken oppdateres i takt.
- **CRLF-drift på snapshotfiler** (`legacy-adapter.test.ts.snap`,
  `finalize-safety.test.ts.snap`) står fortsatt urørt i arbeidstreet. Samme
  mønster som SN-005 f1: filene har blandet radslutt lokalt og gir konstant
  «M»-status uten at innholdet endres. De er ikke i f1-scopet og holdes ute
  for å ikke blande admin-arbeid inn i material-committen.
- **`AppPaywallGate` er ikke lest gjennom i f1.** Den bruker `checkPremium()`
  som er urørt. Om gaten et sted internt refererte til `ProductKey` eller
  `PRODUCT_IDS` ville TypeScript og `git grep` fanget det (verifisert:
  ingen treff utenfor `products.ts`-slettingen). Men jeg leste ikke koden
  linje for linje; jeg stolte på verktøysøket.
- **Rødt lag ble kjørt kun én runde (etter første material-commit).** Etter
  fixene i `2306126` ble det ikke kjørt et nytt rødt lag; jeg antar at
  funn-typene fra første rødt-lag-runde ikke er blitt gjeninnført av selve
  fixene (JSDoc-oppdatering, sletting av eksportert tabell, ekte tester for
  V1, sletting av død kode). Men jeg har ikke bevis for at *nye* småfunn
  ikke er introdusert i post-fix runden. G1-G4 er grønne, som er den
  automatiske ryggraden — men manuell red-team-verifikasjon av 2306126
  isolert er ikke gjort.
- **Faktaskriptet inspiserer HEAD, ikke f1-material-commitene.** HEAD er
  evidens-committen `[admin] SN-W01 f1 G1-G4 evidens rekjørt mot post-fix HEAD`
  som mangler Review-Request-trailerne og ikke starter med `SN-W01:`-prefiks —
  faktaskriptet markerer derfor «MANGLER TRAILERE» og «G6-format BRUDD».
  Dette er samme situasjon som SN-006 f3 hadde, og de to material-commitene
  (`a438a54`, `2306126`) er trailer-korrekte (verifisert i seksjon 3).

## 9. Utgangspunkt for kontroll

- **Eiervedtak å måle mot:** `loop/referanse/EIERVEDTAK-BETALING-2026-08-14.md`
  V1, V2, V5 (V3 er observasjon, V4 er SN-W03, V6 er SN-W02).
- **HEAD (siste commit i f1-pakken):**
  `48e3e8b0dfe7c13909b0e16c235432dbf015c1bb`
  («[admin] SN-W01 f1 G1-G4 evidens rekjørt mot post-fix HEAD»),
  forfatter-tid `2026-08-14T17:53:16+02:00` (= `2026-08-14T15:53:16Z`); pushet
  til `origin/snudly/bygg` samme tidsvindu.
- **Material-commits i f1 (to stykker, begge med `Review-Request: SN-W01` +
  `Forsoek: 1`):**
  `a438a543710ebd8a7e3aac66dc96e6f93d156f96` (første material) og
  `2306126…` (post-fix material — 4 rettinger fra rødt lag).
- **Baseline (BATON før f1):**
  `f52dbd3772b0c85088354e0ddb2e02dc048601a6`
  (`[admin] SN-W01/W02/W03 eiervedtak om betaling og oppdatert arbeidsliste`).
- **Utenfor scope (samme som SN-001–SN-006):** `loop/BATON.md` håndteres i egen
  commit etter push av requesten; `loop/LEDGER.md` føres i egen admin-commit;
  snapshot-filer under `src/lib/**/__snapshots__/` (CRLF-drift) er urørt av f1
  og har egen sporing i tidligere LEDGER-linjer.
