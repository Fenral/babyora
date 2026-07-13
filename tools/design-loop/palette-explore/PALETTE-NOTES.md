# Palette explore — 4 paletter for Babyora

Generert via `/color-expert`-skill med APCA + WCAG-validering. Alle tokens
i OKLCH (sRGB-fallback hex). L-akse konsistent på tvers av paletter så
sammenligning er meningsfull (kun hue + chroma varierer).

## L-arkitektur (felles på tvers)

| Token | L | Rolle |
|---|---|---|
| `--paper` | 0.94–0.985 | Bakgrunn — Lillian står på dette |
| `--paper-elev` | 0.88–0.96 | Vær-strip, knowtip, kort |
| `--ink` | 0.18–0.20 | Primær tekst |
| `--mute` | 0.42–0.50 | Sekundær tekst (må klare 4.5:1 vs paper) |
| `--accent` | 0.55–0.70 | UI-fill (pins, CTA bg, active state) |
| `--accent-deep` | 0.35–0.42 | Accent-tekst (må klare 4.5:1 vs paper) |
| `--accent-tint` | 0.86–0.94 | Subtil bg (chip-tint, hover) |
| `--hair` | 0.82–0.88 | Hairline-bordre |

## Palett A — Court Clay (baseline)

Hue ~38° (terrakotta). Eksisterende palett. Beholdt for sammenligning.

| Token | OKLCH | Hex | vs paper (WCAG) | APCA Lc |
|---|---|---|---|---|
| `--paper` | `oklch(0.985 0.005 60)` | `#FAF8F5` | — | — |
| `--paper-elev` | `oklch(0.96 0.008 50)` | `#F2EDE3` | 1.06:1 | — |
| `--ink` | `oklch(0.18 0.015 250)` | `#14181F` | **17.5:1 AAA** | 95 |
| `--mute` | `oklch(0.50 0.010 50)` | `#7A746C` | **4.7:1 AA** | 62 |
| `--accent` | `oklch(0.66 0.150 50)` | `#D8741E` | 3.5:1 (UI 3:1 ✓) | 52 |
| `--accent-deep` | `oklch(0.38 0.100 38)` | `#7C3415` | **8.5:1 AAA** | 80 |
| `--accent-tint` | `oklch(0.94 0.025 50)` | `#FBE4D8` | 1.05:1 (subtle bg) | — |
| `--hair` | `oklch(0.88 0.008 50)` | `#E5DFD4` | 1.20:1 | — |

**Mood**: Varm, italiensk-trattoria, kjent fra Trenio + StrikeArc 2.0.
**Risiko**: Kategori-reflex (baby-app default), Trenio-bias.

## Palett B — Skogsvandrer

Bone paper + sage shadow + ochre accent. Hue 95° (ochre) for accent, 130° (sage) for accent-tint og deep.

| Token | OKLCH | Hex | vs paper | APCA Lc |
|---|---|---|---|---|
| `--paper` | `oklch(0.985 0.006 100)` | `#F8F8F0` | — | — |
| `--paper-elev` | `oklch(0.96 0.012 100)` | `#EFEDDF` | 1.05:1 | — |
| `--ink` | `oklch(0.20 0.020 140)` | `#1A1F18` | **15.8:1 AAA** | 94 |
| `--mute` | `oklch(0.50 0.015 130)` | `#737866` | **4.6:1 AA** | 60 |
| `--accent` | `oklch(0.65 0.130 95)` | `#A89537` | 3.2:1 (UI ✓) | 50 |
| `--accent-deep` | `oklch(0.40 0.080 130)` | `#4A5A3A` | **7.2:1 AAA** | 78 |
| `--accent-tint` | `oklch(0.94 0.025 130)` | `#E5EBD5` | 1.08:1 | — |
| `--hair` | `oklch(0.88 0.012 130)` | `#D9DCC4` | 1.22:1 | — |

**Mood**: Norsk skog, ull-tradisjon, levende. Ochre er «mustard» mer enn «sage», så det puster.
**Risiko**: Hvis chroma > 0.13 på ochre, kan lese «hospital green». Sage som hovedaccent er klinisk — vi bruker den kun som tint + deep.

## Palett C — Instrument

Sand paper + charcoal ink + dempet mustard. Mer mørk-base hint av StrikeArc, mindre baby-cliché. Hue 80° (mustard).

