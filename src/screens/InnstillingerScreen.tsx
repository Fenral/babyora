/* eslint-disable react-hooks/preserve-manual-memoization -- This legacy screen's callbacks intentionally omit React's stable state setters. Adding useTranslation made the compiler lint inspect those existing callbacks; exhaustive-deps still validates every reactive dependency. */
/**
 * InnstillingerScreen — F60 skjerm "Innstillinger" (top-level tab).
 *
 * Design: mock A (warm-grey #DBD8D2 canvas, DM Serif på temp-meta,
 * warm orange #FF6B35 CTA, Schibsted Grotesk body).
 *
 * Seksjoner:
 *  - PROFIL: kompakt hero med avatar + bytt/legg-til-barn
 *  - VÆR & STED: sted · bruk-posisjon · værkilde
 *  - VARSLER: morgenvarsel · værendring
 *  - UTSEENDE: 3-vei tema-segment (auto / lys / mørk)
 *  - NATIVE-FØLELSE: vibrasjon · reduser bevegelse
 *  - ABONNEMENT: warm orange Premium CTA
 *  - OM & STØTTE: hjelp · tilbakemelding · personvern
 *  - Logg ut (destruktiv tekst-knapp, terracotta)
 *
 * Bottom-bar: BottomTabBar med active='innstillinger'.
 *
 * A11y:
 *  - <main> + <h1> sr-only + semantic <section>/<h2>
 *  - role="switch" + aria-checked på toggles
 *  - role="list"/listitem på grouped rows
 *  - 44px+ touch-target på alle interactives
 *  - focus-visible ring
 *  - safe-area-inset top/bottom
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent as ReactChangeEvent,
  type FormEvent as ReactFormEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import type { TabKey } from '../types/nav';
import { Capacitor } from '@capacitor/core';
import { useChildren } from '../state/children-store';
import { useHapticSystem } from '../lib/haptics/system';
import { useNativeSettings, setNativeSetting } from '../hooks/useNativeSettings';
import { useTheme, type ThemeMode } from '../state/theme-store';
import { useNotificationPref } from '../state/notification-pref-store';
import { useRefHour, type RefHour } from '../state/ref-hour-store';
import { useLocationPref } from '../state/location-pref-store';
import { useAccess } from '../lib/premium/use-access';
import {
  isChildSwitchGated,
  resolveRuntimeCapabilityAccess,
} from '../lib/premium/gating';
import { PLUS_FEATURE_AVAILABILITY } from '../lib/premium/plus-features';
import { automaticLocationController } from '../hooks/useAutoLocationRefresh';
import {
  cancelMorningNotification,
  disableWeatherChangeNotifications,
  enableWeatherChangeNotifications,
  requestNotificationPermission,
  scheduleMorningNotification,
} from '../lib/notifications/morning-notification';
import {
  deleteAllLocalData,
  downloadLocalDataExport,
} from '../lib/gdpr/local-data';
import { requestAppReview, type AppRateResult } from '../lib/feedback/app-rate';
import { APP_VERSION } from '../lib/app-version';
import { PaywallDialog } from '../components/PaywallDialog';
import { CareCircle } from '../components/family/CareCircle';
import type { Caregiver } from '../components/family/care-circle-model';
import { MaterialPreferenceSheet } from '../components/profile/MaterialPreferenceSheet';
import { clearLanguageOverride, setLanguageOverride } from '../i18n';
import {
  htmlLanguageFor,
  isSupportedLanguage,
  readLanguageOverride,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '../i18n/language-policy';
import {
  feedbackDivider,
  getSettingsCopy,
  materialPreferenceLabel,
  type SettingsSecondaryCopy,
} from './settings-copy';
// BottomTabBar er nå global (mounted i App.tsx) — ikke importer/mount her.

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface InnstillingerScreenProps {
  onNavigate: (tab: TabKey) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDob(dob: string, locale: string): string {
  if (!dob) return '—';
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return dob;
  return d.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatHour(hour: number): string {
  const h = Math.max(0, Math.min(23, Math.round(hour)));
  return `${String(h).padStart(2, '0')}:00`;
}

function ageInMonths(dob: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const months =
    (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  return months >= 0 ? months : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tokens (inline — for mock A look uten å kreve global token-fil)
// ─────────────────────────────────────────────────────────────────────────────

// Token-bridge: alle farger peker til CSS-variabler fra design-tokens.css
// slik at dark-mode (data-theme="dark" / prefers-color-scheme) overstyrer
// automatisk uten å re-render React-treet. Skygger/hairlines bruker også
// tokens slik at de blir mykere/lysere i dark.
const C = {
  bgCanvas: 'var(--dw-canvas)',
  bgCanvasSoft: 'var(--dw-canvas)',
  orange500: 'var(--dw-accent)',
  orange600: 'var(--dw-accent)',
  orange700: 'var(--dw-accent)',
  orange100: 'var(--dw-accent-surface)',
  terracotta700: 'var(--dw-accent)',
  ink900: 'var(--dw-ink-hi)',
  ink800: 'var(--dw-ink-hi)',
  ink700: 'var(--dw-ink-mid)',
  ink500: 'var(--dw-ink-mid)',
  ink300: 'var(--dw-ink-low)',
  ink200: 'var(--dw-hairline)',
  cardBg: 'var(--dw-raised)',
  hairline: 'var(--dw-hairline)',
  cardShadow: 'var(--shadow-cta)',
  fontSans: "var(--dw-font-ui)",
  fontSerif: "var(--font-serif)",
  // Kontrakten: EN kurve for hele appen. Var var(--ease-standard)
  // = cubic-bezier(0.32,0.72,0,1); --dw-ease er (0.2,0.7,0.2,1).
  ease: 'var(--dw-ease)',
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const rootStyle: CSSProperties = {
  position: 'relative',
  minHeight: '100dvh',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: C.fontSans,
  color: C.ink900,
  background: C.bgCanvas,
  boxSizing: 'border-box',
  paddingTop: 'max(54px, env(safe-area-inset-top, 54px))',
  /* ═══ KLARING FOR DEN FLYTENDE TAB-BAREN ═══════════════════════════════
     FUNN 2026-08-06, sett i revisjonens skjermbilde: siste rad i «De som
     passer» — «Ida · Dagmamma / Venter på svar» — lå BAK tab-baren og ble
     kuttet av skjermkanten. Den var verken lesbar eller trykkbar.

     Skjermen hadde paddingTop, men ingen paddingBottom. Tab-baren flyter
     over innholdet, så uten klaring nederst ender alltid det siste
     elementet under den. Hvor mange rader som forsvinner avhenger av hvor
     mange som passer barnet — altså av dataene. Det er den verste
     varianten: feilen finnes ikke for en familie med to voksne, og finnes
     for en med fire.

     --dw-tabbar-clearance er husets eget svar (høyde + gap + safe-area +
     14 px) og brukes allerede av Hjem, Juster, Plaggbiblioteket og
     Vinterprogrammet. Denne skjermen brukte den ikke. Samme funn som
     Plaggbiblioteket fikk 2026-08-05: tokenet fantes, og skjermen som
     trengte det sto utenfor. ══════════════════════════════════════════ */
  paddingBottom: 'var(--dw-tabbar-clearance, 90px)',
};

const subtleHighlightStyle: CSSProperties = {
  content: '""',
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  background:
    'radial-gradient(120% 46% at 50% -8%, var(--dw-canvas-glow), transparent 60%)',
};

const headerStyle: CSSProperties = {
  position: 'relative',
  zIndex: 5,
  flex: 'none',
  padding: 'var(--dw-space-20) var(--dw-space-22) var(--dw-space-8)',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: 'var(--dw-space-12)',
};

const titlesStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--dw-space-2)',
  minWidth: 0,
};

const eyebrowTopStyle: CSSProperties = {
  fontFamily: C.fontSerif,
  fontStyle: 'italic',
  fontWeight: 400,
  fontSize: '0.8125rem',
  letterSpacing: '.2px',
  color: C.ink700,
  lineHeight: 1,
};

const appTitleStyle: CSSProperties = {
  fontSize: 30,
  fontWeight: 700,
  letterSpacing: '-0.6px',
  margin: 0,
  color: C.ink900,
  lineHeight: 1.05,
};

/* metaPillStyle er SLETTET 2026-08-06 sammen med stedspillen den kledde (se
   headeren). En stil uten flate er død kode, og `noUnusedLocals` ville uansett
   stoppet den — men poenget er at flaten skulle vekk, ikke bare bruken. */

const scrollStyle: CSSProperties = {
  position: 'relative',
  zIndex: 3,
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
  /* D4: bunn-fade i stedet for hardt kutt — samme oppskrift som resten av
     appen (.dw-sheet-innhold, .hjm-result, Plaggbiblioteket). Uten den sier
     en skjerm som er lengre enn skjermen ingenting om at det er mer under.

     FUNN 2026-08-06 ([MINDRE] Innstillinger, «bunn-fade dimmer ekte innhold
     langt over tab-baren»). MEKANISMEN: `--dw-fade-bunn` er
     `linear-gradient(to bottom, black 92%, transparent 100%)` — en PROSENT
     av containerens høyde. Denne containeren er ~628 px høy, så 8 % blir
     ~50 px uttoning. Seksjonsetiketten «VARSLER» og kortet under lå i den
     sonen I HVILE og leste som deaktivert, ikke som avskåret.

     OG DET ER IKKE `--dw-fade-over-tabbar` SOM ER SVARET HER. Det tokenet
     er bygget for containere som går HELT NED under den flytende baren, og
     legger uttoningen 76 px over containerbunnen. Denne containeren slutter
     allerede 14 px OVER barens overkant, fordi `rootStyle` bærer
     `--dw-tabbar-clearance` som paddingBottom. Byttet ville flyttet
     uttoningen ~90 px ENDA lenger opp og gjort funnet verre. Målt i
     revisjonens tall: containerbunn y≈754, barens overkant y≈768.

     Riktig svar er en uttoning forankret i containerBUNNEN med en FAST
     rampe — 28 px, samme rampehøyde som `--dw-fade-over-tabbar` bruker — så
     sonen ikke vokser med skjermhøyden. «VARSLER» (y≈717) står da i full
     styrke, og de siste 28 px bærer fortsatt rulle-affordansen (doktrine 4).
     Verdien hører hjemme som token; se delteFilerSomTrengs i overleveringen. */
  WebkitMaskImage: 'var(--dw-fade-bunn-kort)',
  maskImage: 'var(--dw-fade-bunn-kort)',
  padding: '14px 16px calc(env(safe-area-inset-bottom, 0px) + 110px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--dw-space-18)',
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'none',
};

const sectionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--dw-space-8)',
};

const sectionEyebrowStyle: CSSProperties = {
  fontSize: '0.65625rem',
  fontWeight: 600,
  letterSpacing: '1.6px',
  textTransform: 'uppercase',
  color: C.ink500,
  margin: '0 var(--dw-space-4)',
  lineHeight: 1,
};

const groupCardStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  background: C.cardBg,
  borderRadius: 16,
  overflow: 'hidden',
  border: `1px solid ${C.hairline}`,
  boxShadow: C.cardShadow,
};

const rowBase: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--dw-space-12)',
  padding: 'var(--dw-space-14)',
  minHeight: 52,
  width: '100%',
  background: 'transparent',
  border: 'none',
  textAlign: 'left',
  font: 'inherit',
  color: C.ink800,
  cursor: 'pointer',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
};

const rowStaticBase: CSSProperties = {
  ...rowBase,
  cursor: 'default',
};

const rowIconBase: CSSProperties = {
  flex: 'none',
  width: 32,
  height: 32,
  borderRadius: 9,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: C.bgCanvasSoft,
  color: C.ink700,
  border: `1px solid ${C.hairline}`,
};

const rowIconAccent: CSSProperties = {
  ...rowIconBase,
  background: C.orange100,
  color: C.orange700,
  borderColor: 'var(--dw-hairline)',
};

const rowBodyStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
};

const rowLabelStyle: CSSProperties = {
  fontSize: '0.90625rem',
  fontWeight: 500,
  color: C.ink900,
  letterSpacing: '-0.1px',
  lineHeight: 1.15,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

// P8 (ekstern designgjennomgang): én-linjes ellipsis kappet hjelpetekster
// midt i meningen (f.eks. "...hjem-skje..." under Referansetime,
// "...påkled..." under Morgenvarsel). rowBase har kun min-height (52), ikke
// fast høyde, så radene kan vokse — bytter til en 2-linjers klipp i stedet
// for 1-linjes avkutting.
const rowSubStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 500,
  color: C.ink500,
  letterSpacing: '.05px',
  lineHeight: 1.3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  whiteSpace: 'normal',
};

// F81.5-W2: delt "Pluss"-chip — a11y-krav (accessibility-lead pre-clearance)
// er at premium-elementer ALLTID formidler kravet visuelt FØR aktivering
// (aldri kun ikon/farge/dimming). Chip er aria-hidden — den fulle meningen
// ("krever Babyora Pluss") ligger alltid i elementets aria-label/tilgjengelige
// navn ved siden av, aldri kun i denne visuelle chippen.
const plussChipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  flex: 'none',
  marginLeft: 'var(--dw-space-6)',
  padding: 'var(--dw-space-2) 7px',
  borderRadius: 999,
  fontSize: '0.625rem',
  fontWeight: 700,
  letterSpacing: '0.4px',
  textTransform: 'uppercase',
  color: 'var(--dw-ink-on-accent)',
  background: 'var(--dw-accent)',
};

const rowValueStyle: CSSProperties = {
  flex: 'none',
  fontSize: '0.84375rem',
  fontWeight: 500,
  color: C.ink500,
  letterSpacing: '-0.05px',
  maxWidth: '42%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const rowValueBoldStyle: CSSProperties = {
  ...rowValueStyle,
  color: C.ink900,
  fontWeight: 600,
};

const rowChevronStyle: CSSProperties = {
  flex: 'none',
  color: C.ink300,
  display: 'flex',
  alignItems: 'center',
};

const dividerStyle: CSSProperties = {
  height: 1,
  background: C.hairline,
  margin: '0 var(--dw-space-14)',
};

// P6 (Familie-kortsuppe, duel-notat §9): "Barn"-seksjonen hadde tidligere TO
// stablede kort — profil-hero (profileHeroStyle, egen bakgrunn/kant/skygge)
// og en separat handlings-liste (groupCardStyle) rett under. Doktrinen sier
// «sections on ONE raised group surface, ytterbokser rundt enkeltelementer
// fjernes». barnSectionSurfaceStyle er den ENE ytre flaten som nå huser
// begge (se render-stedet), med en divider mellom. profileHeroStyle mistet
// derfor sin egen bakgrunn/kant/skygge/radius — rent visuelt, ingen
// data/props/aria endret.
const barnSectionSurfaceStyle: CSSProperties = {
  background: C.cardBg,
  borderRadius: 18,
  border: `1px solid ${C.hairline}`,
  boxShadow: C.cardShadow,
  overflow: 'hidden',
};

const profileHeroStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--dw-space-14)',
  padding: 'var(--dw-space-14) var(--dw-space-14)',
};

// Bar liste-reset for lister som lever INNI barnSectionSurfaceStyle (samme
// visuelle overflate som resten av "Barn"-seksjonen) — groupCardStyle sin
// EGEN bakgrunn/kant/skygge ville dobbeltkortet.
const groupListBareStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
};

const profileAvatarStyle: CSSProperties = {
  width: 56,
  height: 56,
  flex: 'none',
  borderRadius: '50%',
  background: 'var(--dw-raised)',
  border: `1px solid ${C.hairline}`,
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
};

const profileBodyStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--dw-space-2)',
};

const profileNameStyle: CSSProperties = {
  fontFamily: C.fontSerif,
  fontWeight: 400,
  fontSize: '1.375rem',
  letterSpacing: '-0.4px',
  color: C.ink900,
  lineHeight: 1.1,
  margin: 0,
};

const profileMetaStyle: CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: C.ink700,
  letterSpacing: '.1px',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--dw-space-6)',
  flexWrap: 'wrap',
};

const profileMetaDotStyle: CSSProperties = {
  width: 3,
  height: 3,
  borderRadius: '50%',
  background: C.ink300,
  display: 'inline-block',
};

