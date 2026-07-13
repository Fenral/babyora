# Babyora — Native-feel-rapport

**Dato:** 2026-06-25
**Skop:** Aggregert evaluering av 10 uavhengige native-feel-rapporter mot prod (wool-app.vercel.app) + lokal kodebase (`C:/Users/SkotvoldSivertSende/wool-app/`).
**Snitt-score på tvers av rapporter:** ~54/100 (spenn: 28/100 farge/dark-mode → 78/100 ui-ux-pro-max).

---

## Sammendrag

Babyora har et **uvanlig solid fundament** for en Capacitor-basert PWA: kanoniske safe-area-tokens, 44×44 hit-targets, iOS ease-curves, 4-tier haptic-system (selection/light/medium/success) med pre-launch-policy om "aldri eneste signal", `prefers-reduced-motion`-guards på flere skjermer, `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation` globalt, og en motion-grammar med iOS-drawer-curve (cubic-bezier(0.32, 0.72, 0, 1)). Dette er bedre enn de fleste Capacitor-apper i markedet.

Likevel havner appen i et "premium-PWA"-segment (~Linear-web-nivå) snarere enn ekte native-iOS-segment (~Things 3 / Apple Weather / Notion Calendar) av tre grunner: **(1) Skjerm-overganger og spring-fysikk eksisterer kun som dødt kode** — `motion@12.40.0` er installert men null `from 'motion'`-imports i kodebasen, og `motionTokens.ts`-stiffness/damping brukes ikke. **(2) Gestures mangler nesten helt** — ingen drag-to-dismiss på sheets (selv om drag-handle er tegnet), ingen edge-swipe-back, ingen swipe-to-delete på lister, ingen pull-to-refresh. **(3) Native-skallet er underbygget** — kun haptics+geolocation+revenuecat er installert; status-bar/splash-screen/keyboard/app-plugins mangler, dark-mode finnes ikke (`prefers-color-scheme` er 0 treff), Dynamic Type ignoreres (410 hardkodede px-fontsizes), og Lottie + Google Fonts lastes fra CDN på cold-start.

Den gode nyheten: alle 10 rapporter konvergerer på de **samme 3 høyest-impact-tiltakene** (skjerm-transisjoner via Framer Motion, edge-swipe-back, native Capacitor-plugins). Disse alene løfter forventet score fra ~54 til ~78 — og kan bygges i én sprint på ~2 dager AI-tid.

---

## TOP 10 tiltak rangert etter impact

### #1 — Skjerm-overganger via Framer Motion (Animations)
**Hvorfor:** Nevnt som "største web-tell" i 4 av 10 rapporter. `App.tsx` linje 53-87 swapper drill/tab via conditional render uten transition. Native iOS/Android har alltid push-pop slide eller cross-fade. `motion@12.40.0` er allerede i `package.json` men 0 imports.

**Implementering:**
```tsx
// src/App.tsx
import { AnimatePresence, motion } from 'motion/react';

<AnimatePresence mode="wait" initial={false}>
  {drill ? (
    <motion.div
      key="drill"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
    >
      <PaakledningScreen />
    </motion.div>
  ) : (
    <motion.div
      key={tab}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
    >
      {tab === 'hjem' && <HjemScreen />}
      ...
    </motion.div>
  )}
</AnimatePresence>
```

**Deps:** Ingen nye — `motion` er installert.
**Tid:** ~90 min AI-tid.
**Skjermer:** `App.tsx`, alle 10 screens, `BottomTabBar.tsx`.
**Forventet score-løft:** +12-15 poeng.

---

### #2 — Edge-swipe-back fra venstre kant (Gestures)
**Hvorfor:** Drill-skjermer (Paakledning, Guide-targets) har kun back-knapp. iOS-brukere forventer venstre-kant drag-to-pop — nevnt i 5 av 10 rapporter som "den enkelt-funksjonen iOS-brukere savner mest".

