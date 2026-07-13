# Klemeg plagg-audit — HANDOFF

Selvstendig overlevering. Kopier hele denne fila inn i den andre chatten, eller åpne den i en Claude Code-økt i `wool-app/`.

## Hva dette er

En 2-stadie kvalitetsaudit av alle plagg i Klemeg (norsk påkledningsapp for barn 0–3 år, repo `Fenral/wool-app`, lokal mappe `C:\Users\SkotvoldSivertSende\wool-app`). Hvert plagg vurderes mot 5 mål:
1. **Struktur** — komplett/konsistent `what`/`when` + `whyForGarment`-gren
2. **Utseende** — illustrasjonen viser riktig plagg
3. **Seleksjon vs kilder** — temp-bånd plagget velges i er pediatrisk forsvarlig
4. **Tekst↔logikk** — `when`/`whyForGarment` matcher faktiske bånd motoren velger plagget i
5. **Alternativer** — relevant alternativ tilbys der aktuelt

Motoren bor i `src/lib/wool-layers/` (tables.ts = baseTable + bandForTemp, modifiers.ts, conflicts.ts CK-*, softBlocks.ts SB-*, safety.ts HB-*). Plagg-tekst i `src/data/garment-info.ts`. Illustrasjons-mapping i `src/data/garment-illustrations.ts`. Kilder i `src/lib/research/sources.ts`. PNG-er i `public/illustrations/garments/`.

## Status

| Fase | Status |
|---|---|
| Stadium A — Claude (Workflow, 60 agenter, read-only) | ✅ Ferdig. 60 plagg, snitt 85/100, 0 kritisk / 24 høy / 36 medium / 117 lav |
| Stadium B — Fable 5 (claude.ai-modell «Fable 5 High», drevet via Playwright/Edge) | ✅ Hele høy-settet (21 plagg) |
| Spor 1 — trygge tekst-fikser | ✅ 12 endringer i `garment-info.ts` (tsc + 14 tester grønne), IKKE committet |
| Spor 2 — kritiske (helsesøster) | ⏳ Ikke startet — se `HELSESOSTER-KRITISK.md` |
| Mål 5 — alternativer | ⛔ Blokkert: `alternatives.ts` er ukoblet død kode (se under) |
| 39 medium/lav-only-plagg | Kun Claude-dom (bevisst ikke kjørt gjennom Fable) |

## Viktigste resultat

**Fable scoret lavere på 20 av 21 plagg (snitt 80,7 → 68,2).** Claudes Stadium A var systematisk for mild på sikkerhets-relevant drift. Fable eskalerte **8 funn til KRITISK**:

| Type | Plagg |
|---|---|
| Sikkerhet/seleksjon (mål 3) | `regntrekk` (omgår HB-8 varmefelle), `sauekinn-i-vogn` (ingen alders-gate, SIDS-mykt underlag), `sovepose-2-5-tog` (TOG-underisolering) |
| Tekst på sikkerhets-felt (mål 4) | `tynt-teppe`, `pyjamas`, `tynn-pyjamas`, `sovepose-1-0-tog`, `to-ullsett` |

Største nedjusteringer: `regntrekk` 83→57, `tynt-teppe` 67→44, `sovepose-1-0-tog` 77→57, `sovepose-2-5-tog` 70→51.

## To funn som endret planen

1. **Mål 5 kan ikke fikses med data.** `src/lib/wool-layers/alternatives.ts` (ITEM_ALTERNATIVES) er **ukoblet død kode** — ingen `.tsx` importerer den, ingen i18n-locale har `alternatives.*`-nøkler. (!)-ikon/bottom-sheet er aldri bygget. Reell fiks = feature-jobb (UI + i18n over no/en/sv/da/de).
2. **Stadium A bommet på 3 «manglende PNG»-funn** (`vinterkjoredress`, `vinterkjoredress-isolert`, `votter-tynne`) — alle filene finnes. Bekreftet visuelt (Claude vision). Korrigert i rapporten.

## Spor 1 — nøyaktig hva som ble endret (i `src/data/garment-info.ts`)

11 `when`-tekster rettet til faktiske temp-bånd + 1 ord-fiks. Alle er rene string-endringer:

