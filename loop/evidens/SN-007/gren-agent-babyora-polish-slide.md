# SN-007 · Dom · agent/babyora-polish-slide

**Modell/agent:** Haiku 4.5, Snudly W-GREN kontrollør
**Baseline:** origin/main (7108499)
**Grenens tupp:** origin/agent/babyora-polish-slide (9a72e9b)
**Diff:** 249 filer, +17345/-4290 linjer
**Lest:** loop/referanse/snudly-mock.html, loop/referanse/SNUDLY-DESIGNSYSTEM.md, loop/DOD-SNUDLY.md, konkrete git-commits.

## Overordnet vurdering

Grenen samler arkitektoniske endringer (launch signature, Mineral Garden palett, garment carousel) som ikke forenes med Snudly-mocken fra 14.08. Tre kritiske brudd: (1) «BABYORA» vises som HTML-tekst (A7 forbyr brukersynlig merkenavn), (2) Mineral Garden-endringer motsier eiers beslutning om K2b-lys som låst, (3) Grenens omfang er usamordnet. Grenen FORKASTES; dens delarbeider isoleres og reintroduseres separat.

## Dom per del

| Del | Commits | Dom | Begrunnelse |
| --- | --- | --- | --- |
| Launch signature | 12dad31, d0ac3b5 | ENDRE | OK konsept (stille launch, ingen kunstig delay), men brukersynlig «BABYORA»-tekst må fjernes. Isoler fra Mineral Garden. |
| Weather-cloud motion | f502ff9, 628ed29, d72cfb5 | BEHOLD | Motion-tokens OK, respekterer A5 (prefers-reduced-motion). |
| Garment carousel komprimering | ba547c9, 2d0142a | ENDRE | Rad-struktur OK, men <details>-nøsting (A8 brudd) må fjernes. |
| Mineral Garden palett | 3092fdd, d6a3999 | FORKAST | Canvas-endring overstyrer eier-mandat fra 14.08 (K2b låst). DESIGN.md rewritten uten sanksjon. |
| Design-tokens-v2 tester | src/styles/__tests__/* | ENDRE | Må audites mot Snudly-tokens, ikke Mineral Garden-verdier. |
| Materiallokalisering | e1da5a8 | BEHOLD | OK, uomstridelig. |
| Brukersynlig navn | index.html, PaywallDialog.tsx | FORKAST | BABYORA vises direkte. A7-brudd. Fjern all brukersynlig merkenavn-rendering. |

## Nøkkelfunn

1. **A7-brudd: Brukersynlig BABYORA** — `index.html:~1276` viser `<span className="hjm-brand">BABYORA</span>`. Direkte motsetning til SNUDLY-DESIGNSYSTEM.md §9: «Navnebytte Babyora → Snudly er gjennomført i mocken.»

2. **Mineral Garden overstyrer låst design** — Canvas `#F2F5F1` istedenfor K2b `#f3f7f5`. SNUDLY-DESIGNSYSTEM.md §8: «Lys som standardtema» er låst. Commit 3092fdd DESIGN.md sier «Mineral Garden approved 2026-08-08» — men Snudly-fasiten fra 14.08 godkjenner K2b.

3. **Nøsting av garment-info** — ba547c9 bruker `<details className="hjm-journey-fact">` rundt informasjon. A8 forbyr nøstede kort. Mock viser flat struktur.

4. **Design-tokens-v2 usikkerhet** — ~600 linjer endret i `src/styles/__tests__/`. Ukjent om de validerer Snudly eller Mineral Garden tokens.

5. **Slow launch replay OK** — Test-verktøy, ikke brukersynlig. Kan beholdes.

## Anbefaling

**FORKAST grenen som helhet.**

**Reintroduksjon:**
- **SN-008a:** Launch signature (bare exec-logikk, fjern BABYORA-tekst)
- **SN-008b:** Garment carousel (fjern `<details>`-nøsting)
- **SN-008c:** A7 rensing (fjern brukersynlig merkenavn)
- **SN-008d:** Design-tokens-v2 audit
- **Senere:** Mineral Garden redesign (post-lansering, eier-mandat)

## Usikkerhet

- Design-tokens-v2 tester: må audites fullt (ikke lest hver test)
- Mineral Garden-omfang: grep ga deler av det, kan være flere filer
- G1–G4 kjøring: ikke utført (stor grep, mange feil antatt)
