# SN-W02 · Forespørsel, forsøk 2

**Oppgave:** Rette dommens ene funn i `loop/verdicts/SN-W02-f1.md`: V4 og V5
i den nye 2026-08-14-entryen i `docs/DECISION-LOG.md` hadde
«i dag»-formuleringer som beskrev førtilstanden (før SN-W01 f1), mens live
branch allerede har fjernet kvartal/99 (V1) og erstattet stille
`purchasePackage`-feil med typede `purchasePlan`-grunner. Formuleringene var
sanne som vedtaksdokumentasjon, men usanne som «dagens»-data i en entry
skrevet etter SN-W01 f1 — dette bryter DoD E1 og kan gi SN-W03 feil
startbilde.

**Type:** E · **Modell/innsats:** Opus 5, høy innsats (type E per
`loop/PROMPT-CLAUDE-CODE-BYGGELOOP.md` § «Modell og innsats»).
**Utgangspunkt:** `a233142` (f1 sin siste commit, som Codex dømte mot).

**Filer i f2-pakken (a233142..4a5d928):**

- `docs/DECISION-LOG.md` (+26/−10): V4-avsnittet og V5-avsnittet omskrevet
  til å skille førtilstand (vedtakstidspunkt) fra live branch etter SN-W01
  f1. V4 sier 299/99/39 var i koden ved vedtakstidspunktet og at SN-W01 f1
  har fjernet kvartal/99 slik at live har 299 (år) og 39 (måned); både 299
  og 39 er fortsatt uverifiserte fallbacks (SN-W03). V5 sier stille
  `{ success: false }` fra `purchasePackage` var defekten ved
  vedtakstidspunktet og at SN-W01 f1 har erstattet den med `purchasePlan`
  + `PurchaseFailureReason`-union med brukervendte meldinger; V5 er
  eksplisitt merket ikke ferdig fordi SN-W01 er UNDERKJENT/EIER og den
  native snarveien i `PaywallDialog.tsx:915-934` fortsatt kan gi falsk
  suksess. Ingen andre avsnitt i 2026-08-14-entryen berørt.
- `loop/verdicts/SN-W02-f1.md` (+48/−0, ny fil): Codex' f1-dom lagt inn i
  sporing (Codex la filen i arbeidstreet uten commit; sporing følger samme
  praksis som SN-006 f3-pakken hvor prior verdicts ble tatt inn i
  materialcommiten). Filen er byte-identisk med den Codex leverte.
- `loop/ARBEIDSLISTE-SNUDLY.md` (+1/−1): SN-W02 status flyttet fra
  `TIL KONTROLL` til `PÅGÅR` (per syklus-steg 7 i
  `loop/LOOP-PROTOKOLL.md`: UNDERKJENT → tilbake til bygging).
- `loop/LEDGER.md` (+2/−0): én startlinje for f2 med UTC-tidsstempel hentet
  fra `date -u +%Y-%m-%dT%H:%M:%SZ` → `2026-08-14T16:49:01Z`. Ingen linjer
  redigert.
- `loop/evidens/SN-W02/g3-test.txt` (+2/−2): G3-output re-fanget mot
  4a5d928 sitt tre. Tallendring: Start-tidsstempel og Duration; testtall
  uendret (210 filer, 3168 pass + 1 todo).
- `loop/evidens/SN-W02/g4-build.txt` (+2/−2): G4-output re-fanget mot
  4a5d928 sitt tre. Tallendring: kun build-tid.

Ingen produksjonskode er berørt. Ingen `[admin]`-commits (per Codex' SN-W01
f1 funn 3, LEDGER `16:10Z`). Alle commits i pakken har `SN-W02:`-emne og
trailerne `Review-Request: SN-W02` og `Forsoek: 2`.

## Merknad om f1-diffen som Codex bemerket

