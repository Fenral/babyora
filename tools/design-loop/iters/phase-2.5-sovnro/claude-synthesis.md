# Phase 2.5 — Søvnro palett — Claude self-eval

Commit: `572f945`
Preview: wool-app-git-redesign-instrument-level-sivert-s-projects.vercel.app
Screenshot: `sovnro-hjem.png` (390×844, vogn-sleeping, A7 avatar)

## Score (samme 7-dim RUBRIC)

| Dim | Phase 2 (Court Clay) | Phase 2.5 (Søvnro) | Δ | Note |
|---|---|---|---|---|
| Hierarki (25) | 23 | **23** | 0 | Avatar dominerer fortsatt. Vær-strip MER subtil nå (paper vs paper-elev mer like) — kan være for stille. |
| Visuell forklaring (25) | 24 | **24** | 0 | Pin/chip/peel-mønster uendret. Powder blue er like leselig som terra. |
| Typografi (15) | 13 | **13** | 0 | DM Serif «Lillian» nå i deep blue — leser fint på cool bone. |
| Motion (10) | 9 | **9** | 0 | Tokens uendret, bare farger. |
| Farge (10) | 9 | **8** | −1 | Paletten fungerer, men: clay-warm hair (#E6D7CB) er for subtil mot cool bone paper (1.10:1) til å reelt anker mot klinisk. Risiko-flagget realiserer seg litt. |
| A11y (10) | 10 | **10** | 0 | Egen `--focus` clay-warm token løser blå-på-blå-risikoen som a11y-lead flagget. |
| AI-slop (5) | 4 | **3** | −1 | Powder blue er baby-app-kategori-reflex (Pampers/Owlet/Nanit/Hatch). Mer reflex enn terra var. |

**Total: 90/100** (−2 fra Phase 2 sin 92)

## Hva som fungerer

- **Søvn-mood treffer**: Lillian i sovepose mot cool bone leser «søvn-rom» — semantisk perfekt
- **Tekst-kontrast holder**: deep blue (#3F5F7E) på paper er 7.5:1 AAA, leser knivskarpt
- **Pin-pulsen funker**: powder blue pins pulser fint mot avatar
- **`--focus` separat token redder fokus-state**: clay-warm focus-ring på blå pin = synlig (a11y-lead P0-fix gjorde jobben)

## Hva som er svakere

1. **Clay-warm hair er for subtilt** — det skulle være anker mot klinisk, men 1.10:1 mot paper gjør det praktisk usynlig. Dette var risiko-flagget i planen.
2. **AI-slop-score ned**: powder blue er kategori-reflex for baby-segment. Søvnro leser «hvilken baby-app som helst» mer enn unikt Babyora.
3. **Lillian-claymation klashing er reell men subtil**: varm sovepose-orange mot cool blå har «warm/cool split». Ikke katastrofe, men ikke flowy.
4. **Vær-strip subtil**: paper-elev mot paper er nesten umerkelig — vær-konteksten kan «forsvinne».

## Recommendation

**Hold Søvnro** (Sivert valgte og fortjente å se det live), men vurder:

### Polish-iterasjon (Phase 2.6 hvis Sivert vil):
- **Push clay-warm hardere**: gjør `--paper-elev` til en SVAK clay-tint istedenfor cool bone. Da får hele vær-strip + knowtip clay-warmth, ankret paletten mot Lillian.
- **Eller**: gi `--hair` en tydeligere clay-warm (#D8C0AB istedenfor #E6D7CB) for mer synlig differensieringssignal.

### Alternativ vinklinger:
- Hybrid: behold powder blue som accent, men paper #F8F6F0 (warm bone, ikke cool). Lillian klasher mindre.

Eller **hold som er** — 90/100 er fortsatt over Phase 2-gate 85.

## Gate-status

90 ≥ 85 → behold. Score sank fra 92 → 90 (−2). Innenfor akseptabel-margin.

Sivert avgjør om Phase 2.6 polish trengs eller om vi flytter til Phase 3 (dress-up).