const profileEditStyle: CSSProperties = {
  flex: 'none',
  /* 44, ikke 36: trykkmaalet er et gulv i BEGGE akser (WCAG 2.5.8).
     Hoyden ble reddet av den globale button{min-height:44px}, saa
     knappen var 36x44 - ikke 44x44. De sju andre lukkeknappene i
     filen var allerede riktige: dette var drift bort fra normen. */
  width: 'var(--dw-size-touch)',
  height: 'var(--dw-size-touch)',
  borderRadius: 11,
  background: C.bgCanvasSoft,
  border: `1px solid ${C.hairline}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  padding: 0,
  color: C.ink700,
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation',
};

const premiumCardStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'stretch',
  gap: 0,
  padding: 0,
  borderRadius: 18,
  background: `linear-gradient(135deg, ${C.orange500} 0%, ${C.orange600} 60%, ${C.orange700} 100%)`,
  boxShadow: 'var(--shadow-cta-primary)',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--dw-ink-on-accent)',
  textAlign: 'left',
  font: 'inherit',
  width: '100%',
  WebkitTapHighlightColor: 'transparent',
};

// F81.5-W2 SHIP-blocker-fiks: shine var inset:0 (dekket hele kortet, inkl.
// tekstsonen) — dempet/konfinert til høyre (pil-)sonen slik at den aldri
// legger et lysere lag bak eyebrow/tittel/sub-tekst (se premiumEyebrowStyle/
// premiumSubStyle under for kontrast-fiksen selve teksten fikk).
const premiumShineStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  width: '42%',
  background:
    'radial-gradient(140% 100% at 100% 0%, rgba(255,255,255,.16), rgba(255,255,255,0) 62%)',
  pointerEvents: 'none',
};

const premiumBodyStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: 'var(--dw-space-16) var(--dw-space-14) var(--dw-space-16) var(--dw-space-18)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--dw-space-4)',
  position: 'relative',
  zIndex: 1,
};

const premiumEyebrowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--dw-space-6)',
  fontSize: '0.625rem',
  fontWeight: 700,
  letterSpacing: '1.8px',
  textTransform: 'uppercase',
  // F81.5-W2 SHIP-blocker-fiks: var(--dw-ink-on-accent) er en udelt, heldekkende
  // tekstfarge kalibrert MOT nettopp denne gradient-familien (samme par
  // brukes allerede av premiumTitleStyle/premiumArrowStyle under, og av
  // PaywallDialog sin hero) — erstatter semi-transparent hvit (samme
  // kontrast-antipattern som ble felt i pre-clearance).
  color: 'var(--dw-ink-on-accent)',
  lineHeight: 1,
};

// Dekorativ status-dot — teksten ved siden av bærer alltid betydningen
// (aldri farge alene). aria-hidden i markup.
const premiumStatusDotStyle: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: 'currentColor',
  flex: 'none',
};

const premiumTitleStyle: CSSProperties = {
  fontFamily: C.fontSerif,
  fontStyle: 'italic',
  fontWeight: 400,
  fontSize: '1.375rem',
  letterSpacing: '-0.4px',
  lineHeight: 1.1,
  color: 'var(--dw-ink-on-accent)',
  margin: 0,
};

const premiumSubStyle: CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 500,
  // F81.5-W2 SHIP-blocker-fiks: se premiumEyebrowStyle-kommentaren over.
  color: 'var(--dw-ink-on-accent)',
  letterSpacing: '.05px',
  lineHeight: 1.3,
};

const premiumArrowStyle: CSSProperties = {
  flex: 'none',
  width: 54,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  zIndex: 1,
  color: 'var(--dw-ink-on-accent)',
};

const logoutBtnStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--dw-space-8)',
  width: '100%',
  minHeight: 52,
  padding: 'var(--dw-space-14)',
  border: `1px solid ${C.hairline}`,
  borderRadius: 16,
  background: C.cardBg,
  color: C.terracotta700,
  fontSize: '0.90625rem',
  fontWeight: 600,
  letterSpacing: '-0.1px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation',
};

const footerMetaStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--dw-space-2)',
  padding: 'var(--dw-space-4) 0 var(--dw-space-2)',
  color: C.ink500,
  fontSize: '0.71875rem',
  fontWeight: 500,
  letterSpacing: '.2px',
};

const footerBrandStyle: CSSProperties = {
  fontFamily: C.fontSerif,
  fontStyle: 'italic',
  fontSize: '0.8125rem',
  color: C.ink700,
  letterSpacing: '.1px',
};

// ─────────────────────────────────────────────────────────────────────────────
// Chevron
// ─────────────────────────────────────────────────────────────────────────────

function Chevron(): ReactElement {
  return (
    <span style={rowChevronStyle} aria-hidden="true">
      <svg
        width={7}
        height={12}
        viewBox="0 0 7 12"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable={false}
      >
        <path d="M1 1l5 5-5 5" />
      </svg>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Row icon SVG-er (16×16, currentColor)
// ─────────────────────────────────────────────────────────────────────────────

/* FUNN 2026-08-06 ([MINDRE] Innstillinger, «Bytt barn bruker et tilbake-/
   angre-pilikon»): ikonet var ÉN pil med hodet mot venstre og en hale som
   svingte ned og tilbake — nøyaktig formen på en angre-/tilbakepil. Det leste
   «gå tilbake», ikke «velg et annet barn», og ikonet er det blikket treffer
   først i raden. Nå to motsatt rettede piler: den øvre går mot høyre, den
   nedre mot venstre — den entydige veksle-formen, og symmetrisk slik at den
   ikke kan forveksles med en retning. */
function IconSwap(): ReactElement {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h12" />
      <path d="M12 3l3 3-3 3" />
      <path d="M15 12H3" />
      <path d="M6 9l-3 3 3 3" />
    </svg>
  );
}

function IconPlus(): ReactElement {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}

function IconPin(): ReactElement {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 14s5-4.5 5-8.5a5 5 0 10-10 0C3 9.5 8 14 8 14z" />
      <circle cx="8" cy="5.5" r="1.8" />
    </svg>
  );
}

function IconCrosshair(): ReactElement {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 2v2M8 12v2M2 8h2M12 8h2" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

function IconCloud(): ReactElement {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 11a3 3 0 010-6 4 4 0 017.7 1.3A2.5 2.5 0 0112 11H4z" />
    </svg>
  );
}

function IconBell(): ReactElement {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12h10l-1.5-2V7a3.5 3.5 0 00-7 0v3z" />
      <path d="M6.5 14a1.5 1.5 0 003 0" />
    </svg>
  );
}

function IconClock(): ReactElement {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 5v3l2 1.5" />
    </svg>
  );
}

function IconTrend(): ReactElement {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 9l3-3 3 3 6-6" />
      <path d="M10 3h4v4" />
    </svg>
  );
}

function IconVibrate(): ReactElement {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="3" width="6" height="10" rx="1.4" />
      <path d="M2 6v4M14 6v4" />
    </svg>
  );
}

function IconMotion(): ReactElement {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" />
      <path d="M5 8h6" />
    </svg>
  );
}

function IconHelp(): ReactElement {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" />
      <path d="M6.3 6.3a1.7 1.7 0 113 .8c-.5.4-1.3.6-1.3 1.4" />
      <circle cx="8" cy="11.2" r=".6" fill="currentColor" />
    </svg>
  );
}

function IconFeedback(): ReactElement {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 4h12v7H6l-3 2.5V4z" />
    </svg>
  );
}

function IconShield(): ReactElement {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2l5 2v4c0 3-2.2 5.4-5 6-2.8-.6-5-3-5-6V4l5-2z" />
    </svg>
  );
}

function IconStar(): ReactElement {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2.2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.4l-3.6 1.9.7-4L2.2 6.5l4-.6L8 2.2z" />
    </svg>
  );
}

function IconDownload(): ReactElement {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2v8" />
      <path d="M4.5 7L8 10.5 11.5 7" />
      <path d="M3 13h10" />
    </svg>
  );
}

function IconTrash(): ReactElement {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 4.5h10" />
      <path d="M6 4.5V3.2A1.2 1.2 0 017.2 2h1.6A1.2 1.2 0 0110 3.2v1.3" />
      <path d="M4.4 4.5l.7 8.3A1.4 1.4 0 006.5 14h3a1.4 1.4 0 001.4-1.2l.7-8.3" />
      <path d="M6.8 7v4M9.2 7v4" />
    </svg>
  );
}

function IconLogout(): ReactElement {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3H3v10h3" />
      <path d="M10 5l3 3-3 3" />
      <path d="M13 8H6" />
    </svg>
  );
}

function IconEdit(): ReactElement {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11.3 2.7l2 2L5 13l-3 .6.6-3z" />
    </svg>
  );
}

/* IconHeaderPin er SLETTET 2026-08-06 sammen med stedspillen i headeren.
   `IconPin` (samme motiv, 16 px) står igjen og brukes av «Sted»-raden, som nå
   er skjermens eneste sted-visning. */

function ArrowLong(): ReactElement {
  return (
    <svg width={22} height={13} viewBox="0 0 26 14" fill="none" stroke="var(--dw-ink-on-accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 7h20" />
      <path d="M17 2l5 5-5 5" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TogglePill
// ─────────────────────────────────────────────────────────────────────────────

interface TogglePillProps {
  on: boolean;
  ariaLabel: string;
  onChange: (next: boolean) => void;
  reducedMotion: boolean;
  /** Optional ref — settes på <button>-elementet slik at en dialog kan
   *  returnere fokus til toggle-en når den lukkes. */
  buttonRef?: { current: HTMLButtonElement | null };
  /** F81.5-W2: sett til 'dialog' når trykk (i gatet tilstand) åpner en
   *  paywall i stedet for å faktisk toggle — ellers undefined. */
  ariaHaspopup?: 'dialog';
  disabled?: boolean;
}

function TogglePill({
  on,
  ariaLabel,
  onChange,
  reducedMotion,
  buttonRef,
  ariaHaspopup,
  disabled = false,
}: TogglePillProps): ReactElement {
  /* ═══ TRYKKFLATEN ER IKKE SPORET ══════════════════════════════════════════
     FUNN 2026-08-06 ([MINDRE] Innstillinger, «bryteren er nesten sirkulær»).

     MEKANISMEN lå ikke i tallene her, men i design-tokens.css:507 —
     `button { min-height: 44px }` (det globale WCAG-trykkmålet). `height: 28`
     på en <button> kan ikke slå en `min-height` fra stilarket: min-height
     KLEMMER høyden opp uansett hvor den kommer fra. Sporet ble derfor
     46 × 44 px med `border-radius: 999` — altså en sirkel, forholdstall 1,05
     — og knotten (24 px, `top: 2`) satt i ØVRE VENSTRE HJØRNE av en flate
     som var 16 px høyere enn den trodde. «Skinne med to endestillinger»
     forsvinner når skinnen er rund.

     44 px-trykkmålet er RIKTIG og skal bli stående. Feilen var at
     trykkmålet og den synlige flaten var samme element. <button> er nå den
     usynlige trykkflaten (52 × 44), og sporet er et eget <span> med egne
     mål: 52 × 29 = 1,79× høyden, knott 25 px = 86 % av sporhøyden — begge
     endestillinger synlige. Kanten står ALLTID (gjennomsiktig i på-
     tilstand) så geometrien ikke hopper 2 px når bryteren slås på. */
  const hitAreaStyle: CSSProperties = {
    width: 52,
    minHeight: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 'none',
    padding: 0,
    flex: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  };

  const trackStyle: CSSProperties = {
    width: 52,
    height: 29,
    borderRadius: 999,
    /* ═══ AV ER NEDSENKET, IKKE LYST ═══════════════════════════════════════

       Historikken står her fordi begge feilene er lærerike.

       P8 byttet fra C.ink200 (--dw-hairline, en ~14 % rgba-LINJE beregnet
       for kanter) fordi av-sporet var nesten usynlig i lys modus — hvit
       knott på ~#EAE8E8, ~1,2:1. Riktig diagnose. Men erstatningen ble
       --dw-ink-low: et BLEKK-token brukt som FLATE.

       Følgen ble målt 2026-08-06: i mørkt tema er --dw-ink-low #A79A82,
       altså lys varm tan på et mørkebrunt kort. Alt annet inaktivt på
       skjermen er mørkt, så bryteren leste som PÅ mens den var AV — med
       underteksten «Bruker valgt sted» rett ved siden av. En kontroll som
       motsier seg selv er verre enn en utydelig kontroll: forelderen tror
       hun har skrudd på noe hun ikke har.

       P8 løste «usynlig i lys» og skapte «ser påslått ut i mørk». Begge
       kommer av at av-tilstanden ble tenkt som en FARGE. Den er en
       TILSTAND: av = nedsenket, på = hevet og aksentuert.

       --dw-canvas er mørkere enn kortet (--dw-raised) i mørkt tema OG
       nedsenket i lyst. Kanten holder den lesbar der forskjellen er liten
       — som er nettopp problemet P8 fant. */
    background: on ? C.orange500 : 'var(--dw-canvas)',
    border: `1px solid ${on ? 'transparent' : C.hairline}`,
    boxShadow: on ? 'none' : 'inset 0 1px 2px rgba(0, 0, 0, 0.28)',
    position: 'relative',
    display: 'block',
    flex: 'none',
    padding: 0,
    transition: reducedMotion ? 'none' : `background var(--dw-m-state) ${C.ease}`,
  };

  const thumbStyle: CSSProperties = {
    position: 'absolute',
    top: 1,
    left: 1,
    width: 25,
    height: 25,
    borderRadius: '50%',
    background: '#FFF',
    // P8: la til en fast tynn ring (0 0 0 1px) i tillegg til løfteskyggen —
    // gir kula en synlig egen kant mot sporet UANSETT sporfarge/tema, i
    // stedet for å stole utelukkende på fyll-mot-fyll-kontrast.
    boxShadow: '0 0 0 1px rgba(0,0,0,.14), 0 1px 3px rgba(0,0,0,.18)',
    /* 23 px = sporets innvendige bredde (52 − 2 × 1 px kant = 50) minus
       knotten (25) minus de 2 × 1 px luft den ligger med. Begge
       endestillingene er dermed synlige som luft i motsatt ende. */
    transform: on ? 'translateX(23px)' : 'translateX(0)',
    // F83: iOS-switch-fysikk — iosDrawer-kurven (ease-standard) + 320ms gir
    // den karakteristiske raskt-ut/myk-landing-følelsen fra native switches.
    transition: reducedMotion
      ? 'none'
      : 'transform var(--dw-m-state) var(--ease-standard)',
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      aria-haspopup={ariaHaspopup}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={() => onChange(!on)}
      style={hitAreaStyle}
    >
      <span aria-hidden="true" style={trackStyle}>
        <span aria-hidden="true" style={thumbStyle} />
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Row helpers
// ─────────────────────────────────────────────────────────────────────────────

interface NavRowProps {
  icon: ReactNode;
  label: string;
  sub?: string;
  value?: string;
  valueBold?: boolean;
  accent?: boolean;
  onClick: () => void;
  ariaLabel?: string;
}

function NavRow({ icon, label, sub, value, valueBold, accent, onClick, ariaLabel }: NavRowProps): ReactElement {
  return (
    <button
      type="button"
      className="ba-row-press"
      style={rowBase}
      onClick={onClick}
      aria-label={ariaLabel ?? (value ? `${label} — ${value}` : label)}
    >
      <span style={accent ? rowIconAccent : rowIconBase} aria-hidden="true">
        {icon}
      </span>
      <span style={rowBodyStyle}>
        <span style={rowLabelStyle}>{label}</span>
        {sub ? <span style={rowSubStyle}>{sub}</span> : null}
      </span>
      {value ? (
        <span style={valueBold ? rowValueBoldStyle : rowValueStyle}>{value}</span>
      ) : null}
      <Chevron />
    </button>
  );
}

interface ToggleRowProps {
  icon: ReactNode;
  label: string;
  sub?: string;
  on: boolean;
  onChange: (next: boolean) => void;
  reducedMotion: boolean;
}

function ToggleRow({ icon, label, sub, on, onChange, reducedMotion }: ToggleRowProps): ReactElement {
  const { t } = useTranslation();
  return (
    <div
      style={rowStaticBase}
      role="group"
      aria-label={`${label} — ${t(on ? 'common.on' : 'common.off')}`}
    >
      <span style={rowIconBase} aria-hidden="true">
        {icon}
      </span>
      <span style={rowBodyStyle}>
        <span style={rowLabelStyle}>{label}</span>
        {sub ? <span style={rowSubStyle}>{sub}</span> : null}
      </span>
      <TogglePill on={on} ariaLabel={label} onChange={onChange} reducedMotion={reducedMotion} />
    </div>
  );
}

interface SectionProps {
  eyebrow: string;
  children: ReactNode;
  id: string;
  ariaLabel?: string;
}

function Section({ eyebrow, children, id, ariaLabel }: SectionProps): ReactElement {
  return (
    <section style={sectionStyle} aria-labelledby={id}>
      <h2 id={id} style={sectionEyebrowStyle}>
        {eyebrow}
      </h2>
      <ul role="list" style={groupCardStyle} aria-label={ariaLabel}>
        {children}
      </ul>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ThemeSegment — 3-vei radio-group (auto / lys / mørk)
// ─────────────────────────────────────────────────────────────────────────────

interface ThemeSegmentProps {
  mode: ThemeMode;
  onChange: (next: ThemeMode) => void;
  reducedMotion: boolean;
}

interface ThemeOption {
  value: ThemeMode;
  labelKey: string;
  icon: ReactNode;
}

function IconMaterial(): ReactElement {
  return (
    <svg width={17} height={17} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6.2 10 2.8l7 3.4-7 3.4-7-3.4Z" />
      <path d="m3 10 7 3.4 7-3.4" />
      <path d="m3 13.8 7 3.4 7-3.4" />
    </svg>
  );
}

function useSettingsSecondaryCopy(): SettingsSecondaryCopy {
  const { i18n } = useTranslation();
  return getSettingsCopy(i18n.resolvedLanguage ?? i18n.language);
}

function IconThemeAuto(): ReactElement {
  return (
    <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="8" r="5.2" />
      <path d="M8 2.8v10.4" />
      <path d="M8 2.8a5.2 5.2 0 010 10.4z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconThemeLight(): ReactElement {
  return (
    <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1.6v1.6M8 12.8v1.6M1.6 8h1.6M12.8 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" />
    </svg>
  );
}

function IconThemeDark(): ReactElement {
  return (
    <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13.2 9.6A5.6 5.6 0 016.4 2.8a5.6 5.6 0 106.8 6.8z" />
    </svg>
  );
}

const THEME_OPTIONS: ThemeOption[] = [
  { value: 'auto', labelKey: 'settings.family.themeAuto', icon: <IconThemeAuto /> },
  { value: 'light', labelKey: 'settings.family.themeLight', icon: <IconThemeLight /> },
  { value: 'dark', labelKey: 'settings.family.themeDark', icon: <IconThemeDark /> },
];

function ThemeSegment({ mode, onChange, reducedMotion }: ThemeSegmentProps): ReactElement {
  const { t } = useTranslation();
  const trackStyle: CSSProperties = {
    display: 'flex',
    gap: 'var(--dw-space-4)',
    padding: 'var(--dw-space-4)',
    margin: 'var(--dw-space-4) var(--dw-space-12) var(--dw-space-12)',
    background: C.bgCanvasSoft,
    borderRadius: 12,
    border: `1px solid ${C.hairline}`,
  };

  const segBtnBase: CSSProperties = {
    flex: 1,
    minHeight: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--dw-space-6)',
    padding: 'var(--dw-space-8) var(--dw-space-10)',
    border: 'none',
    borderRadius: 9,
    background: 'transparent',
    color: C.ink700,
    fontFamily: 'inherit',
    fontSize: '0.84375rem',
    fontWeight: 600,
    letterSpacing: '-0.05px',
    cursor: 'pointer',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    transition: reducedMotion ? 'none' : `background var(--dw-m-state) ${C.ease}, color var(--dw-m-state) ${C.ease}`,
  };

  const segBtnActive: CSSProperties = {
    ...segBtnBase,
    background: C.orange500,
    color: 'var(--dw-ink-on-accent)',
    boxShadow: 'var(--shadow-1)',
  };

  return (
    <div
      role="radiogroup"
      aria-label={t('settings.family.themeGroup')}
      style={trackStyle}
    >
      {THEME_OPTIONS.map((opt) => {
        const active = mode === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t(opt.labelKey)}
            onClick={() => onChange(opt.value)}
            style={active ? segBtnActive : segBtnBase}
          >
            <span aria-hidden="true" style={{ display: 'flex' }}>{opt.icon}</span>
            <span>{t(opt.labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InnstillingerScreen
// ─────────────────────────────────────────────────────────────────────────────

// R7 Task 7 (R9-forhåndsvisning, dev-only): statiske eksempeldata for
// omsorgssirkelen. Ingen ekte deling skjer — familiedeling krever auth/RLS/
// backend (R9) og er ikke aktivert. 5 personer → 4 tokens + «+1 flere».
const CARE_CIRCLE_PREVIEW: readonly Caregiver[] = [
  { id: 'mor', name: 'Mona', role: 'roleMother', status: 'active' },
  { id: 'far', name: 'Jonas', role: 'roleFather', status: 'active' },
  { id: 'beste', name: 'Kari', role: 'roleGrandparent', status: 'pending' },
  { id: 'dag', name: 'Ida', role: 'roleChildminder', status: 'pending' },
  { id: 'onkel', name: 'Per', role: 'roleUncle', status: 'pending' },
];

export function InnstillingerScreen({ onNavigate: _onNavigate }: InnstillingerScreenProps): ReactElement {
  // _onNavigate beholdes i signaturen (App passer den), men brukes ikke lokalt
  // siden BottomTabBar nå mountes globalt i App.tsx.
  void _onNavigate;
  const { t, i18n } = useTranslation();
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language;
  const locale = htmlLanguageFor(activeLanguage);
  const secondaryCopy = getSettingsCopy(activeLanguage);
  const {
    active,
    needsOnboarding,
    resetAll,
    children: allChildren,
    setActiveId,
    addChild,
    updateChild,
  } = useChildren();
  const { hapticsPref, motionPref, reducedMotion } = useNativeSettings();
  const { fire } = useHapticSystem();
  const [languageChoice, setLanguageChoice] = useState<'auto' | SupportedLanguage>(
    () => readLanguageOverride() ?? 'auto',
  );
  const themeMode = useTheme((s) => s.mode);
  const setThemeMode = useTheme((s) => s.setMode);
  const morningOn = useNotificationPref((s) => s.morning);
  const weatherChangeOn = useNotificationPref((s) => s.weatherChange);
  const morningHour = useNotificationPref((s) => s.morningHour);
  const setMorningPref = useNotificationPref((s) => s.setMorning);
  const setWeatherChangePref = useNotificationPref((s) => s.setWeatherChange);
  const setMorningHourPref = useNotificationPref((s) => s.setMorningHour);
  const refHour = useRefHour((s) => s.refHour);
  const setRefHourPref = useRefHour((s) => s.setRefHour);
  // F81.5-W2: useAccess() er den eneste kontrakten skjermer skal bruke for
  // Premium-status (se use-access.ts). Migrert fra direkte useSubscription()-
  // lesing — samme underliggende verdi, ingen atferdsendring.
  const { isPremium, loading: accessLoading } = useAccess();
  const automaticLocationAccess = resolveRuntimeCapabilityAccess(
    'automatic_location',
    {
      isPlus: isPremium,
      // automatic_location has no authentication requirement.
      authenticated: false,
      loading: accessLoading,
    },
    PLUS_FEATURE_AVAILABILITY,
  );
  const automaticLocationAllowed = automaticLocationAccess.allowed;
  const careCirclePreview = useMemo<readonly Caregiver[]>(
    () => CARE_CIRCLE_PREVIEW.map((caregiver) => ({
      ...caregiver,
      role: t(`settings.family.${caregiver.role}`),
    })),
    [t],
  );
  const locationMode = useLocationPref((s) => s.mode);
  const setLocationMode = useLocationPref((s) => s.setMode);
  const autoLocationLiveRef = useRef({
    access: automaticLocationAccess,
    childId: active.id,
  });
  useLayoutEffect(() => {
    autoLocationLiveRef.current = {
      access: automaticLocationAccess,
      childId: active.id,
    };
  }, [active.id, automaticLocationAccess]);
  const autoLocationActivationPendingRef = useRef(false);
  useEffect(() => () => {
    if (autoLocationActivationPendingRef.current) {
      automaticLocationController.invalidate();
    }
  }, []);

  // Toast (norsk content, auto-skjul etter 4s)
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 4000);
  }, []);
  useEffect(() => () => {
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
  }, []);

  // Bytt barn-modal (P1: åpnes fra Profil-seksjon → "Bytt barn")
  const switchChildRowRef = useRef<HTMLButtonElement | null>(null);
  const [switchChildOpen, setSwitchChildOpen] = useState(false);

  const handleOpenSwitchChild = useCallback(() => {
    if (needsOnboarding) return;
    void fire('light');
    setSwitchChildOpen(true);
  }, [fire, needsOnboarding]);

  const handleSelectChild = useCallback(
    (id: string) => {
      if (id === active.id) {
        setSwitchChildOpen(false);
        return;
      }
      void fire('selection');
      setActiveId(id);
      setSwitchChildOpen(false);
    },
    [active.id, fire, setActiveId],
  );

  // F81.5-W2 (Flate 4): gatet barn-bytte — Bytt barn-dialogen holdes ÅPEN
  // (native <dialog>-stacking) mens paywall vises på toppen, slik at fokus
  // kan returnere til nøyaktig den barn-raden brukeren trykket når paywall
  // lukkes (i stedet for en rad i en allerede-lukket dialog).
  const [barn2PaywallOpen, setBarn2PaywallOpen] = useState(false);
  const [barn2PaywallReturnFocusTo, setBarn2PaywallReturnFocusTo] =
    useState<HTMLElement | null>(null);

  const handleRequestChildUpgrade = useCallback(
    (trigger: HTMLButtonElement) => {
      void fire('light');
      setBarn2PaywallReturnFocusTo(trigger);
      setBarn2PaywallOpen(true);
    },
    [fire],
  );

  // Legg-til-nytt-barn-modal (P1: åpnes fra Profil-seksjon → "Legg til nytt barn")
  // Native <dialog> med form (navn + dob + sted). Bruker addChild() direkte
  // — vi kjører ikke completeOnboarding() siden brukeren allerede har
  // gjennomført onboarding for første barn.
  const addChildRowRef = useRef<HTMLButtonElement | null>(null);
  const [addChildOpen, setAddChildOpen] = useState(false);

  const materialPreferenceRowRef = useRef<HTMLButtonElement | null>(null);
  const [materialPreferenceOpen, setMaterialPreferenceOpen] = useState(false);

  const handleOpenAddChild = useCallback(() => {
    void fire('light');
    setAddChildOpen(true);
  }, [fire]);

  const handleOpenMaterialPreference = useCallback(() => {
    if (needsOnboarding) return;
    void fire('light');
    setMaterialPreferenceOpen(true);
  }, [fire, needsOnboarding]);

  const handleAddChildSubmit = useCallback(
    (payload: { name: string; dob: string; city: string }) => {
      const actionCopy = getSettingsCopy(activeLanguage).actions;
      void fire('success');
      // Behold default-koordinater fra aktiv barn (best-effort) hvis tilgjengelig,
      // ellers fall tilbake til Trondheim (matcher OnboardingScreen DEFAULT_LOCATION).
      const lat = !needsOnboarding && active.lat ? active.lat : 63.4305;
      const lon = !needsOnboarding && active.lon ? active.lon : 10.3951;
      const AVATAR_COLORS_PICK = ['#C25450', '#4F8A6A', '#2E7CC2', '#D87A2E', '#8B5A8C', '#5B6470'];
      const color = AVATAR_COLORS_PICK[allChildren.length % AVATAR_COLORS_PICK.length]!;
      addChild({
        name: payload.name,
        dob: payload.dob,
        city: payload.city,
        lat,
        lon,
        color,
      });
      setAddChildOpen(false);
      showToast(actionCopy.childAdded(payload.name));
    },
    [active.lat, active.lon, activeLanguage, addChild, allChildren.length, fire, needsOnboarding, showToast],
  );

  // Tidspunkt-modal for morgenvarsel
  const morningRowRef = useRef<HTMLButtonElement | null>(null);
  const [timePickerOpen, setTimePickerOpen] = useState(false);

  // R7 Task 7: Morgenvarsel er en GRATIS-kapabilitet (capabilities.ts) — ingen
  // paywall-gate. Toggle-en ber direkte om varsel-tillatelse for alle brukere.
  const morningToggleRef = useRef<HTMLButtonElement | null>(null);

  // Auto-posisjon (Vær & sted → "Bruk posisjon automatisk")
  // Native <dialog> som forklarer permission FØR vi spør navigator.geolocation —
  // gir brukeren et tydelig samtykke-steg og oppfyller App Store/Play sin
  // "explain before request"-anbefaling. role=switch + aria-checked på selve
  // toggle-en holdes uendret; toggle→dialog→bekreft→permission-request.
  const autoLocationToggleRef = useRef<HTMLButtonElement | null>(null);
  const [autoLocationDialogOpen, setAutoLocationDialogOpen] = useState(false);
  const [autoLocationPending, setAutoLocationPending] = useState(false);

  // Referansetime-modal (når på dagen været skal vises på hjem-skjerm)
  const refHourRowRef = useRef<HTMLButtonElement | null>(null);
  const [refHourPickerOpen, setRefHourPickerOpen] = useState(false);

  // Værendring-varsel: toggle + permission-explainer-dialog
  //
  // Flyt (samme mønster som auto-posisjon):
  //  1. Bruker trykker toggle ON → role=switch / aria-checked styres av weatherChangeOn
  //  2. Vi åpner native <dialog> som forklarer HVORFOR vi spør om varsel-tillatelse
  //  3. Bruker bekrefter → requestNotificationPermission() (Capacitor på native,
  //     Notification API på web)
  //  4. granted → setWeatherChangePref(true) + enableWeatherChangeNotifications()
  //     (wirer til morning-notification.ts sin LocalNotifications-kanal slik at
  //      weather-service kan fyre event-baserte varsler når temp. faller > 5°)
  //  5. denied/default → setWeatherChangePref(false) + toast med veiledning
  //  6. OFF → setWeatherChangePref(false) + disableWeatherChangeNotifications()
  //
  // Focus-return: dialog returnerer fokus til TogglePill via weatherChangeToggleRef.
  const weatherChangeToggleRef = useRef<HTMLButtonElement | null>(null);
  const [weatherChangeDialogOpen, setWeatherChangeDialogOpen] = useState(false);
  const [weatherChangePending, setWeatherChangePending] = useState(false);

  // Paywall-modal for Premium-CTA / "Administrer abonnement" — delt
  // PaywallDialog (F81.5-W1) eier hele kjøpsflyten selv; InnstillingerScreen
  // holder kun åpen/lukket-state + trigger-raden for fokus-retur.
  const premiumRowRef = useRef<HTMLButtonElement | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  // Fanget i klikk-handleren (aldri under render — react-hooks/refs) og gitt
  // videre som PaywallDialog sin returnFocusTo.
  const [paywallReturnFocusTo, setPaywallReturnFocusTo] = useState<HTMLElement | null>(null);

  // Hjelp-modal for "Om & støtte → Hjelp og veiledning"
  const helpRowRef = useRef<HTMLButtonElement | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const handleOpenHelp = useCallback(() => {
    void fire('light');
    setHelpOpen(true);
  }, [fire]);

  // Tilbakemelding-modal for "Om & støtte → Send tilbakemelding"
  const feedbackRowRef = useRef<HTMLButtonElement | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const handleOpenFeedback = useCallback(() => {
    void fire('light');
    setFeedbackOpen(true);
  }, [fire]);

  // Personvern-modal for "Om & støtte → Personvern og vilkår"
  // P0 fra audit: App Store/Play krever synlig personvern/vilkår-link før godkjenning.
  const privacyRowRef = useRef<HTMLButtonElement | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const handleOpenPrivacy = useCallback(() => {
    void fire('light');
    setPrivacyOpen(true);
  }, [fire]);

  // Vurder appen-modal for "Om & støtte → Vurder appen" (P2 fra audit)
  //
  // Flyt:
  //  1. Bruker trykker raden → vi åpner forklarings-dialog (ikke direkte StoreKit-prompt)
  //  2. Bruker bekrefter → requestAppReview() — native StoreKit/Play In-App Review hvis tilgjengelig
  //  3. Resultat → toast (på native viser systemet sin egen prompt, så feedback til
  //     brukeren via toast er viktig for å bekrefte at noe skjedde)
  //
  // Hvorfor en mellom-dialog (ikke direkte trigger):
  //  - Apple/Google ber oss ALDRI auto-prompte; manuell trigger fra Innstillinger
  //    er ok, men brukeren bør forstå hva som kommer FØR systemet tar over.
  //  - StoreKit har et hardt rate-limit (3 prompts/365 dager) — hvis systemet
  //    velger å ikke vise prompten, vil app-rate.ts falle tilbake til Store-URL.
  //    Brukeren bør vite at "Vurder appen" kan åpne en ekstern fane.
  const rateAppRowRef = useRef<HTMLButtonElement | null>(null);
  const [rateAppOpen, setRateAppOpen] = useState(false);
  const [rateAppPending, setRateAppPending] = useState(false);

  const handleOpenRateApp = useCallback(() => {
    void fire('light');
    setRateAppOpen(true);
  }, [fire]);

  const handleConfirmRateApp = useCallback(async () => {
    const actionCopy = getSettingsCopy(activeLanguage).actions;
    if (rateAppPending) return;
    void fire('medium');
    setRateAppPending(true);
    try {
      const result: AppRateResult = await requestAppReview();
      setRateAppOpen(false);
      if (result === 'native-prompt-shown') {
        void fire('success');
        // Apple/Google viser sin egen prompt — vi gir en mild bekreftelse.
        showToast(actionCopy.rateThanks);
      } else if (result === 'fallback-store-opened') {
        showToast(actionCopy.rateStoreOpened);
      } else if (result === 'fallback-web-opened') {
        showToast(actionCopy.rateWebOpened);
      } else {
        showToast(actionCopy.rateUnavailable);
      }
    } catch (err) {
      console.warn('[Babyora] requestAppReview feilet', err);
      setRateAppOpen(false);
      showToast(actionCopy.rateUnavailable);
    } finally {
      setRateAppPending(false);
    }
  }, [activeLanguage, fire, rateAppPending, showToast]);

  // Værkilde-info-modal for "Vær & sted → Værkilde"
  // P2 fra audit: Værdata kommer fra met.no (Meteorologisk institutt) — CC BY 4.0
  // krever at vi attribuerer kilden synlig. Raden viser "met.no" som value;
  // ved klikk åpner vi en info-modal som forklarer kilden + lenker til met.no/no/om.
  // Modal: native <dialog>, ESC + backdrop + X-knapp lukker, focus-return til trigger.
  const weatherSourceRowRef = useRef<HTMLButtonElement | null>(null);
  const [weatherSourceOpen, setWeatherSourceOpen] = useState(false);

  const handleOpenWeatherSource = useCallback(() => {
    void fire('light');
    setWeatherSourceOpen(true);
  }, [fire]);

  // GDPR — eksport + sletting av lokale data (Article 15/17).
  //
  // Eksport: én-trinns nedlasting av JSON med alt vi har i localStorage
  // (babyora:* + legacy klemeg:*). Trigges direkte fra rad-klikk — ingen
  // dialog nødvendig siden handlingen er ikke-destruktiv.
  //
  // Sletting: destructive confirm-dialog FØR vi rører localStorage.
  // Dialog returnerer fokus til trigger-rad ved ESC/avbryt; ved bekreftelse
  // tømmer vi storage + kaller resetAll() (som også gir App.tsx signal om
  // å re-rute til OnboardingScreen via needsOnboarding=true).
  const exportRowRef = useRef<HTMLButtonElement | null>(null);
  const deleteRowRef = useRef<HTMLButtonElement | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleExportData = useCallback(() => {
    const actionCopy = getSettingsCopy(activeLanguage).actions;
    void fire('light');
    const result = downloadLocalDataExport(APP_VERSION);
    if (result.ok) {
      void fire('success');
      showToast(actionCopy.exportSuccess(result.filename));
    } else {
      showToast(actionCopy.exportFailure);
    }
  }, [activeLanguage, fire, showToast]);

  const handleOpenDeleteConfirm = useCallback(() => {
    void fire('medium');
    setDeleteConfirmOpen(true);
  }, [fire]);

  const handleConfirmDeleteData = useCallback(() => {
    const actionCopy = getSettingsCopy(activeLanguage).actions;
    void fire('medium');
    const { removed } = deleteAllLocalData();
    // resetAll() tømmer barn-state og setter activeId='' → App.tsx ruter
    // automatisk til OnboardingScreen siden needsOnboarding=true.
    // Vi kaller den i tillegg til deleteAllLocalData() for å være sikker
    // på at React-state også er synkronisert (selv om deleteAllLocalData
    // allerede har fjernet de samme nøklene fra localStorage).
    resetAll();
    setDeleteConfirmOpen(false);
    showToast(actionCopy.deleteSuccess(removed));
  }, [activeLanguage, fire, resetAll, showToast]);

  const handleOpenExternalUrl = useCallback(
    (url: string) => {
      void fire('selection');
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
    [fire],
  );

  const handleSendFeedbackMail = useCallback(() => {
    const feedbackMailCopy = getSettingsCopy(activeLanguage).feedbackMail;
    void fire('medium');
    const platform = Capacitor.getPlatform();
    const version = APP_VERSION;
    const subject = feedbackMailCopy.subject(version);
    const bodyLines = [
      feedbackMailCopy.greeting,
      '',
      '',
      feedbackDivider(),
      feedbackMailCopy.diagnostics,
      feedbackMailCopy.appVersion(version),
      feedbackMailCopy.platform(platform),
      feedbackDivider(),
    ];
    const body = bodyLines.join('\n');
    const href = `mailto:hei@babyora.no?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    if (typeof window !== 'undefined') {
      window.location.href = href;
    }
    setFeedbackOpen(false);
  }, [activeLanguage, fire]);

  const handlePremiumCtaClick = useCallback(() => {
    void fire('light');
    if (isPremium) {
      // Administrer abonnement → åpne plattformens abonnements-side
      const platform = Capacitor.getPlatform();
      const url =
        platform === 'ios'
          ? 'https://apps.apple.com/account/subscriptions'
          : platform === 'android'
            ? 'https://play.google.com/store/account/subscriptions'
            : 'https://apps.apple.com/account/subscriptions';
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    setPaywallReturnFocusTo(premiumRowRef.current);
    setPaywallOpen(true);
  }, [fire, isPremium]);

  // ──── Auto-posisjon: toggle + permission/geolocation-flyt ─────────────────
  //
  // Flyt:
  //  1. Bruker trykker toggle → role=switch, aria-checked styres av locationMode
  //  2. ON  → vi åpner native <dialog> som forklarer permission (samtykke-steg)
  //  3. Bruker bekrefter → den delte kontrolleren henter posisjon
  //  4. Suksess → kontrolleren lagrer et øktbundet sted og vi aktiverer auto-modus
  //             → setLocationMode('auto')
  //             → useWeather re-kjører via lat/lon useEffect-deps (automatisk)
  //  5. Avbryt/feil/denied → setLocationMode('manual') + toast
  //  6. OFF → setLocationMode('manual') (beholder eksisterende lat/lon)
  const handleAutoLocationToggle = useCallback(
    (next: boolean) => {
      if (!next) {
        void fire('selection');
        automaticLocationController.invalidate();
        setLocationMode('manual');
        return;
      }
      if (automaticLocationAccess.state === 'neutral'
        || !automaticLocationAccess.implementationAvailable) {
        setAutoLocationDialogOpen(false);
        return;
      }
      if (!automaticLocationAccess.allowed) {
        setPaywallReturnFocusTo(autoLocationToggleRef.current);
        setPaywallOpen(true);
        return;
      }
      void fire('selection');
      // ON → åpne forklarings-dialog (samtykke før permission-prompt)
      setAutoLocationDialogOpen(true);
    },
    [automaticLocationAccess, fire, setLocationMode],
  );

  const handleConfirmAutoLocation = useCallback(async () => {
    const actionCopy = getSettingsCopy(activeLanguage).actions;
    if (!automaticLocationAllowed) {
      setAutoLocationDialogOpen(false);
      return;
    }
    void fire('medium');
    if (needsOnboarding) {
      setAutoLocationDialogOpen(false);
      showToast(actionCopy.finishOnboarding);
      return;
    }
    setAutoLocationPending(true);
    autoLocationActivationPendingRef.current = true;
    const requestedChildId = active.id;
    try {
      const outcome = await automaticLocationController.run({
        intent: 'settings-activation',
        runtimeDecision: automaticLocationAccess,
        mode: locationMode,
        childId: requestedChildId,
        isStillAllowed: () => {
          const live = autoLocationLiveRef.current;
          const liveMode = useLocationPref.getState().mode;
          return live.childId === requestedChildId
            && live.access.capability === 'automatic_location'
            && live.access.state === 'allowed'
            && live.access.allowed
            && live.access.implementationAvailable
            && (liveMode === 'manual' || liveMode === 'auto');
        },
      });
      autoLocationActivationPendingRef.current = false;
      setAutoLocationDialogOpen(false);
      if (outcome.status === 'success') {
        setLocationMode('auto');
        void fire('success');
        showToast(actionCopy.locationUpdated(outcome.placeLabel));
        return;
      }
      setLocationMode('manual');
      showToast(actionCopy.locationFailure);
    } catch {
      autoLocationActivationPendingRef.current = false;
      automaticLocationController.invalidate();
      setLocationMode('manual');
      setAutoLocationDialogOpen(false);
      showToast(actionCopy.locationFailure);
    } finally {
      autoLocationActivationPendingRef.current = false;
      setAutoLocationPending(false);
    }
  }, [
    active.id,
    activeLanguage,
    automaticLocationAccess,
    automaticLocationAllowed,
    fire,
    locationMode,
    needsOnboarding,
    setLocationMode,
    showToast,
  ]);

  const handleMorningToggle = useCallback(
    async (next: boolean) => {
      const actionCopy = getSettingsCopy(activeLanguage).actions;
      void fire('selection');
      if (!next) {
        setMorningPref(false);
        void cancelMorningNotification();
        return;
      }
      // Be om tillatelse FØR vi setter på
      const result = await requestNotificationPermission();
      if (result === 'granted') {
        setMorningPref(true);
        void scheduleMorningNotification(morningHour, active.name);
      } else if (result === 'denied') {
        // Rull tilbake + vis veiledning
        setMorningPref(false);
        showToast(actionCopy.notificationsBlocked);
      } else if (result === 'default') {
        setMorningPref(false);
        showToast(actionCopy.morningPermissionRequired);
      } else {
        // unsupported (gammel browser) — lagre likevel, men advar
        setMorningPref(true);
        showToast(actionCopy.notificationUnsupported);
      }
    },
    [active.name, activeLanguage, fire, morningHour, setMorningPref, showToast],
  );

  // Toggle-entry: ON → åpne forklarings-dialog (samtykke-steg FØR permission-prompt).
  // OFF → riv ned umiddelbart (cancel pending + sett pref). Vi ber aldri om
  // permission ved OFF — det ville være forvirrende for brukeren.
  const handleWeatherChangeToggle = useCallback(
    (next: boolean) => {
      void fire('selection');
      if (!next) {
        setWeatherChangePref(false);
        void disableWeatherChangeNotifications();
        return;
      }
      // ON → åpne forklarings-dialog (samtykke før permission-prompt)
      setWeatherChangeDialogOpen(true);
    },
    [fire, setWeatherChangePref],
  );

  // Bekreft fra dialog → spør permission → wire til morning-notification.ts hvis aktiv.
  // Caller (dialog) avbrytes hvis brukeren lukker mid-request — vi clearer pending
  // i finally slik at TogglePill og dialog ikke henger i "wait"-state.
  const handleConfirmWeatherChange = useCallback(async () => {
    const actionCopy = getSettingsCopy(activeLanguage).actions;
    if (weatherChangePending) return;
    void fire('medium');
    setWeatherChangePending(true);
    try {
      const result = await requestNotificationPermission();
      if (result === 'granted') {
        setWeatherChangePref(true);
        await enableWeatherChangeNotifications();
        setWeatherChangeDialogOpen(false);
        void fire('success');
        showToast(actionCopy.weatherChangeEnabled);
      } else if (result === 'denied') {
        setWeatherChangePref(false);
        setWeatherChangeDialogOpen(false);
        showToast(actionCopy.notificationsBlocked);
      } else if (result === 'default') {
        setWeatherChangePref(false);
        setWeatherChangeDialogOpen(false);
        showToast(actionCopy.weatherPermissionRequired);
      } else {
        // unsupported (gammel browser / web) — lagre preferanse, men ikke wire native
        setWeatherChangePref(true);
        setWeatherChangeDialogOpen(false);
        showToast(actionCopy.notificationUnsupported);
      }
    } catch (err) {
      console.warn('[Babyora] weatherChange permission feilet', err);
      setWeatherChangePref(false);
      setWeatherChangeDialogOpen(false);
      showToast(actionCopy.notificationRequestFailure);
    } finally {
      setWeatherChangePending(false);
    }
  }, [activeLanguage, fire, setWeatherChangePref, showToast, weatherChangePending]);

  const handlePickMorningHour = useCallback(
    (next: number) => {
      void fire('selection');
      setMorningHourPref(next);
      if (morningOn) {
        void scheduleMorningNotification(next, active.name);
      }
    },
    [fire, morningOn, setMorningHourPref, active.name],
  );

  const handlePickRefHour = useCallback(
    (next: RefHour) => {
      void fire('selection');
      setRefHourPref(next);
    },
    [fire, setRefHourPref],
  );

  const handleOpenRefHourPicker = useCallback(() => {
    void fire('light');
    setRefHourPickerOpen(true);
  }, [fire]);

  const childName = !needsOnboarding && active.name ? active.name : '—';
  const childCity = !needsOnboarding && active.city ? active.city : '—';
  const childDob = useMemo(
    () => (!needsOnboarding && active.dob ? formatDob(active.dob, locale) : '—'),
    [active.dob, locale, needsOnboarding],
  );
  const childMonths = useMemo(
    () => (!needsOnboarding && active.dob ? ageInMonths(active.dob) : null),
    [active.dob, needsOnboarding],
  );
  const activeMaterialPreference = active.materialPreference ?? 'best_for_conditions';
  const materialPreferenceCopy = secondaryCopy.materialPreference;
  const activeMaterialPreferenceLabel = materialPreferenceLabel(
    activeMaterialPreference,
    materialPreferenceCopy.sheet,
  );

  const noop = () => {
    void fire('light');
  };

  const handleVibration = (next: boolean) => {
    void fire('selection');
    setNativeSetting('haptics', next ? 'on' : 'off');
  };

  const handleReducedMotion = (next: boolean) => {
    void fire('selection');
    setNativeSetting('motion', next ? 'reduce' : 'allow');
  };

  const handleThemeChange = (next: ThemeMode) => {
    if (next === themeMode) return;
    void fire('selection');
    setThemeMode(next);
  };

  const handleLanguageChange = (event: ReactChangeEvent<HTMLSelectElement>) => {
    const next = event.currentTarget.value;
    if (next === 'auto') {
      setLanguageChoice('auto');
      void fire('selection');
      void clearLanguageOverride();
      return;
    }
    if (!isSupportedLanguage(next)) return;
    setLanguageChoice(next);
    void fire('selection');
    void setLanguageOverride(next);
  };

  const handleLogout = () => {
    void fire('medium');
    const ok = typeof window !== 'undefined'
      ? window.confirm(t('settings.family.logoutConfirm'))
      : true;
    if (ok) resetAll();
  };

  const vibrationOn = hapticsPref === 'on';
  const motionReducedOn = motionPref === 'reduce' || (motionPref === 'system' && reducedMotion);

  /* Profil-meta (alder · fødselsdato).
     FUNN 2026-08-06 ([MINDRE] Innstillinger): stedet lå her som tredje ledd.
     To ting fulgte av det. (1) «Trondheim» sto tre ganger på skjermen — se
     kommentaren ved headeren. (2) Med tre ledd brakk linja, og fordi
     skilletegnet ble rendret ETTER sitt eget ledd, ble «·» stående alene
     ytterst på linje 1 og pekte mot noe som ikke sto der.
     Stedet er ute, og skilletegnet henger nå FORAN sitt eget ledd, slik at
     det aldri kan bli liggende igjen på en linje det ikke hører til. */
  const profileMetaItems: ReactNode[] = [];
  if (childMonths !== null) {
    profileMetaItems.push(<span key="age">{t('settings.family.ageMonths', { count: childMonths })}</span>);
  }
  if (childDob !== '—') profileMetaItems.push(<span key="dob">{childDob}</span>);

  return (
    <main style={rootStyle} aria-labelledby="innst-title">
      <span aria-hidden="true" style={subtleHighlightStyle} />

      {/* sr-only h1 per a11y-spec */}
      <h1
        id="innst-title"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {t('settings.family.title')}
      </h1>

      {/* Header */}
      <header style={headerStyle}>
        <div style={titlesStyle}>
          <span style={eyebrowTopStyle}>Babyora</span>
          <span aria-hidden="true" style={appTitleStyle}>{t('settings.family.title')}</span>
        </div>
        {/* FUNN 2026-08-06 ([MINDRE] Innstillinger, «Trondheim står tre ganger»):
            stedspillen sto her, stedet sto i barnekortets metalinje, og
            «Sted»-raden under Vær & sted viser det samme. Tre visninger av
            samme verdi leses som tre uavhengige innstillinger, og forelderen
            må selv finne ut hvilken som faktisk styrer været. Pillen og
            metalinjens sted er fjernet; «Sted»-raden er eneste kilde til
            sannhet på denne skjermen. Stedspillen hører hjemme på Hjem og
            Planlegg, der stedet ER konteksten. */}
      </header>

      {/* Scroll-area */}
      <div style={scrollStyle}>
        {/* BARN (R7 Task 7: Familie-rot-IA — barn-sentrert seksjon øverst) */}
        <section style={sectionStyle} aria-labelledby="sec-profil">
          <h2 id="sec-profil" style={sectionEyebrowStyle}>{t('settings.family.children')}</h2>

          {/* P6: én ytre flate for hele "Barn"-seksjonen (duel-notat §9) — se
              barnSectionSurfaceStyle sin filhode-kommentar. Profil-hero og
              handlings-listen under er nå INNHOLD på samme kort, ikke to
              stablede kort. */}
          <div style={barnSectionSurfaceStyle}>
            <div style={profileHeroStyle} role="group" aria-label={t('settings.family.activeProfile')}>
              <div style={profileAvatarStyle} role="img" aria-label={t('settings.family.avatar', { name: childName })}>
                <span
                  aria-hidden="true"
                  style={{
                    fontFamily: C.fontSerif,
                    fontSize: '1.5rem',
                    color: C.ink700,
                    lineHeight: 1,
                  }}
                >
                  {childName !== '—' ? childName.charAt(0).toUpperCase() : '·'}
                </span>
              </div>
              <div style={profileBodyStyle}>
                <p style={profileNameStyle}>{childName}</p>
                {profileMetaItems.length > 0 ? (
                  <div style={profileMetaStyle}>
                    {profileMetaItems.map((item, i) => (
                      <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--dw-space-6)' }}>
                        {i > 0 ? (
                          <span style={profileMetaDotStyle} aria-hidden="true" />
                        ) : null}
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <button type="button" style={profileEditStyle} aria-label={t('settings.family.editProfile')} onClick={noop}>
                <IconEdit />
              </button>
            </div>

            <div aria-hidden="true" style={dividerStyle} />

            <ul role="list" style={groupListBareStyle} aria-label={t('settings.family.childManagement')}>
              <li style={{ listStyle: 'none' }}>
                <button
                  type="button"
                  ref={switchChildRowRef}
                  style={rowBase}
                  onClick={handleOpenSwitchChild}
                  aria-haspopup="dialog"
                  aria-label={t('settings.family.switchChildAria', { count: allChildren.length })}
                  disabled={needsOnboarding || allChildren.length < 2}
                >
                  <span style={rowIconBase} aria-hidden="true">
                    <IconSwap />
                  </span>
                  <span style={rowBodyStyle}>
                    <span style={rowLabelStyle}>{t('settings.family.switchChild')}</span>
                    {childName !== '—' ? (
                      <span style={rowSubStyle}>{childName}</span>
                    ) : null}
                  </span>
                  <span style={rowValueStyle}>
                    {t('settings.family.childCount', { count: allChildren.length })}
                  </span>
                  <Chevron />
                </button>
              </li>
              <li aria-hidden="true" style={{ listStyle: 'none' }}>
                <div style={dividerStyle} />
              </li>
              <li style={{ listStyle: 'none' }}>
                <button
                  type="button"
                  ref={materialPreferenceRowRef}
                  style={rowBase}
                  onClick={handleOpenMaterialPreference}
                  aria-haspopup="dialog"
                  aria-label={materialPreferenceCopy.rowAria(activeMaterialPreferenceLabel)}
                  disabled={needsOnboarding}
                >
                  <span style={rowIconBase} aria-hidden="true">
                    <IconMaterial />
                  </span>
                  <span style={rowBodyStyle}>
                    <span style={rowLabelStyle}>{materialPreferenceCopy.rowLabel}</span>
                    <span style={rowSubStyle}>{materialPreferenceCopy.rowDescription}</span>
                  </span>
                  <span style={rowValueStyle}>{activeMaterialPreferenceLabel}</span>
                  <Chevron />
                </button>
              </li>
              <li aria-hidden="true" style={{ listStyle: 'none' }}>
                <div style={dividerStyle} />
              </li>
              <li style={{ listStyle: 'none' }}>
                <button
                  type="button"
                  ref={addChildRowRef}
                  style={rowBase}
                  onClick={handleOpenAddChild}
                  aria-haspopup="dialog"
                  aria-label={t('settings.family.addChildAria')}
                >
                  <span style={rowIconAccent} aria-hidden="true">
                    <IconPlus />
                  </span>
                  <span style={rowBodyStyle}>
                    <span style={rowLabelStyle}>{t('settings.family.addChild')}</span>
                    <span style={rowSubStyle}>{t('settings.family.siblingProfile')}</span>
                  </span>
                  <Chevron />
                </button>
              </li>
            </ul>
          </div>
        </section>

        {/* DE SOM PASSER — R9-forhåndsvisning, KUN i utvikling (import.meta.env.DEV).
            Familiedeling krever auth/RLS/backend og er ikke aktivert; seksjonen
            skjules helt i produksjon. Captionen gjør tydelig at dette ikke er
            en live-funksjon. */}
        {import.meta.env.DEV && (
          <section style={sectionStyle} aria-labelledby="sec-care">
            <h2 id="sec-care" style={sectionEyebrowStyle}>{t('settings.family.caregivers')}</h2>
            <div style={groupCardStyle}>
              <p
                style={{
                  margin: '0 0 var(--dw-space-6)',
                  fontSize: '0.75rem',
                  color: C.ink500,
                  lineHeight: 1.4,
                }}
              >
                {t('settings.family.carePreview')}
              </p>
              <CareCircle childName={childName} caregivers={careCirclePreview} />
            </div>
          </section>
        )}

        {/* VÆR & STED */}
        <Section eyebrow={t('settings.family.weatherLocation')} id="sec-vaer">
          <li style={{ listStyle: 'none' }}>
            <NavRow
              icon={<IconPin />}
              label={t('settings.family.location')}
              value={childCity}
              valueBold
              onClick={noop}
            />
          </li>
          <li aria-hidden="true" style={{ listStyle: 'none' }}>
            <div style={dividerStyle} />
          </li>
          <li style={{ listStyle: 'none' }}>
            <div
              style={rowStaticBase}
              role="group"
              aria-label={t('settings.family.automaticLocationAria', { state:
                locationMode === 'auto'
                  ? automaticLocationAllowed
                    ? t('common.on')
                    : t('settings.family.onUnavailable')
                  : t('common.off'),
              })}
            >
              <span style={rowIconBase} aria-hidden="true">
                <IconCrosshair />
              </span>
              <span style={rowBodyStyle}>
                <span style={rowLabelStyle}>{t('settings.family.automaticLocation')}</span>
                <span style={rowSubStyle}>
                  {autoLocationPending
                    ? t('settings.family.fetchingLocation')
                    : locationMode === 'auto'
                      ? automaticLocationAllowed
                        ? t('settings.family.usesCurrentLocation')
                        : t('settings.family.locationNotUsed')
                      : t('settings.family.usesSelectedLocation')}
                </span>
              </span>
              <TogglePill
                on={locationMode === 'auto'}
                ariaLabel={t('settings.family.automaticLocation')}
                onChange={handleAutoLocationToggle}
                reducedMotion={reducedMotion}
                buttonRef={autoLocationToggleRef}
                ariaHaspopup={
                  locationMode === 'manual' && automaticLocationAccess.state === 'denied'
                    ? 'dialog'
                    : undefined
                }
                disabled={
                  locationMode === 'manual'
                  && (
                    automaticLocationAccess.state === 'neutral'
                    || !automaticLocationAccess.implementationAvailable
                  )
                }
              />
            </div>
          </li>
          <li aria-hidden="true" style={{ listStyle: 'none' }}>
            <div style={dividerStyle} />
          </li>
          <li style={{ listStyle: 'none' }}>
            <button
              type="button"
              ref={weatherSourceRowRef}
              style={rowBase}
              onClick={handleOpenWeatherSource}
              aria-haspopup="dialog"
              aria-label={t('settings.family.weatherSourceAria')}
            >
              <span style={rowIconBase} aria-hidden="true">
                <IconCloud />
              </span>
              <span style={rowBodyStyle}>
                <span style={rowLabelStyle}>{t('settings.family.weatherSource')}</span>
                <span style={rowSubStyle}>{t('settings.family.weatherInstitute')}</span>
              </span>
              <span style={rowValueBoldStyle}>met.no</span>
              <Chevron />
            </button>
          </li>
          <li aria-hidden="true" style={{ listStyle: 'none' }}>
            <div style={dividerStyle} />
          </li>
          <li style={{ listStyle: 'none' }}>
            <button
              type="button"
              ref={refHourRowRef}
              style={rowBase}
              onClick={handleOpenRefHourPicker}
              aria-haspopup="dialog"
              aria-label={t('settings.family.referenceHourAria', { time: formatHour(refHour) })}
            >
              <span style={rowIconBase} aria-hidden="true">
                <IconClock />
              </span>
              <span style={rowBodyStyle}>
                <span style={rowLabelStyle}>{t('settings.family.referenceHour')}</span>
                {/* FUNN 2026-08-06 ([MINDRE] Innstillinger): «Hvilket klokkeslett
                    vises på hjem-skjerm» brakk i den ekte bindestreken i
                    «hjem-skjerm» og la raden ut over tre linjer — nesten dobbelt
                    så høy som naboradene, og orddeling tvinger bokstavlesing i
                    stedet for ordgjenkjenning. Teksten er kortet ned og har
                    ingen bindestrek å brekke i. */}
                <span style={rowSubStyle}>{t('settings.family.referenceHourSub')}</span>
              </span>
              <span style={rowValueBoldStyle}>{formatHour(refHour)}</span>
              <Chevron />
            </button>
          </li>
        </Section>

        {/* VARSLER */}
        <Section eyebrow={t('settings.family.notifications')} id="sec-varsler">
          <li style={{ listStyle: 'none' }}>
            <div
              style={rowStaticBase}
              role="group"
              aria-label={t('settings.family.morningNotificationAria', {
                state: t(morningOn ? 'common.on' : 'common.off'),
              })}
            >
              <span style={rowIconBase} aria-hidden="true">
                <IconBell />
              </span>
              <button
                type="button"
                ref={morningRowRef}
                onClick={() => {
                  if (!morningOn) return;
                  void fire('light');
                  setTimePickerOpen(true);
                }}
                disabled={!morningOn}
                aria-label={
                  morningOn
                    ? t('settings.family.changeTime', { time: formatHour(morningHour) })
                    : t('settings.family.timeUnavailable')
                }
                style={{
                  ...rowBodyStyle,
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  font: 'inherit',
                  color: 'inherit',
                  textAlign: 'left',
                  cursor: morningOn ? 'pointer' : 'default',
                  opacity: morningOn ? 1 : 0.85,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                  <span style={rowLabelStyle}>{t('settings.family.morningNotification')}</span>
                </span>
                <span style={rowSubStyle}>
                  {morningOn
                    ? t('settings.family.scheduledOutfit', { time: formatHour(morningHour) })
                    : t('settings.family.morningDescription')}
                </span>
              </button>
              <TogglePill
                on={morningOn}
                ariaLabel={t('settings.family.morningNotification')}
                onChange={(next) => void handleMorningToggle(next)}
                reducedMotion={reducedMotion}
                buttonRef={morningToggleRef}
              />
            </div>
          </li>
          <li aria-hidden="true" style={{ listStyle: 'none' }}>
            <div style={dividerStyle} />
          </li>
          <li style={{ listStyle: 'none' }}>
            <div
              style={rowStaticBase}
              role="group"
              aria-label={t('settings.family.weatherChangeAria', {
                state: t(weatherChangeOn ? 'common.on' : 'common.off'),
              })}
            >
              <span style={rowIconBase} aria-hidden="true">
                <IconTrend />
              </span>
              <span style={rowBodyStyle}>
                <span style={rowLabelStyle}>{t('settings.family.weatherChange')}</span>
                <span style={rowSubStyle}>
                  {weatherChangePending
                    ? t('settings.family.askingPermission')
                    : weatherChangeOn
                      ? t('settings.family.weatherChangeOn')
                      : t('settings.family.weatherChangeOff')}
                </span>
              </span>
              <TogglePill
                on={weatherChangeOn}
                ariaLabel={t('settings.family.weatherChangeNotification')}
                onChange={handleWeatherChangeToggle}
                reducedMotion={reducedMotion}
                buttonRef={weatherChangeToggleRef}
              />
            </div>
          </li>
        </Section>

        {/* UTSEENDE */}
        <div aria-hidden="true" style={{ height: 1, background: C.hairline, margin: 'var(--dw-space-4) var(--dw-space-4) 0' }} />
        <section style={sectionStyle} aria-labelledby="sec-utseende">
          <h2 id="sec-utseende" style={sectionEyebrowStyle}>{t('settings.family.appearance')}</h2>
          <div style={groupCardStyle}>
            <div style={rowStaticBase} role="group" aria-label={t('settings.family.theme')}>
              <span style={rowIconBase} aria-hidden="true">
                <IconThemeAuto />
              </span>
              <span style={rowBodyStyle}>
                <span style={rowLabelStyle}>{t('settings.family.theme')}</span>
                <span style={rowSubStyle}>
                  {themeMode === 'auto'
                    ? t('settings.family.themeSystem')
                    : themeMode === 'light'
                      ? t('settings.family.themeAlwaysLight')
                      : t('settings.family.themeAlwaysDark')}
                </span>
              </span>
            </div>
            <ThemeSegment
              mode={themeMode}
              onChange={handleThemeChange}
              reducedMotion={reducedMotion}
            />
            <div aria-hidden="true" style={dividerStyle} />
            <label htmlFor="babyora-language" style={rowStaticBase}>
              <span style={rowIconBase} aria-hidden="true">Aa</span>
              <span style={rowBodyStyle}>
                <span style={rowLabelStyle}>{t('settings.language')}</span>
                <span style={rowSubStyle}>{t('settings.family.languageSelect')}</span>
              </span>
              <select
                id="babyora-language"
                value={languageChoice}
                onChange={handleLanguageChange}
                aria-label={t('settings.family.languageSelect')}
                style={{
                  maxWidth: 150,
                  minHeight: 36,
                  border: `1px solid ${C.hairline}`,
                  borderRadius: 9,
                  background: C.bgCanvasSoft,
                  color: C.ink700,
                  font: 'inherit',
                  fontSize: '0.8125rem',
                  padding: '0 var(--dw-space-8)',
                }}
              >
                <option value="auto">{t('settings.family.languageAuto')}</option>
                {SUPPORTED_LANGUAGES.map((language) => (
                  <option key={language} value={language}>
                    {t(`settings.languageOption.${language}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* NATIVE-FØLELSE */}
        <Section eyebrow={t('settings.family.nativeFeel')} id="sec-native">
          <li style={{ listStyle: 'none' }}>
            <ToggleRow
              icon={<IconVibrate />}
              label={t('settings.family.vibration')}
              on={vibrationOn}
              onChange={handleVibration}
              reducedMotion={reducedMotion}
            />
          </li>
          <li aria-hidden="true" style={{ listStyle: 'none' }}>
            <div style={dividerStyle} />
          </li>
          <li style={{ listStyle: 'none' }}>
            <ToggleRow
              icon={<IconMotion />}
              label={t('settings.family.reduceMotion')}
              sub={t('settings.family.themeSystem')}
              on={motionReducedOn}
              onChange={handleReducedMotion}
              reducedMotion={reducedMotion}
            />
          </li>
        </Section>

        {/* BABYORA PLUSS (R7 Task 7: Familie-rot-IA — Plus-seksjon) */}
        <section style={sectionStyle} aria-labelledby="sec-abo">
          <h2 id="sec-abo" style={sectionEyebrowStyle}>{t('settings.family.plusHeading')}</h2>
          <button
            ref={premiumRowRef}
            type="button"
            style={premiumCardStyle}
            onClick={handlePremiumCtaClick}
            aria-label={
              isPremium
                ? t('settings.family.plusActiveAria')
                : t('settings.family.plusInactiveAria')
            }
            aria-haspopup={isPremium ? undefined : 'dialog'}
          >
            <span aria-hidden="true" style={premiumShineStyle} />
            <span style={premiumBodyStyle}>
              {/* Status som TEKST (aldri farge alene) — dotten er kun dekorativ.
                  P2 hard paywall: «Gratis-versjon» er fjernet — det finnes
                  ikke lenger et gratis-nivå å beskrive her. */}
              <span style={premiumEyebrowStyle}>
                <span aria-hidden="true" style={premiumStatusDotStyle} />
                {t(isPremium ? 'settings.family.plusActive' : 'settings.family.plusInactive')}
              </span>
              <span style={premiumTitleStyle}>{t('settings.family.plusHeading')}</span>
              <span style={premiumSubStyle}>
                {isPremium
                  ? t('settings.family.manageSubscription')
                  : t('settings.family.plusDescription')}
              </span>
            </span>
            <span style={premiumArrowStyle}>
              <ArrowLong />
            </span>
          </button>
        </section>

        {/* OM & STØTTE */}
        <Section eyebrow={t('settings.family.aboutSupport')} id="sec-om">
          <li style={{ listStyle: 'none' }}>
            <button
              type="button"
              ref={helpRowRef}
              style={rowBase}
              onClick={handleOpenHelp}
              aria-haspopup="dialog"
              aria-label={t('settings.family.openDialogAria', { label: t('settings.family.help') })}
            >
              <span style={rowIconBase} aria-hidden="true">
                <IconHelp />
              </span>
              <span style={rowBodyStyle}>
                <span style={rowLabelStyle}>{t('settings.family.help')}</span>
                <span style={rowSubStyle}>{t('settings.family.helpSub')}</span>
              </span>
              <Chevron />
            </button>
          </li>
          <li aria-hidden="true" style={{ listStyle: 'none' }}>
            <div style={dividerStyle} />
          </li>
          <li style={{ listStyle: 'none' }}>
            <button
              type="button"
              ref={feedbackRowRef}
              style={rowBase}
              onClick={handleOpenFeedback}
              aria-haspopup="dialog"
              aria-label={t('settings.family.openDialogAria', { label: t('settings.family.feedback') })}
            >
              <span style={rowIconBase} aria-hidden="true">
                <IconFeedback />
              </span>
              <span style={rowBodyStyle}>
                <span style={rowLabelStyle}>{t('settings.family.feedback')}</span>
                <span style={rowSubStyle}>{t('settings.family.feedbackSub')}</span>
              </span>
              <Chevron />
            </button>
          </li>
          <li aria-hidden="true" style={{ listStyle: 'none' }}>
            <div style={dividerStyle} />
          </li>
          {/* P2 — Vurder appen (App Store / Play in-app review).
              Bruker en accent-stjerne for å skille fra de andre tekst-radene. */}
          <li style={{ listStyle: 'none' }}>
            <button
              type="button"
              ref={rateAppRowRef}
              style={rowBase}
              onClick={handleOpenRateApp}
              aria-haspopup="dialog"
              aria-label={t('settings.family.openDialogAria', { label: t('settings.family.rate') })}
            >
              <span style={rowIconAccent} aria-hidden="true">
                <IconStar />
              </span>
              <span style={rowBodyStyle}>
                <span style={rowLabelStyle}>{t('settings.family.rate')}</span>
                <span style={rowSubStyle}>{t('settings.family.rateSub')}</span>
              </span>
              <Chevron />
            </button>
          </li>
          <li aria-hidden="true" style={{ listStyle: 'none' }}>
            <div style={dividerStyle} />
          </li>
          <li style={{ listStyle: 'none' }}>
            <button
              type="button"
              ref={privacyRowRef}
              style={rowBase}
              onClick={handleOpenPrivacy}
              aria-haspopup="dialog"
              aria-label={t('settings.family.openDialogAria', { label: t('settings.family.privacy') })}
            >
              <span style={rowIconBase} aria-hidden="true">
                <IconShield />
              </span>
              <span style={rowBodyStyle}>
                <span style={rowLabelStyle}>{t('settings.family.privacy')}</span>
                <span style={rowSubStyle}>{t('settings.family.privacySub')}</span>
              </span>
              <Chevron />
            </button>
          </li>
          <li aria-hidden="true" style={{ listStyle: 'none' }}>
            <div style={dividerStyle} />
          </li>
          {/* GDPR — eksporter mine data (Article 15) */}
          <li style={{ listStyle: 'none' }}>
            <button
              type="button"
              ref={exportRowRef}
              style={rowBase}
              onClick={handleExportData}
              aria-label={t('settings.family.exportAria')}
            >
              <span style={rowIconBase} aria-hidden="true">
                <IconDownload />
              </span>
              <span style={rowBodyStyle}>
                <span style={rowLabelStyle}>{t('settings.family.export')}</span>
                <span style={rowSubStyle}>{t('settings.family.exportSub')}</span>
              </span>
              <Chevron />
            </button>
          </li>
          <li aria-hidden="true" style={{ listStyle: 'none' }}>
            <div style={dividerStyle} />
          </li>
          {/* GDPR — slett mine data (Article 17 — "Right to erasure") */}
          <li style={{ listStyle: 'none' }}>
            <button
              type="button"
              ref={deleteRowRef}
              style={{ ...rowBase, color: C.terracotta700 }}
              onClick={handleOpenDeleteConfirm}
              aria-haspopup="dialog"
              aria-label={t('settings.family.deleteAria')}
            >
              <span
                style={{
                  ...rowIconBase,
                  background: C.orange100,
                  color: C.terracotta700,
                  borderColor: 'var(--dw-hairline)',
                }}
                aria-hidden="true"
              >
                <IconTrash />
              </span>
              <span style={rowBodyStyle}>
                <span style={{ ...rowLabelStyle, color: C.terracotta700 }}>
                  {t('settings.family.delete')}
                </span>
                <span style={rowSubStyle}>{t('settings.family.deleteSub')}</span>
              </span>
              <Chevron />
            </button>
          </li>
        </Section>

        {/* Veiledende-disclaimer (eierbeslutning 2026-07-15) — juridisk sone. */}
        <p style={{ margin: 'var(--dw-space-2) var(--dw-space-6) 0', fontSize: '0.75rem', lineHeight: 1.45, color: C.ink500 }}>
          {t('settings.family.disclaimer')}
        </p>

        {/* Logg ut */}
        <button
          type="button"
          style={logoutBtnStyle}
          onClick={handleLogout}
          aria-label={t('settings.family.logoutAria')}
        >
          <IconLogout />
          <span>{t('settings.family.logout')}</span>
        </button>

        <div
          style={footerMetaStyle}
          aria-label={t('settings.family.appInfo', { version: APP_VERSION })}
        >
          <span style={footerBrandStyle}>Babyora</span>
          <span>{t('settings.family.appInfoVisible', { version: APP_VERSION })}</span>
        </div>
      </div>

      {/* Tidspunkt-modal for morgenvarsel — native <dialog> (focus-trap + ESC + backdrop) */}
      <MorningHourDialog
        open={timePickerOpen}
        hour={morningHour}
        reducedMotion={reducedMotion}
        onClose={() => setTimePickerOpen(false)}
        onSelect={(h) => {
          handlePickMorningHour(h);
          setTimePickerOpen(false);
        }}
        triggerRef={morningRowRef}
      />

      {/* Hjelp-modal for "Om & støtte" — native <dialog> (focus-trap + ESC + backdrop) */}
      <HelpDialog
        open={helpOpen}
        reducedMotion={reducedMotion}
        onClose={() => setHelpOpen(false)}
        triggerRef={helpRowRef}
      />

      {/* Tilbakemelding-modal for "Om & støtte" — native <dialog> (focus-trap + ESC + backdrop) */}
      <FeedbackDialog
        open={feedbackOpen}
        reducedMotion={reducedMotion}
        onClose={() => setFeedbackOpen(false)}
        onSendMail={handleSendFeedbackMail}
        triggerRef={feedbackRowRef}
      />

      {/* Personvern-modal for "Om & støtte" — native <dialog> (focus-trap + ESC + backdrop) */}
      <PrivacyDialog
        open={privacyOpen}
        reducedMotion={reducedMotion}
        onClose={() => setPrivacyOpen(false)}
        onOpenExternal={handleOpenExternalUrl}
        triggerRef={privacyRowRef}
      />

      {/* GDPR — destructive bekreftelses-dialog FØR vi tømmer localStorage.
          Speiler WeatherChangeDialog-mønsteret men med rød/terracotta primary-CTA
          for å signalisere konsekvens. Focus-return til "Slett mine data"-rad. */}
      <DeleteDataDialog
        open={deleteConfirmOpen}
        reducedMotion={reducedMotion}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDeleteData}
        triggerRef={deleteRowRef}
      />

      {/* Paywall-modal for Premium-CTA — delt komponent (F81.5-W1). trigger=null
          fordi dette er den generiske Innstillinger-inngangen (ikke en
          feature-gate); returFocusTo peker tilbake til abonnement-raden. */}
      <PaywallDialog
        open={paywallOpen}
        trigger={null}
        onClose={() => setPaywallOpen(false)}
        returnFocusTo={paywallReturnFocusTo}
      />

      {/* Bytt barn-modal — viser alle barn for valg */}
      <SwitchChildDialog
        open={switchChildOpen}
        children={allChildren}
        activeId={active.id}
        reducedMotion={reducedMotion}
        onClose={() => setSwitchChildOpen(false)}
        onSelect={handleSelectChild}
        triggerRef={switchChildRowRef}
        isPremium={isPremium}
        onRequestUpgrade={handleRequestChildUpgrade}
      />

      {/* Paywall-modal for barn 2+-gaten (F81.5-W2, Flate 4) — stables OVENPÅ
          Bytt barn-dialogen (som forblir åpen), slik at returnFocusTo kan
          peke til den spesifikke barn-raden som ble trykket. */}
      <PaywallDialog
        open={barn2PaywallOpen}
        trigger="barn_2"
        onClose={() => setBarn2PaywallOpen(false)}
        returnFocusTo={barn2PaywallReturnFocusTo}
      />

      {/* Legg-til-nytt-barn-modal — form (navn + dob + sted), kaller addChild() */}
      <AddChildDialog
        open={addChildOpen}
        reducedMotion={reducedMotion}
        onClose={() => setAddChildOpen(false)}
        onSubmit={handleAddChildSubmit}
        triggerRef={addChildRowRef}
      />

      <MaterialPreferenceSheet
        open={materialPreferenceOpen}
        value={activeMaterialPreference}
        copy={materialPreferenceCopy.sheet}
        onChange={(next) => {
          if (needsOnboarding) return;
          void fire('selection');
          updateChild(active.id, { materialPreference: next });
        }}
        onClose={() => setMaterialPreferenceOpen(false)}
        triggerRef={materialPreferenceRowRef}
      />

      {/* Auto-posisjon-modal — forklarer permission FØR navigator.geolocation
          (samtykke-steg per Apple/Google-anbefaling). Lukkes på avbryt, ESC,
          backdrop eller X — returnerer fokus til TogglePill via autoLocationToggleRef. */}
      <AutoLocationDialog
        open={autoLocationDialogOpen}
        pending={autoLocationPending}
        reducedMotion={reducedMotion}
        onClose={() => {
          if (autoLocationActivationPendingRef.current) {
            autoLocationActivationPendingRef.current = false;
            automaticLocationController.invalidate();
          }
          setAutoLocationDialogOpen(false);
        }}
        onConfirm={() => {
          void handleConfirmAutoLocation();
        }}
        triggerRef={autoLocationToggleRef}
      />

      {/* Værendring-varsel — forklarer notification-permission FØR vi spør
          systemet (samtykke-steg). Lukkes på avbryt, ESC, backdrop eller X
          — returnerer fokus til TogglePill via weatherChangeToggleRef. */}
      <WeatherChangeDialog
        open={weatherChangeDialogOpen}
        pending={weatherChangePending}
        reducedMotion={reducedMotion}
        onClose={() => setWeatherChangeDialogOpen(false)}
        onConfirm={() => {
          void handleConfirmWeatherChange();
        }}
        triggerRef={weatherChangeToggleRef}
      />

      {/* Værkilde-info — forklarer at vær-data kommer fra met.no (Meteorologisk
          institutt) og lenker til met.no/no/om. ESC + backdrop + X lukker;
          fokus returneres til trigger-raden via weatherSourceRowRef. */}
      <WeatherSourceDialog
        open={weatherSourceOpen}
        reducedMotion={reducedMotion}
        onClose={() => setWeatherSourceOpen(false)}
        onOpenLink={() => {
          handleOpenExternalUrl('https://www.met.no/om-oss');
        }}
        triggerRef={weatherSourceRowRef}
      />

      {/* Vurder appen-modal — forklarer hva som skjer FØR vi kaller native
          StoreKit/Play In-App Review. ESC + backdrop + X lukker; fokus
          returneres til "Vurder appen"-raden via rateAppRowRef. */}
      <RateAppDialog
        open={rateAppOpen}
        pending={rateAppPending}
        reducedMotion={reducedMotion}
        onClose={() => setRateAppOpen(false)}
        onConfirm={() => {
          void handleConfirmRateApp();
        }}
        triggerRef={rateAppRowRef}
      />

      {/* Referansetime-modal — 6/9/12/15/18/21 segmenter */}
      <RefHourPickerDialog
        open={refHourPickerOpen}
        currentHour={refHour}
        reducedMotion={reducedMotion}
        onClose={() => setRefHourPickerOpen(false)}
        onSelect={(h) => {
          handlePickRefHour(h);
          setRefHourPickerOpen(false);
        }}
        triggerRef={refHourRowRef}
      />

      {/* Toast (sr live region — for permission-fallbacks) */}
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          left: '50%',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)',
          transform: 'translateX(-50%)',
          maxWidth: 360,
          width: 'calc(100% - 32px)',
          padding: toast ? 'var(--dw-space-12) var(--dw-space-16)' : 0,
          background: 'var(--dw-ink-hi)',
          color: 'var(--dw-raised)',
          borderRadius: 12,
          boxShadow: 'var(--shadow-cta)',
          fontSize: '0.84375rem',
          fontWeight: 500,
          letterSpacing: '-0.05px',
          textAlign: 'center',
          opacity: toast ? 1 : 0,
          pointerEvents: toast ? 'auto' : 'none',
          transition: reducedMotion ? 'none' : 'opacity var(--dw-m-state) var(--ease-standard)',
          zIndex: 50,
        }}
      >
        {toast ?? ''}
      </div>

      {/* BottomTabBar mountes globalt i App.tsx — ikke her. */}
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MorningHourDialog — native <dialog> tidspunkt-velger for morgenvarsel
// ─────────────────────────────────────────────────────────────────────────────

interface MorningHourDialogProps {
  open: boolean;
  hour: number;
  reducedMotion: boolean;
  onClose: () => void;
  onSelect: (hour: number) => void;
  triggerRef: { current: HTMLElement | null };
}

const MORNING_HOUR_OPTIONS = [5, 6, 7, 8, 9, 10];

function MorningHourDialog({
  open,
  hour,
  reducedMotion,
  onClose,
  onSelect,
  triggerRef,
}: MorningHourDialogProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const copy = useSettingsSecondaryCopy();

  // Åpne/lukk det native <dialog>-elementet i takt med `open`
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  // Når <dialog> lukkes (ESC, .close(), submit method="dialog") → focus-return + onClose
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const handleClose = () => {
      onClose();
      requestAnimationFrame(() => {
        triggerRef.current?.focus?.();
      });
    };
    dlg.addEventListener('close', handleClose);
    return () => dlg.removeEventListener('close', handleClose);
  }, [onClose, triggerRef]);

  // Backdrop-click → close
  const handleBackdropClick = (e: ReactMouseEvent<HTMLDialogElement>) => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const rect = dlg.getBoundingClientRect();
    const inDialog =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    if (!inDialog) dlg.close();
  };

  const dialogStyle: CSSProperties = {
    padding: 0,
    border: `1px solid ${C.hairline}`,
    borderRadius: 20,
    maxWidth: 420,
    width: 'calc(100% - 32px)',
    margin: 'auto',
    background: C.cardBg,
    color: C.ink900,
    boxShadow: 'var(--shadow-cta-primary)',
    fontFamily: C.fontSans,
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--dw-space-12)',
    padding: 'var(--dw-space-16) var(--dw-space-18) var(--dw-space-12)',
    borderBottom: `1px solid ${C.hairline}`,
  };

  const titleStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    margin: 0,
    fontFamily: C.fontSerif,
    fontStyle: 'italic',
    fontWeight: 400,
    fontSize: '1.25rem',
    letterSpacing: '-0.3px',
    color: C.ink900,
    lineHeight: 1.15,
  };

  const closeBtnStyle: CSSProperties = {
    flex: 'none',
    /* 44, ikke 36: trykkmaalet er et gulv i BEGGE akser (WCAG 2.5.8).
       Hoyden ble reddet av den globale button{min-height:44px}, saa
       knappen var 36x44 - ikke 44x44. De sju andre lukkeknappene i
       filen var allerede riktige: dette var drift bort fra normen. */
    width: 'var(--dw-size-touch)',
    height: 'var(--dw-size-touch)',
    borderRadius: 11,
    border: `1px solid ${C.hairline}`,
    background: C.bgCanvasSoft,
    color: C.ink700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    fontFamily: 'inherit',
    fontSize: 18,
    lineHeight: 1,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  };

  const bodyStyle: CSSProperties = {
    padding: 'var(--dw-space-14) var(--dw-space-18) var(--dw-space-18)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-10)',
  };

  const helpStyle: CSSProperties = {
    margin: 0,
    fontSize: '0.84375rem',
    fontWeight: 500,
    color: C.ink700,
    lineHeight: 1.35,
  };

  const optionsGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 'var(--dw-space-8)',
    marginTop: 'var(--dw-space-4)',
  };

  const optionBase: CSSProperties = {
    minHeight: 52,
    padding: 'var(--dw-space-10) var(--dw-space-8)',
    borderRadius: 12,
    background: C.bgCanvasSoft,
    border: `1px solid ${C.hairline}`,
    color: C.ink800,
    fontFamily: 'inherit',
    fontSize: '1rem',
    fontWeight: 600,
    letterSpacing: '-0.1px',
    cursor: 'pointer',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    transition: reducedMotion
      ? 'none'
      : `background var(--dw-m-state) ${C.ease}, color var(--dw-m-state) ${C.ease}, border-color var(--dw-m-state) ${C.ease}`,
  };

  const optionActive: CSSProperties = {
    ...optionBase,
    background: C.orange500,
    color: 'var(--dw-ink-on-accent)',
    borderColor: C.orange500,
    boxShadow: 'var(--shadow-1)',
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="morning-hour-title"
      aria-describedby="morning-hour-desc"
      onClick={handleBackdropClick}
      style={dialogStyle}
    >
      <header style={headerStyle}>
        <h2 id="morning-hour-title" style={titleStyle}>
          {copy.morningHour.title}
        </h2>
        <button
          type="button"
          aria-label={copy.common.close}
          onClick={() => dialogRef.current?.close()}
          style={closeBtnStyle}
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>
      <div style={bodyStyle}>
        <p id="morning-hour-desc" style={helpStyle}>
          {copy.morningHour.description}
        </p>
        <div
          role="radiogroup"
          aria-labelledby="morning-hour-title"
          style={optionsGridStyle}
        >
          {MORNING_HOUR_OPTIONS.map((h) => {
            const active = h === hour;
            return (
              <button
                key={h}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={copy.common.hourAria(formatHour(h))}
                onClick={() => onSelect(h)}
                style={active ? optionActive : optionBase}
              >
                {formatHour(h)}
              </button>
            );
          })}
        </div>
      </div>
    </dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HelpDialog — native <dialog> FAQ for "Om & støtte → Hjelp og veiledning"
// ─────────────────────────────────────────────────────────────────────────────
//
// P0 fra audit: App Store/Play krever en synlig support-link før godkjenning.
// Implementeres som en native <dialog> (showModal + ESC + backdrop + X) med
// statisk FAQ. Markdown-lett struktur: vi rendrer som ren tekst (ingen runtime
// markdown-parser), men beholder en avsnitts-basert datamodell slik at vi kan
// bytte til markdown senere uten endringer i call-site.

interface HelpDialogProps {
  open: boolean;
  reducedMotion: boolean;
  onClose: () => void;
  triggerRef: { current: HTMLElement | null };
}

function HelpDialog({
  open,
  reducedMotion,
  onClose,
  triggerRef,
}: HelpDialogProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const copy = useSettingsSecondaryCopy();
  const dialogCopy = copy.help;

  // Åpne/lukk det native <dialog>-elementet i takt med `open`
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  // Når <dialog> lukkes (ESC, .close(), backdrop) → focus-return + onClose
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const handleClose = () => {
      onClose();
      requestAnimationFrame(() => {
        triggerRef.current?.focus?.();
      });
    };
    dlg.addEventListener('close', handleClose);
    return () => dlg.removeEventListener('close', handleClose);
  }, [onClose, triggerRef]);

  // Backdrop-click → close (klikk skjedde på selve <dialog>, ikke innerSurface)
  const handleBackdropClick = (e: ReactMouseEvent<HTMLDialogElement>) => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (e.target === dlg) {
      dlg.close();
    }
  };

  const dialogStyle: CSSProperties = {
    padding: 0,
    border: `1px solid ${C.hairline}`,
    borderRadius: 22,
    maxWidth: 460,
    width: 'calc(100% - 24px)',
    maxHeight: 'calc(100dvh - 32px)',
    margin: 'auto',
    background: C.cardBg,
    color: C.ink900,
    boxShadow: 'var(--shadow-cta-primary)',
    fontFamily: C.fontSans,
    overflow: 'hidden',
  };

  const innerSurfaceStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100dvh - 32px)',
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--dw-space-12)',
    padding: 'var(--dw-space-16) var(--dw-space-18) var(--dw-space-12)',
    borderBottom: `1px solid ${C.hairline}`,
    flex: 'none',
  };

  const titleStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    margin: 0,
    fontFamily: C.fontSerif,
    fontStyle: 'italic',
    fontWeight: 400,
    fontSize: '1.25rem',
    letterSpacing: '-0.3px',
    color: C.ink900,
    lineHeight: 1.15,
  };

  const closeBtnStyle: CSSProperties = {
    flex: 'none',
    /* 44, ikke 36: trykkmaalet er et gulv i BEGGE akser (WCAG 2.5.8).
       Hoyden ble reddet av den globale button{min-height:44px}, saa
       knappen var 36x44 - ikke 44x44. De sju andre lukkeknappene i
       filen var allerede riktige: dette var drift bort fra normen. */
    width: 'var(--dw-size-touch)',
    height: 'var(--dw-size-touch)',
    borderRadius: 11,
    border: `1px solid ${C.hairline}`,
    background: C.bgCanvasSoft,
    color: C.ink700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    fontFamily: 'inherit',
    fontSize: 18,
    lineHeight: 1,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  };

  const bodyStyle: CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    // D4: bunn-fade sa arket sier at det er mer under — samme oppskrift som
    // .dw-sheet-innhold i sheet.css og resten av appens rulleflater.
    WebkitMaskImage: 'var(--dw-fade-bunn)',
    maskImage: 'var(--dw-fade-bunn)',
    padding: 'var(--dw-space-14) var(--dw-space-18) var(--dw-space-18)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-14)',
    WebkitOverflowScrolling: 'touch',
  };

  const introStyle: CSSProperties = {
    margin: 0,
    fontSize: '0.84375rem',
    fontWeight: 500,
    color: C.ink700,
    lineHeight: 1.4,
  };

  const faqListStyle: CSSProperties = {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    border: `1px solid ${C.hairline}`,
    borderRadius: 14,
    overflow: 'hidden',
    background: C.cardBg,
  };

  const faqItemStyle: CSSProperties = {
    listStyle: 'none',
    padding: 'var(--dw-space-14) var(--dw-space-14)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-6)',
  };

  const faqQStyle: CSSProperties = {
    margin: 0,
    fontFamily: C.fontSans,
    fontWeight: 600,
    fontSize: '0.96875rem',
    letterSpacing: '-0.1px',
    color: C.ink900,
    lineHeight: 1.25,
  };

  const faqAStyle: CSSProperties = {
    margin: 0,
    fontSize: '0.875rem',
    fontWeight: 500,
    color: C.ink700,
    lineHeight: 1.45,
    letterSpacing: '-0.05px',
  };

  const footerStyle: CSSProperties = {
    flex: 'none',
    padding: '12px 18px calc(env(safe-area-inset-bottom, 0px) + 14px)',
    borderTop: `1px solid ${C.hairline}`,
    display: 'flex',
    justifyContent: 'flex-end',
    background: C.cardBg,
  };

  const doneBtnStyle: CSSProperties = {
    minHeight: 44,
    padding: 'var(--dw-space-10) var(--dw-space-18)',
    borderRadius: 12,
    border: 'none',
    background: C.orange500,
    color: 'var(--dw-ink-on-accent)',
    fontFamily: 'inherit',
    fontSize: '0.9375rem',
    fontWeight: 600,
    letterSpacing: '-0.05px',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-1)',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    transition: reducedMotion ? 'none' : `background var(--dw-m-feedback) ${C.ease}`,
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="help-title"
      aria-describedby="help-desc"
      onClick={handleBackdropClick}
      style={dialogStyle}
    >
      <div style={innerSurfaceStyle}>
        <header style={headerStyle}>
          <h2 id="help-title" style={titleStyle}>
            {dialogCopy.title}
          </h2>
          <button
            type="button"
            aria-label={copy.common.close}
            onClick={() => dialogRef.current?.close()}
            style={closeBtnStyle}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div style={bodyStyle}>
          <p id="help-desc" style={introStyle}>
            {dialogCopy.description}
          </p>

          <ul role="list" style={faqListStyle} aria-label={dialogCopy.faqAria}>
            {dialogCopy.faq.map((item, i) => (
              <li
                key={item.q}
                style={{
                  ...faqItemStyle,
                  ...(i > 0 ? { borderTop: `1px solid ${C.hairline}` } : null),
                }}
              >
                <h3 style={faqQStyle}>{item.q}</h3>
                {item.a.map((para, pi) => (
                  <p key={pi} style={faqAStyle}>
                    {para}
                  </p>
                ))}
              </li>
            ))}
          </ul>
        </div>

        <footer style={footerStyle}>
          <button
            type="button"
            style={doneBtnStyle}
            onClick={() => dialogRef.current?.close()}
            aria-label={dialogCopy.closeAria}
            autoFocus
          >
            {copy.common.done}
          </button>
        </footer>
      </div>
    </dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FeedbackDialog — native <dialog> for "Om & støtte → Send tilbakemelding"
// ─────────────────────────────────────────────────────────────────────────────
//
// P0 fra audit: Raden var tidligere en no-op. Vi åpner en native <dialog>
// (showModal + ESC + backdrop + X) som forklarer hva som sendes (versjon +
// plattform pre-fill) før vi åpner brukerens e-postklient via `mailto:`.
// Dette gir brukeren et tydelig samtykke-steg og matcher list-row-mønsteret
// fra HelpDialog/PaywallDialog (premium-card surface, hairline, terracotta-CTA).

interface FeedbackDialogProps {
  open: boolean;
  reducedMotion: boolean;
  onClose: () => void;
  onSendMail: () => void;
  triggerRef: { current: HTMLElement | null };
}

function FeedbackDialog({
  open,
  reducedMotion,
  onClose,
  onSendMail,
  triggerRef,
}: FeedbackDialogProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const copy = useSettingsSecondaryCopy();
  const dialogCopy = copy.feedback;
  const platform = useMemo(() => {
    try {
      return Capacitor.getPlatform();
    } catch {
      return 'web';
    }
  }, []);
  const version = APP_VERSION;

  // Åpne/lukk det native <dialog>-elementet i takt med `open`
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  // Når <dialog> lukkes (ESC, .close(), backdrop) → focus-return + onClose
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const handleClose = () => {
      onClose();
      requestAnimationFrame(() => {
        triggerRef.current?.focus?.();
      });
    };
    dlg.addEventListener('close', handleClose);
    return () => dlg.removeEventListener('close', handleClose);
  }, [onClose, triggerRef]);

  // Backdrop-click → close (klikk skjedde på selve <dialog>, ikke innerSurface)
  const handleBackdropClick = (e: ReactMouseEvent<HTMLDialogElement>) => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (e.target === dlg) {
      dlg.close();
    }
  };

  const dialogStyle: CSSProperties = {
    padding: 0,
    border: `1px solid ${C.hairline}`,
    borderRadius: 22,
    maxWidth: 460,
    width: 'calc(100% - 24px)',
    maxHeight: 'calc(100dvh - 32px)',
    margin: 'auto',
    background: C.cardBg,
    color: C.ink900,
    boxShadow: 'var(--shadow-cta-primary)',
    fontFamily: C.fontSans,
    overflow: 'hidden',
  };

  const innerSurfaceStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100dvh - 32px)',
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--dw-space-12)',
    padding: 'var(--dw-space-16) var(--dw-space-18) var(--dw-space-12)',
    borderBottom: `1px solid ${C.hairline}`,
    flex: 'none',
  };

  const titleStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    margin: 0,
    fontFamily: C.fontSerif,
    fontStyle: 'italic',
    fontWeight: 400,
    fontSize: '1.25rem',
    letterSpacing: '-0.3px',
    color: C.ink900,
    lineHeight: 1.15,
  };

  const closeBtnStyle: CSSProperties = {
    flex: 'none',
    /* 44, ikke 36: trykkmaalet er et gulv i BEGGE akser (WCAG 2.5.8).
       Hoyden ble reddet av den globale button{min-height:44px}, saa
       knappen var 36x44 - ikke 44x44. De sju andre lukkeknappene i
       filen var allerede riktige: dette var drift bort fra normen. */
    width: 'var(--dw-size-touch)',
    height: 'var(--dw-size-touch)',
    borderRadius: 11,
    border: `1px solid ${C.hairline}`,
    background: C.bgCanvasSoft,
    color: C.ink700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    fontFamily: 'inherit',
    fontSize: 18,
    lineHeight: 1,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  };

  const bodyStyle: CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    // D4: bunn-fade sa arket sier at det er mer under — samme oppskrift som
    // .dw-sheet-innhold i sheet.css og resten av appens rulleflater.
    WebkitMaskImage: 'var(--dw-fade-bunn)',
    maskImage: 'var(--dw-fade-bunn)',
    padding: 'var(--dw-space-14) var(--dw-space-18) var(--dw-space-18)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-14)',
    WebkitOverflowScrolling: 'touch',
  };

  const introStyle: CSSProperties = {
    margin: 0,
    fontSize: '0.90625rem',
    fontWeight: 500,
    color: C.ink800,
    lineHeight: 1.45,
    letterSpacing: '-0.05px',
  };

  const helpStyle: CSSProperties = {
    margin: 0,
    fontSize: '0.84375rem',
    fontWeight: 500,
    color: C.ink700,
    lineHeight: 1.4,
  };

  const metaCardStyle: CSSProperties = {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    border: `1px solid ${C.hairline}`,
    borderRadius: 14,
    overflow: 'hidden',
    background: C.cardBg,
    display: 'flex',
    flexDirection: 'column',
  };

  const metaRowStyle: CSSProperties = {
    ...rowStaticBase,
    padding: 'var(--dw-space-12) var(--dw-space-14)',
    minHeight: 48,
  };

  const metaItems: ReadonlyArray<{ label: string; value: string }> = [
    { label: dialogCopy.appVersion, value: version },
    { label: dialogCopy.platform, value: platform },
    { label: dialogCopy.recipient, value: 'hei@babyora.no' },
  ];

  const footerStyle: CSSProperties = {
    flex: 'none',
    padding: '12px 18px calc(env(safe-area-inset-bottom, 0px) + 14px)',
    borderTop: `1px solid ${C.hairline}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-8)',
    background: C.cardBg,
  };

  const primaryBtnStyle: CSSProperties = {
    width: '100%',
    minHeight: 52,
    padding: 'var(--dw-space-14) var(--dw-space-16)',
    borderRadius: 14,
    border: 'none',
    background: C.orange500,
    color: 'var(--dw-ink-on-accent)',
    fontFamily: 'inherit',
    fontSize: '1rem',
    fontWeight: 600,
    letterSpacing: '-0.1px',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-cta-primary)',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    transition: reducedMotion ? 'none' : `background var(--dw-m-feedback) ${C.ease}`,
  };

  const secondaryBtnStyle: CSSProperties = {
    width: '100%',
    minHeight: 44,
    padding: 'var(--dw-space-10) var(--dw-space-16)',
    borderRadius: 12,
    border: `1px solid ${C.hairline}`,
    background: C.bgCanvasSoft,
    color: C.ink800,
    fontFamily: 'inherit',
    fontSize: '0.90625rem',
    fontWeight: 600,
    letterSpacing: '-0.05px',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    transition: reducedMotion ? 'none' : `background var(--dw-m-feedback) ${C.ease}`,
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="feedback-title"
      aria-describedby="feedback-desc"
      onClick={handleBackdropClick}
      style={dialogStyle}
    >
      <div style={innerSurfaceStyle}>
        <header style={headerStyle}>
          <h2 id="feedback-title" style={titleStyle}>
            {dialogCopy.title}
          </h2>
          <button
            type="button"
            aria-label={copy.common.close}
            onClick={() => dialogRef.current?.close()}
            style={closeBtnStyle}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div style={bodyStyle}>
          <p id="feedback-desc" style={introStyle}>
            {dialogCopy.description}
          </p>

          <p style={helpStyle}>
            {dialogCopy.details}
          </p>

          <ul role="list" style={metaCardStyle} aria-label={dialogCopy.diagnosticsAria}>
            {metaItems.map((item, i) => (
              <li
                key={item.label}
                style={{
                  listStyle: 'none',
                  ...(i > 0 ? { borderTop: `1px solid ${C.hairline}` } : null),
                }}
              >
                <div style={metaRowStyle} role="group" aria-label={`${item.label}: ${item.value}`}>
                  <span style={rowBodyStyle}>
                    <span style={rowLabelStyle}>{item.label}</span>
                  </span>
                  <span style={rowValueBoldStyle}>{item.value}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <footer style={footerStyle}>
          <button
            type="button"
            style={primaryBtnStyle}
            onClick={onSendMail}
            aria-label={dialogCopy.openEmailAria}
            autoFocus
          >
            {dialogCopy.openEmail}
          </button>
          <button
            type="button"
            style={secondaryBtnStyle}
            onClick={() => dialogRef.current?.close()}
            aria-label={dialogCopy.cancelAria}
          >
            {copy.common.cancel}
          </button>
        </footer>
      </div>
    </dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PrivacyDialog — native <dialog> for "Om & støtte → Personvern og vilkår"
// ─────────────────────────────────────────────────────────────────────────────
//
// P0 fra audit: App Store/Play krever synlig link til personvern og vilkår
// før godkjenning. Vi viser et kort, statisk sammendrag (norsk) + lenker til
// den fulle teksten på babyora.no, og lister tredjepartsbibliotek/-tjenester
// (met.no attribution, Capacitor, RevenueCat) som er obligatorisk å oppgi.
//
// Speiler HelpDialog/FeedbackDialog-mønsteret: native <dialog> (showModal +
// ESC + backdrop + X), focus-trap automatisk, focus-return til trigger-rad,
// prefers-reduced-motion respektert, premium-card surface + hairline.

interface PrivacyDialogProps {
  open: boolean;
  reducedMotion: boolean;
  onClose: () => void;
  onOpenExternal: (url: string) => void;
  triggerRef: { current: HTMLElement | null };
}

function PrivacyDialog({
  open,
  reducedMotion,
  onClose,
  onOpenExternal,
  triggerRef,
}: PrivacyDialogProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const copy = useSettingsSecondaryCopy();
  const dialogCopy = copy.privacy;

  // Åpne/lukk det native <dialog>-elementet i takt med `open`
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  // Når <dialog> lukkes (ESC, .close(), backdrop) → focus-return + onClose
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const handleClose = () => {
      onClose();
      requestAnimationFrame(() => {
        triggerRef.current?.focus?.();
      });
    };
    dlg.addEventListener('close', handleClose);
    return () => dlg.removeEventListener('close', handleClose);
  }, [onClose, triggerRef]);

  // Backdrop-click → close (klikk skjedde på selve <dialog>, ikke innerSurface)
  const handleBackdropClick = (e: ReactMouseEvent<HTMLDialogElement>) => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (e.target === dlg) {
      dlg.close();
    }
  };

  const dialogStyle: CSSProperties = {
    padding: 0,
    border: `1px solid ${C.hairline}`,
    borderRadius: 22,
    maxWidth: 460,
    width: 'calc(100% - 24px)',
    maxHeight: 'calc(100dvh - 32px)',
    margin: 'auto',
    background: C.cardBg,
    color: C.ink900,
    boxShadow: 'var(--shadow-cta-primary)',
    fontFamily: C.fontSans,
    overflow: 'hidden',
  };

  const innerSurfaceStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100dvh - 32px)',
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--dw-space-12)',
    padding: 'var(--dw-space-16) var(--dw-space-18) var(--dw-space-12)',
    borderBottom: `1px solid ${C.hairline}`,
    flex: 'none',
  };

  const titleStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    margin: 0,
    fontFamily: C.fontSerif,
    fontStyle: 'italic',
    fontWeight: 400,
    fontSize: '1.25rem',
    letterSpacing: '-0.3px',
    color: C.ink900,
    lineHeight: 1.15,
  };

  const closeBtnStyle: CSSProperties = {
    flex: 'none',
    /* 44, ikke 36: trykkmaalet er et gulv i BEGGE akser (WCAG 2.5.8).
       Hoyden ble reddet av den globale button{min-height:44px}, saa
       knappen var 36x44 - ikke 44x44. De sju andre lukkeknappene i
       filen var allerede riktige: dette var drift bort fra normen. */
    width: 'var(--dw-size-touch)',
    height: 'var(--dw-size-touch)',
    borderRadius: 11,
    border: `1px solid ${C.hairline}`,
    background: C.bgCanvasSoft,
    color: C.ink700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    fontFamily: 'inherit',
    fontSize: 18,
    lineHeight: 1,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  };

  const bodyStyle: CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    // D4: bunn-fade sa arket sier at det er mer under — samme oppskrift som
    // .dw-sheet-innhold i sheet.css og resten av appens rulleflater.
    WebkitMaskImage: 'var(--dw-fade-bunn)',
    maskImage: 'var(--dw-fade-bunn)',
    padding: 'var(--dw-space-14) var(--dw-space-18) var(--dw-space-18)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-16)',
    WebkitOverflowScrolling: 'touch',
  };

  const introStyle: CSSProperties = {
    margin: 0,
    fontSize: '0.84375rem',
    fontWeight: 500,
    color: C.ink700,
    lineHeight: 1.4,
  };

  const sectionEyebrowInDialogStyle: CSSProperties = {
    fontSize: '0.65625rem',
    fontWeight: 600,
    letterSpacing: '1.6px',
    textTransform: 'uppercase',
    color: C.ink500,
    margin: 'var(--dw-space-4) var(--dw-space-4) 0',
    lineHeight: 1,
  };

  const summaryListStyle: CSSProperties = {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    border: `1px solid ${C.hairline}`,
    borderRadius: 14,
    overflow: 'hidden',
    background: C.cardBg,
  };

  const summaryItemStyle: CSSProperties = {
    listStyle: 'none',
    padding: 'var(--dw-space-14) var(--dw-space-14)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-6)',
  };

  const summaryQStyle: CSSProperties = {
    margin: 0,
    fontFamily: C.fontSans,
    fontWeight: 600,
    fontSize: '0.96875rem',
    letterSpacing: '-0.1px',
    color: C.ink900,
    lineHeight: 1.25,
  };

  const summaryAStyle: CSSProperties = {
    margin: 0,
    fontSize: '0.875rem',
    fontWeight: 500,
    color: C.ink700,
    lineHeight: 1.45,
    letterSpacing: '-0.05px',
  };

  const linksCardStyle: CSSProperties = {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    background: C.cardBg,
    borderRadius: 14,
    overflow: 'hidden',
    border: `1px solid ${C.hairline}`,
  };

  const externalLinkRowStyle: CSSProperties = {
    ...rowBase,
    padding: 'var(--dw-space-14)',
  };

  const externalLinkIconStyle: CSSProperties = {
    ...rowIconAccent,
  };

  const thirdPartyCardStyle: CSSProperties = {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    border: `1px solid ${C.hairline}`,
    borderRadius: 14,
    overflow: 'hidden',
    background: C.cardBg,
    display: 'flex',
    flexDirection: 'column',
  };

  const thirdPartyRowStyle: CSSProperties = {
    ...rowStaticBase,
    padding: 'var(--dw-space-12) var(--dw-space-14)',
    minHeight: 48,
  };

  const footerStyle: CSSProperties = {
    flex: 'none',
    padding: '12px 18px calc(env(safe-area-inset-bottom, 0px) + 14px)',
    borderTop: `1px solid ${C.hairline}`,
    display: 'flex',
    justifyContent: 'flex-end',
    background: C.cardBg,
  };

  const doneBtnStyle: CSSProperties = {
    minHeight: 44,
    padding: 'var(--dw-space-10) var(--dw-space-18)',
    borderRadius: 12,
    border: 'none',
    background: C.orange500,
    color: 'var(--dw-ink-on-accent)',
    fontFamily: 'inherit',
    fontSize: '0.9375rem',
    fontWeight: 600,
    letterSpacing: '-0.05px',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-1)',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    transition: reducedMotion ? 'none' : `background var(--dw-m-feedback) ${C.ease}`,
  };

  // Liten ekstern-link-ikon (NE-pil), brukt på link-rader for å signalisere
  // at trykk åpner i ekstern nettleser.
  const ExternalIcon = (
    <svg
      width={14}
      height={14}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 3h7v7" />
      <path d="M13 3L6.5 9.5" />
      <path d="M11 9v3.5A1.5 1.5 0 019.5 14h-6A1.5 1.5 0 012 12.5v-6A1.5 1.5 0 013.5 5H7" />
    </svg>
  );

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="privacy-title"
      aria-describedby="privacy-desc"
      onClick={handleBackdropClick}
      style={dialogStyle}
    >
      <div style={innerSurfaceStyle}>
        <header style={headerStyle}>
          <h2 id="privacy-title" style={titleStyle}>
            {dialogCopy.title}
          </h2>
          <button
            type="button"
            aria-label={copy.common.close}
            onClick={() => dialogRef.current?.close()}
            style={closeBtnStyle}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div style={bodyStyle}>
          <p id="privacy-desc" style={introStyle}>
            {dialogCopy.description}
          </p>

          <h3 style={sectionEyebrowInDialogStyle}>{dialogCopy.summaryHeading}</h3>
          <ul role="list" style={summaryListStyle} aria-label={dialogCopy.summaryAria}>
            {dialogCopy.summary.map((item, i) => (
              <li
                key={item.q}
                style={{
                  ...summaryItemStyle,
                  ...(i > 0 ? { borderTop: `1px solid ${C.hairline}` } : null),
                }}
              >
                <h4 style={summaryQStyle}>{item.q}</h4>
                {item.a.map((para, pi) => (
                  <p key={pi} style={summaryAStyle}>
                    {para}
                  </p>
                ))}
              </li>
            ))}
          </ul>

          <h3 style={sectionEyebrowInDialogStyle}>{dialogCopy.fullTextHeading}</h3>
          <ul role="list" style={linksCardStyle} aria-label={dialogCopy.linksAria}>
            {dialogCopy.links.map((link, i) => (
              <li
                key={link.href}
                style={{
                  listStyle: 'none',
                  ...(i > 0 ? { borderTop: `1px solid ${C.hairline}` } : null),
                }}
              >
                <button
                  type="button"
                  style={externalLinkRowStyle}
                  onClick={() => onOpenExternal(link.href)}
                  aria-label={dialogCopy.openLinkAria(link.label)}
                >
                  <span style={externalLinkIconStyle} aria-hidden="true">
                    {ExternalIcon}
                  </span>
                  <span style={rowBodyStyle}>
                    <span style={rowLabelStyle}>{link.label}</span>
                    <span style={rowSubStyle}>{link.sub}</span>
                  </span>
                  <Chevron />
                </button>
              </li>
            ))}
          </ul>

          <h3 style={sectionEyebrowInDialogStyle}>{dialogCopy.thirdPartiesHeading}</h3>
          <ul role="list" style={thirdPartyCardStyle} aria-label={dialogCopy.thirdPartiesAria}>
            {dialogCopy.thirdParties.map((item, i) => (
              <li
                key={item.name}
                style={{
                  listStyle: 'none',
                  ...(i > 0 ? { borderTop: `1px solid ${C.hairline}` } : null),
                }}
              >
                <div
                  style={thirdPartyRowStyle}
                  role="group"
                  aria-label={`${item.name}: ${item.purpose}`}
                >
                  <span style={rowBodyStyle}>
                    <span style={rowLabelStyle}>{item.name}</span>
                    <span
                      style={{
                        ...rowSubStyle,
                        whiteSpace: 'normal',
                        overflow: 'visible',
                        textOverflow: 'clip',
                      }}
                    >
                      {item.purpose}
                    </span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <footer style={footerStyle}>
          <button
            type="button"
            style={doneBtnStyle}
            onClick={() => dialogRef.current?.close()}
            aria-label={dialogCopy.closeAria}
            autoFocus
          >
            {copy.common.done}
          </button>
        </footer>
      </div>
    </dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SwitchChildDialog — native <dialog> for å bytte aktivt barn
// ─────────────────────────────────────────────────────────────────────────────

interface SwitchChildDialogProps {
  open: boolean;
  children: ReadonlyArray<{ id: string; name: string }>;
  activeId: string;
  reducedMotion: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  triggerRef: { current: HTMLElement | null };
  /** F81.5-W2 (Flate 4): barn nr. 1 (children[0]) er alltid gratis — resten
   *  krever Babyora Pluss for å bli AKTIVT barn. */
  isPremium: boolean;
  /** Kalt i stedet for onSelect når brukeren trykker et gatet barn — mottar
   *  selve knappen som ble trykket (returnFocusTo for PaywallDialog). Den
   *  underliggende dialogen forblir åpen (native <dialog>-stacking) slik at
   *  fokus kan returnere til NØYAKTIG denne knappen når paywall lukkes. */
  onRequestUpgrade: (trigger: HTMLButtonElement) => void;
}

function SwitchChildDialog({
  open,
  children,
  activeId,
  reducedMotion,
  onClose,
  onSelect,
  triggerRef,
  isPremium,
  onRequestUpgrade,
}: SwitchChildDialogProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const copy = useSettingsSecondaryCopy().switchChild;

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const handleClose = () => {
      onClose();
      requestAnimationFrame(() => {
        triggerRef.current?.focus?.();
      });
    };
    dlg.addEventListener('close', handleClose);
    return () => dlg.removeEventListener('close', handleClose);
  }, [onClose, triggerRef]);

  const handleBackdropClick = (e: ReactMouseEvent<HTMLDialogElement>) => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const rect = dlg.getBoundingClientRect();
    const inDialog =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    if (!inDialog) dlg.close();
  };

  const dialogStyle: CSSProperties = {
    padding: 0,
    border: `1px solid ${C.hairline}`,
    borderRadius: 20,
    maxWidth: 420,
    width: 'calc(100% - 32px)',
    margin: 'auto',
    background: C.cardBg,
    color: C.ink900,
    boxShadow: 'var(--shadow-cta-primary)',
    fontFamily: C.fontSans,
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--dw-space-12)',
    padding: 'var(--dw-space-16) var(--dw-space-18) var(--dw-space-12)',
    borderBottom: `1px solid ${C.hairline}`,
  };

  const titleStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    margin: 0,
    fontFamily: C.fontSerif,
    fontStyle: 'italic',
    fontWeight: 400,
    fontSize: '1.25rem',
    letterSpacing: '-0.3px',
    color: C.ink900,
    lineHeight: 1.15,
  };

  const closeBtnStyle: CSSProperties = {
    flex: 'none',
    width: 44,
    height: 44,
    borderRadius: 12,
    border: `1px solid ${C.hairline}`,
    background: C.bgCanvasSoft,
    color: C.ink700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    fontFamily: 'inherit',
    fontSize: 20,
    lineHeight: 1,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  };

  const bodyStyle: CSSProperties = {
    padding: 'var(--dw-space-12) var(--dw-space-12) var(--dw-space-16)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-4)',
  };

  const optionBase: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--dw-space-12)',
    padding: 'var(--dw-space-12) var(--dw-space-14)',
    minHeight: 52,
    borderRadius: 12,
    background: 'transparent',
    border: `1px solid transparent`,
    color: C.ink800,
    fontFamily: 'inherit',
    fontSize: '1rem',
    fontWeight: 600,
    letterSpacing: '-0.1px',
    cursor: 'pointer',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    textAlign: 'left',
    transition: reducedMotion ? 'none' : `background var(--dw-m-feedback) ${C.ease}`,
  };

  const optionActive: CSSProperties = {
    ...optionBase,
    background: C.bgCanvasSoft,
    borderColor: C.hairline,
    color: C.ink900,
  };

  const checkmarkStyle: CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: C.orange500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="switch-child-title"
      aria-describedby="switch-child-desc"
      onClick={handleBackdropClick}
      style={dialogStyle}
    >
      <header style={headerStyle}>
        <h2 id="switch-child-title" style={titleStyle}>
          {copy.title}
        </h2>
        <button
          type="button"
          aria-label={copy.closeAria}
          onClick={() => dialogRef.current?.close()}
          style={closeBtnStyle}
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>
      <p
        id="switch-child-desc"
        style={{
          margin: 0,
          padding: 'var(--dw-space-10) var(--dw-space-18) 0',
          fontSize: '0.84375rem',
          fontWeight: 500,
          color: C.ink700,
          lineHeight: 1.4,
        }}
      >
        {copy.description}
      </p>
      {!isPremium && children.length > 1 && (
        <p
          style={{
            margin: 0,
            padding: 'var(--dw-space-8) var(--dw-space-18) 0',
            fontSize: '0.78125rem',
            fontWeight: 500,
            color: C.ink500,
            lineHeight: 1.4,
          }}
        >
          {copy.plusNotice}
        </p>
      )}
      <div style={bodyStyle} role="radiogroup" aria-labelledby="switch-child-title">
        {children.length === 0 ? (
          <p
            style={{
              margin: 0,
              padding: 'var(--dw-space-12) var(--dw-space-14)',
              fontSize: '0.875rem',
              color: C.ink500,
            }}
          >
            {copy.empty}
          </p>
        ) : (
          children.map((child, index) => {
            const isActive = child.id === activeId;
            // F81.5-W2 (Flate 4): children[0] er alltid gratis. Aktivt barn
            // låses ALDRI ut selv om det er barn 2+ og bruker mistet Premium
            // (isActive utelukker gating — se VIKTIG-klausul i spec).
            const gated = isChildSwitchGated(index, isActive, isPremium);
            const displayName = child.name || copy.unnamed;
            const label = isActive
              ? copy.activeAria(displayName)
              : gated
                ? copy.gatedAria(displayName)
                : copy.switchAria(displayName);
            return (
              <button
                key={child.id}
                type="button"
                role="radio"
                aria-checked={isActive}
                aria-haspopup={gated ? 'dialog' : undefined}
                aria-label={label}
                onClick={(e) => {
                  if (gated) {
                    onRequestUpgrade(e.currentTarget);
                    return;
                  }
                  onSelect(child.id);
                }}
                style={isActive ? optionActive : optionBase}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {child.name || '—'}
                  {gated && (
                    <span aria-hidden="true" style={plussChipStyle}>{copy.plusLabel}</span>
                  )}
                </span>
                {isActive ? <span style={checkmarkStyle} aria-hidden="true">{copy.activeStatus}</span> : null}
              </button>
            );
          })
        )}
      </div>
    </dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RefHourPickerDialog — native <dialog> for referansetime (6/9/12/15/18/21)
// ─────────────────────────────────────────────────────────────────────────────

interface RefHourPickerDialogProps {
  open: boolean;
  currentHour: RefHour;
  reducedMotion: boolean;
  onClose: () => void;
  onSelect: (hour: RefHour) => void;
  triggerRef: { current: HTMLElement | null };
}

const REF_HOUR_OPTIONS: ReadonlyArray<RefHour> = [6, 9, 12, 15, 18, 21];

function RefHourPickerDialog({
  open,
  currentHour,
  reducedMotion,
  onClose,
  onSelect,
  triggerRef,
}: RefHourPickerDialogProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const copy = useSettingsSecondaryCopy();

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const handleClose = () => {
      onClose();
      requestAnimationFrame(() => {
        triggerRef.current?.focus?.();
      });
    };
    dlg.addEventListener('close', handleClose);
    return () => dlg.removeEventListener('close', handleClose);
  }, [onClose, triggerRef]);

  const handleBackdropClick = (e: ReactMouseEvent<HTMLDialogElement>) => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const rect = dlg.getBoundingClientRect();
    const inDialog =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    if (!inDialog) dlg.close();
  };

  const dialogStyle: CSSProperties = {
    padding: 0,
    border: `1px solid ${C.hairline}`,
    borderRadius: 20,
    maxWidth: 420,
    width: 'calc(100% - 32px)',
    margin: 'auto',
    background: C.cardBg,
    color: C.ink900,
    boxShadow: 'var(--shadow-cta-primary)',
    fontFamily: C.fontSans,
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--dw-space-12)',
    padding: 'var(--dw-space-16) var(--dw-space-18) var(--dw-space-12)',
    borderBottom: `1px solid ${C.hairline}`,
  };

  const titleStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    margin: 0,
    fontFamily: C.fontSerif,
    fontStyle: 'italic',
    fontWeight: 400,
    fontSize: '1.25rem',
    letterSpacing: '-0.3px',
    color: C.ink900,
    lineHeight: 1.15,
  };

  const closeBtnStyle: CSSProperties = {
    flex: 'none',
    /* 44, ikke 36: trykkmaalet er et gulv i BEGGE akser (WCAG 2.5.8).
       Hoyden ble reddet av den globale button{min-height:44px}, saa
       knappen var 36x44 - ikke 44x44. De sju andre lukkeknappene i
       filen var allerede riktige: dette var drift bort fra normen. */
    width: 'var(--dw-size-touch)',
    height: 'var(--dw-size-touch)',
    borderRadius: 11,
    border: `1px solid ${C.hairline}`,
    background: C.bgCanvasSoft,
    color: C.ink700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    fontFamily: 'inherit',
    fontSize: 18,
    lineHeight: 1,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  };

  const bodyStyle: CSSProperties = {
    padding: 'var(--dw-space-14) var(--dw-space-18) var(--dw-space-18)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-10)',
  };

  const helpStyle: CSSProperties = {
    margin: 0,
    fontSize: '0.84375rem',
    fontWeight: 500,
    color: C.ink700,
    lineHeight: 1.35,
  };

  const optionsGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 'var(--dw-space-8)',
    marginTop: 'var(--dw-space-4)',
  };

  const optionBase: CSSProperties = {
    minHeight: 52,
    padding: 'var(--dw-space-10) var(--dw-space-8)',
    borderRadius: 12,
    background: C.bgCanvasSoft,
    border: `1px solid ${C.hairline}`,
    color: C.ink800,
    fontFamily: 'inherit',
    fontSize: '1rem',
    fontWeight: 600,
    letterSpacing: '-0.1px',
    cursor: 'pointer',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    transition: reducedMotion
      ? 'none'
      : `background var(--dw-m-state) ${C.ease}, color var(--dw-m-state) ${C.ease}, border-color var(--dw-m-state) ${C.ease}`,
  };

  const optionActive: CSSProperties = {
    ...optionBase,
    background: C.orange500,
    color: 'var(--dw-ink-on-accent)',
    borderColor: C.orange500,
    boxShadow: 'var(--shadow-1)',
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="ref-hour-title"
      aria-describedby="ref-hour-desc"
      onClick={handleBackdropClick}
      style={dialogStyle}
    >
      <header style={headerStyle}>
        <h2 id="ref-hour-title" style={titleStyle}>
          {copy.referenceHour.title}
        </h2>
        <button
          type="button"
          aria-label={copy.common.close}
          onClick={() => dialogRef.current?.close()}
          style={closeBtnStyle}
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>
      <div style={bodyStyle}>
        <p id="ref-hour-desc" style={helpStyle}>
          {copy.referenceHour.description}
        </p>
        <div role="radiogroup" aria-labelledby="ref-hour-title" style={optionsGridStyle}>
          {REF_HOUR_OPTIONS.map((h) => {
            const active = h === currentHour;
            return (
              <button
                key={h}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={copy.common.hourAria(formatHour(h))}
                onClick={() => onSelect(h)}
                style={active ? optionActive : optionBase}
              >
                {formatHour(h)}
              </button>
            );
          })}
        </div>
      </div>
    </dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AddChildDialog — native <dialog> form for å legge til et nytt barn
// ─────────────────────────────────────────────────────────────────────────────
//
// P1 fra audit: Profil-seksjonens "Legg til nytt barn" var tidligere en no-op.
// Vi åpner en native <dialog> (showModal + ESC + backdrop + X) med et lite
// form (navn + fødselsdato + sted). Submit kaller addChild() i parent.
// Speiler dialog-mønsteret fra HelpDialog/FeedbackDialog/SwitchChildDialog:
// focus-trap automatisk via <dialog>, focus-return til trigger, ESC lukker,
// klikk på backdrop lukker, prefers-reduced-motion respekteres, alle
// touch-targets ≥44px.

interface AddChildDialogProps {
  open: boolean;
  reducedMotion: boolean;
  onClose: () => void;
  onSubmit: (payload: { name: string; dob: string; city: string }) => void;
  triggerRef: { current: HTMLElement | null };
}

function AddChildDialog({
  open,
  reducedMotion,
  onClose,
  onSubmit,
  triggerRef,
}: AddChildDialogProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const copy = useSettingsSecondaryCopy();
  const dialogCopy = copy.addChild;

  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [city, setCity] = useState('');
  const [touched, setTouched] = useState(false);

  // Åpne/lukk det native <dialog>-elementet i takt med `open`
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
      // Fokuser navn-input ved åpning (focus-trap settes opp av <dialog>)
      requestAnimationFrame(() => {
        nameInputRef.current?.focus();
      });
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  // Reset form-state ved åpning, slik at en ny "Legg til" alltid starter blank.
  // R3 (2026-07-14): render-justering i stedet for sync setState i effect —
  // feltene er garantert blanke FØR showModal/fokus-effekten kjører.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName('');
      setDob('');
      setCity('');
      setTouched(false);
    }
  }

  // Når <dialog> lukkes (ESC, .close(), backdrop) → focus-return + onClose
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const handleClose = () => {
      onClose();
      requestAnimationFrame(() => {
        triggerRef.current?.focus?.();
      });
    };
    dlg.addEventListener('close', handleClose);
    return () => dlg.removeEventListener('close', handleClose);
  }, [onClose, triggerRef]);

  // Backdrop-click → close (klikk skjedde på selve <dialog>, ikke innerSurface)
  const handleBackdropClick = (e: ReactMouseEvent<HTMLDialogElement>) => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (e.target === dlg) {
      dlg.close();
    }
  };

  const trimmedName = name.trim();
  const trimmedCity = city.trim();

  // Valider dato (må være ISO YYYY-MM-DD og ikke i fremtiden, ikke før 2018)
  const dobIsValid = useMemo(() => {
    if (!dob) return false;
    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) return false;
    const now = new Date();
    const earliest = new Date('2018-01-01');
    return d >= earliest && d <= now;
  }, [dob]);

  const nameOk = trimmedName.length > 0;
  const cityOk = trimmedCity.length > 0;
  const canSubmit = nameOk && dobIsValid && cityOk;

  const handleSubmit = (e: ReactFormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    onSubmit({
      name: trimmedName,
      dob,
      city: trimmedCity,
    });
  };

  const dialogStyle: CSSProperties = {
    padding: 0,
    border: `1px solid ${C.hairline}`,
    borderRadius: 22,
    maxWidth: 460,
    width: 'calc(100% - 24px)',
    maxHeight: 'calc(100dvh - 32px)',
    margin: 'auto',
    background: C.cardBg,
    color: C.ink900,
    boxShadow: 'var(--shadow-cta-primary)',
    fontFamily: C.fontSans,
    overflow: 'hidden',
  };

  const innerSurfaceStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100dvh - 32px)',
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--dw-space-12)',
    padding: 'var(--dw-space-16) var(--dw-space-18) var(--dw-space-12)',
    borderBottom: `1px solid ${C.hairline}`,
    flex: 'none',
  };

  const titleStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    margin: 0,
    fontFamily: C.fontSerif,
    fontStyle: 'italic',
    fontWeight: 400,
    fontSize: '1.25rem',
    letterSpacing: '-0.3px',
    color: C.ink900,
    lineHeight: 1.15,
  };

  const closeBtnStyle: CSSProperties = {
    flex: 'none',
    width: 44,
    height: 44,
    borderRadius: 12,
    border: `1px solid ${C.hairline}`,
    background: C.bgCanvasSoft,
    color: C.ink700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    fontFamily: 'inherit',
    fontSize: 20,
    lineHeight: 1,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  };

  const bodyStyle: CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    // D4: bunn-fade sa arket sier at det er mer under — samme oppskrift som
    // .dw-sheet-innhold i sheet.css og resten av appens rulleflater.
    WebkitMaskImage: 'var(--dw-fade-bunn)',
    maskImage: 'var(--dw-fade-bunn)',
    padding: 'var(--dw-space-16) var(--dw-space-18) var(--dw-space-18)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-14)',
    WebkitOverflowScrolling: 'touch',
  };

  const introStyle: CSSProperties = {
    margin: 0,
    fontSize: '0.84375rem',
    fontWeight: 500,
    color: C.ink700,
    lineHeight: 1.4,
  };

  const fieldStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-6)',
  };

  const labelStyle: CSSProperties = {
    fontSize: '0.78125rem',
    fontWeight: 600,
    letterSpacing: '.2px',
    color: C.ink700,
    textTransform: 'uppercase',
  };

  // Fase 3-migrering: `outline: 'none'` sto her uten erstatning. Som inline-stil
  // slo den ut den globale :focus-visible-ringen i design-tokens.css (inline
  // vinner over :where()), så de tre feltene hadde INGEN synlig fokusmarkør for
  // tastatur. Deklarasjonen er fjernet — flatene arver nå den ekte ringen
  // (2px solid var(--dw-focus), offset 3px). Uendret utenfor fokus.
  const inputStyle: CSSProperties = {
    width: '100%',
    minHeight: 48,
    padding: 'var(--dw-space-12) var(--dw-space-14)',
    borderRadius: 12,
    border: `1px solid ${C.hairline}`,
    background: C.bgCanvasSoft,
    color: C.ink900,
    fontFamily: 'inherit',
    fontSize: '1rem',
    fontWeight: 500,
    letterSpacing: '-0.05px',
    boxSizing: 'border-box',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    transition: reducedMotion ? 'none' : `border-color var(--dw-m-feedback) ${C.ease}`,
  };

  const errorStyle: CSSProperties = {
    margin: 0,
    fontSize: '0.75rem',
    fontWeight: 500,
    color: C.terracotta700,
    letterSpacing: '.05px',
    lineHeight: 1.3,
  };

  const footerStyle: CSSProperties = {
    flex: 'none',
    padding: '12px 18px calc(env(safe-area-inset-bottom, 0px) + 14px)',
    borderTop: `1px solid ${C.hairline}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-8)',
    background: C.cardBg,
  };

  const primaryBtnStyle: CSSProperties = {
    width: '100%',
    minHeight: 52,
    padding: 'var(--dw-space-14) var(--dw-space-16)',
    borderRadius: 14,
    border: 'none',
    background: canSubmit ? C.orange500 : 'color-mix(in srgb, var(--dw-accent) 40%, var(--dw-canvas))',
    color: canSubmit ? 'var(--dw-ink-on-accent)' : 'var(--dw-ink-hi)',
    fontFamily: 'inherit',
    fontSize: '1rem',
    fontWeight: 600,
    letterSpacing: '-0.1px',
    cursor: canSubmit ? 'pointer' : 'not-allowed',
    boxShadow: canSubmit ? 'var(--shadow-cta-primary)' : 'none',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    transition: reducedMotion ? 'none' : `background var(--dw-m-feedback) ${C.ease}`,
  };

  const secondaryBtnStyle: CSSProperties = {
    width: '100%',
    minHeight: 44,
    padding: 'var(--dw-space-10) var(--dw-space-16)',
    borderRadius: 12,
    border: `1px solid ${C.hairline}`,
    background: C.bgCanvasSoft,
    color: C.ink800,
    fontFamily: 'inherit',
    fontSize: '0.90625rem',
    fontWeight: 600,
    letterSpacing: '-0.05px',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    transition: reducedMotion ? 'none' : `background var(--dw-m-feedback) ${C.ease}`,
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="add-child-title"
      aria-describedby="add-child-desc"
      onClick={handleBackdropClick}
      style={dialogStyle}
    >
      <form onSubmit={handleSubmit} style={innerSurfaceStyle}>
        <header style={headerStyle}>
          <h2 id="add-child-title" style={titleStyle}>
            {dialogCopy.title}
          </h2>
          <button
            type="button"
            aria-label={dialogCopy.closeAria}
            onClick={() => dialogRef.current?.close()}
            style={closeBtnStyle}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div style={bodyStyle}>
          <p id="add-child-desc" style={introStyle}>
            {dialogCopy.description}
          </p>

          <div style={fieldStyle}>
            <label htmlFor="add-child-name" style={labelStyle}>
              {dialogCopy.name}
            </label>
            <input
              id="add-child-name"
              ref={nameInputRef}
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="words"
              placeholder={dialogCopy.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched(true)}
              aria-required="true"
              aria-invalid={touched && !nameOk}
              aria-describedby={touched && !nameOk ? 'add-child-name-err' : undefined}
              style={inputStyle}
              maxLength={40}
            />
            {touched && !nameOk ? (
              <p id="add-child-name-err" style={errorStyle}>
                {dialogCopy.nameError}
              </p>
            ) : null}
          </div>

          <div style={fieldStyle}>
            <label htmlFor="add-child-dob" style={labelStyle}>
              {dialogCopy.birthDate}
            </label>
            <input
              id="add-child-dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              onBlur={() => setTouched(true)}
              aria-required="true"
              aria-invalid={touched && !dobIsValid}
              aria-describedby={touched && !dobIsValid ? 'add-child-dob-err' : undefined}
              min="2018-01-01"
              max={today}
              style={inputStyle}
            />
            {touched && !dobIsValid ? (
              <p id="add-child-dob-err" style={errorStyle}>
                {dialogCopy.birthDateError}
              </p>
            ) : null}
          </div>

          <div style={fieldStyle}>
            <label htmlFor="add-child-city" style={labelStyle}>
              {dialogCopy.location}
            </label>
            <input
              id="add-child-city"
              type="text"
              inputMode="text"
              autoComplete="address-level2"
              autoCapitalize="words"
              placeholder={dialogCopy.locationPlaceholder}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onBlur={() => setTouched(true)}
              aria-required="true"
              aria-invalid={touched && !cityOk}
              aria-describedby={touched && !cityOk ? 'add-child-city-err' : undefined}
              style={inputStyle}
              maxLength={60}
            />
            {touched && !cityOk ? (
              <p id="add-child-city-err" style={errorStyle}>
                {dialogCopy.locationError}
              </p>
            ) : null}
          </div>
        </div>

        <footer style={footerStyle}>
          <button
            type="submit"
            style={primaryBtnStyle}
            disabled={!canSubmit}
            aria-label={dialogCopy.submitAria}
          >
            {dialogCopy.submit}
          </button>
          <button
            type="button"
            style={secondaryBtnStyle}
            onClick={() => dialogRef.current?.close()}
            aria-label={dialogCopy.cancelAria}
          >
            {copy.common.cancel}
          </button>
        </footer>
      </form>
    </dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AutoLocationDialog — native <dialog> som forklarer geolocation-permission
// FØR vi spør navigator.geolocation.getCurrentPosition.
// ─────────────────────────────────────────────────────────────────────────────
//
// Hvorfor en mellom-dialog: Apple/Google sin App Review-anbefaling sier at
// vi bør forklare HVORFOR vi ber om posisjon, før systemet viser sin egen
// permission-prompt. Da blir bruker mer trygg på å trykke "Tillat".
//
// Speiler resten av Babyora sine dialoger:
//  - native <dialog> + showModal() (focus-trap automatisk)
//  - ESC + .close() + backdrop-click + X-knapp lukker
//  - focus-return til triggerRef (toggle-pill) i 'close'-event
//  - prefers-reduced-motion respekteres (ingen transitions ved reduce)
//  - touch-target ≥44px på primary CTA + close + secondary
//  - norsk språk

interface AutoLocationDialogProps {
  open: boolean;
  pending: boolean;
  reducedMotion: boolean;
  onClose: () => void;
  onConfirm: () => void;
  triggerRef: { current: HTMLElement | null };
}

function AutoLocationDialog({
  open,
  pending,
  reducedMotion,
  onClose,
  onConfirm,
  triggerRef,
}: AutoLocationDialogProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const copy = useSettingsSecondaryCopy();
  const dialogCopy = copy.autoLocation;

  // Åpne/lukk det native <dialog>-elementet i takt med `open`
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  // Når <dialog> lukkes (ESC, .close(), backdrop) → focus-return + onClose
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const handleClose = () => {
      onClose();
      requestAnimationFrame(() => {
        triggerRef.current?.focus?.();
      });
    };
    dlg.addEventListener('close', handleClose);
    return () => dlg.removeEventListener('close', handleClose);
  }, [onClose, triggerRef]);

  // Backdrop-click → close (klikk skjedde på selve <dialog>, ikke innerSurface).
  // Når pending=true blokkerer vi backdrop-lukk slik at vi ikke avbryter
  // permission-flyten mid-request.
  const handleBackdropClick = (e: ReactMouseEvent<HTMLDialogElement>) => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (pending) return;
    if (e.target === dlg) {
      dlg.close();
    }
  };

  const dialogStyle: CSSProperties = {
    padding: 0,
    border: `1px solid ${C.hairline}`,
    borderRadius: 22,
    maxWidth: 420,
    width: 'calc(100% - 24px)',
    maxHeight: 'calc(100dvh - 32px)',
    margin: 'auto',
    background: C.cardBg,
    color: C.ink900,
    boxShadow: 'var(--shadow-cta-primary)',
    fontFamily: C.fontSans,
    overflow: 'hidden',
  };

  const innerSurfaceStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100dvh - 32px)',
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--dw-space-12)',
    padding: 'var(--dw-space-16) var(--dw-space-18) var(--dw-space-12)',
    borderBottom: `1px solid ${C.hairline}`,
    flex: 'none',
  };

  const titleStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    margin: 0,
    fontFamily: C.fontSerif,
    fontStyle: 'italic',
    fontWeight: 400,
    fontSize: '1.25rem',
    letterSpacing: '-0.3px',
    color: C.ink900,
    lineHeight: 1.15,
  };

  const closeBtnStyle: CSSProperties = {
    flex: 'none',
    width: 44,
    height: 44,
    borderRadius: 12,
    border: `1px solid ${C.hairline}`,
    background: C.bgCanvasSoft,
    color: C.ink700,
    cursor: pending ? 'not-allowed' : 'pointer',
    opacity: pending ? 0.5 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    fontFamily: 'inherit',
    fontSize: 20,
    lineHeight: 1,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  };

  const bodyStyle: CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    // D4: bunn-fade sa arket sier at det er mer under — samme oppskrift som
    // .dw-sheet-innhold i sheet.css og resten av appens rulleflater.
    WebkitMaskImage: 'var(--dw-fade-bunn)',
    maskImage: 'var(--dw-fade-bunn)',
    padding: 'var(--dw-space-16) var(--dw-space-18) var(--dw-space-18)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-12)',
    WebkitOverflowScrolling: 'touch',
  };

  const introStyle: CSSProperties = {
    margin: 0,
    fontSize: '0.90625rem',
    fontWeight: 500,
    color: C.ink800,
    lineHeight: 1.45,
    letterSpacing: '-0.05px',
  };

  const helpStyle: CSSProperties = {
    margin: 0,
    fontSize: '0.84375rem',
    fontWeight: 500,
    color: C.ink700,
    lineHeight: 1.4,
  };

  const footerStyle: CSSProperties = {
    flex: 'none',
    padding: '12px 18px calc(env(safe-area-inset-bottom, 0px) + 14px)',
    borderTop: `1px solid ${C.hairline}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-8)',
    background: C.cardBg,
  };

  const primaryBtnStyle: CSSProperties = {
    width: '100%',
    minHeight: 52,
    padding: 'var(--dw-space-14) var(--dw-space-16)',
    borderRadius: 14,
    border: 'none',
    background: pending ? 'color-mix(in srgb, var(--dw-accent) 40%, var(--dw-canvas))' : C.orange500,
    color: pending ? 'var(--dw-ink-hi)' : 'var(--dw-ink-on-accent)',
    fontFamily: 'inherit',
    fontSize: '1rem',
    fontWeight: 600,
    letterSpacing: '-0.1px',
    cursor: pending ? 'wait' : 'pointer',
    boxShadow: pending ? 'none' : 'var(--shadow-cta-primary)',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    transition: reducedMotion ? 'none' : `background var(--dw-m-feedback) ${C.ease}`,
  };

  const secondaryBtnStyle: CSSProperties = {
    width: '100%',
    minHeight: 44,
    padding: 'var(--dw-space-10) var(--dw-space-16)',
    borderRadius: 12,
    border: `1px solid ${C.hairline}`,
    background: C.bgCanvasSoft,
    color: C.ink800,
    fontFamily: 'inherit',
    fontSize: '0.90625rem',
    fontWeight: 600,
    letterSpacing: '-0.05px',
    cursor: pending ? 'not-allowed' : 'pointer',
    opacity: pending ? 0.5 : 1,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    transition: reducedMotion ? 'none' : `background var(--dw-m-feedback) ${C.ease}`,
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="auto-location-title"
      aria-describedby="auto-location-desc"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
        dialogRef.current?.close();
      }}
      onClick={handleBackdropClick}
      style={dialogStyle}
    >
      <div style={innerSurfaceStyle}>
        <header style={headerStyle}>
          <h2 id="auto-location-title" style={titleStyle}>
            {dialogCopy.title}
          </h2>
          <button
            type="button"
            aria-label={copy.common.close}
            onClick={() => dialogRef.current?.close()}
            disabled={pending}
            style={closeBtnStyle}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div style={bodyStyle}>
          <p id="auto-location-desc" style={introStyle}>
            {dialogCopy.description}
          </p>
          <p style={helpStyle}>
            {dialogCopy.details}
          </p>
        </div>

        <footer style={footerStyle}>
          <button
            type="button"
            style={primaryBtnStyle}
            onClick={onConfirm}
            disabled={pending}
            aria-label={dialogCopy.allowAria}
            autoFocus
          >
            {pending ? dialogCopy.pending : dialogCopy.allow}
          </button>
          <button
            type="button"
            style={secondaryBtnStyle}
            onClick={() => dialogRef.current?.close()}
            disabled={pending}
            aria-label={dialogCopy.cancelAria}
          >
            {copy.common.cancel}
          </button>
        </footer>
      </div>
    </dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WeatherChangeDialog — native <dialog> som forklarer notification-permission