**Implementering:**
```tsx
// src/hooks/useEdgeSwipeBack.ts
import { useEffect } from 'react';
export function useEdgeSwipeBack(onBack: () => void) {
  useEffect(() => {
    let startX = 0, startY = 0;
    const onStart = (e: TouchEvent) => {
      if (e.touches[0].clientX < 24) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = Math.abs(e.changedTouches[0].clientY - startY);
      if (startX < 24 && dx > 60 && dy < 40) onBack();
    };
    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchend', onEnd);
    };
  }, [onBack]);
}
```
Pluss `App.addListener('backButton')` for Android-paritet.

**Deps:** `npm install @capacitor/app` (for Android back-button).
**Tid:** ~45 min AI-tid.
**Skjermer:** Alle drill-skjermer (Paakledning, TogGuide, MinGarderobe-detalj).
**Forventet score-løft:** +6-8 poeng.

---

### #3 — Native Capacitor-plugins (status-bar + splash + keyboard + app) (Native plugins)
**Hvorfor:** Statusbar-farge styres bare via `<meta theme-color>` (feil på iOS native). Default splash uten merke-overgang. Keyboard skjuler input-felt. Ingen Android back-button.

**Implementering:**
```bash
npm install @capacitor/status-bar @capacitor/splash-screen @capacitor/keyboard @capacitor/app
npx cap sync
```
```tsx
// src/main.tsx
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { App } from '@capacitor/app';

StatusBar.setStyle({ style: Style.Dark }); // dark text on light bg
StatusBar.setBackgroundColor({ color: '#DBD8D2' }); // matcher --bg-canvas
SplashScreen.hide({ fadeOutDuration: 250 });
Keyboard.addListener('keyboardWillShow', (info) => {
  document.documentElement.style.setProperty('--kb-h', `${info.keyboardHeight}px`);
});
App.addListener('backButton', () => { /* drill-pop logic */ });
```
Pluss dynamisk style-skifte når dark-mode lander (tiltak #6).

**Deps:** `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/keyboard`, `@capacitor/app`.
**Tid:** ~60 min AI-tid + `npx cap sync` per plattform.
**Skjermer:** Hele appen (statusbar + splash er globalt).
**Forventet score-løft:** +8-10 poeng.

---

### #4 — Draggable sheets med snap-points + drag-to-dismiss (Gestures + Animations)
**Hvorfor:** `PaakledningScreen`-sheet har tegnet drag-handle (38×4 bar) men den er dekorativ — kan ikke dras ned. Specet `sheetSlide.dragDismissThreshold: 80` i `motionTokens.ts` brukes ikke. Mobbin-research viser at native sheets ALLTID har grabber + minst én medium-detent + drag-dismiss.

**Implementering:**
```tsx
// src/components/Sheet.tsx
import { motion, useDragControls, AnimatePresence } from 'motion/react';

export function Sheet({ open, onClose, children }) {
  const controls = useDragControls();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: '#000', backdropFilter: 'blur(12px)' }}
          />
          <motion.div
            drag="y"
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => { if (info.offset.y > 80 || info.velocity.y > 500) onClose(); }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0,
              background: 'var(--bg-elevated)', borderRadius: '20px 20px 0 0',
              paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div onPointerDown={(e) => controls.start(e)}
              style={{ padding: 12, display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2,
                background: 'rgba(0,0,0,.18)' }} />
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

**Deps:** Ingen nye (motion er installert). Alternativ: `npm install vaul` for ferdig Radix-basert sheet.
**Tid:** ~2 timer AI-tid (inkl. refactor av PaakledningScreen-sheet + alle modaler).
**Skjermer:** `PaakledningScreen`, alle modaler (plagg-detalj, størrelses-velger, settings).
**Forventet score-løft:** +8-10 poeng.

---

### #5 — Dark-mode + semantiske farge-tokens (Layout / Native plugins)
**Hvorfor:** Score 28/100 fra color-expert. `--bg-canvas: #DBD8D2` er hardlocket lys. `prefers-color-scheme` har 0 treff. iOS-brukere i system-dark får grell beige app.

**Implementering:**
```css
/* src/styles/design-tokens.css */
:root {
  --text-primary: #1A1614;
  --text-secondary: #5E5953;
  --bg-canvas: #DBD8D2;
  --bg-elevated: #FFFFFF;
  --separator: rgba(0,0,0,0.08);
  --accent: #C75D3A;
}
@media (prefers-color-scheme: dark) {
  :root {
    --text-primary: #ECE5DD;
    --text-secondary: #A39B92;
    --bg-canvas: #1A1614;
    --bg-elevated: #2A2420;
    --separator: rgba(255,255,255,0.10);
    --accent: #D87650; /* re-validert for AA på mørk */
  }
}
```
```html
<!-- index.html -->
<meta name="color-scheme" content="light dark" />
<meta name="theme-color" content="#DBD8D2" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#1A1614" media="(prefers-color-scheme: dark)" />
```
Refaktor 80 filer fra `--ink-900` → `--text-primary` osv. Re-valider OKLCH-kontrast etter hue-swap (jf. memo).

**Deps:** Ingen.
**Tid:** ~4 timer AI-tid (codemod + manuell QA + kontrast-validering).
**Skjermer:** Alle 10 screens + `BottomTabBar` + `design-tokens.css`.
**Forventet score-løft:** +10-12 poeng.

---

### #6 — Wire spring-fysikk inn på 4 hot-spots (Animations)
**Hvorfor:** Alle overganger er tids-baserte CSS-easings (120ms-320ms). Ingen spring/velocity-carryover. Rapid double-tap på tab-bar eller segment-slider snapper i stedet for å bevare momentum. `motionTokens.ts` har stiffness/damping definert men aldri brukt.

**Implementering:**
```tsx
// src/components/SegmentToggle.tsx — slider-thumb
<motion.div
  animate={{ x: activity === 'utelek' ? 0 : '100%' }}
  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
  style={{ position: 'absolute', width: '50%', height: '100%' }}
/>

// src/components/BottomTabBar.tsx — press
<motion.button
  whileTap={{ scale: 0.94 }}
  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
>...</motion.button>

// HjemScreen + PaakledningScreen — CTA press: samme pattern, scale 0.97
```
Hot-spots: (1) SegmentToggle-slider, (2) sheet enter/exit, (3) CTA-press, (4) tab-bar icon press.

**Deps:** Ingen nye.
**Tid:** ~90 min AI-tid.
**Skjermer:** `BottomTabBar`, `SegmentToggle`, `HjemScreen`, `PaakledningScreen`.
**Forventet score-løft:** +5-7 poeng.

---

### #7 — Skeleton/shimmer + reservert plass + `useCountUp`-wiring (Layout / Animations)
**Hvorfor:** `HjemScreen` viser `'–'`, `'Henter vær'`, `'Henter anbefaling…'` som tekst-fallback. Layout hopper når data lander. `useCountUp`-hooken finnes i `/hooks` men er ikke koblet til temperatur-tallet — 9° → 10° hopper. Native pattern: opake skeleton-blokker + count-up.

**Implementering:**
```tsx
// src/components/Skeleton.tsx
export const Skeleton = ({ w, h }: { w: number; h: number }) => (
  <div style={{ width: w, height: h, borderRadius: 8,
    background: 'linear-gradient(90deg, var(--separator) 25%, var(--bg-elevated) 50%, var(--separator) 75%)',
    backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
);
// @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

// HjemScreen.tsx
{weather.status === 'loading'
  ? <Skeleton w={120} h={48} />
  : <span style={{ fontVariantNumeric: 'tabular-nums' }}>{useCountUp(weather.temp)}°</span>}
```
Pluss `font-variant-numeric: tabular-nums` globalt på `.number`-spans (temp/vind/nedbør).

**Deps:** Ingen nye.
**Tid:** ~75 min AI-tid.
**Skjermer:** `HjemScreen`, `UkeScreen`, `PaakledningScreen` (alle ladbare verdier).
**Forventet score-løft:** +4-6 poeng.

---

### #8 — Dynamic Type via rem/clamp + `text-size-adjust` (Layout)
**Hvorfor:** 410 treff av hardkodede `px`-fontSize i 80 filer. iOS Dynamic Type og Android font-scale ignoreres totalt. Bryter WCAG 1.4.4-forventning på native.

**Implementering:**
```css
/* design-tokens.css */
:root {
  font-size: 100%;
  --fs-caption: 0.72rem;
  --fs-body: 1rem;
  --fs-label: 0.875rem;
  --fs-title: 1.5rem;
  --fs-display: clamp(2rem, 6vw, 2.5rem);
}
html { -webkit-text-size-adjust: 100%; }
```
Codemod alle screens/* fra `fontSize: 40` → `fontSize: 'var(--fs-display)'`, `13.5` → `'var(--fs-body)'` osv. Test med iOS Settings → Text Size XXL.

**Deps:** Ingen.
**Tid:** ~3 timer AI-tid (codemod + QA på 3 størrelser).
**Skjermer:** Alle 10 screens.
**Forventet score-løft:** +6-8 poeng.

---

### #9 — Self-host fonter + lazy-load screens + drop CDN-Lottie (Layout / Native plugins)
**Hvorfor:** Schibsted Grotesk + DM Serif Display lastes via `@import` fra `fonts.googleapis.com` — render-blokkerende, FOUT-flash på cold-start. Lottie-player fra `unpkg.com`, weather-animasjoner fra `assets10.lottiefiles.com` — 2,5s failsafe-delay offline. Hovedbundle 417 KB, alle 10 screens synkront importert. 42 MB avatars + 68 MB illustrations i `public/`.

**Implementering:**
```bash
npm install @fontsource/schibsted-grotesk @fontsource/dm-serif-display @lottiefiles/dotlottie-react
# eller last ned woff2 til public/fonts/
```
```tsx
// App.tsx — lazy-load
const HjemScreen = lazy(() => import('./screens/HjemScreen'));
// ... alle 10 screens, wrap i <Suspense fallback={<SplashHold/>}>
```
```html
<!-- index.html — preload kritiske fonter -->
<link rel="preload" as="font" type="font/woff2" crossorigin
      href="/fonts/schibsted-grotesk-500.woff2" />
```
Bytt CDN-Lottie til lokal `.lottie`-bundle eller dropp Lottie helt på native (SVG-fallback er produksjons-klar, veier 0 KB). Flytt 42 MB avatar-mappe ut av `public/` — last via dynamisk import.

**Deps:** `@fontsource/schibsted-grotesk`, `@fontsource/dm-serif-display`, evt. `@lottiefiles/dotlottie-react`.
**Tid:** ~3 timer AI-tid.
**Skjermer:** Globalt (fonter), `WeatherLottie`-bruk i `HjemScreen`+`UkeScreen`, alle 10 screens (lazy-split).
**Forventet score-løft:** +5-7 poeng (synlig cold-start).

---

### #10 — Polish-pakke: pull-to-refresh, overscroll-contain, long-press-callout-fix, hit-target-bump (Gestures / Layout / Haptics)
**Hvorfor:** Samle-tiltak med lav individuell kost, høy samlet impact. (a) `useWeather` er refreshable men har ingen pull-gesture. (b) Kun 3/10 screens setter `WebkitOverflowScrolling` — ingen `overscroll-behavior: contain`, iOS rubber-band lekker til body. (c) Long-press på temp/anbefaling trigger iOS tekst-callout. (d) Notif-knapp i `HjemScreen` linje 439-440 er 40×40 — under WCAG 2.5.5 / Apple HIG 44pt. (e) Haptic-toggle i Settings mangler (Wysa/Sonar/stoic.-mønster).

**Implementering:**
```css
/* design-tokens.css */
html, body { overscroll-behavior: contain; }
body { -webkit-touch-callout: none; user-select: none; }
input, textarea, [contenteditable] { -webkit-touch-callout: default; user-select: text; }
```
```tsx
// src/hooks/usePullToRefresh.ts — Capacitor-native via Preferences eller WebView pull
// Eller bruk react-simple-pull-to-refresh
import PullToRefresh from 'react-simple-pull-to-refresh';
<PullToRefresh onRefresh={() => weather.refetch()}>
  <HjemContent />
</PullToRefresh>

// HjemScreen.tsx linje 439-440 — bump hit-target
<button style={{ width: 44, height: 44, ...rest }} />

// Settings — ny toggle
<Toggle label="Haptisk feedback" value={haptics.enabled} onChange={haptics.set} />
```

**Deps:** `react-simple-pull-to-refresh` (eller native via Capacitor StatusBar-event).
**Tid:** ~2 timer AI-tid (samlet).
**Skjermer:** `HjemScreen`, `UkeScreen`, `Settings` (ny), `design-tokens.css`, alle scroll-containere.
**Forventet score-løft:** +4-6 poeng samlet.

---

## Kategori-oversikt

| Kategori | Tiltak | Estimert tid | Forventet løft |
|---|---|---|---|
| **Animations** | #1 Skjerm-overganger, #6 Spring-fysikk, #7 Skeleton/count-up | ~4 t | +21-28 |
| **Gestures** | #2 Edge-swipe-back, #4 Draggable sheets, #10 PTR | ~5 t | +18-24 |
| **Native plugins** | #3 status-bar/splash/keyboard/app, #5 dark-mode bridge, #9 self-host | ~7 t | +23-29 |
| **Layout** | #5 Dark-mode + tokens, #8 Dynamic Type, #10 overscroll-contain | ~9 t | +20-26 |
| **Haptics** | #10 Settings-toggle (resten allerede solid) | ~30 min | +1-2 |

**Total estimat:** ~25 timer AI-tid. **Forventet samlet score-løft:** +54 → ~82-88/100 (Things 3-segmentet).

---

## Anbefalt rekkefølge (sprint-plan)

**Sprint 1 (Dag 1, ~4 t):** Tiltak #1 + #2 + #3. Disse tre alene løfter "føles som webside"-følelsen mest, og er forutsetninger for #4 og #6.

**Sprint 2 (Dag 2, ~5 t):** Tiltak #4 + #6 + #7. Bygger på spring-fysikk-infraen fra Sprint 1.

**Sprint 3 (Dag 3, ~9 t):** Tiltak #5 + #8. Dark-mode + Dynamic Type krever codemod over 80 filer — gjør samlet for å unngå dobbel refactor.

**Sprint 4 (Dag 4, ~5 t):** Tiltak #9 + #10. Polish-pakke + cold-start-optimalisering. Test på fysisk enhet, mål LCP/TTI før/etter.

**Re-evaluer:** Kjør samme 10 rapporter på nytt etter Sprint 4 — forventet snitt 82-88/100.

---

## Sluttnote

Babyora er **én sprint unna** å gå fra "premium PWA" til "føles som ekte iOS-app". Fundamentet (haptics, tokens, safe-area, motion-grammar) er allerede der — det som mangler er å koble det inn. De tre topp-tiltakene (#1, #2, #3) er teknisk billige fordi `motion` er installert og Capacitor-plugins er én `npm install` unna. Den eneste reelle refactor-jobben er dark-mode + Dynamic Type (codemod over ~80 filer), og den løses i én dag.
