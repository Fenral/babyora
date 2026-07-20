/**
 * OnboardingScreen — F60 prod-port av Mock B (visual + spacious).
 *
 * Kilde-mock: public/onboarding-mock-b/index.html
 *
 * 4 steg + en avsluttende velkomst-skjerm:
 *   1. Navn        — input + babyens navn
 *   2. Bursdag     — dag/mnd/år + auto-beregnet alder i mnd
 *   3. Sted        — geolocation + by + søk manuelt
 *   4. Klar        — sammendrag + edit-knapper
 *   5. Velkomst    — hero + feature-liste (vises etter completeOnboarding)
 *
 * Motor beholdt:
 *  - useChildren().completeOnboarding(...) → persisterer barn i localStorage
 *  - useWeather (kun forhåndsvarming etter location-step, ikke kritisk)
 *  - useHapticSystem (selection/medium/success per step)
 *  - useNativeSettings (reducedMotion = ingen animasjoner)
 *
 * A11y:
 *  - <main> + <h1> per step
 *  - role="progressbar" på dot-progress
 *  - aria-live polite på alder/by-feedback
 *  - aria-label på back/skip/edit
 *  - safe-area-inset top + bottom
 *  - INGEN BottomTabBar (pre-onboarding er full-screen)
 *
 * F80c PROD-PORT til Morgennatt (docs/F80/a11y-preclearance.md + design-tokens.css).
 * Brand-tokens: Morgennatt bg-canvas/ink-ramp + Fraunces (serif) + Schibsted Grotesk
 * (sans) + Granmynte-CTA (var(--accent-cta)/var(--accent-cta-ink), 56px,
 * var(--shadow-cta-primary)) på ob-btn-primary — samme mønster som HjemScreen.
 * Terracotta-stigen (var(--terracotta-*)) er beholdt for ikon/aksent-flater
 * (loc-pin, sum-icon, feat-icon warm/rain, dot-progress, brand-mark, eyebrow) —
 * IKKE for primær-CTA-er, som nå går på Granmynte-grønn.
 * Stylet inline via <style>-blokk for å match mock 1:1 uten å forurense
 * global design-tokens.css utover å konsumere dens var(--...)-tokens.
 */
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from 'react';
import { useChildren } from '../state/children-store';
import { useWeather } from '../hooks/useWeather';
import { useHapticSystem } from '../lib/haptics/system';
import { useNativeSettings } from '../hooks/useNativeSettings';
import { searchCities } from '../data/no-cities';
import { searchAddress } from '../lib/geocode/nominatim';
import { DISCLAIMER_FULL } from '../lib/copy/disclaimer';
import { OnboardingBabyHero } from './onboarding/OnboardingBabyHero';

// ─────────────────────────────────────────────────────────────────────────────
// GSAP stagger-hero (lazy-loaded — kun for intro-step / step 1)
// ─────────────────────────────────────────────────────────────────────────────
//
// Vi lazy-importerer gsap + @gsap/react slik at:
//   1. Bundle på subsequent steps (2-5) ikke betaler GSAP-runtime-prisen
//   2. Første paint av step 1 ikke blokkeres av animasjons-runtime
//
// Komponenten er en ren useGSAP-wrapper som velger refs via data-attributes
// inne i step-1 sub-treet. Den rendrer ingenting selv.
const IntroHeroAnimator = lazy(() =>
  import('./onboarding/IntroHeroAnimator').then((m) => ({ default: m.IntroHeroAnimator })),
);

// ─────────────────────────────────────────────────────────────────────────────
// Konstanter
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_LOCATION = {
  city: 'Trondheim',
  lat: 63.4305,
  lon: 10.3951,
};

const AVATAR_COLOR_DEFAULT = '#C25450';

const MONTHS_NB = [
  'januar', 'februar', 'mars', 'april', 'mai', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'desember',
];

// ─────────────────────────────────────────────────────────────────────────────
// Typer
// ─────────────────────────────────────────────────────────────────────────────

export type OnboardingScreenProps = {
  /** Valgfri callback når onboarding er fullført (etter velkomst-skjerm). */
  onComplete?: () => void;
};

type Step = 1 | 2 | 3 | 4 | 5; // 5 = velkomst (post-complete) → inn i appen (første anbefaling før paywall, R7 Task 7)

