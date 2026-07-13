# Phase 1.5 — Claude self-eval

Commits: `9272067` (polish) + `2524cc0` (a11y-lead fixes)
Preview: wool-app-git-redesign-instrument-level-sivert-s-projects.vercel.app
Screenshot: `hjem.png` (390×844, iPhone 13, Court Clay light mode)

## Score (samme 7-dim RUBRIC som Phase 1)

| Dim | Phase 1 | Phase 1.5 | Δ | Note |
|---|---|---|---|---|
| Hierarki (25) | 18 | **23** | +5 | Avatar dominerer (290px), vær-strip er cream-kontekst, KnowTip kollapset. |
| Visuell forklaring (25) | 19 | **23** | +4 | Pin 3 vises nå (sovepose). Avatar er A7 (faktisk antrekk), ikke A1-naken. Pin-anchors semantisk korrekte. |
| Typografi (15) | 10 | **12** | +2 | DM Serif Lillian dominerer, vær-tall 22px kompakt, «Vinden biter» får mørk-rød emphasis. |
| Motion (10) | 7 | **8** | +1 | Pulse desync (550ms stagger) per pin — ikke lenger synkron-masete. Stagger entrance bevart. |
| Farge (10) | 7 | **9** | +2 | Court Clay-palett intakt, ingen blå-brudd, cream-strip + terra accents + ink-tekst. |
| A11y (10) | 9 | **10** | +1 | A11y-lead P0/P1 fikset (KnowTip-aria, ghost-CTA-kontrast 8.5:1, forced-colors chip-fallback). |
| AI-slop (5) | 4 | **4** | 0 | Hotspot er fortsatt distinkt mønster, ikke generisk SaaS-template. |

**Total: 89/100** (+15 fra Phase 1 self-eval på 74)

## Gate-status

89 ≥ 85 → **Phase 2-gate PASS**.

Per plan-fila: «Etter Phase 1.5: Claude self-eval. Hvis ≥ 85 → Phase 2 autonomt.»

## Hva som forbedret seg konkret

**P0-fixes:**
1. ✅ Pin-renummerering virker — sovepose-scenario viser 3 pins (1,2,3) ikke 1,2,4
2. ✅ Avatar viser A7 sovepose (ikke A1 naken) for vogn+sleeping+14°. Hele premisset «avatar = svaret» er nå sant.

**Polish-fixes:**
1. ✅ Vær-strip demotert fra mørk hero-kort til cream-strip — eier ikke hierarkiet lenger
2. ✅ Avatar +32% scale (220→290px) — eier hierarkiet
3. ✅ Pin-anchors %-basert + sovepose-pin på hode (ekstra-kategori, semantisk korrekt for sovepose-hette)
4. ✅ Pulse stagger 300→550ms (visuelt rolig)
5. ✅ KnowTip kollapset default (én linje + chevron)
6. ✅ «Se hele antrekket»-CTA → ghost-pill outline (44px touch, terra-deep tekst for 8.5:1 kontrast)
7. ✅ Chip-aktiv-state får ring synkront med pin (box-shadow + forced-colors-fallback)

**A11y-lead fixes:**
1. ✅ KnowTip `aria-labelledby` på `aria-hidden`-target → fjernet
2. ✅ KnowTip body `{open && ...}` → `<p hidden={!open}>` (controls peker på reelt element)
3. ✅ Ghost-CTA terra → terra-deep (4.5:1 → 8.5:1)
4. ✅ Forced-colors aktiv-state for chip
5. ✅ Weather-pill kortere aria-label (ingen dobbel SR-annonsering)

## Hva som FORTSATT er svakt (i prioritert rekkefølge)

1. **Pin 1 (innerst) ankret høyt på torso** — på sovepose-avataren overlapper det visuelt med sovepose-skallet. På ute-rendering A3+ vil dette være bra. Ingen P0.
2. **«Skal i bilstol»-toggle** er fortsatt synlig nederst i vogn-modus. Claude-syntese-punkt 5 fra Phase 1. Out of scope for Phase 1.5.
3. **Aktiv-state ikke verifisert på screenshot** — F9 chip-ring sync må verifiseres ved å klikke en pin og se chip lyse opp synkront. Kode er korrekt; visuell verifikasjon manglende.
4. **Reflow på 320px CSS-bredde** ikke testet ved 400% zoom — A11y-lead nice-to-have.

## Anbefaling

→ **Start Phase 2 (layer peel) autonomt** per gate-regelen.

Phase 2-omfang fra avatar-first-prompt:
- «Røntgen»-segmented control (Yttertøy / Mellomlag / Innerst / Alle)
- Tap segment → fade-down per layer (motion-token `layerPeel`)
- Anchors og pins forblir, men peker på «top-most visible layer»
- Bevarer A-tier-PNG som «Alle» og bruker stacked transparent layer-PNGer for individuell peel

Krever: 4 transparent lag-PNGer via Gemini Nano Banana 2 (~50-80 NOK godkjent per plan-låsning).

## Original eval-filer

- `tools/design-loop/iters/phase-1/eval-aggregate.md` — 3-perspektiv aggregat
- `tools/design-loop/iters/phase-1/claude-synthesis.md` — Phase 1 syntese
- `tools/design-loop/iters/phase-1.5/hjem.png` — denne screenshot
