# Babyora — DressUp-orbital · Fable 5 kvalitetsvurdering

> En brif av prosjektet og den nylig live-integrerte DressUp-orbital-
> funksjonen for ekstern kvalitetsvurdering. Dato: 2026-06-12.

## Hva er Babyora

Norsk påkledningsapp for foreldre med barn 0–3 år. Hjelper foreldre å
velge **hva barnet skal ha på i dag** basert på:

- Vær (met.no — temp, vind, nedbør, gefuhltetemperatur)
- Aktivitet (vogn, bæresele, utelek, søvn, bilstol)
- Alder + utviklingstrinn (kan rulle, går, osv.)

Motoren `wool-layers` er en egen NPM-pakke (`Fenral/wool-layers`,
47 tester) som returnerer en strukturert `Recommendation` med 4
kategorier: **innerst**, **mellomlag**, **yttertøy**, **ekstra**.

**Stack**: Vite + React 19 + TypeScript + vanilla CSS. Capacitor for
iOS + Android (app-id `no.klemeg.app`). Backend: Supabase.

**Repo**: `Fenral/wool-app` (lokal mappe `wool-app/`). Branch som vurderes:
`redesign/instrument-level`.

## Hva som vurderes — DressUp-orbital (commit `8dd07cb`)

Hjem-fanen i Babyora viser barnet (avatar **«Lillian»**) påkledd dagens
anbefaling, omgitt av 6 plagg-«tags» i sirkulær orbit som forklarer
**hvert plagg-valg**. Designet erstatter det forrige pin-systemet
(numererte 1–4 punkter på avatar) som ble dropet pga. duplikat-UI.

### Konsept

```
        [Lue]
                                ← plagg-tag (klikkbar med label)
  [Body]              [Votter]
                  
        [Lillian]                ← A-tier-PNG (sentralt)
                                    ferdig kledd vinter, claymation 3D
  [Ull-bukse]          [Kjøredress]
        [Sokker]
```

- **Animasjon**: spilles automatisk **første gang per sesjon**
  (sessionStorage-flag). Plaggene flyr inn fra ytterkanten med fjær-
  fysikk (WAAPI), lander i orbit-posisjon, og blir der.
- **Klikkbart**: hvert plagg er en SVG-button med alltid-synlig label
  («Ull-bukse», «Kjøredress», osv.). Klikk åpner et bottom-sheet
  (`LayerDetailSheet`) med forklaring + alternativer + bytte-funksjon.
- **Tilgjengelighet**: tastatur-navigasjon (Tab + Enter/Space), aria-
  labels, focus-trap i sheet, retur-fokus til triggerende tag,
  `prefers-reduced-motion` gir fade-modus uten haptikk.

### Pedagogisk hensikt

Hvert plagg-valg er drevet av motor-anbefaling. Tag-en kommuniserer
**plagget**; klikk forklarer **hvorfor** (f.eks. «Ull mot huden holder
varme og slipper fukt ut»). Bytte til alternativ skjer i samme sheet.

## Tech-stack-detaljer

| Lag | Teknologi |
|---|---|
| Frontend | React 19, Vite, TypeScript 5, vanilla CSS + design-tokens (Søvnro powder-blue palette) |
| Animasjon | Web Animations API (WAAPI), avhengighetsfri renderer |
| Native | Capacitor 6 (iOS + Android), no.klemeg.app |
| Backend | Supabase (Auth + Postgres + Storage) |
| Vær | met.no public API |
| Avatar-assets | A-tier-PNG-er (A1–A7) + plagg-tag-PNG-er, alle 3D-claymation-stil generert via Gemini Nano Banana 2 |
| Motor | `wool-layers` (NPM, intern), tar (Weather, Child, Activity) → Recommendation |

## Filstruktur (DressUp-spesifikk)

```
src/features/dressup/
├── DressUpOrbital.tsx        ← Production-komponent (HeroHotspot bruker denne)
├── DressUpAvatar.tsx         ← WAAPI-renderer, avhengighetsfri
├── DressupSandbox.tsx        ← Test-rute (`/?dressup-test=1`)
├── choreography.ts           ← Fjær-fysikk + buildTimeline
├── garment-visuals.tsx       ← ORBIT_POSITIONS + outfitLayersToOrbitalVisuals
├── garment-slot-map.ts       ← plagg-id → slot-mapping (6 slots)
└── HANDOFF.md                ← Original handover-spec

src/components/
├── HeroHotspot.tsx           ← Sentral Hjem-komponent (bruker DressUpOrbital)
├── LayerDetailSheet.tsx      ← Bottom-sheet (focus-trap, Esc, retur-fokus)
├── LayerPeelControl.tsx      ← «Vis under»-knapper (bytter A-tier-PNG)
├── ComfortBadge.tsx          ← Komfort-pille (Lun / Kald / Komfortabel)
└── WeatherScene.tsx          ← Dekorativ vær-bakgrunn

src/lib/
├── avatar-tier.ts            ← tier-mapping (A1–A7) + avatarPng()
├── outfit-state.ts           ← Recommendation → OutfitLayer[]
└── wool-layers/              ← Motor-import (NPM-symlink)

public/
├── avatars/avatar-{A1..A7}.png          ← Ferdig kledd Lillian per tier
└── illustrations/
    ├── garments/*.png                    ← Plagg-thumbnails (60+ filer)
    └── dressup/lillian-*.png             ← Lillian-formede plagg for sandkasse
```