type LocationState = {
  city: string;
  lat: number;
  lon: number;
  /** ± meter (visuell estimat — null hvis ikke geolocation) */
  accuracy: number | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toISODate(d: number, m: number, y: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

function isValidDate(d: number, m: number, y: number): boolean {
  if (!Number.isFinite(d) || !Number.isFinite(m) || !Number.isFinite(y)) return false;
  if (y < 2018 || y > new Date().getFullYear() + 1) return false;
  if (m < 1 || m > 12) return false;
  const last = new Date(y, m, 0).getDate();
  if (d < 1 || d > last) return false;
  return true;
}

function ageInMonths(d: number, m: number, y: number): number | null {
  if (!isValidDate(d, m, y)) return null;
  const dob = new Date(y, m - 1, d);
  const now = new Date();
  const months =
    (now.getFullYear() - dob.getFullYear()) * 12 +
    (now.getMonth() - dob.getMonth()) -
    (now.getDate() < dob.getDate() ? 1 : 0);
  return Math.max(0, months);
}

function formatAge(months: number | null): string {
  if (months === null) return '';
  if (months < 1) return 'under 1 mnd';
  if (months < 24) return `${months} mnd`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} år`;
  return `${years} år ${rem} mnd`;
}

function formatDOBLong(d: number, m: number, y: number): string {
  return `${d}. ${MONTHS_NB[m - 1] ?? ''} ${y}`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG-ikoner (inline)
// ─────────────────────────────────────────────────────────────────────────────

const Stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2 as const,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" {...Stroke} aria-hidden="true" focusable="false">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" {...Stroke} strokeWidth={2.4} aria-hidden="true" focusable="false">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" {...Stroke} aria-hidden="true" focusable="false">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" {...Stroke} aria-hidden="true" focusable="false">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" {...Stroke} aria-hidden="true" focusable="false">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" {...Stroke} aria-hidden="true" focusable="false">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" {...Stroke} aria-hidden="true" focusable="false">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" {...Stroke} aria-hidden="true" focusable="false">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" {...Stroke} aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" {...Stroke} aria-hidden="true" focusable="false">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}
function RainIcon() {
  return (
    <svg viewBox="0 0 24 24" {...Stroke} aria-hidden="true" focusable="false">
      <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
      <line x1="8" y1="19" x2="8" y2="21" />
      <line x1="8" y1="13" x2="8" y2="15" />
      <line x1="16" y1="19" x2="16" y2="21" />
      <line x1="16" y1="13" x2="16" y2="15" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="12" y1="15" x2="12" y2="17" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Komponent
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// ObCalendar — månedskalender-datovelger (steg 2). A11y-clearance 2026-07-12:
// vanlige <button> (ikke role=grid), aria-pressed på valgt + aria-current="date"
// på i dag, aria-label = full dato, disabled på fremtid/>3år, måned-tittel
// aria-live, non-color-cues (prikk = valgt, understrek = i dag).
// ─────────────────────────────────────────────────────────────────────────────
const WEEKDAYS_NB = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

function ObCalendar({
  value,
  onSelect,
  today,
}: {
  value: { d: number; m: number; y: number } | null;
  onSelect: (d: number, m: number, y: number) => void;
  today: Date;
}): ReactElement {
  const [view, setView] = useState<Date>(() =>
    value ? new Date(value.y, value.m - 1, 1) : new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const y = view.getFullYear();
  const mo = view.getMonth();
  const minDate = new Date(today.getFullYear() - 3, today.getMonth(), 1);
  const maxView = new Date(today.getFullYear(), today.getMonth(), 1);
  const canPrev = new Date(y, mo, 1) > minDate;
  const canNext = new Date(y, mo, 1) < maxView;
  const lead = (new Date(y, mo, 1).getDay() + 6) % 7; // mandag = 0
  const daysIn = new Date(y, mo + 1, 0).getDate();

  const cells: ReactElement[] = [];
  for (let i = 0; i < lead; i++) cells.push(<span key={`lead-${i}`} className="ob-cal-empty" aria-hidden="true" />);
  for (let d = 1; d <= daysIn; d++) {
    const cur = new Date(y, mo, d);
    const future = cur > today;
    const isSel = !!value && value.d === d && value.m === mo + 1 && value.y === y;
    const isToday = cur.toDateString() === today.toDateString();
    const cls = ['ob-cal-day'];
    if (isSel) cls.push('sel');
    if (isToday) cls.push('today');
    cells.push(
      <button
        key={d}
        type="button"
        className={cls.join(' ')}
        disabled={future}
        aria-pressed={isSel || undefined}
        aria-current={isToday ? 'date' : undefined}
        aria-label={`${d}. ${MONTHS_NB[mo]} ${y}`}
        onClick={() => onSelect(d, mo + 1, y)}
      >
        <span className="ob-cal-num">{d}</span>
      </button>,
    );
  }

  return (
    <div className="ob-cal">
      <div className="ob-cal-head">
        <span className="ob-cal-title" aria-live="polite">{MONTHS_NB[mo]} {y}</span>
        <span className="ob-cal-nav">
          <button type="button" onClick={() => setView(new Date(y, mo - 1, 1))} disabled={!canPrev} aria-label="Forrige måned">‹</button>
          <button type="button" onClick={() => setView(new Date(y, mo + 1, 1))} disabled={!canNext} aria-label="Neste måned">›</button>
        </span>
      </div>
      <div className="ob-cal-grid">
        {WEEKDAYS_NB.map((w) => <span key={w} className="ob-cal-wd" aria-hidden="true">{w}</span>)}
        {cells}
      </div>
    </div>
  );
}

export function OnboardingScreen(props: OnboardingScreenProps): ReactElement {
  const { onComplete } = props;
  const { completeOnboarding } = useChildren();
  const { fire } = useHapticSystem();
  const { reducedMotion } = useNativeSettings();
  // reducedMotion: native Capacitor-flag + prefers-reduced-motion media query.
  // Brukes av IntroHeroAnimator for å sette ende-state direkte i stedet for å
  // animere. Øvrige overganger i screen er CSS-driven og respekterer
  // @media (prefers-reduced-motion: reduce) lenger nede i STYLE_CSS.

  // ─── Step + felt-state ───────────────────────────────────────────────────
  const [step, setStep] = useState<Step>(1);
  const [introMotionPlayed, setIntroMotionPlayed] = useState(false);

  // Scope-ref for GSAP useGSAP() — binder alle selectors til denne subtree-en
  // og lar useGSAP() håndtere ryddig cleanup når step byttes (eller komponent
  // unmountes), per @gsap/react best practice.
  const screenRef = useRef<HTMLElement | null>(null);

  const [name, setName] = useState<string>('');
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const today = useMemo(() => new Date(), []);
  // Ingen forhåndsvalgt dato — bruker må velge i kalenderen (a11y-vilkår: Fortsett
  // disabled til valgt). Kalender-visningen (calView) starter på inneværende måned.
  const [day, setDay] = useState<string>('');
  const [month, setMonth] = useState<string>('');
  const [year, setYear] = useState<string>('');

  const [location, setLocation] = useState<LocationState>({
    city: DEFAULT_LOCATION.city,
    lat: DEFAULT_LOCATION.lat,
    lon: DEFAULT_LOCATION.lon,
    accuracy: null,
  });
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  // Sted-typeahead (full APG-combobox, a11y-clearance 2026-07-12)
  const [showManual, setShowManual] = useState<boolean>(false);
  const [locQuery, setLocQuery] = useState<string>('');
  const [locResults, setLocResults] = useState<Array<{ city: string; lat: number; lon: number }>>([]);
  const [locActive, setLocActive] = useState<number>(-1);
  const locDebounce = useRef<number | null>(null);
  const locReqId = useRef<number>(0);

  // ─── Avledet ─────────────────────────────────────────────────────────────
  const dNum = parseInt(day, 10);
  const mNum = parseInt(month, 10);
  const yNum = parseInt(year, 10);
  const ageM = ageInMonths(dNum, mNum, yNum);
  const dobIsValid = ageM !== null;
  const dobISO = dobIsValid ? toISODate(dNum, mNum, yNum) : '';
  const nameTrim = name.trim();
  const nameOk = nameTrim.length > 0;

  // Forhåndsvarming av vær når vi har location klar (best-effort; ignorer state)
  useWeather(location.lat, location.lon);

  // ─── A11y: fokuser navn-input når step 1 mountes ─────────────────────────
  useEffect(() => {
    if (step === 1) {
      const t = window.setTimeout(() => {
        nameInputRef.current?.focus();
      }, 60);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [step]);

  // ─── Step-navigasjon ─────────────────────────────────────────────────────
  const advanceStep = useCallback((lastStep: Step) => {
    if (step === 1) setIntroMotionPlayed(true);
    setStep((current) => (current < lastStep ? ((current + 1) as Step) : current));
  }, [step]);

  const goNext = useCallback(() => {
    fire('medium').catch(() => {});
    advanceStep(5);
  }, [advanceStep, fire]);

  const goBack = useCallback(() => {
    fire('light').catch(() => {});
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
  }, [fire]);

  const handleIntroMotionDone = useCallback(() => {
    setIntroMotionPlayed(true);
  }, []);

  const goEdit = useCallback(
    (target: Step) => {
      fire('selection').catch(() => {});
      setStep(target);
    },
    [fire],
  );

  // ─── Geolocation ─────────────────────────────────────────────────────────
  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationStatus('error');
      return;
    }
    fire('selection').catch(() => {});
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          city: 'Din posisjon',
          lat: Number(pos.coords.latitude.toFixed(4)),
          lon: Number(pos.coords.longitude.toFixed(4)),
          accuracy: pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null,
        });
        setLocationStatus('ready');
        fire('success').catch(() => {});
      },
      () => {
        setLocationStatus('error');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  }, [fire]);

  // Kalender-valg → setter dag/mnd/år (eksisterende dobISO/ageM-avledning uendret)
  const selectDate = useCallback((d: number, m: number, y: number) => {
    setDay(`${d}`);
    setMonth(`${m}`);
    setYear(`${y}`);
    fire('selection').catch(() => {});
  }, [fire]);

  // Sted-typeahead: lokal by-database (instant) + Nominatim (debounced, hvilket
  // som helst sted). Erstatter det gamle manuelle feltet som beholdt default-
  // koordinater (lokasjon var reelt ødelagt — Sivert 2026-07-11).
  const runLocSearch = useCallback((q: string) => {
    const trimmed = q.trim();
    setLocActive(-1);
    if (trimmed.length < 2) { setLocResults([]); return; }
    // Instant lokale treff
    const local = searchCities(trimmed, 6).map((c) => ({ city: c.name, lat: c.lat, lon: c.lon }));
    setLocResults(local);
    // Debounced Nominatim for steder utenfor by-lista (rate-limit 1/s)
    if (locDebounce.current) window.clearTimeout(locDebounce.current);
    const reqId = ++locReqId.current;
    locDebounce.current = window.setTimeout(() => {
      void searchAddress(trimmed).then((remote) => {
        if (reqId !== locReqId.current) return; // eldre svar — ignorer
        const seen = new Set(local.map((r) => r.city.toLowerCase()));
        const merged = [...local];
        for (const r of remote) {
          const label = r.city ?? r.displayName.split(',')[0];
          if (label && !seen.has(label.toLowerCase())) {
            seen.add(label.toLowerCase());
            merged.push({ city: label, lat: r.lat, lon: r.lon });
          }
        }
        setLocResults(merged.slice(0, 8));
      }).catch(() => { /* offline / rate-limit — behold lokale treff */ });
    }, 450);
  }, []);

  const onLocInput = useCallback((v: string) => {
    setLocQuery(v);
    runLocSearch(v);
  }, [runLocSearch]);

  const pickLocation = useCallback((r: { city: string; lat: number; lon: number }) => {
    setLocation({ city: r.city, lat: r.lat, lon: r.lon, accuracy: null });
    setLocQuery(r.city);
    setLocResults([]);
    setLocActive(-1);
    setShowManual(false);
    fire('selection').catch(() => {});
  }, [fire]);

  const onLocKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!locResults.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setLocActive((i) => (i + 1) % locResults.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setLocActive((i) => (i <= 0 ? locResults.length - 1 : i - 1)); }
    else if (e.key === 'Enter') {
      if (locActive >= 0 && locActive < locResults.length) { e.preventDefault(); pickLocation(locResults[locActive]); }
    } else if (e.key === 'Escape') { setLocResults([]); setLocActive(-1); }
  }, [locResults, locActive, pickLocation]);

  // ─── Skip / Submit / Complete ────────────────────────────────────────────
  const handleSkip = useCallback(() => {
    fire('light').catch(() => {});
    advanceStep(4);
  }, [advanceStep, fire]);

  const handleCompleteOnboarding = useCallback(() => {
    if (!nameOk || !dobIsValid) return;
    completeOnboarding({
      name: nameTrim,
      dob: dobISO,
      city: location.city || DEFAULT_LOCATION.city,
      lat: location.lat,
      lon: location.lon,
      color: AVATAR_COLOR_DEFAULT,
    });
    fire('success').catch(() => {});
    setStep(5); // velkomst-hero
  }, [nameOk, dobIsValid, nameTrim, dobISO, location, completeOnboarding, fire]);

  // R7 Task 7: velkomst-steget (5) tar brukeren rett inn i appen — første
  // ekte anbefaling vises FØR noen paywall. Plus introduseres kontekstuelt
  // inne i appen, ikke som et pre-verdi-steg i onboardingen.
  const handleEnterApp = useCallback(() => {
    fire('medium').catch(() => {});
    onComplete?.();
  }, [fire, onComplete]);

  // ─── A11y: ESC tilbake (kun steg 2-4) ────────────────────────────────────
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' && step > 1 && step < 5) {
        goBack();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, goBack]);

  // ─── Render ──────────────────────────────────────────────────────────────
  const totalSteps = 4;
  const ariaLive: CSSProperties = { position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 };

  return (
    <>
      <style>{STYLE_CSS}</style>
      <main
        ref={screenRef}
        className={`ob-screen${step === 5 ? ' welcome' : ''}${step === 1 ? ' intro-hero' : ''}`}
        aria-labelledby="ob-title"
      >
        {/* GSAP stagger-hero kun for intro-step. Suspense fallback=null:
            initial hero-state er allerede satt via CSS (`.intro-hero [data-hero]`),
            så ingenting "flasher" mens animator-bundlen lastes. Når reducedMotion
            er på hopper IntroHeroAnimator rett til ferdig-state via gsap.set(). */}
        {step === 1 && (
          <Suspense fallback={null}>
            <IntroHeroAnimator scopeRef={screenRef} reducedMotion={reducedMotion} />
          </Suspense>
        )}

        {/* ─── TOP BAR ─── */}
        <div className="ob-topbar">
          {step === 1 || step === 5 ? (
            <button type="button" className="ob-top-back ghost" aria-hidden="true" tabIndex={-1}>
              <ChevronLeft />
            </button>
          ) : (
            <button type="button" className="ob-top-back" onClick={goBack} aria-label="Tilbake">
              <ChevronLeft />
            </button>
          )}

          {step === 5 ? (
            <div className="ob-welcome-brand">
              <div className="ob-brand-mark" aria-hidden="true">B</div>
              <div className="ob-brand-name">Babyora</div>
            </div>
          ) : (
            <div className="ob-top-step">
              Steg <em>{step}</em> av {totalSteps}
            </div>
          )}

          {step === 5 ? (
            <button type="button" className="ob-top-skip" aria-hidden="true" tabIndex={-1} style={{ visibility: 'hidden' }}>·</button>
          ) : step < 4 ? (
            <button type="button" className="ob-top-skip" onClick={handleSkip}>Hopp over</button>
          ) : (
            <button type="button" className="ob-top-skip" aria-hidden="true" tabIndex={-1} style={{ visibility: 'hidden' }}>·</button>
          )}
        </div>

        {/* ─── DOT PROGRESS (skjult i welcome + Pluss-teaser) ─── */}
        {step < 5 && (
          <div
            className="ob-dots"
            data-hero={step === 1 ? 'dots' : undefined}
            role="progressbar"
            aria-valuenow={step}
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-label={`Steg ${step} av ${totalSteps}`}
          >
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                data-hero-dot={step === 1 ? '' : undefined}
                className={`ob-dot${i < step ? ' done' : ''}${i === step ? ' active' : ''}`}
                aria-hidden="true"
              />
            ))}
          </div>
        )}

        {/* ─── BODY ─── */}
        <div className="ob-body">
          {step === 1 && (
            <>
              <OnboardingBabyHero
                reducedMotion={reducedMotion}
                playMotion={!introMotionPlayed}
                onMotionDone={handleIntroMotionDone}
              />

              <div className="ob-copy">
                <p className="ob-eyebrow" data-hero="eyebrow">La oss bli kjent</p>
                <h1 id="ob-title" className="ob-h2" data-hero="title">
                  {/*
                    Manuelt word-wrap: hvert ord får sin egen span med
                    data-hero-word slik at GSAP kan stagger inn ord-for-ord.
                    `display:inline-block` settes via CSS slik at transform
                    fungerer. Mellomrom beholdes som tekst-noder mellom span-ene.
                    Lesbart for SR siden vi ikke deler enkelt-ord opp i bokstaver.
                  */}
                  <span data-hero-word>Hva</span>{' '}
                  <span data-hero-word>heter</span>{' '}
                  <span data-hero-word><em>babyen</em>?</span>
                </h1>
                <p data-hero="lede">Vi bruker navnet for å gi anbefalinger som føles personlige – aldri delt med andre.</p>
              </div>

              <div className="ob-field" data-hero="avatar">
                <label htmlFor="ob-name-input">Babyens navn</label>
                <div className="ob-input-shell">
                  <span className="ob-input-icon" aria-hidden="true"><UserIcon /></span>
                  <input
                    id="ob-name-input"
                    ref={nameInputRef}
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    autoCapitalize="words"
                    placeholder="F.eks. Iver"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && nameOk) goNext();
                    }}
                    aria-describedby="ob-name-hint"
                  />
                </div>
                <div id="ob-name-hint" className="ob-hint">Du kan endre dette senere i innstillinger.</div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="ob-illu" aria-hidden="true">
                <img src="/illustrations/onboarding/onboarding-step2-birthday.png" alt="" />
              </div>

              <div className="ob-copy">
                <p className="ob-eyebrow">Alder</p>
                <h1 id="ob-title" className="ob-h2">
                  Når er {nameTrim || 'babyen'} <em>født</em>?
                </h1>
                <p>Babyens alder styrer hvor mye varme vi anbefaler – og hvilke lag som passer akkurat nå.</p>
              </div>

              <ObCalendar
                value={day !== '' && month !== '' && year !== '' ? { d: dNum, m: mNum, y: yNum } : null}
                onSelect={selectDate}
                today={today}
              />

              <div className="ob-hint ob-hint-center" aria-live="polite">
                {dobIsValid ? (
                  <>
                    {nameTrim || 'Babyen'} er <strong>{formatAge(ageM)}</strong> gammel
                  </>
                ) : (
                  <>Velg fødselsdato i kalenderen</>
                )}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="ob-illu" aria-hidden="true">
                <img src="/illustrations/onboarding/onboarding-step3-location.png" alt="" />
              </div>

              <div className="ob-copy">
                <p className="ob-eyebrow">Hvor bor dere?</p>
                <h1 id="ob-title" className="ob-h2">
                  Vi henter <em>været</em> der dere er
                </h1>
                <p>Posisjonen brukes kun til lokale værvarsler fra MET. Slås av når som helst.</p>
              </div>

              <div className="ob-loc-card">
                <div className="ob-loc-row">
                  <div className="ob-loc-pin" aria-hidden="true"><PinIcon /></div>
                  <div className="ob-loc-id">
                    <div className="ob-loc-city">{location.city}</div>
                    <div className="ob-loc-coord">
                      {location.lat.toFixed(2)}° N · {location.lon.toFixed(2)}° Ø
                      {location.accuracy !== null ? ` · ±${location.accuracy} m` : ''}
                    </div>
                  </div>
                </div>
                <div className="ob-loc-actions">
                  <button type="button" onClick={requestLocation} disabled={locationStatus === 'loading'}>
                    <RefreshIcon />
                    {locationStatus === 'loading' ? 'Henter…' : 'Oppdater'}
                  </button>
                  <button type="button" onClick={() => setShowManual((v) => !v)}>
                    <SearchIcon />
                    Søk by
                  </button>
                </div>

                {showManual && (
                  <div className="ob-manual">
                    <div className="ob-combo">
                      <input
                        type="text"
                        role="combobox"
                        aria-expanded={locResults.length > 0}
                        aria-controls="ob-loc-listbox"
                        aria-activedescendant={locActive >= 0 ? `ob-loc-opt-${locActive}` : undefined}
                        aria-autocomplete="list"
                        aria-label="Søk etter by eller sted"
                        placeholder="Søk, f.eks. Trondheim"
                        value={locQuery}
                        onChange={(e) => onLocInput(e.target.value)}
                        onKeyDown={onLocKeyDown}
                        autoComplete="off"
                      />
                      <ul id="ob-loc-listbox" role="listbox" className="ob-combo-list" aria-label="Steder">
                        {locResults.map((r, i) => (
                          <li
                            key={`${r.city}-${r.lat}`}
                            id={`ob-loc-opt-${i}`}
                            role="option"
                            aria-selected={i === locActive}
                            className={`ob-combo-opt${i === locActive ? ' active' : ''}`}
                            onMouseDown={(e) => { e.preventDefault(); pickLocation(r); }}
                          >
                            <PinIcon /> {r.city}
                          </li>
                        ))}
                        {locQuery.trim().length >= 2 && locResults.length === 0 && (
                          <li className="ob-combo-none" aria-hidden="true">Søker … skriv gjerne mer</li>
                        )}
                      </ul>
                    </div>
                    <div className="ob-sr-only" role="status" aria-live="polite">
                      {locResults.length > 0
                        ? `${locResults.length} ${locResults.length === 1 ? 'treff' : 'treff'}`
                        : locQuery.trim().length >= 2
                          ? 'Ingen treff ennå'
                          : ''}
                    </div>
                  </div>
                )}

                {locationStatus === 'error' && (
                  <div className="ob-loc-error" role="status">
                    Fikk ikke tilgang til posisjon. Skriv inn manuelt eller bruk standard.
                  </div>
                )}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="ob-illu" aria-hidden="true">
                <img src="/illustrations/onboarding/onboarding-step4-ready.png" alt="" />
              </div>

              <div className="ob-copy">
                <p className="ob-eyebrow">Klar til start</p>
                <h1 id="ob-title" className="ob-h2">
                  Alt er <em>klart</em> for {nameTrim || 'babyen'}
                </h1>
                <p>Sjekk gjerne at alt stemmer før vi tar deg til hjem-skjermen.</p>
              </div>

              <ul className="ob-summary" aria-label="Sammendrag">
                <li className="ob-sum-row">
                  <span className="ob-sum-icon" aria-hidden="true"><UserIcon /></span>
                  <div className="ob-sum-text">
                    <span className="ob-sum-label">Navn</span>
                    <span className="ob-sum-value">{nameTrim || '—'}</span>
                  </div>
                  <button className="ob-sum-edit" type="button" onClick={() => goEdit(1)} aria-label="Endre navn">
                    <EditIcon />
                  </button>
                </li>
                <li className="ob-sum-row">
                  <span className="ob-sum-icon" aria-hidden="true"><CalendarIcon /></span>
                  <div className="ob-sum-text">
                    <span className="ob-sum-label">Bursdag</span>
                    <span className="ob-sum-value">
                      {dobIsValid
                        ? `${formatDOBLong(dNum, mNum, yNum)} · ${formatAge(ageM)}`
                        : '—'}
                    </span>
                  </div>
                  <button className="ob-sum-edit" type="button" onClick={() => goEdit(2)} aria-label="Endre bursdag">
                    <EditIcon />
                  </button>
                </li>
                <li className="ob-sum-row">
                  <span className="ob-sum-icon" aria-hidden="true"><PinIcon /></span>
                  <div className="ob-sum-text">
                    <span className="ob-sum-label">Sted</span>
                    <span className="ob-sum-value">{location.city}</span>
                  </div>
                  <button className="ob-sum-edit" type="button" onClick={() => goEdit(3)} aria-label="Endre sted">
                    <EditIcon />
                  </button>
                </li>
              </ul>

              {/* R7 Task 7: eksplisitt lokal-først-forklaring før første bruk. */}
              <p className="ob-hint ob-hint-center">
                Alt lagres lokalt på enheten din. Ingenting sendes til en server,
                og du kan endre det når som helst.
              </p>

              {/* Veiledende-disclaimer (eierbeslutning 2026-07-15). */}
              <p className="ob-hint ob-hint-center">{DISCLAIMER_FULL}</p>
            </>
          )}

          {step === 5 && (
            <>
              <div className="ob-illu hero" aria-hidden="true">
                <img src="/illustrations/onboarding/onboarding-step4-ready.png" alt="" />
              </div>

              <div className="ob-welcome-greet">
                <p className="ob-eyebrow">Velkommen til Babyora</p>
                <h1 id="ob-title" className="ob-h2-hero">
                  Hei <em>{nameTrim || 'der'}</em> — la oss kle deg riktig
                </h1>
                <p>
                  Vi har laget en personlig pakke basert på alder, sted og dagens vær. Du er klar på 3 sekunder.
                </p>
              </div>

              <ul className="ob-feats" aria-label="Det vi gjør for deg">
                <li className="ob-feat">
                  <span className="ob-feat-icon sun" aria-hidden="true"><SunIcon /></span>
                  <div className="ob-feat-text">
                    <div className="ob-feat-title">Tilpasset dagens vær</div>
                    <div className="ob-feat-sub">Henter MET-varsel for {location.city} hver morgen.</div>
                  </div>
                </li>
                <li className="ob-feat">
                  <span className="ob-feat-icon" aria-hidden="true"><LayersIcon /></span>
                  <div className="ob-feat-text">
                    <div className="ob-feat-title">Lag-for-lag forslag</div>
                    <div className="ob-feat-sub">
                      Anbefaler 2–4 lag basert på {nameTrim || 'barnets'} alder og temperatur.
                    </div>
                  </div>
                </li>
                <li className="ob-feat">
                  <span className="ob-feat-icon rain" aria-hidden="true"><RainIcon /></span>
                  <div className="ob-feat-text">
                    <div className="ob-feat-title">Husker hva som funket</div>
                    <div className="ob-feat-sub">Logg "for varmt / passe / for kaldt" – vi lærer over tid.</div>
                  </div>
                </li>
              </ul>
            </>
          )}

        </div>

        {/* sr-only status for screen-readers */}
        <span aria-live="polite" style={ariaLive}>
          {step === 5
            ? 'Onboarding fullført. Velkommen.'
            : `Steg ${step} av ${totalSteps}`}
        </span>

        {/* ─── BOTTOM CTA ─── */}
        <div className="ob-cta-zone">
          {step === 1 && (
            <button
              className="ob-btn-primary"
              data-hero="cta"
              type="button"
              onClick={goNext}
              disabled={!nameOk}
              aria-disabled={!nameOk}
            >
              Fortsett <ChevronRight />
            </button>
          )}

          {step === 2 && (
            <button
              className="ob-btn-primary"
              type="button"
              onClick={goNext}
              disabled={!dobIsValid}
              aria-disabled={!dobIsValid}
            >
              Fortsett <ChevronRight />
            </button>
          )}

          {step === 3 && (
            <>
              <button className="ob-btn-primary" type="button" onClick={goNext}>
                Bruk denne posisjonen <ChevronRight />
              </button>
              <button className="ob-btn-ghost" type="button" onClick={() => setShowManual(true)}>
                Skriv inn manuelt
              </button>
            </>
          )}

          {step === 4 && (
            <button
              className="ob-btn-primary giant"
              type="button"
              onClick={handleCompleteOnboarding}
              disabled={!nameOk || !dobIsValid}
              aria-disabled={!nameOk || !dobIsValid}
            >
              Ta meg til Babyora <ChevronRight />
            </button>
          )}

          {step === 5 && (
            <>
              <button className="ob-btn-primary giant" type="button" onClick={handleEnterApp}>
                Vis dagens antrekk <ChevronRight />
              </button>
              <button className="ob-btn-ghost" type="button" onClick={handleEnterApp}>
                Utforsk på egenhånd
              </button>
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default OnboardingScreen;

// ─────────────────────────────────────────────────────────────────────────────
// Inline CSS — Mock B 1:1
// ─────────────────────────────────────────────────────────────────────────────

const STYLE_CSS = `
.ob-screen{
  /* Mappet til globale design-tokens slik at dark-mode (auto + data-theme="dark")
     cascader inn. Lokale ob-tokens beholdes som alias så all eksisterende CSS
     under fortsatt fungerer 1:1. */
  --ob-bg-canvas:var(--bg-canvas);
  --ob-bg-canvas-soft:var(--bg-canvas-soft);
  --ob-bg-canvas-warm:var(--bg-canvas-warm);
  --ob-surface:var(--surface-soft);
  --ob-surface-raised:var(--surface);
  --ob-terracotta-500:var(--terracotta-500);
  --ob-terracotta-600:var(--terracotta-600);
  --ob-terracotta-700:var(--terracotta-700);
  --ob-terracotta-300:var(--terracotta-200);
  --ob-terracotta-100:var(--terracotta-100);
  --ob-warm-orange:var(--warm-orange-500);
  /* Granmynte-CTA (F80c): primær-knappene bruker samme grønn+ink-par som
     HjemScreen sin CTA, ikke terracotta-stigen (den er nå kun for ikon/aksent). */
  --ob-accent-cta:var(--accent-cta);
  --ob-accent-cta-ink:var(--accent-cta-ink);
  --ob-shadow-cta:var(--shadow-cta);
  --ob-shadow-cta-primary:var(--shadow-cta-primary);
  --ob-ink-900:var(--ink-900);
  --ob-ink-800:var(--ink-800);
  --ob-ink-700:var(--ink-700);
  --ob-ink-500:var(--ink-500);
  --ob-ink-400:var(--ink-400);
  --ob-ink-300:var(--ink-300);
  --ob-ink-200:var(--ink-200);
  --ob-line:var(--ink-100);
  --ob-line-strong:var(--ink-200);
  --ob-shadow-1:var(--shadow-1);
  --ob-shadow-2:var(--shadow-2);
  --ob-shadow-illu:0 24px 60px color-mix(in srgb, var(--chip-edge-korall) 18%, transparent), 0 8px 20px color-mix(in srgb, var(--ink-900) 10%, transparent);
  /* Glow-overlay på illu/welcome-bg: lys i light-mode, transparent i dark
     (overstyres lenger ned). */
  --ob-glow-overlay:color-mix(in srgb, var(--surface-pure) 55%, transparent);
  --ob-glow-overlay-strong:color-mix(in srgb, var(--surface-pure) 65%, transparent);
  --ob-glow-shine:color-mix(in srgb, var(--surface-pure) 65%, transparent);
  --ob-feat-bg:color-mix(in srgb, var(--surface-pure) 50%, transparent);
  --ob-loc-action-bg:var(--ink-100);
  --ob-cta-gradient-stop:color-mix(in srgb, var(--bg-canvas) 92%, transparent);
  --ob-ease-standard:cubic-bezier(.2,.7,.2,1);
  --ob-ease-spring:cubic-bezier(.34,1.32,.64,1);
  --ob-font-sans:var(--font-sans);
  --ob-font-serif:var(--font-serif);

  position:relative;
  display:flex;flex-direction:column;
  min-height:100dvh;
  width:100%;
  overflow-x:hidden;
  font-family:var(--ob-font-sans);
  color:var(--ob-ink-900);
  background:
    radial-gradient(140% 70% at 50% -10%, var(--ob-glow-overlay), transparent 55%),
    radial-gradient(80% 50% at 100% 0%, color-mix(in srgb, var(--ob-terracotta-500) 10%, transparent), transparent 60%),
    var(--ob-bg-canvas);
  /* F83 M2: max()-gulv — WKWebView rapporterer env()≈0 (HjemScreen F80.3). */
  padding-top:max(50px, calc(env(safe-area-inset-top, 0px) + 12px));
  padding-bottom:calc(env(safe-area-inset-bottom, 0px) + 0px);
  box-sizing:border-box;
}
.ob-screen.welcome{
  background:
    radial-gradient(140% 70% at 50% -10%, var(--ob-glow-overlay-strong), transparent 55%),
    radial-gradient(80% 60% at 100% 100%, color-mix(in srgb, var(--ob-terracotta-600) 12%, transparent), transparent 60%),
    radial-gradient(70% 40% at 0% 0%, color-mix(in srgb, var(--ob-terracotta-500) 14%, transparent), transparent 60%),
    var(--ob-bg-canvas);
}

/* Dark-mode override — bytte ut hvit-overlays mot varme krem-toner og dempe
   shine/feat-bg/action-bg slik at de fungerer mot mørk warm-grey canvas. */
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]) .ob-screen{
    --ob-glow-overlay:color-mix(in srgb, var(--ink-900) 8%, transparent);
    --ob-glow-overlay-strong:color-mix(in srgb, var(--ink-900) 10%, transparent);
    --ob-glow-shine:color-mix(in srgb, var(--ink-900) 10%, transparent);
    --ob-feat-bg:color-mix(in srgb, var(--ink-900) 5%, transparent);
    --ob-loc-action-bg:color-mix(in srgb, var(--ink-900) 6%, transparent);
    --ob-cta-gradient-stop:color-mix(in oklab, var(--bg-canvas) 88%, transparent);
    --ob-shadow-illu:0 24px 60px color-mix(in srgb, black 55%, transparent), 0 8px 20px color-mix(in srgb, black 40%, transparent);
  }
}
:root[data-theme="dark"] .ob-screen{
  --ob-glow-overlay:color-mix(in srgb, var(--ink-900) 8%, transparent);
  --ob-glow-overlay-strong:color-mix(in srgb, var(--ink-900) 10%, transparent);
  --ob-glow-shine:color-mix(in srgb, var(--ink-900) 10%, transparent);
  --ob-feat-bg:color-mix(in srgb, var(--ink-900) 5%, transparent);
  --ob-loc-action-bg:color-mix(in srgb, var(--ink-900) 6%, transparent);
  --ob-cta-gradient-stop:color-mix(in oklab, var(--bg-canvas) 88%, transparent);
  --ob-shadow-illu:0 24px 60px color-mix(in srgb, black 55%, transparent), 0 8px 20px color-mix(in srgb, black 40%, transparent);
}
.ob-screen *,.ob-screen *::before,.ob-screen *::after{box-sizing:border-box}