`loop/verdicts/SN-W02-f1.md:38` («Merknad uten domsvirkning») peker på at f1
også endret SN-W01 i arbeidslisten fra `KLAR` til `EIER`. Denne endringen
ligger i f1-materialcommiten `dacfa24` og er inkludert i kontrollgrunnlaget
Codex allerede har dømt over — den er ikke del av f2-diffen. Endringen
følger eierens ruling `16:16Z` (SN-W01 parkeres som EIER inntil Fable 5
Extra eller Opus 4.8 Extra er tilgjengelig, eller til eier eksplisitt
godkjenner Opus 4.7 for oppgaven). f2 rører ikke SN-W01-status.

## Porter kjørt (§1: fanget etter siste materialcommit til fil, sitert herfra)

Kjøringsrekkefølge: G1 → G2 → G3 & G4 parallelt. G3 og G4 kjørte i
uavhengige node-prosesser fra samme arbeidstre; G3 leser ikke bygget og G4
leser ikke tester, så parallellisering er sikker.

```
$ cat loop/evidens/SN-W02/g1-lint.txt
> babyora@0.1.0 lint
> eslint .

EXIT=0
```

```
$ cat loop/evidens/SN-W02/g2-tsc.txt
EXIT=0
```

```
$ tail -6 loop/evidens/SN-W02/g3-test.txt
 Test Files  210 passed (210)
      Tests  3168 passed | 1 todo (3169)
   Start at  18:52:19
   Duration  168.57s (transform 12.82s, setup 0ms, import 44.11s, tests 494.37s, environment 40ms)

EXIT=0
```

Testtelling mot baseline: 3168 pass + 1 todo — **identisk** med SN-W01 f1
(LEDGER `15:57Z`) og SN-W02 f1 (LEDGER `16:39Z`). Ingen skipp/todo lagt
til.

```
$ tail -12 loop/evidens/SN-W02/g4-build.txt
> babyora@0.1.0 build:bare
> vite build --config apps/bare/vite.config.ts

vite v8.0.14 building client environment for production...
transforming...✓ 30 modules transformed.
rendering chunks...
computing gzip size...
dist/bare/index.html                  0.54 kB │ gzip:  0.35 kB
dist/bare/assets/index-NIgpWZ0E.js  281.23 kB │ gzip: 87.18 kB

✓ built in 352ms
EXIT=0
```

Bare-appens `dist/bare/index.html` = 0.54 kB, `dist/bare/assets/index-NIgpWZ0E.js`
= 281.23 kB (gzip 87.18 kB). Chunk-advarselen i hoved-vite-outputen er den
kjente advarselen som har fulgt f1 og eldre kjøringer; ikke ny.

## Leveransefakta (rå output fra loop/leveranse-fakta.sh SN-W02)

```
$ bash loop/leveranse-fakta.sh SN-W02
=== LEVERANSEFAKTA SN-W02 ===
generert: 2026-08-14T16:55:42Z  (date -u)

--- HEAD ---
sha:      4a5d928b5ff83348578a703e1712241e8d48b9b5
emne:     SN-W02: f2 evidens G1-G4 mot d600cbc
forfatter:2026-08-14T18:55:25+02:00

--- trailere ---
Review-Request: SN-W02
Forsoek: 2

--- G6-format ---
OK: emnet starter med 'SN-W02: '

--- diff mot forelder ---
 2 files changed, 4 insertions(+), 4 deletions(-)

--- per fil (numstat: eksakt, ikke skalert graf) ---
2	2	loop/evidens/SN-W02/g3-test.txt
2	2	loop/evidens/SN-W02/g4-build.txt

--- dommer og evidens som må være sporet ---
OK sporet:   loop/verdicts/SN-W02-f1.md
OK sporet:   loop/evidens/SN-W02/g1-lint.txt
OK sporet:   loop/evidens/SN-W02/g2-tsc.txt
OK sporet:   loop/evidens/SN-W02/g3-test.txt
OK sporet:   loop/evidens/SN-W02/g4-build.txt
(alt relevant er sporet)

--- synk mot origin ---
HEAD:     4a5d928b5ff83348578a703e1712241e8d48b9b5
upstream: 4a5d928b5ff83348578a703e1712241e8d48b9b5
OK: pushet og synkron

rev-list --left-right --count HEAD...@{upstream}:
0	0

=== SLUTT SN-W02 ===
```