// FØR vi spør systemet (Notification API på web, LocalNotifications på native).
// ─────────────────────────────────────────────────────────────────────────────
//
// Hvorfor en mellom-dialog: samme prinsipp som AutoLocationDialog — Apple/Google
// sin App Review-anbefaling sier at vi bør forklare HVORFOR vi ber om tillatelse
// FØR systemet viser sin egen permission-prompt. Bruker blir tryggere på «Tillat».
//
// Speiler resten av Babyora sine dialoger:
//  - native <dialog> + showModal() (focus-trap automatisk)
//  - ESC + .close() + backdrop-click + X-knapp lukker
//  - focus-return til triggerRef (TogglePill) i 'close'-event
//  - prefers-reduced-motion respekteres (ingen transitions ved reduce)
//  - touch-target ≥44px på CTA + close + secondary
//  - norsk språk

interface WeatherChangeDialogProps {
  open: boolean;
  pending: boolean;
  reducedMotion: boolean;
  onClose: () => void;
  onConfirm: () => void;
  triggerRef: { current: HTMLElement | null };
}

function WeatherChangeDialog({
  open,
  pending,
  reducedMotion,
  onClose,
  onConfirm,
  triggerRef,
}: WeatherChangeDialogProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const copy = useSettingsSecondaryCopy();
  const dialogCopy = copy.weatherChange;

  // Åpne/lukk det native <dialog>-elementet i takt med `open`
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  // Når <dialog> lukkes (ESC, .close(), backdrop) → focus-return + onClose
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const handleClose = () => {
      onClose();
      requestAnimationFrame(() => {
        triggerRef.current?.focus?.();
      });
    };
    dlg.addEventListener('close', handleClose);
    return () => dlg.removeEventListener('close', handleClose);
  }, [onClose, triggerRef]);

  // Backdrop-click → close (klikk skjedde på selve <dialog>, ikke innerSurface).
  // Blokker mid-request (pending=true) slik at vi ikke avbryter permission-flyten.
  const handleBackdropClick = (e: ReactMouseEvent<HTMLDialogElement>) => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (pending) return;
    if (e.target === dlg) {
      dlg.close();
    }
  };

  const dialogStyle: CSSProperties = {
    padding: 0,
    border: `1px solid ${C.hairline}`,
    borderRadius: 22,
    maxWidth: 420,
    width: 'calc(100% - 24px)',
    maxHeight: 'calc(100dvh - 32px)',
    margin: 'auto',
    background: C.cardBg,
    color: C.ink900,
    boxShadow: 'var(--shadow-cta-primary)',
    fontFamily: C.fontSans,
    overflow: 'hidden',
  };

  const innerSurfaceStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100dvh - 32px)',
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--dw-space-12)',
    padding: 'var(--dw-space-16) var(--dw-space-18) var(--dw-space-12)',
    borderBottom: `1px solid ${C.hairline}`,
    flex: 'none',
  };

  const titleStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    margin: 0,
    fontFamily: C.fontSerif,
    fontStyle: 'italic',
    fontWeight: 400,
    fontSize: '1.25rem',
    letterSpacing: '-0.3px',
    color: C.ink900,
    lineHeight: 1.15,
  };

  const closeBtnStyle: CSSProperties = {
    flex: 'none',
    width: 44,
    height: 44,
    borderRadius: 12,
    border: `1px solid ${C.hairline}`,
    background: C.bgCanvasSoft,
    color: C.ink700,
    cursor: pending ? 'not-allowed' : 'pointer',
    opacity: pending ? 0.5 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    fontFamily: 'inherit',
    fontSize: 20,
    lineHeight: 1,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  };

  const bodyStyle: CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    // D4: bunn-fade sa arket sier at det er mer under — samme oppskrift som
    // .dw-sheet-innhold i sheet.css og resten av appens rulleflater.
    WebkitMaskImage: 'var(--dw-fade-bunn)',
    maskImage: 'var(--dw-fade-bunn)',
    padding: 'var(--dw-space-16) var(--dw-space-18) var(--dw-space-18)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-12)',
    WebkitOverflowScrolling: 'touch',
  };

  const introStyle: CSSProperties = {
    margin: 0,
    fontSize: '0.90625rem',
    fontWeight: 500,
    color: C.ink800,
    lineHeight: 1.45,
    letterSpacing: '-0.05px',
  };

  const helpStyle: CSSProperties = {
    margin: 0,
    fontSize: '0.84375rem',
    fontWeight: 500,
    color: C.ink700,
    lineHeight: 1.4,
  };

  const footerStyle: CSSProperties = {
    flex: 'none',
    padding: '12px 18px calc(env(safe-area-inset-bottom, 0px) + 14px)',
    borderTop: `1px solid ${C.hairline}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-8)',
    background: C.cardBg,
  };

  const primaryBtnStyle: CSSProperties = {
    width: '100%',
    minHeight: 52,
    padding: 'var(--dw-space-14) var(--dw-space-16)',
    borderRadius: 14,
    border: 'none',
    background: pending ? 'color-mix(in srgb, var(--dw-accent) 40%, var(--dw-canvas))' : C.orange500,
    color: pending ? 'var(--dw-ink-hi)' : 'var(--dw-ink-on-accent)',
    fontFamily: 'inherit',
    fontSize: '1rem',
    fontWeight: 600,
    letterSpacing: '-0.1px',
    cursor: pending ? 'wait' : 'pointer',
    boxShadow: pending ? 'none' : 'var(--shadow-cta-primary)',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    transition: reducedMotion ? 'none' : `background var(--dw-m-feedback) ${C.ease}`,
  };

  const secondaryBtnStyle: CSSProperties = {
    width: '100%',
    minHeight: 44,
    padding: 'var(--dw-space-10) var(--dw-space-16)',
    borderRadius: 12,
    border: `1px solid ${C.hairline}`,
    background: C.bgCanvasSoft,
    color: C.ink800,
    fontFamily: 'inherit',
    fontSize: '0.90625rem',
    fontWeight: 600,
    letterSpacing: '-0.05px',
    cursor: pending ? 'not-allowed' : 'pointer',
    opacity: pending ? 0.5 : 1,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    transition: reducedMotion ? 'none' : `background var(--dw-m-feedback) ${C.ease}`,
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="weather-change-title"
      aria-describedby="weather-change-desc"
      onClick={handleBackdropClick}
      style={dialogStyle}
    >
      <div style={innerSurfaceStyle}>
        <header style={headerStyle}>
          <h2 id="weather-change-title" style={titleStyle}>
            {dialogCopy.title}
          </h2>
          <button
            type="button"
            aria-label={copy.common.close}
            onClick={() => dialogRef.current?.close()}
            disabled={pending}
            style={closeBtnStyle}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div style={bodyStyle}>
          <p id="weather-change-desc" style={introStyle}>
            {dialogCopy.description}
          </p>
          <p style={helpStyle}>
            {dialogCopy.details}
          </p>
        </div>

        <footer style={footerStyle}>
          <button
            type="button"
            style={primaryBtnStyle}
            onClick={onConfirm}
            disabled={pending}
            aria-label={dialogCopy.allowAria}
            autoFocus
          >
            {pending ? dialogCopy.pending : dialogCopy.allow}
          </button>
          <button
            type="button"
            style={secondaryBtnStyle}
            onClick={() => dialogRef.current?.close()}
            disabled={pending}
            aria-label={dialogCopy.cancelAria}
          >
            {copy.common.cancel}
          </button>
        </footer>
      </div>
    </dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DeleteDataDialog — destructive bekreftelses-dialog for GDPR-sletting
// ─────────────────────────────────────────────────────────────────────────────
//
// P1 fra audit: GDPR Article 17 ("right to erasure") krever én-klikks sletting
// av alle bruker-data. Vi viser en tydelig destructive confirm-dialog FØR vi
// tømmer localStorage, slik at det ikke skjer ved et uhell.
//
// A11y: speiler WeatherChangeDialog (native <dialog> + showModal + ESC +
// backdrop + X-knapp + focus-return). Forskjell: primary-CTA er rød
// (terracotta-700) for å signalisere destructive action; secondary "Avbryt"
// får autoFocus så ENTER ikke utløser sletting ved et uhell.
//
// Norsk språk overalt — meningsfulle aria-label.

interface DeleteDataDialogProps {
  open: boolean;
  reducedMotion: boolean;
  onClose: () => void;
  onConfirm: () => void;
  triggerRef: { current: HTMLElement | null };
}

function DeleteDataDialog({
  open,
  reducedMotion,
  onClose,
  onConfirm,
  triggerRef,
}: DeleteDataDialogProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const copy = useSettingsSecondaryCopy();
  const dialogCopy = copy.deleteData;

  // Åpne/lukk det native <dialog>-elementet i takt med `open`
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  // Når <dialog> lukkes (ESC, .close(), backdrop) → focus-return + onClose
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const handleClose = () => {
      onClose();
      requestAnimationFrame(() => {
        triggerRef.current?.focus?.();
      });
    };
    dlg.addEventListener('close', handleClose);
    return () => dlg.removeEventListener('close', handleClose);
  }, [onClose, triggerRef]);

  // Backdrop-click → close (klikk skjedde på selve <dialog>, ikke innerSurface).
  const handleBackdropClick = (e: ReactMouseEvent<HTMLDialogElement>) => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (e.target === dlg) {
      dlg.close();
    }
  };

  const dialogStyle: CSSProperties = {
    padding: 0,
    border: `1px solid ${C.hairline}`,
    borderRadius: 22,
    maxWidth: 420,
    width: 'calc(100% - 24px)',
    maxHeight: 'calc(100dvh - 32px)',
    margin: 'auto',
    background: C.cardBg,
    color: C.ink900,
    boxShadow: 'var(--shadow-cta-primary)',
    fontFamily: C.fontSans,
    overflow: 'hidden',
  };

  const innerSurfaceStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100dvh - 32px)',
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--dw-space-12)',
    padding: 'var(--dw-space-16) var(--dw-space-18) var(--dw-space-12)',
    borderBottom: `1px solid ${C.hairline}`,
    flex: 'none',
  };

  const titleStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    margin: 0,
    fontFamily: C.fontSerif,
    fontStyle: 'italic',
    fontWeight: 400,
    fontSize: '1.25rem',
    letterSpacing: '-0.3px',
    color: C.ink900,
    lineHeight: 1.15,
  };

  const closeBtnStyle: CSSProperties = {
    flex: 'none',
    width: 44,
    height: 44,
    borderRadius: 12,
    border: `1px solid ${C.hairline}`,
    background: C.bgCanvasSoft,
    color: C.ink700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    fontFamily: 'inherit',
    fontSize: 20,
    lineHeight: 1,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  };

  const bodyStyle: CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    // D4: bunn-fade sa arket sier at det er mer under — samme oppskrift som
    // .dw-sheet-innhold i sheet.css og resten av appens rulleflater.
    WebkitMaskImage: 'var(--dw-fade-bunn)',
    maskImage: 'var(--dw-fade-bunn)',
    padding: 'var(--dw-space-16) var(--dw-space-18) var(--dw-space-18)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-12)',
    WebkitOverflowScrolling: 'touch',
  };

  const introStyle: CSSProperties = {
    margin: 0,
    fontSize: '0.96875rem',
    fontWeight: 600,
    color: C.ink900,
    lineHeight: 1.4,
    letterSpacing: '-0.05px',
  };

  const helpStyle: CSSProperties = {
    margin: 0,
    fontSize: '0.84375rem',
    fontWeight: 500,
    color: C.ink700,
    lineHeight: 1.45,
  };

  const bulletListStyle: CSSProperties = {
    margin: 'var(--dw-space-4) 0 0',
    paddingLeft: 'var(--dw-space-18)',
    color: C.ink700,
    fontSize: '0.84375rem',
    fontWeight: 500,
    lineHeight: 1.5,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-4)',
  };

  const footerStyle: CSSProperties = {
    flex: 'none',
    padding: '12px 18px calc(env(safe-area-inset-bottom, 0px) + 14px)',
    borderTop: `1px solid ${C.hairline}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-8)',
    background: C.cardBg,
  };

  // Destructive primary — terracotta i stedet for warm orange
  const destructiveBtnStyle: CSSProperties = {
    width: '100%',
    minHeight: 52,
    padding: 'var(--dw-space-14) var(--dw-space-16)',
    borderRadius: 14,
    border: 'none',
    background: C.terracotta700,
    color: 'var(--dw-ink-on-accent)',
    fontFamily: 'inherit',
    fontSize: '1rem',
    fontWeight: 600,
    letterSpacing: '-0.1px',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-cta-primary)',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    transition: reducedMotion ? 'none' : `background var(--dw-m-feedback) ${C.ease}`,
  };

  const secondaryBtnStyle: CSSProperties = {
    width: '100%',
    minHeight: 44,
    padding: 'var(--dw-space-10) var(--dw-space-16)',
    borderRadius: 12,
    border: `1px solid ${C.hairline}`,
    background: C.bgCanvasSoft,
    color: C.ink800,
    fontFamily: 'inherit',
    fontSize: '0.90625rem',
    fontWeight: 600,
    letterSpacing: '-0.05px',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    transition: reducedMotion ? 'none' : `background var(--dw-m-feedback) ${C.ease}`,
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="delete-data-title"
      aria-describedby="delete-data-desc"
      onClick={handleBackdropClick}
      style={dialogStyle}
    >
      <div style={innerSurfaceStyle}>
        <header style={headerStyle}>
          <h2 id="delete-data-title" style={titleStyle}>
            {dialogCopy.title}
          </h2>
          <button
            type="button"
            aria-label={copy.common.close}
            onClick={() => dialogRef.current?.close()}
            style={closeBtnStyle}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div style={bodyStyle}>
          <p id="delete-data-desc" style={introStyle}>
            {dialogCopy.irreversible}
          </p>
          <p style={helpStyle}>
            {dialogCopy.description}
          </p>
          <ul style={bulletListStyle} aria-label={dialogCopy.deletedItemsAria}>
            {dialogCopy.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <p style={helpStyle}>
            {dialogCopy.aftermath}
          </p>
        </div>

        <footer style={footerStyle}>
          <button
            type="button"
            style={destructiveBtnStyle}
            onClick={onConfirm}
            aria-label={dialogCopy.confirmAria}
          >
            {dialogCopy.confirm}
          </button>
          <button
            type="button"
            style={secondaryBtnStyle}
            onClick={() => dialogRef.current?.close()}
            aria-label={dialogCopy.cancelAria}
            autoFocus
          >
            {copy.common.cancel}
          </button>
        </footer>
      </div>
    </dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WeatherSourceDialog — native <dialog> som forklarer hvor vær-data kommer fra
// ─────────────────────────────────────────────────────────────────────────────
//
// P2 fra audit: met.no leverer vær-data under CC BY 4.0 — vi MÅ attribuere
// kilden synlig i UI. Denne dialogen åpnes fra "Vær & sted → Værkilde" og
// forklarer at vi bruker met.no (Meteorologisk institutt), med ekstern lenke
// til met.no/no/om.
//
// Speiler resten av Babyora sine dialoger:
//  - native <dialog> + showModal() (focus-trap automatisk)
//  - ESC + .close() + backdrop-click + X-knapp lukker
//  - focus-return til triggerRef (rad-knapp) i 'close'-event
//  - prefers-reduced-motion respekteres (ingen transitions ved reduce)
//  - touch-target ≥44px på CTA + close + lenke
//  - norsk språk + meningsfulle aria-label

interface WeatherSourceDialogProps {
  open: boolean;
  reducedMotion: boolean;
  onClose: () => void;
  onOpenLink: () => void;
  triggerRef: { current: HTMLElement | null };
}

function WeatherSourceDialog({
  open,
  reducedMotion,
  onClose,
  onOpenLink,
  triggerRef,
}: WeatherSourceDialogProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const copy = useSettingsSecondaryCopy();
  const dialogCopy = copy.weatherSource;

  // Åpne/lukk det native <dialog>-elementet i takt med `open`
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  // Når <dialog> lukkes (ESC, .close(), backdrop) → focus-return + onClose
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const handleClose = () => {
      onClose();
      requestAnimationFrame(() => {
        triggerRef.current?.focus?.();
      });
    };
    dlg.addEventListener('close', handleClose);
    return () => dlg.removeEventListener('close', handleClose);
  }, [onClose, triggerRef]);

  // Backdrop-click → close (klikk skjedde på selve <dialog>, ikke innerSurface)
  const handleBackdropClick = (e: ReactMouseEvent<HTMLDialogElement>) => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (e.target === dlg) {
      dlg.close();
    }
  };

  const dialogStyle: CSSProperties = {
    padding: 0,
    border: `1px solid ${C.hairline}`,
    borderRadius: 22,
    maxWidth: 420,
    width: 'calc(100% - 24px)',
    maxHeight: 'calc(100dvh - 32px)',
    margin: 'auto',
    background: C.cardBg,
    color: C.ink900,
    boxShadow: 'var(--shadow-cta-primary)',
    fontFamily: C.fontSans,
    overflow: 'hidden',
  };

  const innerSurfaceStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100dvh - 32px)',
  };

  const dialogHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--dw-space-12)',
    padding: 'var(--dw-space-16) var(--dw-space-18) var(--dw-space-12)',
    borderBottom: `1px solid ${C.hairline}`,
    flex: 'none',
  };

  const titleStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    margin: 0,
    fontFamily: C.fontSerif,
    fontStyle: 'italic',
    fontWeight: 400,
    fontSize: '1.25rem',
    letterSpacing: '-0.3px',
    color: C.ink900,
    lineHeight: 1.15,
  };

  const closeBtnStyle: CSSProperties = {
    flex: 'none',
    width: 44,
    height: 44,
    borderRadius: 12,
    border: `1px solid ${C.hairline}`,
    background: C.bgCanvasSoft,
    color: C.ink700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    fontFamily: 'inherit',
    fontSize: 20,
    lineHeight: 1,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  };

  const bodyStyle: CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    // D4: bunn-fade sa arket sier at det er mer under — samme oppskrift som
    // .dw-sheet-innhold i sheet.css og resten av appens rulleflater.
    WebkitMaskImage: 'var(--dw-fade-bunn)',
    maskImage: 'var(--dw-fade-bunn)',
    padding: 'var(--dw-space-16) var(--dw-space-18) var(--dw-space-18)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-12)',
    WebkitOverflowScrolling: 'touch',
  };

  const introStyle: CSSProperties = {
    margin: 0,
    fontSize: '0.90625rem',
    fontWeight: 500,
    color: C.ink800,
    lineHeight: 1.45,
    letterSpacing: '-0.05px',
  };

  const helpStyle: CSSProperties = {
    margin: 0,
    fontSize: '0.84375rem',
    fontWeight: 500,
    color: C.ink700,
    lineHeight: 1.4,
  };

  const footerStyle: CSSProperties = {
    flex: 'none',
    padding: '12px 18px calc(env(safe-area-inset-bottom, 0px) + 14px)',
    borderTop: `1px solid ${C.hairline}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-8)',
    background: C.cardBg,
  };

  const primaryBtnStyle: CSSProperties = {
    width: '100%',
    minHeight: 52,
    padding: 'var(--dw-space-14) var(--dw-space-16)',
    borderRadius: 14,
    border: 'none',
    background: C.orange500,
    color: 'var(--dw-ink-on-accent)',
    fontFamily: 'inherit',
    fontSize: '1rem',
    fontWeight: 600,
    letterSpacing: '-0.1px',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-cta-primary)',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    transition: reducedMotion ? 'none' : `background var(--dw-m-feedback) ${C.ease}`,
  };

  const secondaryBtnStyle: CSSProperties = {
    width: '100%',
    minHeight: 44,
    padding: 'var(--dw-space-10) var(--dw-space-16)',
    borderRadius: 12,
    border: `1px solid ${C.hairline}`,
    background: C.bgCanvasSoft,
    color: C.ink800,
    fontFamily: 'inherit',
    fontSize: '0.90625rem',
    fontWeight: 600,
    letterSpacing: '-0.05px',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    transition: reducedMotion ? 'none' : `background var(--dw-m-feedback) ${C.ease}`,
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="weather-source-title"
      aria-describedby="weather-source-desc"
      onClick={handleBackdropClick}
      style={dialogStyle}
    >
      <div style={innerSurfaceStyle}>
        <header style={dialogHeaderStyle}>
          <h2 id="weather-source-title" style={titleStyle}>
            {dialogCopy.title}
          </h2>
          <button
            type="button"
            aria-label={dialogCopy.closeAria}
            onClick={() => dialogRef.current?.close()}
            style={closeBtnStyle}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div style={bodyStyle}>
          <p id="weather-source-desc" style={introStyle}>
            {dialogCopy.description}
          </p>
          <p style={helpStyle}>
            {dialogCopy.details}
          </p>
        </div>

        <footer style={footerStyle}>
          <button
            type="button"
            style={primaryBtnStyle}
            onClick={onOpenLink}
            aria-label={dialogCopy.readMoreAria}
            autoFocus
          >
            {dialogCopy.readMore}
          </button>
          <button
            type="button"
            style={secondaryBtnStyle}
            onClick={() => dialogRef.current?.close()}
            aria-label={dialogCopy.closeAria}
          >
            {copy.common.close}
          </button>
        </footer>
      </div>
    </dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RateAppDialog — native <dialog> som forklarer App Store-vurdering FØR vi
// trigger native StoreKit / Play In-App Review via requestAppReview().
// ─────────────────────────────────────────────────────────────────────────────
//
// P2 fra audit: Brukeren bør forstå hva som skjer FØR systemet tar over —
// Apple/Google sin in-app review-prompt er en modal som ikke kan avbrytes
// programmatisk, og hvis vi treffer rate-limit (3/365 på iOS) faller vi
// tilbake til Store-URL i ekstern nettleser. Dialogen er et samtykke-steg.
//
// Speiler resten av Babyora sine dialoger:
//  - native <dialog> + showModal() (focus-trap automatisk)
//  - ESC + .close() + backdrop-click + X-knapp lukker
//  - focus-return til triggerRef (rad-knapp) i 'close'-event
//  - prefers-reduced-motion respekteres (ingen transitions ved reduce)
//  - touch-target ≥44px på CTA + close
//  - norsk språk + meningsfulle aria-label

interface RateAppDialogProps {
  open: boolean;
  pending: boolean;
  reducedMotion: boolean;
  onClose: () => void;
  onConfirm: () => void;
  triggerRef: { current: HTMLElement | null };
}

function RateAppDialog({
  open,
  pending,
  reducedMotion,
  onClose,
  onConfirm,
  triggerRef,
}: RateAppDialogProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const copy = useSettingsSecondaryCopy();
  const dialogCopy = copy.rateApp;

  // Åpne/lukk det native <dialog>-elementet i takt med `open`
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  // Når <dialog> lukkes (ESC, .close(), backdrop) → focus-return + onClose
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const handleClose = () => {
      onClose();
      requestAnimationFrame(() => {
        triggerRef.current?.focus?.();
      });
    };
    dlg.addEventListener('close', handleClose);
    return () => dlg.removeEventListener('close', handleClose);
  }, [onClose, triggerRef]);

  // Backdrop-click → close (klikk skjedde på selve <dialog>, ikke innerSurface)
  const handleBackdropClick = (e: ReactMouseEvent<HTMLDialogElement>) => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (e.target === dlg) {
      dlg.close();
    }
  };

  const dialogStyle: CSSProperties = {
    padding: 0,
    border: `1px solid ${C.hairline}`,
    borderRadius: 22,
    maxWidth: 420,
    width: 'calc(100% - 24px)',
    maxHeight: 'calc(100dvh - 32px)',
    margin: 'auto',
    background: C.cardBg,
    color: C.ink900,
    boxShadow: 'var(--shadow-cta-primary)',
    fontFamily: C.fontSans,
    overflow: 'hidden',
  };

  const innerSurfaceStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100dvh - 32px)',
  };

  const dialogHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--dw-space-12)',
    padding: 'var(--dw-space-16) var(--dw-space-18) var(--dw-space-12)',
    borderBottom: `1px solid ${C.hairline}`,
    flex: 'none',
  };

  const titleStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    margin: 0,
    fontFamily: C.fontSerif,
    fontStyle: 'italic',
    fontWeight: 400,
    fontSize: '1.25rem',
    letterSpacing: '-0.3px',
    color: C.ink900,
    lineHeight: 1.15,
  };

  const closeBtnStyle: CSSProperties = {
    flex: 'none',
    width: 44,
    height: 44,
    borderRadius: 12,
    border: `1px solid ${C.hairline}`,
    background: C.bgCanvasSoft,
    color: C.ink700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    fontFamily: 'inherit',
    fontSize: 20,
    lineHeight: 1,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  };

  const bodyStyle: CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    // D4: bunn-fade sa arket sier at det er mer under — samme oppskrift som
    // .dw-sheet-innhold i sheet.css og resten av appens rulleflater.
    WebkitMaskImage: 'var(--dw-fade-bunn)',
    maskImage: 'var(--dw-fade-bunn)',
    padding: 'var(--dw-space-16) var(--dw-space-18) var(--dw-space-18)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-12)',
    WebkitOverflowScrolling: 'touch',
  };

  const heroStarStyle: CSSProperties = {
    width: 56,
    height: 56,
    borderRadius: 16,
    background: C.orange100,
    color: C.orange700,
    border: `1px solid var(--dw-hairline)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto var(--dw-space-4)',
  };

  const introStyle: CSSProperties = {
    margin: 0,
    fontSize: '0.96875rem',
    fontWeight: 500,
    color: C.ink800,
    lineHeight: 1.45,
    letterSpacing: '-0.05px',
    textAlign: 'center',
  };

  const helpStyle: CSSProperties = {
    margin: 0,
    fontSize: '0.84375rem',
    fontWeight: 500,
    color: C.ink700,
    lineHeight: 1.4,
  };

  const footerStyle: CSSProperties = {
    flex: 'none',
    padding: '12px 18px calc(env(safe-area-inset-bottom, 0px) + 14px)',
    borderTop: `1px solid ${C.hairline}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--dw-space-8)',
    background: C.cardBg,
  };

  const primaryBtnStyle: CSSProperties = {
    width: '100%',
    minHeight: 52,
    padding: 'var(--dw-space-14) var(--dw-space-16)',
    borderRadius: 14,
    border: 'none',
    background: pending ? 'color-mix(in srgb, var(--dw-accent) 40%, var(--dw-canvas))' : C.orange500,
    color: pending ? 'var(--dw-ink-hi)' : 'var(--dw-ink-on-accent)',
    fontFamily: 'inherit',
    fontSize: '1rem',
    fontWeight: 600,
    letterSpacing: '-0.1px',
    cursor: pending ? 'wait' : 'pointer',
    boxShadow: 'var(--shadow-cta-primary)',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    transition: reducedMotion ? 'none' : `background var(--dw-m-feedback) ${C.ease}`,
  };

  const secondaryBtnStyle: CSSProperties = {
    width: '100%',
    minHeight: 44,
    padding: 'var(--dw-space-10) var(--dw-space-16)',
    borderRadius: 12,
    border: `1px solid ${C.hairline}`,
    background: C.bgCanvasSoft,
    color: C.ink800,
    fontFamily: 'inherit',
    fontSize: '0.90625rem',
    fontWeight: 600,
    letterSpacing: '-0.05px',
    cursor: pending ? 'wait' : 'pointer',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    transition: reducedMotion ? 'none' : `background var(--dw-m-feedback) ${C.ease}`,
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="rate-app-title"
      aria-describedby="rate-app-desc"
      onClick={handleBackdropClick}
      style={dialogStyle}
    >
      <div style={innerSurfaceStyle}>
        <header style={dialogHeaderStyle}>
          <h2 id="rate-app-title" style={titleStyle}>
            {dialogCopy.title}
          </h2>
          <button
            type="button"
            aria-label={dialogCopy.closeAria}
            onClick={() => dialogRef.current?.close()}
            style={closeBtnStyle}
            disabled={pending}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div style={bodyStyle}>
          <div style={heroStarStyle} aria-hidden="true">
            <svg
              width={28}
              height={28}
              viewBox="0 0 16 16"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth={0.6}
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M8 2.2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.4l-3.6 1.9.7-4L2.2 6.5l4-.6L8 2.2z" />
            </svg>
          </div>
          <p id="rate-app-desc" style={introStyle}>
            {dialogCopy.description}
          </p>
          <p style={helpStyle}>
            {dialogCopy.details}
          </p>
        </div>

        <footer style={footerStyle}>
          <button
            type="button"
            style={primaryBtnStyle}
            onClick={onConfirm}
            disabled={pending}
            aria-label={dialogCopy.confirmAria}
            autoFocus
          >
            {pending ? dialogCopy.pending : dialogCopy.confirm}
          </button>
          <button
            type="button"
            style={secondaryBtnStyle}
            onClick={() => dialogRef.current?.close()}
            disabled={pending}
            aria-label={dialogCopy.notNowAria}
          >
            {dialogCopy.notNow}
          </button>
        </footer>
      </div>
    </dialog>
  );
}

export default InnstillingerScreen;