/* ── TOP BAR ── */
.ob-screen > .ob-topbar{
  flex:none;display:flex;align-items:center;justify-content:space-between;
  padding:4px 22px 8px;min-height:40px;
}
.ob-top-back{
  width:40px;height:40px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  background:var(--ob-glow-shine);border:1px solid var(--ob-line);
  color:var(--ob-ink-700);cursor:pointer;
  -webkit-tap-highlight-color:transparent;
}
.ob-top-back svg{width:18px;height:18px;}
.ob-top-back.ghost{visibility:hidden;}
.ob-top-step{
  font-family:var(--ob-font-sans);font-size:11.5px;font-weight:600;
  letter-spacing:1.4px;text-transform:uppercase;color:var(--ob-ink-500);
}
.ob-top-step em{font-style:normal;color:var(--ob-terracotta-700);}
.ob-top-skip{
  font-family:var(--ob-font-sans);font-size:13.5px;font-weight:600;
  color:var(--ob-ink-500);background:transparent;border:none;cursor:pointer;
  padding:8px 6px;-webkit-tap-highlight-color:transparent;
}

/* Welcome brand */
.ob-welcome-brand{
  display:flex;flex-direction:column;align-items:center;gap:6px;
}
.ob-brand-mark{
  width:48px;height:48px;border-radius:14px;
  background:linear-gradient(160deg, var(--ob-terracotta-500), var(--ob-terracotta-700));
  color:var(--surface-pure);display:flex;align-items:center;justify-content:center;
  font-family:var(--ob-font-serif);font-size:24px;line-height:1;
  box-shadow:0 6px 16px color-mix(in srgb, var(--chip-edge-korall) 32%, transparent), inset 0 -2px 0 color-mix(in srgb, black 15%, transparent);
}
.ob-brand-name{
  font-family:var(--ob-font-serif);font-size:14px;color:var(--ob-ink-700);
  letter-spacing:.4px;
}