Merk at `leveranse-fakta.sh` viser bare HEAD-committen sin diff mot
forelder (evidenscommiten). Full f2-pakke er a233142..4a5d928 (to commits
totalt):

```
$ git diff --numstat a233142..4a5d928
26	10	docs/DECISION-LOG.md
1	1	loop/ARBEIDSLISTE-SNUDLY.md
2	0	loop/LEDGER.md
2	2	loop/evidens/SN-W02/g3-test.txt
2	2	loop/evidens/SN-W02/g4-build.txt
48	0	loop/verdicts/SN-W02-f1.md
```

```
$ git log --oneline a233142..4a5d928
4a5d928 SN-W02: f2 evidens G1-G4 mot d600cbc
d600cbc SN-W02: f2 skille foertilstand fra live i V4/V5 + spor f1-dom
```

## E1-erklæring (per Codex' underkjennelse av f1)

Hver faktapåstand i den nye V4- og V5-teksten kan verifiseres mot koden på
HEAD (`4a5d928`):

| Påstand i DECISION-LOG.md | Kommando som beviser |
| --- | --- |
| V4: «Ankerprisene i koden ved vedtakstidspunktet var 299/99/39 kr (år/kvartal/måned)» | `git show a438a54^:src/lib/premium/products.ts` (`a438a54^` = `f52dbd3`, siste commit før SN-W01 f1) viser `anchorPriceNok: 299` (år), `anchorPriceNok: 99` (kvartal, `quarterly`-oppføring) og `anchorPriceNok: 39` (måned). Kvartal-tallet 99 ble fjernet av SN-W01 f1 materialcommiten `a438a54`. Rettet i f2 etter påstandsagentens funn: f1-utgangspunktet `aaced3e` er ALTfor sent — SN-W01 f1 hadde da allerede fjernet kvartal, så `aaced3e^:products.ts` viser ikke førtilstanden. |
| V4: «SN-W01 f1 (materialcommit `a438a54`, `src/lib/premium/products.ts:34-48`) fjernet kvartalsvarianten og 99-ankeret per V1» | `git show a438a54 -- src/lib/premium/products.ts` — commiten fjerner `quarterly`-oppføringen fra PRODUCTS. |
| V4: «live branch nå har kun 299 (år) og 39 (måned)» | `grep -n anchorPriceNok src/lib/premium/products.ts` → linje 36 (299) og 43 (39) — matcher på HEAD. |
| V4: «produktnavnene `babyora_yearly_299` og `babyora_monthly_49` antyder 299 og 49» | Navnesuffiksene sier 299 og 49; SN-W03 må lese faktiske prisfelt i App Store Connect. |
| V5: «`purchasePackage` returnerte `{ success: false }` uten forklaring når ingen pakke matchet» (førtilstand) | `git show f52dbd3:src/lib/billing/revenuecat.ts` (siste commit før SN-W01 f1) — signaturen er `purchasePackage(packageId: string): Promise<{ success: boolean; customerInfo?: CustomerInfo }>`. Ingen `reason`/`message`-felter i suksess-typen; når `pkg` ikke fantes returnerte funksjonen `{ success: false }` uten forklaring. Rettet i f2 etter påstandsagentens funn på samme mønster som V4-raden: `aaced3e` er post-SN-W01 og har allerede `purchasePlan` med typede grunner. |
| V5: «`purchasePlan` og en typet `PurchaseFailureReason`-union med brukervendte meldinger (`src/lib/billing/revenuecat.ts:83-111,128-152`)» | `sed -n '83,152p' src/lib/billing/revenuecat.ts` viser `PurchaseFailureReason` (linje 83-89), `PurchaseResult` (91-93), `REASON_MESSAGE`-map (95-107), `fail()`-hjelper (109-111), og `purchasePlan`-implementasjonen (128+). |
| V5: «synlig feilregion i paywall-dialogen (`src/components/PaywallDialog.tsx`)» | `grep -n "errorMessage" src/components/PaywallDialog.tsx` viser feilregion satt via `setErrorMessage(result.message)` i kjøpsflyten. Ikke sitert med linjenummer for regionens plassering fordi jeg ikke har verifisert det tallet mot HEAD selv (se «minst trygg» under). |
| V5: «den native snarveien i `src/components/PaywallDialog.tsx:915-934` fortsatt kan gi falsk suksess uten RevenueCat-konfig» | `sed -n '915,934p' src/components/PaywallDialog.tsx` viser `if (!isRevenueCatConfigured() || !Capacitor.isNativePlatform())`-grenen som setter `setPremium(true)` og `statusActivatedTestmode` uten å kalle `purchasePlan`. Verifisert direkte på HEAD (`4a5d928`). |

