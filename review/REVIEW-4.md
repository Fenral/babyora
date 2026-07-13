# Runde 4 — 2026-06-12

Verifikasjon av P7 splitt-hero (commit `acbc337`).

## Resultat

| Test | Status | Bevis |
|---|---|---|
| P7.1 To kolonner liste / avatar | ✅ PASS | `hjem-r4-splitt-hero.png` |
| P7.1 Sortert innerst → ekstra | ✅ PASS | Body (innerst) → Pyjamas (mellomlag) → Sovepose (ekstra) |
| P7.1 Kategorifarge-venstrekant 4 px | ✅ PASS | Krem (innerst), teal (mellomlag), korall (ekstra) synlige |
| P7.1 displayName kapitalisering | ✅ PASS | «Langermet body», «Pyjamas», «Sovepose 2.5 TOG» |
| P7.1 Chevron per rad | ✅ PASS | ›-symbol på hver rad indikerer klikkbarhet |
| P7.1 LayerDetailSheet på klikk | ✅ PASS (fra R3) | Klikk-flyt allerede verifisert tidligere |
| P7.3 Stagger fade-in | ✅ PASS | CSS `animationDelay: 70 ms` per rad |
| P7.4 AKTIVITET over VIS LAG | ✅ PASS | AKTIVITET synlig før hero, VIS LAG nedenfor |
| P7.4 Hero passer i viewport | ✅ PASS | 3 plagg + Lillian + AKTIVITET synlig før scroll på 430×900 |
| P0.1 Summary nevner alle kategorier | ✅ PASS | «Langermet body og pyjamas, pluss sovepose 2.5 tog.» |

## Observasjoner (ikke kritiske)

### Cosmetic: ComfortBadge overlapper avatar-hjørne

ComfortBadge «Passe kledd» plasseres over avatar-kolonnen og overlapper
litt med Lillians hode. Lesbarheten er OK, men kunne vært justert.

### Cosmetic: Klassiske A-tier-PNG-er

Avatar-PNGen er fortsatt den gamle claymation Lillian fra før Fable
review. Ny OKLCH-palett-versjon kommer i P9 (asset-regenerering pågår).

## Suksesser bekreftet

- Hele rekkefølgen vær-pille → summary → AKTIVITET → splitt-hero →
  VIS LAG → «Se hele antrekket» fungerer som planlagt.
- Kategorifargene er tydelige og leselige.
- Tab-rekkefølge: innerst → mellomlag → ekstra (DRESS_ORDER bevart).
- Ingen rester av orbit-paradigmet synlige på Hjem.

## Merge-gate

Alle BLOCKER fra master-sjekklisten er nå løst:
- ✅ P0.1 summary (commit ec0a956)
- ✅ P0.6 R3 (commit 5f690c1)
- ✅ P2.2 R3 (commit 5f690c1)
- ✅ P4 (commit d3017b7)
- ✅ P7 splitt-hero + P7.4 (commit acbc337)
- ✅ R4 verifikasjon (denne runden)

**Status:** klar for merge til main etter P9 asset-regenerering er
ferdig (kjører i bakgrunnen).