/* ── DOT PROGRESS ── */
.ob-screen > .ob-dots{
  flex:none;display:flex;justify-content:center;align-items:center;gap:8px;
  padding:8px 24px 4px;
}
.ob-dot{
  width:8px;height:8px;border-radius:50%;
  background:var(--ob-ink-300);
  transition:all .35s var(--ob-ease-spring);
}
.ob-dot.done{background:var(--ob-terracotta-300);}
.ob-dot.active{
  width:30px;border-radius:999px;
  background:var(--ob-terracotta-600);
}

/* ── BODY ── */
.ob-screen > .ob-body{
  flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;
  padding:6px 28px 0;
  display:flex;flex-direction:column;
  -webkit-overflow-scrolling:touch;
}
.ob-body::-webkit-scrollbar{display:none;}

/* ── ILLUSTRATION ── */
.ob-baby-hero{
  flex:none;margin:10px auto 0;
  width:min(100%, 300px);aspect-ratio:1;
  position:relative;isolation:isolate;overflow:hidden;
  border-radius:36px;
  background:#eee9f3;
  border:1px solid var(--ob-line);
  box-shadow:var(--ob-shadow-illu);
}
.ob-baby-media{
  position:absolute;inset:0;width:100%;height:100%;
  object-fit:cover;display:block;pointer-events:none;
  user-select:none;-webkit-user-drag:none;
}
.ob-baby-poster{z-index:0;}
.ob-baby-video{z-index:1;}
.ob-baby-wordmark{
  position:absolute;z-index:3;top:7%;left:14px;right:14px;
  font-family:var(--ob-font-serif);font-size:clamp(32px, 9vw, 40px);
  font-weight:400;line-height:1;letter-spacing:-.7px;text-align:center;
  color:#2d2438;
  text-shadow:0 1px 18px rgba(255,255,255,.78);
  pointer-events:none;
}
.ob-baby-frame{
  position:absolute;z-index:2;inset:0;pointer-events:none;
  border-radius:inherit;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.42);
  background:
    linear-gradient(180deg, rgba(255,255,255,.13), transparent 28%),
    radial-gradient(90% 42% at 50% 104%, rgba(35,27,50,.1), transparent 70%);
}