## Avgjørelser underveis

- **Skille førtilstand fra live i selve V4/V5-teksten, ikke bare i
  paranteser.** Codex' funn 1-2 gjaldt at «i dag» ble brukt om
  førtilstanden. Rettelsen ble å eksplisitt navngi
  «vedtakstidspunktet» og «live branch etter SN-W01 f1» som to
  tydelig atskilte tilstander i selve teksten, med
  commit-SHA-referanse (`a438a54`) og fil-referanse
  (`products.ts:34-48`) som ankere. Kostnad hvis feil: hvis en
  fremtidig leser tolker rekkefølgen som at SN-W01 er ferdig, kan de
  anta at kjøpsflyten er trygg. Motvirket av eksplisitt
  «V5 er ikke ferdig»-avsnittet.
- **Ta inn `loop/verdicts/SN-W02-f1.md` i sporing.** Codex la
  filen i arbeidstreet uten commit. Samme praksis fulgt som SN-006 f3
  (LEDGER `14:56Z`): dommen sporet i materialcommiten. Kostnad hvis
  feil: minimal — filen er bevis for en dom, ikke produksjonskode.
- **Ikke rette f1-pakken selv (SN-W01 status-flipp i ARBEIDSLISTE
  fra f1).** Codex' merknad uten domsvirkning bemerket at f1s
  diffbeskrivelse ikke nevnte at f1 også flippet SN-W01 fra `KLAR`
  til `EIER`. Rettelsen ligger i denne requestens
  «Merknad om f1-diffen»-avsnitt, ikke i en ny diff. f2 rører ikke
  SN-W01-status. Kostnad hvis feil: ingen — merknaden hadde ingen
  domsvirkning.

## Avvik fra mock eller designsystem

Ingen. Ren dokumentendring.

## Det jeg er minst trygg på

- Jeg oppgir feilregionens plassering i `PaywallDialog.tsx` uten
  linjenummer (bare filnavn), fordi jeg ikke selv leste den regionen
  på HEAD. Codex' f1-dom siterte den på linje 1126-1129, og jeg antar
  linjene er stabile på 4a5d928, men jeg har ikke sjekket. Om Codex
  ønsker linjenummer i teksten, kan det legges til i f3.
- V4-teksten sier «V1-endringen av `PLAN_ORDER`/`PRODUCTS` er
  likevel del av live branch og utgjør kontrollgrunnlaget for denne
  V4-teksten». Dette er sant fordi `PLAN_ORDER` i
  `src/lib/premium/paywall-copy.ts:24` er `['yearly', 'monthly']` på
  HEAD og `PRODUCTS` i `products.ts:34-48` har kun `yearly`/`monthly`.
  Men det kan tolkes som at V1 er «ferdig» — noe SN-W01 fortsatt er
  UNDERKJENT/EIER om. Jeg har prøvd å motvirke det ved å skille V1
  (PLAN_ORDER/PRODUCTS-endring, som lever i branch) fra V5 (som er
  åpen på grunn av native snarvei). Om skillet mellom «kode-endring
  merget» og «oppgave godkjent» er utydelig, er dette stedet det
  brytes.
- Type E-erklæringen om ingen konsollhandling gjelder også for f2
  (ingen App Store Connect, Play Console eller RevenueCat berørt).
  Dette er en fraværserklæring; ingen diff kan bevise det, men det
  følger av at ingen produksjonskode er berørt.