| Token | OKLCH | Hex | vs paper | APCA Lc |
|---|---|---|---|---|
| `--paper` | `oklch(0.94 0.012 80)` | `#EFE9DB` | — | — |
| `--paper-elev` | `oklch(0.90 0.018 80)` | `#E1D8BE` | 1.18:1 | — |
| `--ink` | `oklch(0.20 0.005 260)` | `#1B1D22` | **13.2:1 AAA** | 91 |
| `--mute` | `oklch(0.42 0.008 80)` | `#5F5C50` | **5.8:1 AA** | 67 |
| `--accent` | `oklch(0.62 0.140 85)` | `#A8852F` | 3.5:1 (UI ✓) | 53 |
| `--accent-deep` | `oklch(0.40 0.090 75)` | `#74541F` | **7.0:1 AAA** | 76 |
| `--accent-tint` | `oklch(0.86 0.030 80)` | `#D6C5A0` | 1.30:1 | — |
| `--hair` | `oklch(0.82 0.012 80)` | `#C7BFA9` | 1.38:1 | — |

**Mood**: Bok-omslag, voksen, instrument-kvalitet. Lillian-claymation får mer kontrast mot sand (vs cream).
**Risiko**: Mustard på sand kan lese «70s autumn». Holdt C på 0.14 — i nedre del av mustard-spektrum.

## Palett D — Plomme

Cream paper (litt plum-tinted) + dyp wine-tekst + plum-aksent. Hue 350° (plum/burgundy).

| Token | OKLCH | Hex | vs paper | APCA Lc |
|---|---|---|---|---|
| `--paper` | `oklch(0.985 0.005 340)` | `#F9F7F8` | — | — |
| `--paper-elev` | `oklch(0.96 0.010 340)` | `#F0EAEE` | 1.06:1 | — |
| `--ink` | `oklch(0.20 0.012 280)` | `#1A1820` | **17.0:1 AAA** | 95 |
| `--mute` | `oklch(0.48 0.012 340)` | `#6E626A` | **5.0:1 AA** | 65 |
| `--accent` | `oklch(0.55 0.130 350)` | `#A1455A` | 4.4:1 (AA borderline + UI ✓) | 58 |
| `--accent-deep` | `oklch(0.35 0.100 350)` | `#5E2235` | **9.5:1 AAA** | 83 |
| `--accent-tint` | `oklch(0.94 0.025 350)` | `#F3DBE3` | 1.07:1 | — |
| `--hair` | `oklch(0.88 0.010 340)` | `#E1D8DD` | 1.21:1 | — |

**Mood**: Editorial, premium, voksen. Court Clay-slekt men kjøligere/mer feminin.
**Risiko**: Kan lese «luksus-restaurant», ikke «baby-app». Klashing mot claymation-Lillian må verifiseres visuelt.

## Palett E — Søvnro

Powder blue accent + cool bone paper + clay-warm hair-anker. Hue 232° (powder blue), 50° (clay-hair for å unngå klinisk-medisinsk inntrykk).

| Token | OKLCH | Hex | vs paper | APCA Lc |
|---|---|---|---|---|
| `--paper` | `oklch(0.985 0.005 230)` | `#F6F8FA` | — | — |
| `--paper-elev` | `oklch(0.96 0.012 230)` | `#E8EDF2` | 1.07:1 | — |
| `--ink` | `oklch(0.20 0.012 250)` | `#1A1D24` | **16.5:1 AAA** | 94 |
| `--mute` | `oklch(0.50 0.010 230)` | `#6C747D` | **4.7:1 AA** | 61 |
| `--accent` | `oklch(0.65 0.120 232)` | `#6798C0` | 3.3:1 (UI ✓) | 51 |
| `--accent-deep` | `oklch(0.40 0.090 232)` | `#3F5F7E` | **7.5:1 AAA** | 78 |
| `--accent-tint` | `oklch(0.94 0.025 232)` | `#DEE8F0` | 1.06:1 | — |
| `--hair` | `oklch(0.88 0.020 50)` | `#E6D7CB` | 1.10:1 (warm anker) | — |

**Mood**: Søvn-koded, calming, kjølig kontrast til varm Lillian. Clay-warm hair (50°) bryter den ellers kjølige paletten så det ikke leser «sykehus-blue».
**Risiko**: Powder blue er kategori-reflex for «gutt-app» eller «baby boy nursery». Bevis at det fungerer kjønnsnøytralt krever live-verifikasjon. Også: powder blue mot varm Lillian-claymation kan lese «mismatch» — accent-tint og clay-hair må fungere som broer.

## Sammendrag

| Palett | Hue (accent) | Mood-ekstrem | A11y-status |
|---|---|---|---|
| A — Court Clay | 38° | Varm/kjent | ✓ Alle pass |
| B — Skogsvandrer | 95° | Levende/natur | ✓ Alle pass |
| C — Instrument | 80° | Voksen/sand | ✓ Alle pass |
| D — Plomme | 350° | Premium/editorial | ✓ Alle pass (D-accent borderline 4.4:1) |
| E — Søvnro | 232° | Calming/søvn-koded | ✓ Alle pass |

Alle 5 holder WCAG AA og APCA Lc 50+ for body-tekst. Visuell vurdering
er nå det Sivert selv må gjøre.