.ob-illu{
  flex:none;margin:10px auto 0;
  width:100%;max-width:300px;aspect-ratio:1/1;
  border-radius:36px;
  background:
    radial-gradient(130% 90% at 30% 20%, color-mix(in srgb, var(--ob-terracotta-500) 16%, transparent), transparent 60%),
    radial-gradient(120% 100% at 100% 100%, color-mix(in srgb, var(--ob-terracotta-600) 10%, transparent), transparent 60%),
    linear-gradient(160deg, var(--ob-surface-raised) 0%, var(--ob-surface) 65%, var(--ob-bg-canvas-warm) 100%);
  border:1px solid var(--ob-line);
  box-shadow:var(--ob-shadow-illu);
  overflow:hidden;
  display:flex;align-items:center;justify-content:center;
  position:relative;
}
.ob-illu::after{
  content:"";position:absolute;inset:0;
  background:radial-gradient(circle at 18% 18%, var(--ob-glow-overlay-strong), transparent 38%);
  pointer-events:none;
}
.ob-illu img{
  width:108%;height:108%;object-fit:cover;
  transform:translateY(-1%);
  filter:saturate(1.02) contrast(1.01);
  position:relative;z-index:1;
}
.ob-illu.hero{
  max-width:340px;aspect-ratio:1/1.02;
  border-radius:48px;
  box-shadow:0 32px 70px color-mix(in srgb, var(--chip-edge-korall) 22%, transparent), 0 12px 24px color-mix(in srgb, var(--ink-900) 12%, transparent);
  margin-top:18px;
}

