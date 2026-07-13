# Iter 001 — Claude-syntese (orkestrator, skrives først)

Commit: `b307b56` · Branch: `redesign/instrument-level` · Preview: wool-app-git-redesign-instrument-level-sivert-s-projects.vercel.app
Skjermbilde: `screenshot-hjem.png` (390×844, full-page)

## Hva jeg ser

- **Navn («Lillian») + dato** øverst — slim identity, OK.
- **Vær-pill** mørk navy/terra med 15° + cond + meta — visuell tyngde høyt på skjermen, **konkurrerer med hero**.
- **Hero**: 2-kolonne. Venstre er en SVG-firkant (yttertøy-shell) med en mindre firkant inni (mellomlag) og en mini baby-omriss (sirkel + trapes). Høyre tekst «+ lite bevegelse» + «3 lag · 15°».
- **Avatar-PNG av Lillian (pinkish dukk-figur)** ligger oppå hero-shellsen øverst venstre — det er en VISUELL FEIL. (Det ser ut som identity-section avatar fortsatt rendres et sted.)
- **Detail-list «Lag for lag»** under hero med innerst/mellomlag/ekstra-rader + thumbnails.
- **Activity-segment** (Vogn / Bæresele / Utelek).
- **Bottom-nav** (Hjem / Uke / Guide / Innst).
- **«Bra å vite»-tip-kort** nederst — sticky, fortsatt visuell vekt.

## Score (min vurdering)

| Dimensjon | Score | Begrunnelse |
|---|---|---|
| Hierarki & klarhet | 12/25 | Hero ER over fold-en, men vær-pill og avatar-overlapp tar oppmerksomheten |
| Visuell forklaring | 8/25 | Shells leser som geometriske rektangler, IKKE «lag på baby». Bruker forstår IKKE antrekket på 1s. |
| Typografi & tekst-økonomi | 11/15 | «+ lite bevegelse» + «3 lag · 15°» er ryddig. Vær-pill duplicerer 15°. |
| Motion | 8/10 | Stagger-fade-in funker ved aktivitet-bytte (sjekkbart manuelt). |
| Farge/depth | 7/10 | Vær-pill (mørk navy) er for sterk vs hero (paper-deep). Tertiær elementer fortsatt skygget. |
| Touch & a11y | 9/10 | Forrige a11y-fixes holder. |
| AI-slop | 4/5 | Ikke generisk SaaS, men shells er for abstrakt. |

**Total: ~59/100**

## Største problemer

1. **Shells representerer ikke baby**. Brukeren ser kvadrater, ikke «klær på et barn». Spec'en var «Show baby WITH clothing applied. Layers stacked ON body» — ikke konsentriske rektangler.
2. **Avatar-overlapp**: identity-section avatar (Lillian-PNG) rendres VARSEL/oppå hero-shellsen. Bug.
3. **Vær-pill konkurrerer med hero** — bør neddres til en tynnere status-strip eller flyttes innenfor hero.
4. **Dupliserende temp**: 15° vises både i vær-pill og i hero-meta — én av dem bør droppes.
5. **Tip-kort nederst** har fortsatt visuell vekt; bør neddres som tertiær.

## Foreslått neste-runde-endring (hvis konsensus)

- **Reintroduser A-tier-PNG i sentrum av shells** — la babyen være SYNLIG, shells RUNDT som tynnere ringer
- **Fjern duplikat-avatar** fra identity (vi har den i hero nå)
- **Tynnere vær-pill** — en tekst-strip («Oslo · 15° · skyet · 3.4 m/s»), ikke et stort kort
- **Drop hero-meta sin «15°»** siden vær-pill viser den
