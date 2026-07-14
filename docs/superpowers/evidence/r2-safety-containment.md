# R2 — Legacy safety containment: pakke-evidens

**Dato:** 2026-07-14 · **Basis:** commit `03b46f6` (R1-baseline) · **Tier: SHIPPBAR**

## Hva ble avgrenset

P0-funnet fra analyseplanen: kategori-overrides (B-1), per-barn-kalibrering (P9.5) og session-swaps i UI kjørte **etter** `applySafety` og kunne gjeninnføre kombinasjoner sikkerhetskjeden hadde fjernet.

Løsning: `src/lib/wool-layers/finalize-safety.ts` — én endelig grense som re-anvender den godkjente kjeden conflicts → soft-blocks → hard-safety etter siste tillatte mutasjon:
- `recommend()` kjører grensen når overrides og/eller kalibrering har mutert laget; umutert sti er uendret (byte-ekvivalens strukturelt garantert + snapshot-bevist).
- Skjermer (`HjemScreen`, `UkeScreen`) ruter session-swaps gjennom `applySwapsFinalized()` — ingen lokal array-mapping av trusted Recommendation gjenstår (G9b-grep: 0 treff).
- `softBlocks.ts`: kun SB-5 apply-once-vakt (idempotens), keyet på eksisterende notatspor; copy/terskler byte-identiske. `safety.ts`/`conflicts.ts` urørte (tom diff).

## Prosess og artefakter

| Fase | Artefakt |
|---|---|
| Rubrikk låst FØR kode (G1–G12, uttømmende kritisk-liste) | [r2-safety-containment-rubrikk.md](./r2-safety-containment-rubrikk.md) |
| RED: G1–G7 feilet mot gammel pipeline (sårbarhet bevist), G8c/G9a/G11 module-not-found, G10-før-bilde (12 snapshots) | [r2-red.txt](./r2-red.txt) |
| GREEN: 27/27 matrise, 249/249 full suite, 19/19 audit, build ✓, lint-delta 0 | [r2-green.txt](./r2-green.txt) |
| Uavhengig fresh-context dom (Fable 5, kun rubrikk + repo; re-kjørte alle kommandoer selv) | Verdict **PASS**, gjengitt under |

**Fixture-korreksjon i RED-fasen (kravtekst uendret):** G9a-fixturen antok først en regel som ikke finnes (ensomt teppe under søvn rammes ikke av HB/CK, og grensen innfører ikke nye regler). Korrigert til swap som skaper sovepose+teppe-kombinasjonen CK-1/HB-2 faktisk håndhever.

## Uavhengig dom (sammendrag)

- Verdict: **PASS** · fresh-context Fable 5 · working-tree over 03b46f6
- Evidenssjekkliste: G1–G12 alle JA med selvstendig re-kjørte kommandoer
- Scope: kun tillatte filer; `git diff --check` rent; safety/conflicts byte-urørte
- Kritiske defekter: **ingen**
- Uavhengig mutasjonssøk fant ingen udekket vei (ownership-override mater inn i den nå-gatede `recommend()`)

## Registrerte oppfølginger (ikke-blokkerende)

1. **P3/a11y (WCAG 4.1.3):** Avvist swap er stille — når grensen fjerner et swappet plagg får bruker samme suksess-haptikk/lukking som ved akseptert swap. Oppfølging: annonser sikkerhetsavvist swap via eksisterende `useLiveStatus` (rolle=status). Hører hjemme i R7 Core UI.
2. **P3:** G8a grensetest ved 12 °C, ikke eksakt 8,0 °C — stram inn ved neste testrunde.
3. **P3:** `applySwapsFinalized` oppdaterer ikke `summary` (matcher tidligere UI-adferd; løses av kanonisk `RecommendationView` i R5).
4. **P3:** SB-5-vakten betyr at override i 7–9-mnd-vinduet ikke re-reduseres (sanksjonert trade-off — soft block, ikke hard safety; dokumentert i rubrikkens avviksnotat).
5. **A11y-lead-review av UI-diffen:** APPROVE WITH NOTES — funn 1 = punkt 1 over; funn 2 (snapshot-divergens i takeover) pre-eksisterende, løses ved per-fase-kontekst.

## Rollback

Trygg rollback for Motor V2 = denne containede legacy-stien (recommend() med grensen), aldri pre-containment-stien. All-flags-off-testkrav for V2 (engine-2-plan Task 12) skal peke hit.