/* ── COPY ── */
.ob-copy{
  flex:none;margin-top:26px;
  display:flex;flex-direction:column;gap:10px;
  text-align:center;
}
.ob-eyebrow{
  font-family:var(--ob-font-sans);font-size:11.5px;font-weight:700;
  letter-spacing:1.6px;text-transform:uppercase;color:var(--ob-terracotta-600);
  margin:0;
}
.ob-h2{
  font-family:var(--ob-font-serif);font-weight:400;
  font-size:34px;line-height:1.08;letter-spacing:-.5px;
  color:var(--ob-ink-900);margin:0;
  text-wrap:balance;
}
.ob-h2 em{font-style:italic;color:var(--ob-terracotta-700);}
.ob-h2-hero{
  font-family:var(--ob-font-serif);font-weight:400;
  font-size:40px;line-height:1.02;letter-spacing:-.7px;
  color:var(--ob-ink-900);margin:0;text-wrap:balance;
}
.ob-h2-hero em{font-style:italic;color:var(--ob-terracotta-700);}
.ob-copy p, .ob-welcome-greet p{
  font-family:var(--ob-font-sans);font-size:15px;line-height:1.5;
  color:var(--ob-ink-700);margin:0;
  max-width:310px;margin-inline:auto;
  text-wrap:pretty;
}

.ob-welcome-greet{
  flex:none;margin-top:22px;text-align:center;
  display:flex;flex-direction:column;gap:12px;
}

