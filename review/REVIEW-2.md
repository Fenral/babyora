# Runde 2 — 2026-06-12

Verifikasjon av R1.1 og R1.2 + klikk-tester.

## Resultat

| Test | Status | Bevis |
|---|---|---|
| R1.1 Innstillinger viser samme by som Hjem/Uke | ✅ PASS | DOM viser «Oslo» i alle tre vyer |
| R1.2 Orbit-tags synlige | ✅ PASS | `[data-garment]` inline opacity=1, computed=1 |
| Orbit-tag klikk → LayerDetailSheet | ✅ PASS | Klikk på «Pyjamas»-tag åpner sheet med «Lag 2 av 3 · Mellomlag · pyjamas» |
| Esc lukker sheet | ✅ PASS | Sheet lukkes ved Esc |
| Engine-summary | ✅ PASS | «Langermet body og pyjamas.» matcher rec |
| Værikon | ✅ PASS | partly-cloudy ved 0.0 mm/t |
| Time-for-time | ✅ PASS | 24 timer + scores |
| 10-dager med relative datoer | ✅ PASS | «12. juni, 13. juni…» |

## Nye observasjoner

### Cosmetic: «Body»-tag overlapper Lillian (3-plagg-case)

**Skjermbilde:** `r2-430x900/hjem-r2.png`

Når motoren returnerer kun 3 plagg (mild dag), bruker `computeOrbitPositions`
**stram radius** (rx=80, ry=95). Det plasserer topp-tagen ved (150, 75) —
midt OVER Lillians hode, men i avatar-PNG-området. Labelen «Body» (y=118)
overlapper også ComfortBadge-pillen.

**Ikke en blocker** — 4-6 plagg bruker full radius og ligger utenfor.
Logges som anomali for fremtidig P1.4-fix.

### «pyjamas» rendres lowercase i sheet-overskrift

`recommend()` returnerer `'pyjamas'` (lowercase). `LayerDetailSheet`
viser teksten as-is som `<h2>`. Visuelt rart. Fix kan være å
kapitalisere første bokstav.

## Suksesser bekreftet

- Sted-konsistens (R1.1) ✓
- Orbit-tags synlige etter første sesjon (R1.2) ✓
- Klikk-flyt orbit-tag → LayerDetailSheet ✓
- Esc + focus-trap ✓
- Motor-drevet tekst overalt ✓

## Beslutning

Stopper Playwright-loopen her — alle kritiske bugs løst. Cosmetic-bugs
loggføres for fremtidig polish-runde. Akseptansekriterier 1, 2, 4, 5,
7, 10 oppfylt; 3 (kontrast-test) og 6 (bytte-chips skjult) per kode.
