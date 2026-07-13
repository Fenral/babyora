# Iter 001 — Aggregert syntese

Commit i evaluering: `b307b56`
Preview: wool-app-git-redesign-instrument-level-sivert-s-projects.vercel.app
Dato: 2026-06-10

## Score-konsensus

| Perspektiv | Total | Hierarki (25) | Visuell (25) | Typo (15) | Motion (10) | Farge (10) | A11y (10) | Slop (5) |
|---|---|---|---|---|---|---|---|---|
| Claude (orkestrator) | 59 | 12 | 8 | 11 | 8 | 7 | 9 | 4 |
| /impeccable | 58 | 12 | 11 | 9 | 5 | 6 | 12 | 3 |
| /emil-design-eng | 58 | 12 | 11 | 9 | 5 | 6 | 11 | 4 |
| Microsoft Copilot | — | (krever pålogging — ikke kjørt) |

**Aggregert score: 58/100.** Alle tre konvergerer.

## Konsensus-problemer

1. **Heroen kommuniserer ikke lag-stabling.** Shells-SVG leser som geometriske rektangler eller en tom firkant — ikke som «klær på en baby». Spec'en var «Show baby WITH clothing applied. Layers stacked ON body». Brukeren ser ikke 3 lag på < 1 s.

2. **Hierarki-kollaps above-fold.** Vær-pill (mørk navy/burgunder) + Lillian-header (DM Serif 40px) + hero konkurrerer. Ingen av dem dominerer. Hero tar ~30 % der mål er ≥45 %.

3. **PALETT-PIVOT (hard-stop fra /impeccable).** PRODUCT.md sier eksplisitt at paletten skal være **pure white (#FFFFFF) + deep ink (#14181f) + warm orange CTA (#FF6B35) + Apple-Fitness-DNA activity-rings (vogn-blå / bæresele-lilla / utelek-emerald / søvn-indigo)**. Cream + terracotta + serif (det vi bygger på nå som «Court Clay») ble eksplisitt avvist som **«Hatch/Frida-category-reflex»** i jun 2026. Hele forrige sprint er bygget på en avvist palett.

4. **Lag-listen er flat horisontal, ikke en stabling.** «Innerst → Mellomlag → Ekstra» med 1·2·3-tall til høyre føles som mengde, ikke lag-rekkefølge. Visuelt motsatt av det heroens shells skulle gjøre.

5. **Motion uten formål** (Emils første beslutnings-spørsmål: «should this animate at all?»). 90 ms stagger på flat liste er AI-slop-animasjon.

6. **Avatar-overlapp bug** (min observasjon): identity-section Lillian-PNG rendres oppå hero-shellsen.

## Survivor-design

Ingen elementer fra forrige iter overlever uten endring. SVG-shells må forkastes eller forankres til en faktisk baby-silhuett. Court-Clay-paletten må byttes ut.

## Stopp-trigger

- Score (58) < 95 → loop fortsetter etter spec
- MEN: palett-pivot er **hard-stop-anomali** per memory-regel «Destruktive handlinger krever approval» (palett-pivot er destruktivt for forrige sprint) — Sivert må bekrefte scope før iter 002

## Foreslått iter 002 (krever Sivert-bekreftelse)

Konkret plan basert på PRODUCT.md + impeccable + emil:

1. **Palett-pivot**: tokens-bytte i `index.css`. `--paper` blir #FFFFFF. `--ink` blir #14181F. `--terra` blir #FF6B35. Nye tokens for activity-rings: `--ring-vogn` (blå), `--ring-baeresele` (lilla), `--ring-utelek` (emerald), `--ring-soevn` (indigo).
2. **Ny SVG-baby-silhuett**: organisk profil (ikke 4-firkant-onion). Konsentriske kontur-linjer rundt silhuetten = lag.
3. **Activity-rings**: Apple-Fitness-style ringer øverst (en per aktivitet), ikke pille-segment.
4. **Vær-pill krymper** til 1-linje hairline.
5. **Fjern duplikat-avatar** fra identity (vi har den i hero).
6. **Lag-listen** blir vertikal stack med 1px guide-linje (per emil).

Estimat: 2-3 timer AI-tid. Risiko: mange downstream-screens har Court-Clay-tokens som må følge med.