/* ── INPUT ── */
.ob-field{
  flex:none;margin-top:22px;
  display:flex;flex-direction:column;gap:8px;
}
.ob-field label{
  font-size:11.5px;font-weight:700;letter-spacing:1.2px;
  text-transform:uppercase;color:var(--ob-ink-500);
  padding-left:4px;
}
.ob-input-shell{
  position:relative;display:flex;align-items:center;
  background:var(--ob-surface-raised);
  border:1.5px solid var(--ob-terracotta-600);
  border-radius:18px;padding:16px 18px;
  box-shadow:0 0 0 4px color-mix(in srgb, var(--ob-terracotta-600) 10%, transparent), var(--ob-shadow-1);
  transition:box-shadow .2s var(--ob-ease-standard);
}
.ob-input-icon{
  flex:none;display:flex;width:22px;height:22px;color:var(--ob-terracotta-600);margin-right:12px;
}
.ob-input-icon svg{width:22px;height:22px;}
.ob-input-shell input{
  flex:1;font:inherit;font-size:18px;font-weight:500;color:var(--ob-ink-900);
  background:transparent;border:none;outline:none;width:100%;
  letter-spacing:-.1px;
}
.ob-input-shell input::placeholder{color:var(--ob-ink-400);font-weight:400;}
.ob-hint{
  font-size:12.5px;color:var(--ob-ink-500);
  padding-left:4px;
}
.ob-hint-center{
  text-align:center;margin-top:14px;padding-left:0;font-size:13px;
}
.ob-hint-center strong{color:var(--ob-terracotta-700);font-weight:700;}

/* ── DATE GRID ── */
.ob-date-grid{
  display:grid;grid-template-columns:1fr 1fr 1.4fr;gap:10px;
  margin-top:22px;
}
.ob-date-cell{display:flex;flex-direction:column;gap:6px;}
.ob-date-cell label{
  font-size:10.5px;font-weight:700;letter-spacing:1.2px;
  text-transform:uppercase;color:var(--ob-ink-500);
  padding-left:4px;
}
.ob-date-input{
  display:flex;align-items:center;justify-content:center;
  background:var(--ob-surface-raised);
  border:1.5px solid var(--ob-line-strong);
  border-radius:16px;padding:18px 8px;
  font-family:var(--ob-font-serif);font-size:24px;color:var(--ob-ink-900);
  line-height:1;letter-spacing:-.3px;
  box-shadow:var(--ob-shadow-1);
  text-align:center;width:100%;outline:none;
  appearance:none;-moz-appearance:textfield;
}
.ob-date-input::-webkit-outer-spin-button,
.ob-date-input::-webkit-inner-spin-button{ -webkit-appearance:none;margin:0; }
.ob-date-input.filled{
  border-color:var(--ob-terracotta-600);
  background:var(--surface-pure);
  box-shadow:0 0 0 4px color-mix(in srgb, var(--ob-terracotta-600) 8%, transparent), var(--ob-shadow-1);
}
.ob-date-input:focus-visible{
  border-color:var(--ob-terracotta-600);
  box-shadow:0 0 0 4px color-mix(in srgb, var(--ob-terracotta-600) 18%, transparent), var(--ob-shadow-1);
}

/* ── LOCATION CARD ── */
.ob-loc-card{
  margin-top:22px;display:flex;flex-direction:column;gap:18px;
  padding:22px;border-radius:24px;
  background:var(--ob-surface-raised);
  border:1px solid var(--ob-line);
  box-shadow:var(--ob-shadow-2);
}
.ob-loc-row{display:flex;align-items:center;gap:14px;}
.ob-loc-pin{
  flex:none;width:48px;height:48px;border-radius:50%;
  background:var(--ob-terracotta-100);color:var(--ob-terracotta-700);
  display:flex;align-items:center;justify-content:center;
  box-shadow:inset 0 -2px 4px color-mix(in srgb, var(--chip-edge-korall) 8%, transparent);
}
.ob-loc-pin svg{width:22px;height:22px;}
.ob-loc-id{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0;}
.ob-loc-city{
  font-family:var(--ob-font-serif);font-size:22px;color:var(--ob-ink-900);
  line-height:1.05;letter-spacing:-.2px;
}
.ob-loc-coord{font-size:12.5px;font-weight:500;color:var(--ob-ink-500);letter-spacing:.1px;}
.ob-loc-actions{display:flex;gap:8px;}
.ob-loc-actions button{
  flex:1;display:flex;align-items:center;justify-content:center;gap:6px;
  padding:11px 8px;border-radius:12px;
  font:inherit;font-size:13px;font-weight:600;color:var(--ob-ink-700);
  background:var(--ob-loc-action-bg);border:1px solid var(--ob-line);cursor:pointer;
  -webkit-tap-highlight-color:transparent;
}
.ob-loc-actions button:disabled{opacity:.5;cursor:not-allowed;}
.ob-loc-actions button svg{width:14px;height:14px;}
.ob-manual{
  display:flex;gap:8px;align-items:stretch;
  padding-top:4px;
}
.ob-manual input{
  flex:1;font:inherit;font-size:14px;color:var(--ob-ink-900);
  background:var(--surface-pure);border:1px solid var(--ob-line-strong);border-radius:10px;
  padding:10px 12px;outline:none;
}
.ob-manual input:focus-visible{border-color:var(--ob-terracotta-600);box-shadow:0 0 0 3px color-mix(in srgb, var(--ob-terracotta-600) 15%, transparent);}
.ob-manual button{
  font:inherit;font-size:13px;font-weight:600;color:var(--surface-pure);
  background:var(--ob-terracotta-500);border:none;border-radius:10px;
  padding:10px 14px;cursor:pointer;
}
.ob-manual button:disabled{opacity:.5;cursor:not-allowed;}
.ob-loc-error{
  font-size:12.5px;color:var(--ob-terracotta-700);
  padding:8px 12px;border-radius:10px;
  background:color-mix(in srgb, var(--ob-terracotta-600) 8%, transparent);
}

/* ── KALENDER (steg 2) ── */
.ob-cal{
  background:var(--surface-pure);border:1px solid var(--ob-line);
  border-radius:20px;padding:14px 14px 16px;margin-top:4px;
  box-shadow:var(--ob-shadow-1);
}
.ob-cal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
.ob-cal-title{font-family:var(--font-serif);font-weight:560;font-size:17px;color:var(--ob-ink-900);}
.ob-cal-nav{display:flex;gap:8px;}
.ob-cal-nav button{
  width:38px;height:38px;border-radius:11px;border:1px solid var(--ob-line-strong);
  background:var(--ob-surface);color:var(--ob-ink-900);font-size:18px;line-height:1;
  cursor:pointer;display:grid;place-items:center;
}
.ob-cal-nav button:disabled{opacity:.35;cursor:default;}
.ob-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;}
.ob-cal-wd{font-size:11px;font-weight:700;letter-spacing:.02em;color:var(--ob-ink-700);
  text-align:center;padding:4px 0 6px;text-transform:uppercase;}
.ob-cal-empty{min-height:40px;}
.ob-cal-day{
  aspect-ratio:1;min-height:40px;border:none;background:none;font:inherit;font-size:14px;
  color:var(--ob-ink-900);border-radius:11px;cursor:pointer;display:grid;place-items:center;
  position:relative;
}
.ob-cal-day:disabled{color:var(--ob-line-strong);cursor:default;}
.ob-cal-day.sel{background:var(--ob-accent-cta);}
.ob-cal-day.sel .ob-cal-num{color:var(--ob-accent-cta-ink);font-weight:700;}
/* non-color-cue for VALGT: liten prikk under tallet (redundant med grønt fyll) */
.ob-cal-day.sel::after{content:"";position:absolute;bottom:5px;left:50%;transform:translateX(-50%);
  width:4px;height:4px;border-radius:50%;background:var(--ob-accent-cta-ink);}
/* I DAG: terrakotta-ring + non-color-cue (understreket tall) */
.ob-cal-day.today{box-shadow:inset 0 0 0 1.5px var(--ob-terracotta-600);}
.ob-cal-day.today .ob-cal-num{text-decoration:underline;text-underline-offset:2px;}
.ob-cal-day.sel.today{box-shadow:inset 0 0 0 1.5px var(--ob-accent-cta-ink);}