## Tilgjengelighet (A11y)

Sjekkliste, alle aktive:

- [x] Avatar SVG har `role="img"` + dynamisk `aria-label` («Barnet kles
      på» under sekvens → «Barnet er ferdig kledd» etter)
- [x] Hver plagg-tag er en SVG-`<g role="button">` med:
  - `aria-haspopup="dialog"`
  - `aria-label="{plagg-navn}, åpne detaljer"`
  - `aria-expanded` (oppdateres via DOM når sheet åpner/lukker)
  - `tabIndex=0` etter animasjon (−1 mens animasjon spiller)
- [x] LayerDetailSheet har `role="dialog"` + `aria-modal`, focus-trap
      (Tab/Shift+Tab syklerer), Esc lukker, retur-fokus til triggerende
      plagg-tag
- [x] `prefers-reduced-motion: reduce` → fade-modus uten haptikk
- [x] `role="status"` + `aria-atomic` på sluttmelding
- [x] Tab-rekkefølge matcher pedagogisk DRESS_ORDER
      (underdel → overdel → ytterlag → fotter → hode → hender)
- [x] Inert på underliggende innhold mens sheet er åpen

Tidligere a11y-review-rounds: 3 (sandkasse-fase, fix-runde, live-fase).
Alle anbefalinger fra `accessibility-lead` er anvendt.

## Animasjonsdetaljer

- **Total varighet**: 1277 ms (innenfor 1300 ms-budsjettet)
- **Fjær-fysikk**: stiffness 320, damping 32 (kritisk-dempet,
  ratio 0.89 — subtil settle uten synlig wobble)
- **Stagger**: 90 ms per plagg
- **Squash-effekt**: skrudd av (orbit-modus har 6 raske landinger →
  ville gitt opplevelse av canvas-vibrasjon)
- **Haptikk**: `navigator.vibrate(8)` per landing (web), kun i spring-modus

## Hva som er ferdig (committed til branch)

| Commit | Hva |
|---|---|
| `8dd07cb` | Live-integrasjon i HeroHotspot, memoize outfitLayers i HomeScreen |
| `826bb9a` | Bug-fix: choreography-memo (animasjonen kjørte ikke) |
| `b70a8bb` | Fjern canvas-risting (squash off, høyere damping) |
| `e0b5cdb` | Orbit-redesign (sandkasse) + LayerDetailSheet-kobling |
| `8717691` | Lillian-formede plagg-PNG-er + a11y-runde |

## Kjente begrensninger (ærlig for review)

1. **A-tier-PNG-ene** er fortsatt det gamle designet (laget for pin-
   paradigmet). De er claymation-Lillian fullt kledd. Visuell konsistens
   med orbit-tags er akseptabel, men en regenerering kunne hevet
   helheten.

2. **«Bytt plagg»-funksjonen** i `LayerDetailSheet` vises men er IKKE
   koblet til motoren ennå — klikk på alternativ-chip endrer ingenting.
   Egen oppgave senere.

3. **LayerPeelControl** bytter A-tier-PNG (vise under) mens orbit-tags
   forblir uendret — kan skape forvirring om plagg-tag-en hører til
   peel-stagen som vises. Tags forblir bevisst statiske (de er
   anbefalingen, ikke avatar-laget).

4. **Lillian-formede plagg-PNG-er** brukes kun i sandkassen
   (`?dressup-test=1`). Live bruker `/illustrations/garments/*.png`
   (eksisterende thumbnail-sett). Vurderer å regenerere de mest brukte
   for konsistens.

5. **Pin-systemet** er fjernet i HeroHotspot, men `LayeredAvatar`-
   komponenten finnes fortsatt (brukes i ModellExplorer-vy).

6. **Browser-kompatibilitet**: WAAPI har bred støtte men spring-fysikk
   sampling er manuelt regnet ut (ingen avhengighet). Testet i Chrome
   og Edge; iOS Safari haptikk hopper graciøst over (try/catch).

## Verifiserings-URL

Sandkasse (offentlig hvis Vercel preview-protection er av):
`https://wool-app-git-redesign-instrument-level-sivert-s-projects.vercel.app/?dressup-test=1`

Live Hjem-vy:
`https://wool-app-git-redesign-instrument-level-sivert-s-projects.vercel.app/`
(krever onboarding-flyt; mock-bruker kan opprettes)

## Hva Fable 5 bør vurdere

1. **Visuell konsistens**: leser orbit-tags som hørende til Lillian
   sentralt, eller som «svevende» objekter uten kontekst?
2. **Pedagogisk klarhet**: forstår en ny bruker at hvert plagg er en
   forklaring, og at klikk åpner mer info?
3. **A11y**: er tab-rekkefølgen meningsfull? Er aria-labels nyttige?
4. **Animasjons-følelse**: er fjær-fysikken behagelig, eller distraherende?
5. **Sluttilstand**: er statisk orbit etter animasjon estetisk og funksjonelt?
6. **Bottom-sheet UX**: er innholdet brukbart? Er bytte-funksjonen tydelig?
7. **Mobile-first**: vises orbit pent på 430×900 viewport (iPhone)?

---

*Generert 2026-06-12. Branch: `redesign/instrument-level`. Hovedutvikler:
Sivert Skotvold Sende. Implementasjon assistert av Claude Code.*