- `langermet-ullbody` → «Inner lag i bæresele på milde dager (ca 10–15 °C) og som nattplagg i kalde soverom. På varme dager: velg heller kortermet eller tynn ullbody.»
- `ullsett-tynt` → «Ute fra ca 0–16 °C avhengig av aktivitet …»
- `lett-bukse` → «Varme sommerdager ute, ca 16–21 °C …»
- `tynn-bukse` → «Som mellomlag i milde til varme forhold (ca 10–21 °C) … vanligvis uten yttertøy.»
- `ull-jakke` → «Som ekstra isolasjons-mellomlag under skall i kjølig til streng frost — sjelden alene.»
- `kjoredress` → «Kjølige dager i vogn, ca 5–9 °C — eller i bæresele ned mot frost.»
- `vinterkjoredress` → «Kalde til frost-dager i vogn, ca −7 til +4 °C.»
- `vinterdress-isolert` → «Lek ute i streng frost, fra ca −7 °C og kaldere.»
- `lue-tynn` → «Milde til varme dager, ca 10–21 °C — særlig i vogn og bæresele.»
- `vintersko` → «Kjølige dager med utelek … ca 0–5 °C. For minusgrader: bruk isolerte vintersko.»
- `vintersko-isolerte` → «Frost og kaldere ved utelek, fra ca −7 °C …»
- `kjoredress` `whyForGarment`: «Padded» → «Fôret»

Bevisst IKKE rørt: alle sovepose/TOG- og safety-sammenvevde plagg (å matche teksten til dagens logikk ville sementert under-isolering/varmefelle). De hører til spor 2.

## Leveranser (alle i `wool-app/tools/garment-audit/`)

- `REPORT.md` — full rapport: sammendrag, Fable-seksjon, kritisk/høy-tabell, visuell korreksjon, scorecard per kategori
- `HELSESOSTER-KRITISK.md` — de 8 kritiske formatert for faglig validering
- `scorecard.csv` — 60 plagg × 5 mål × {Claude, Fable}
- `plagg/<id>.json` — 60 per-plagg-filer ({claude, fable}); 21 har Fable-dom
- `fable-raw/prompts/<id>.txt` — ferdige Fable-prompts for alle 60 (for å gjenoppta)
- `RUBRIC.md`, `PROMPT_FABLE.md`, `log.jsonl`, `claude-visual.json`
- Skript: `scripts/garment-audit.workflow.js` (Stadium A), `scripts/process-audit.mjs`, `scripts/gen-fable-prompts.mjs`, `scripts/merge-fable.mjs`, `scripts/gen-report.mjs`

## Hvordan gjenoppta Stadium B (de 39 medium/lav-plaggene)

Per plagg, seriellt via Playwright i innlogget Edge mot claude.ai (Fable 5 High, web-search av):
1. `claude.ai/new` → `Ctrl+U` → last opp `public/illustrations/garments/<id>.png`
2. Lim inn `fable-raw/prompts/<id>.txt` → send
3. Vent ~100–130 s (verbose JSON). Ekstraher **in-place** (IKKE re-naviger — da blir svaret virtualisert/borte). Hent JSON via `pre`-blokk ELLER main-tekst med diskriminatoren `"struktur":`
4. Lagre `fable-raw/<id>.json` → `node scripts/merge-fable.mjs` → `node scripts/gen-report.mjs`

Fallgruver: re-navigering mister svaret; for kort venting gir `STILL_GENERATING`; cwd for Bash-flytting må være `C:\Users\SkotvoldSivertSende` (filename-save lander der).

## Hva gjenstår / neste valg

- **Commit spor 1** (1 fil, `src/data/garment-info.ts`, +12/−12). Ikke gjort ennå.
- **Spor 2:** valider de 8 i `HELSESOSTER-KRITISK.md` med helsesøster, så fiks terskler/safety-regler (f.eks. legg `regntrekk` i `PRAM_COVER_RE`, alders-gate på saueskinn, minimums-TOG-gulv).
- **Alternativer-feature** (UI + i18n) — egen jobb.
- **`kortermet-body` farge** (rosa → nøytral) = bilde-regen via Gemini/nano-banana.
- Evt. Fable-dom på de 39 medium/lav-plaggene.