/* ── STED-COMBOBOX (steg 3, APG-typeahead) ── */
.ob-manual{flex-direction:column;align-items:stretch;}
.ob-combo{position:relative;width:100%;}
.ob-combo input{
  width:100%;font:inherit;font-size:14px;color:var(--ob-ink-900);
  background:var(--surface-pure);border:1px solid var(--ob-line-strong);border-radius:10px;
  padding:11px 12px;outline:none;box-sizing:border-box;
}
.ob-combo input:focus-visible{border-color:var(--ob-terracotta-600);
  box-shadow:0 0 0 3px color-mix(in srgb, var(--ob-terracotta-600) 15%, transparent);}
.ob-combo-list{list-style:none;margin:6px 0 0;padding:5px;background:var(--surface-pure);
  border:1px solid var(--ob-line);border-radius:14px;box-shadow:var(--ob-shadow-2, var(--ob-shadow-1));
  max-height:230px;overflow-y:auto;}
.ob-combo-list:empty{display:none;}
.ob-combo-opt{display:flex;align-items:center;gap:9px;padding:11px 10px;border-radius:9px;
  font-size:14px;color:var(--ob-ink-900);cursor:pointer;}
.ob-combo-opt.active,.ob-combo-opt:hover{background:var(--ob-surface);}
.ob-combo-opt svg{width:15px;height:15px;opacity:.7;flex:none;}
.ob-combo-none{padding:11px 10px;font-size:13px;color:var(--ob-ink-700);}
.ob-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;
  clip:rect(0 0 0 0);white-space:nowrap;border:0;}

/* ── SUMMARY ── */
.ob-summary{
  margin:22px 0 0;padding:0;list-style:none;
  display:flex;flex-direction:column;
  background:var(--ob-surface);border:1px solid var(--ob-line);
  border-radius:22px;overflow:hidden;
  box-shadow:var(--ob-shadow-1);
}
.ob-sum-row{
  display:flex;align-items:center;gap:14px;
  padding:16px 18px;min-height:62px;
}
.ob-sum-row + .ob-sum-row{border-top:1px solid var(--ob-line);}
.ob-sum-icon{
  flex:none;width:38px;height:38px;border-radius:12px;
  background:var(--ob-terracotta-100);color:var(--ob-terracotta-700);
  display:flex;align-items:center;justify-content:center;
}
.ob-sum-icon svg{width:18px;height:18px;}
.ob-sum-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
.ob-sum-label{
  font-size:11px;font-weight:700;letter-spacing:1px;
  text-transform:uppercase;color:var(--ob-ink-500);
}
.ob-sum-value{
  font-family:var(--ob-font-serif);font-size:18px;color:var(--ob-ink-900);
  line-height:1.1;letter-spacing:-.2px;
}
.ob-sum-edit{
  flex:none;width:34px;height:34px;border-radius:50%;
  background:transparent;border:1px solid var(--ob-line-strong);
  color:var(--ob-ink-500);display:flex;align-items:center;justify-content:center;
  cursor:pointer;-webkit-tap-highlight-color:transparent;
}
.ob-sum-edit svg{width:14px;height:14px;}

/* ── WELCOME FEATS ── */
.ob-feats{
  margin:22px 0 0;padding:0;list-style:none;
  display:flex;flex-direction:column;gap:12px;
}
.ob-feat{
  display:flex;align-items:center;gap:14px;
  padding:14px 16px;border-radius:18px;
  background:var(--ob-feat-bg);
  border:1px solid var(--ob-line);
}
.ob-feat-icon{
  flex:none;width:42px;height:42px;border-radius:13px;
  display:flex;align-items:center;justify-content:center;
  background:var(--ob-terracotta-100);color:var(--ob-terracotta-700);
  box-shadow:inset 0 -2px 4px color-mix(in srgb, var(--chip-edge-korall) 8%, transparent);
}
.ob-feat-icon.sun{background:color-mix(in srgb, var(--status-warm) 16%, var(--surface-pure)); color:var(--status-warm);}
.ob-feat-icon.rain{background:color-mix(in srgb, var(--status-cold) 16%, var(--surface-pure)); color:var(--status-cold);}
.ob-feat-icon svg{width:20px;height:20px;}
.ob-feat-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
.ob-feat-title{font-size:14.5px;font-weight:600;color:var(--ob-ink-900);line-height:1.2;}
.ob-feat-sub{font-size:12.5px;color:var(--ob-ink-500);line-height:1.3;}

/* ── CTA ZONE ── */
.ob-screen > .ob-cta-zone{
  flex:none;
  padding:18px 24px calc(env(safe-area-inset-bottom, 0px) + 28px);
  display:flex;flex-direction:column;gap:10px;
  background:linear-gradient(180deg, transparent 0%, var(--ob-cta-gradient-stop) 30%, var(--ob-bg-canvas) 60%);
}
/* Granmynte-CTA-mønster (F80c, jf. HjemScreen): var(--accent-cta) + accent-cta-ink,
   var(--shadow-cta-primary). Terracotta-stigen er nå kun for ikon/aksent-flater
   (loc-pin, sum-icon, feat-icon, brand-mark), ikke for primær-CTA-er. */
.ob-btn-primary{
  width:100%;min-height:56px;
  display:flex;align-items:center;justify-content:center;gap:10px;
  padding:16px 20px;border-radius:18px;
  background:var(--ob-accent-cta);color:var(--ob-accent-cta-ink);
  font-family:var(--ob-font-sans);font-size:16px;font-weight:700;letter-spacing:.1px;
  border:none;cursor:pointer;
  box-shadow:var(--ob-shadow-cta-primary);
  transition:transform .18s var(--ob-ease-spring), box-shadow .18s var(--ob-ease-standard);
  -webkit-tap-highlight-color:transparent;
}
.ob-btn-primary:active{
  transform:translateY(1px);
  box-shadow:var(--ob-shadow-cta);
}
.ob-btn-primary:disabled,.ob-btn-primary[aria-disabled="true"]{
  opacity:.55;cursor:not-allowed;transform:none;
  box-shadow:var(--ob-shadow-cta);
}
.ob-btn-primary svg{width:18px;height:18px;}
.ob-btn-primary.giant{min-height:64px;font-size:17px;border-radius:22px;}

.ob-btn-ghost{
  width:100%;min-height:46px;
  display:flex;align-items:center;justify-content:center;gap:6px;
  background:transparent;border:none;
  font-family:var(--ob-font-sans);font-size:14px;font-weight:600;color:var(--ob-ink-500);
  cursor:pointer;letter-spacing:.1px;
  -webkit-tap-highlight-color:transparent;
}

/* Focus visibility — Morgennatt-fokusring (samme token som HjemScreen). */
.ob-screen :focus-visible{
  outline:2.5px solid var(--focus-ring, var(--accent-cta));
  outline-offset:2px;border-radius:8px;
}

/* ── INTRO-HERO (step 1, GSAP stagger-entrance) ──
   VIKTIG (bugfiks 2026-07-11): hero-innholdet er SYNLIG som default. Den
   skjulte fra-tilstanden settes av IntroHeroAnimator via gsap.set() rett før
   timeline-en (useGSAP kjører i useLayoutEffect → før paint, ingen flash når
   GSAP er lastet). Tidligere satte CSS opacity:0 som default og lot GSAP
   være ENESTE vei til synlig — hvis GSAP var treg/feilet/aldri mountet ble
   steg 1 permanent blankt. Nå viser skjermen alltid innhold, uansett GSAP.

   Word-spans inne i .ob-h2: display:inline-block kreves for at GSAP translateY
   skal virke på span. */
.ob-screen.intro-hero .ob-h2 [data-hero-word]{
  display:inline-block;
}

/* Reduced-motion: drep alle overganger/animasjoner. IntroHeroAnimator setter
   uansett ende-state direkte (ingen skjuling) under reducedMotion. */
@media (prefers-reduced-motion: reduce){
  .ob-screen *,.ob-screen *::before,.ob-screen *::after{
    transition:none !important;animation:none !important;
  }
}
`;
