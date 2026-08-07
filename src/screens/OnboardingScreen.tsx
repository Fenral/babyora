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
import { searchCities } from '../data/no-cities';
import { searchAddress } from '../lib/geocode/nominatim';
import { DISCLAIMER_FULL } from '../lib/copy/disclaimer';
import { OnboardingBabyHero } from './onboarding/OnboardingBabyHero';

// ─────────────────────────────────────────────────────────────────────────────
// Konstanter
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_LOCATION = {
  city: 'Trondheim',
  lat: 63.4305,
  lon: 10.3951,
};

const AVATAR_COLOR_DEFAULT = '#C25450';

/**
 * P10/JOB5 (2026-08-01, docs/mocks/monter/onboarding-steg1-v2.html): the
 * STANDING Monter mascot for onboarding — feet resting on the step-1 card's
 * top edge. NOT the old lilac sitting-doll illustration (OnboardingBabyHero
 * — still used for steps 2-4/5's smaller "compact"/"welcome" chip, now
 * pointed at this same asset, see OnboardingBabyHero.tsx), and NOT the
 * hanging pose (`MascotPeek`/hjm-mascot — reserved for the Hjem panel).
 */
const MASCOT_STANDING_SRC = `${import.meta.env.BASE_URL}monter/maskot-staaende-cut-360.webp`;

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
export function OnboardingScreen(props: OnboardingScreenProps): ReactElement {
  const { onComplete } = props;
  const { completeOnboarding } = useChildren();
  const { fire } = useHapticSystem();
  /* `reducedMotion` er borte herfra 2026-08-07: den styrte KUN den korte
     babyvideoen, som aldri spilte og nå er arkivert. Skjermens øvrige
     bevegelse er CSS-overganger, og de respekterer
     `prefers-reduced-motion` i stylesheetet — ikke via denne kroken.
     Kommer det animasjon som må gates i JS, hentes den inn igjen. */

  // ─── Step + felt-state ───────────────────────────────────────────────────
  const [step, setStep] = useState<Step>(1);

  const [name, setName] = useState<string>('');

  const today = useMemo(() => new Date(), []);
  // Ingen forhåndsvalgt dato. iOS/Android får bruke sin egen, kjente datovelger.
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
  const [locationConfirmed, setLocationConfirmed] = useState(false);
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
  const todayISO = toISODate(today.getDate(), today.getMonth() + 1, today.getFullYear());
  const earliestDob = useMemo(() => {
    const min = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
    return toISODate(min.getDate(), min.getMonth() + 1, min.getFullYear());
  }, [today]);
  const nameTrim = name.trim();
  const nameOk = nameTrim.length > 0;

  // Forhåndsvarming av vær når vi har location klar (best-effort; ignorer state)
  useWeather(location.lat, location.lon);

  // ─── Step-navigasjon ─────────────────────────────────────────────────────
  const advanceStep = useCallback((lastStep: Step) => {
    setStep((current) => (current < lastStep ? ((current + 1) as Step) : current));
  }, []);

  const goNext = useCallback(() => {
    fire('medium').catch(() => {});
    advanceStep(5);
  }, [advanceStep, fire]);

  const goBack = useCallback(() => {
    fire('light').catch(() => {});
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
  }, [fire]);

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
        setLocationConfirmed(true);
        fire('success').catch(() => {});
      },
      () => {
        setLocationStatus('error');
        setShowManual(true);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  }, [fire]);

  const selectDate = useCallback((isoDate: string) => {
    const [y, m, d] = isoDate.split('-');
    setDay(d ?? '');
    setMonth(m ?? '');
    setYear(y ?? '');
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
    setLocationStatus('ready');
    setLocationConfirmed(true);
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

  const handleCompleteOnboarding = useCallback(() => {
    if (!nameOk || !dobIsValid || !locationConfirmed) return;
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
  }, [nameOk, dobIsValid, locationConfirmed, nameTrim, dobISO, location, completeOnboarding, fire]);

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
        className={`ob-screen step-${step}${step === 5 ? ' welcome' : ''}${step === 1 ? ' intro-hero' : ''}`}
        aria-labelledby="ob-title"
      >
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

          <div className="ob-top-center">
            {/* P10.1 (judge finding D3): the contract's `.top` section
                (docs/mocks/monter/onboarding-steg1-v2.html) always shows the
                BABYORA brand row — it was previously suppressed on step 1
                entirely. Step 1 gets the mock's own micro-brand treatment
                (13px/700/0.24em tracking, uppercase); steps 2-4/5 keep their
                existing larger serif wordmark unchanged. */}
            {step === 1 && <span className="ob-s1-brand">BABYORA</span>}
            {step !== 1 && <span className="ob-top-brand">Babyora</span>}
          </div>

          <span className="ob-top-spacer" aria-hidden="true" />
        </div>

        {/* P10/JOB5: segment-bar ALENE — den forrige "N av 4"-tekstlinjen
            (over) var en duplikat av akkurat denne informasjonen. Amber
            KUN på det aktive segmentet (docs/mocks/monter/
            onboarding-steg1-v2.html: kun segment[0] får .done ved steg 1),
            ikke en akkumulerende "fullført"-fylling. */}
        {step < 5 && (
          <div
            className="ob-seg-progress"
            role="progressbar"
            aria-valuenow={step}
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-label={`Steg ${step} av ${totalSteps}`}
          >
            {Array.from({ length: totalSteps }, (_, i) => (
              <i key={i} className={i === step - 1 ? 'active' : ''} aria-hidden="true" />
            ))}
          </div>
        )}

        {/* ─── BODY ─── */}
        <div className="ob-body">
          {step === 1 && (
            <>
              {/* P10/JOB5 v2 re-skin (docs/mocks/monter/onboarding-steg1-v2.html
                  + sol-duel-2026-07-31.md §11, owner-confirmed 2026-08-01):
                  standing mascot with feet resting on the card's top edge,
                  ONE raised card holding headline+field+preview (not the old
                  bare-canvas hero+copy+field stack).
                  P10.1 (judge finding D2): mascot+card now share an explicit
                  DOCKING container (`.ob-s1-hero`, `position:relative` +
                  `display:flow-root` so the card's own margin-top can never
                  collapse THROUGH the wrapper into the page flow — the exact
                  bug class hjem-monter.css's own history warns about, "grepet
                  gled fra kanten via margin-kollaps gjennom det tomme
                  ankeret") instead of the previous bare negative-margin
                  overlap (-50px — deep enough to nearly touch the H1). */}
              <div className="ob-s1-hero">
                <img
                  className="ob-s1-mascot"
                  src={MASCOT_STANDING_SRC}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                />

                <section className="ob-s1-card" aria-label="Navn eller kallenavn">
                  <h1 id="ob-title" className="ob-s1-h1">Hvem kler vi på?</h1>
                  <p className="ob-s1-sub">Bruk navn eller kallenavn hvis du vil gjøre rådene personlige.</p>

                  <div className="ob-field ob-s1-field">
                    <label htmlFor="ob-name-input">Navn eller kallenavn · Valgfritt</label>
                    {/* P10.1 (judge finding D4): the leading person-icon inside
                        the input is NOT in the contract (onboarding-steg1-v2.html's
                        `<input>` has no icon) — amber is action-only, and a
                        leading-icon-in-input is a generic AI pattern the
                        contract deliberately omitted. Removed; the input
                        itself + its label already carry the field's identity. */}
                    <div className="ob-input-shell">
                      <input
                        id="ob-name-input"
                        type="text"
                        inputMode="text"
                        autoComplete="off"
                        autoCapitalize="words"
                        placeholder="F.eks. Iver"
                        value={name}
                        // §11: feltet autofokuseres IKKE (tastaturet tvinges
                        // ikke opp) — ingen autoFocus-prop her, med vilje.
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') goNext();
                        }}
                        aria-describedby="ob-name-hint"
                      />
                    </div>
                    {/* FUNN 2026-08-06 ([MINDRE] Onboarding, personvernløftet):
                        teksten sa «denne iPhonen». Appen distribueres også på
                        Android (no.klemeg.app), og der er setningen synlig
                        usann om enheten forelderen holder i hånden. En
                        personvernpåstand er den dårligste å ta feil om, så
                        formuleringen er enhetsnøytral nå. */}
                    <div id="ob-name-hint" className="ob-hint">Brukes bare i teksten og lagres bare på denne telefonen.</div>
                  </div>

                  {/* §11: "tomrommet gjør arbeid" — dempet forhåndsvisning av
                      hva navnet faktisk påvirker, oppdatert live fra feltet. */}
                  <div className="ob-s1-preview">
                    <span className="ob-s1-preview-tag">Navnet brukes i rådene</span>
                    <span className="ob-s1-preview-line">
                      «Da er vi klare for <span className="ob-s1-preview-named">{nameTrim || 'babyen'}</span>»
                    </span>
                  </div>
                </section>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <OnboardingBabyHero
                variant="compact"
                context="birthday"
              />

              <div className="ob-copy">
                <p className="ob-eyebrow">Alder</p>
                <h1 id="ob-title" className="ob-h2">
                  Når er {nameTrim || 'babyen'} <em>født</em>?
                </h1>
                <p>Alder påvirker hvor varmt barnet bør kles.</p>
              </div>

              <label className={`ob-date-picker${dobIsValid ? ' selected' : ''}`} htmlFor="ob-birth-date">
                <span className="ob-date-icon" aria-hidden="true"><CalendarIcon /></span>
                <span className="ob-date-copy">
                  <span className="ob-date-label">Fødselsdato</span>
                  <span className="ob-date-value">
                    {dobIsValid ? formatDOBLong(dNum, mNum, yNum) : 'Velg dato'}
                  </span>
                </span>
                <ChevronRight />
                <input
                  id="ob-birth-date"
                  type="date"
                  value={dobISO}
                  min={earliestDob}
                  max={todayISO}
                  onChange={(event) => selectDate(event.target.value)}
                  aria-describedby="ob-age-hint"
                />
              </label>

              <div id="ob-age-hint" className="ob-hint ob-hint-center" aria-live="polite">
                {dobIsValid ? (
                  <>
                    {nameTrim || 'Babyen'} er <strong>{formatAge(ageM)}</strong> gammel
                  </>
                ) : (
                  <>Den vanlige datovelgeren på telefonen åpnes.</>
                )}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <OnboardingBabyHero
                variant="compact"
                context="location"
              />

              <div className="ob-copy">
                <p className="ob-eyebrow">Hjemsted</p>
                <h1 id="ob-title" className="ob-h2">
                  Hvor er dere <em>hjemme</em>?
                </h1>
                <p>Gratisversjonen gir dagens råd for ett fast hjemsted.</p>
              </div>

              <div className="ob-loc-card">
                {locationConfirmed && <div className="ob-loc-row">
                  <div className="ob-loc-pin" aria-hidden="true"><PinIcon /></div>
                  <div className="ob-loc-id">
                    <div className="ob-loc-city">{location.city}</div>
                    <div className="ob-loc-coord">
                      Brukes som hjemsted for dagens vær
                    </div>
                  </div>
                </div>}
                <div className="ob-loc-actions">
                  <button type="button" onClick={requestLocation} disabled={locationStatus === 'loading'}>
                    <PinIcon />
                    {locationStatus === 'loading' ? 'Finner stedet…' : 'Bruk posisjonen min'}
                  </button>
                  <button type="button" onClick={() => setShowManual((v) => !v)}>
                    <SearchIcon />
                    Søk etter sted
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
                    Posisjon er ikke tilgjengelig. Søk etter hjemstedet i stedet.
                  </div>
                )}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <OnboardingBabyHero
                variant="compact"
                context="ready"
              />

              <div className="ob-copy">
                <p className="ob-eyebrow">Nesten ferdig</p>
                <h1 id="ob-title" className="ob-h2">
                  Alt er <em>klart</em> for {nameTrim || 'babyen'}
                </h1>
                <p>Kontroller opplysningene før Babyora lager det første rådet.</p>
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
                Opplysningene lagres på enheten og kan endres når som helst.
              </p>

              {/* Veiledende-disclaimer (eierbeslutning 2026-07-15). */}
              <p className="ob-hint ob-hint-center">{DISCLAIMER_FULL}</p>
            </>
          )}

          {step === 5 && (
            <>
              <OnboardingBabyHero
                variant="welcome"
                context="ready"
              />

              <div className="ob-welcome-greet">
                <p className="ob-eyebrow">Babyora er klar</p>
                <h1 id="ob-title" className="ob-h2-hero">
                  Dagens råd er klart for <em>{nameTrim || 'babyen'}</em>
                </h1>
                <p>
                  Basert på alder, hjemsted og været akkurat nå.
                </p>
              </div>

              <ul className="ob-feats" aria-label="Det vi gjør for deg">
                <li className="ob-feat">
                  <span className="ob-feat-icon sun" aria-hidden="true"><SunIcon /></span>
                  <div className="ob-feat-text">
                    <div className="ob-feat-title">I dag · {location.city}</div>
                    <div className="ob-feat-sub">Lokalt vær fra MET.</div>
                  </div>
                </li>
                <li className="ob-feat">
                  <span className="ob-feat-icon" aria-hidden="true"><LayersIcon /></span>
                  <div className="ob-feat-text">
                    <div className="ob-feat-title">Plagg i riktig rekkefølge</div>
                    <div className="ob-feat-sub">
                      Tilpasset {formatAge(ageM)} og dagens forhold.
                    </div>
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
            /* P8 (ekstern designgjennomgang + duell §11, ADOPTERT): navnefeltet
               er frivillig personalisering, ikke påkrevd profilinformasjon —
               «Fortsett» skal ALLTID se aktiv ut og ALLTID være aktiv på steg 1.
               Tidligere `disabled={!nameOk}` gjorde knappen utilgjengelig-
               utseende (opacity .55) i normal bruk (tomt navnefelt er
               starttilstanden), som komprimerte kontrasten mellom
               --ob-accent-cta og --ob-accent-cta-ink til under 3:1 — IKKE en
               feil i selve fargeparet (det gir 6,86:1/4,6:1 udempet), men et
               resultat av at en gyldig CTA ble feilaktig visuelt dempet. */
            <button
              className="ob-btn-primary"
              type="button"
              onClick={goNext}
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
            <button
              className="ob-btn-primary"
              type="button"
              onClick={goNext}
              disabled={!locationConfirmed}
              aria-disabled={!locationConfirmed}
            >
              {locationConfirmed ? `Fortsett med ${location.city}` : 'Velg hjemsted'} <ChevronRight />
            </button>
          )}

          {step === 4 && (
            <button
              className="ob-btn-primary giant"
              type="button"
              onClick={handleCompleteOnboarding}
              disabled={!nameOk || !dobIsValid || !locationConfirmed}
              aria-disabled={!nameOk || !dobIsValid || !locationConfirmed}
            >
              Lag første antrekk <ChevronRight />
            </button>
          )}

          {step === 5 && (
            <>
              <button className="ob-btn-primary giant" type="button" onClick={handleEnterApp}>
                Vis dagens antrekk <ChevronRight />
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
  --ob-bg-canvas:var(--dw-canvas);
  --ob-bg-canvas-soft:var(--dw-canvas);
  --ob-bg-canvas-warm:var(--dw-canvas);
  --ob-surface:var(--dw-raised);
  --ob-surface-raised:var(--dw-raised);
  --ob-terracotta-500:var(--dw-accent);
  --ob-terracotta-600:var(--dw-accent);
  --ob-terracotta-700:var(--dw-accent);
  --ob-terracotta-300:var(--terracotta-200);
  --ob-terracotta-100:var(--dw-accent-surface);
  --ob-warm-orange:var(--dw-accent);
  /* Granmynte-CTA (F80c): primær-knappene bruker samme grønn+ink-par som
     HjemScreen sin CTA, ikke terracotta-stigen (den er nå kun for ikon/aksent). */
  --ob-accent-cta:var(--dw-accent);
  --ob-accent-cta-ink:var(--dw-ink-on-accent);
  --ob-shadow-cta:var(--shadow-cta);
  --ob-shadow-cta-primary:var(--shadow-cta-primary);
  --ob-ink-900:var(--dw-ink-hi);
  --ob-ink-800:var(--dw-ink-hi);
  --ob-ink-700:var(--dw-ink-mid);
  --ob-ink-500:var(--dw-ink-mid);
  --ob-ink-400:var(--dw-ink-low);
  --ob-ink-300:var(--dw-ink-low);
  --ob-ink-200:var(--dw-hairline);
  --ob-line:var(--dw-hairline);
  --ob-line-strong:var(--dw-hairline);
  --ob-shadow-1:var(--shadow-1);
  --ob-shadow-2:var(--shadow-2);
  --ob-shadow-illu:0 24px 60px color-mix(in srgb, var(--dw-accent-pressed) 18%, transparent), 0 8px 20px color-mix(in srgb, var(--dw-ink-hi) 10%, transparent);
  /* Glow-overlay på illu/welcome-bg: lys i light-mode, transparent i dark
     (overstyres lenger ned). */
  --ob-glow-overlay:color-mix(in srgb, var(--dw-overlay) 55%, transparent);
  --ob-glow-overlay-strong:color-mix(in srgb, var(--dw-overlay) 65%, transparent);
  --ob-glow-shine:color-mix(in srgb, var(--dw-overlay) 65%, transparent);
  --ob-feat-bg:color-mix(in srgb, var(--dw-overlay) 50%, transparent);
  --ob-loc-action-bg:var(--dw-hairline);
  --ob-cta-gradient-stop:color-mix(in srgb, var(--dw-canvas) 92%, transparent);
  /* --ob-ease-standard er slettet: den var --dw-ease skrevet en gang til, og
     et alias som vasker et token gjør bare tokenet usynlig for portene.
     Bruksstedene henter nå var(--dw-ease) direkte.
     --ob-ease-spring STÅR IGJEN, men er ikke lenger i bruk: den er navngitt
     målprøve («variabel»-flaten) i design-tokens-v2.motion.test.ts. Slettes
     den her alene, blir motion-porten TAUS i stedet for rød. Den skal ut
     sammen med sin registerlinje, ikke før. */
  --ob-ease-spring:cubic-bezier(.34,1.32,.64,1);
  --ob-font-sans:var(--dw-font-ui);
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
    --ob-glow-overlay:color-mix(in srgb, var(--dw-ink-hi) 8%, transparent);
    --ob-glow-overlay-strong:color-mix(in srgb, var(--dw-ink-hi) 10%, transparent);
    --ob-glow-shine:color-mix(in srgb, var(--dw-ink-hi) 10%, transparent);
    --ob-feat-bg:color-mix(in srgb, var(--dw-ink-hi) 5%, transparent);
    --ob-loc-action-bg:color-mix(in srgb, var(--dw-ink-hi) 6%, transparent);
    --ob-cta-gradient-stop:color-mix(in oklab, var(--dw-canvas) 88%, transparent);
    --ob-shadow-illu:0 24px 60px color-mix(in srgb, black 55%, transparent), 0 8px 20px color-mix(in srgb, black 40%, transparent);
  }
}
:root[data-theme="dark"] .ob-screen{
  --ob-glow-overlay:color-mix(in srgb, var(--dw-ink-hi) 8%, transparent);
  --ob-glow-overlay-strong:color-mix(in srgb, var(--dw-ink-hi) 10%, transparent);
  --ob-glow-shine:color-mix(in srgb, var(--dw-ink-hi) 10%, transparent);
  --ob-feat-bg:color-mix(in srgb, var(--dw-ink-hi) 5%, transparent);
  --ob-loc-action-bg:color-mix(in srgb, var(--dw-ink-hi) 6%, transparent);
  --ob-cta-gradient-stop:color-mix(in oklab, var(--dw-canvas) 88%, transparent);
  --ob-shadow-illu:0 24px 60px color-mix(in srgb, black 55%, transparent), 0 8px 20px color-mix(in srgb, black 40%, transparent);
}
.ob-screen *,.ob-screen *::before,.ob-screen *::after{box-sizing:border-box}

/* ── TOP BAR ── */
.ob-screen > .ob-topbar{
  flex:none;display:flex;align-items:center;justify-content:space-between;
  padding:var(--dw-space-4) var(--dw-space-22) var(--dw-space-8);min-height:40px;
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
.ob-top-skip{
  font-family:var(--ob-font-sans);font-size:13.5px;font-weight:600;
  color:var(--ob-ink-500);background:transparent;border:none;cursor:pointer;
  padding:var(--dw-space-8) var(--dw-space-6);-webkit-tap-highlight-color:transparent;
}

/* Welcome brand */
.ob-welcome-brand{
  display:flex;flex-direction:column;align-items:center;gap:var(--dw-space-6);
}
.ob-brand-mark{
  width:48px;height:48px;border-radius:14px;
  background:linear-gradient(160deg, var(--ob-terracotta-500), var(--ob-terracotta-700));
  color:var(--dw-overlay);display:flex;align-items:center;justify-content:center;
  font-family:var(--ob-font-serif);font-size:24px;line-height:1;
  box-shadow:0 6px 16px color-mix(in srgb, var(--dw-accent-pressed) 32%, transparent), inset 0 -2px 0 color-mix(in srgb, black 15%, transparent);
}
.ob-brand-name{
  font-family:var(--ob-font-serif);font-size:14px;color:var(--ob-ink-700);
  letter-spacing:.4px;
}

/* ── DOT PROGRESS ──
   SLETTET: .ob-dots/.ob-dot ble aldri rendret. Fremdriften tegnes av
   .ob-seg-progress lenger ned, og prikkene stod igjen som død CSS — med
   filens eneste rå transition (350 ms + spring-kurve) i seg. Gjelden
   forsvant med flaten, den ble ikke tokenisert bort. */

/* ── BODY ── */
.ob-screen > .ob-body{
  flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;
  padding:var(--dw-space-6) 28px 0;
  display:flex;flex-direction:column;
  -webkit-overflow-scrolling:touch;
  /* D4: rullingen får bunn-fade — samme form som sheet.css/hjem-monter.css. */
  -webkit-mask-image: var(--dw-fade-bunn);
  mask-image: var(--dw-fade-bunn);
  -webkit--webkit-mask-image: var(--dw-fade-bunn);
mask-image: var(--dw-fade-bunn);
}
.ob-body::-webkit-scrollbar{display:none;}

/* ── ILLUSTRATION ── */
/* P10/JOB5 (2026-08-01): the hardcoded #eee9f3 (lilac) card behind the old
   sitting-doll asset was a design-system violation on its own (a theme-
   invariant literal, never following dark/light) — token-aliased
   --ob-surface-raised (= --dw-raised) now flips correctly with the rest of
   the app in both themes. */
.ob-baby-hero{
  flex:none;margin:var(--dw-space-10) auto 0;
  width:min(100%, 300px);aspect-ratio:1;
  position:relative;isolation:isolate;overflow:hidden;
  border-radius:36px;
  background:var(--ob-surface-raised);
  border:1px solid var(--ob-line);
  box-shadow:var(--ob-shadow-illu);
}
.ob-baby-hero.compact{
  width:156px;
  margin-top:var(--dw-space-8);
  border-radius:28px;
  box-shadow:0 16px 36px color-mix(in srgb, var(--dw-accent-pressed) 15%, transparent), 0 6px 14px color-mix(in srgb, var(--dw-ink-hi) 9%, transparent);
}
.ob-baby-hero.welcome{
  width:min(58vw, 224px);
  margin-top:var(--dw-space-14);
  border-radius:34px;
}
/* P10/JOB5: object-fit:contain (not cover) — the standing-mascot PNG now
   used here (compact/welcome variants, see OnboardingBabyHero.tsx) is a
   tall, transparent-background portrait, not a pre-cropped square
   illustration; contain shows the whole figure centered on the card
   instead of cropping its head/feet. */
.ob-baby-media{
  position:absolute;inset:0;width:100%;height:100%;
  object-fit:contain;display:block;pointer-events:none;
  user-select:none;-webkit-user-drag:none;
}
.ob-baby-poster{z-index:0;}
.ob-baby-video{z-index:1;}
.ob-baby-wordmark{
  position:absolute;z-index:3;top:7%;left:14px;right:14px;
  font-family:var(--ob-font-serif);font-size:clamp(32px, 9vw, 40px);
  font-weight:400;line-height:1;letter-spacing:-.7px;text-align:center;
  /* D7: #2d2438 var tema-invariant og ble USYNLIG i mørk modus (kortet under
     er --dw-raised = #2C1F13). Glorien var hardkodet hvit av samme grunn.
     Begge henter nå fra tokenet: inken flipper, og glorien er kortets egen
     flate som blør gjennom — lys i lys modus, varm mørk i mørk. */
  color:var(--dw-ink-hi);
  text-shadow:0 1px 18px color-mix(in srgb, var(--dw-raised) 78%, transparent);
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
.ob-baby-context{
  position:absolute;z-index:4;right:10px;bottom:10px;
  width:42px;height:42px;border-radius:50%;
  display:grid;place-items:center;
  color:var(--ob-terracotta-700);
  background:color-mix(in srgb, var(--dw-overlay) 88%, transparent);
  border:1px solid color-mix(in srgb, var(--dw-overlay) 72%, var(--ob-line));
  box-shadow:0 7px 18px color-mix(in srgb, var(--dw-ink-hi) 16%, transparent);
  backdrop-filter:blur(10px);
}
.ob-baby-context svg{
  width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.8;
  stroke-linecap:round;stroke-linejoin:round;
}
.ob-baby-context.birthday svg path:last-child{fill:currentColor;stroke:none;}
.ob-baby-context.ready{
  color:var(--ob-accent-cta-ink);
  background:var(--ob-accent-cta);
  border-color:color-mix(in srgb, var(--ob-accent-cta) 75%, white);
}

.ob-illu{
  flex:none;margin:var(--dw-space-10) auto 0;
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
  box-shadow:0 32px 70px color-mix(in srgb, var(--dw-accent-pressed) 22%, transparent), 0 12px 24px color-mix(in srgb, var(--dw-ink-hi) 12%, transparent);
  margin-top:var(--dw-space-18);
}

/* ── COPY ── */
.ob-copy{
  flex:none;margin-top:26px;
  display:flex;flex-direction:column;gap:var(--dw-space-10);
  text-align:center;
}
.ob-eyebrow{
  font-family:var(--ob-font-sans);font-size:11.5px;font-weight:700;
  letter-spacing:1.6px;text-transform:uppercase;color:var(--ob-terracotta-600);
  margin:0;
}
/* P10/JOB5 (2026-08-01): Fraunces is reserved for hero-numbers/price only
   (sol-duel-2026-07-31.md §5) — these onboarding headlines are prose, not a
   hero number, so they move to Schibsted (--ob-font-sans) at weight 700
   instead of the old Fraunces-400 treatment. The <em> word inside them
   previously ADDED italic + an amber (terracotta) text color — both
   forbidden for running text (amber is edge/glow/icon-only, never prose) —
   so emphasis is now purely typographic inheritance (no italic, no color),
   same font/weight as the rest of the sentence. */
.ob-h2{
  font-family:var(--ob-font-sans);font-weight:700;
  font-size:34px;line-height:1.08;letter-spacing:-.5px;
  color:var(--ob-ink-900);margin:0;
  text-wrap:balance;
}
.ob-h2 em{font-style:normal;font-weight:inherit;color:inherit;}
.ob-h2-hero{
  font-family:var(--ob-font-sans);font-weight:700;
  font-size:40px;line-height:1.02;letter-spacing:-.7px;
  color:var(--ob-ink-900);margin:0;text-wrap:balance;
}
.ob-h2-hero em{font-style:normal;font-weight:inherit;color:inherit;}
.ob-copy p, .ob-welcome-greet p{
  font-family:var(--ob-font-sans);font-size:15px;line-height:1.5;
  color:var(--ob-ink-700);margin:0;
  max-width:310px;margin-inline:auto;
  text-wrap:pretty;
}

.ob-welcome-greet{
  flex:none;margin-top:var(--dw-space-22);text-align:center;
  display:flex;flex-direction:column;gap:var(--dw-space-12);
}

/* ── STEG 1 v2 (P10/JOB5, docs/mocks/monter/onboarding-steg1-v2.html;
   revidert P10.1 etter judge-funn D2) ──
   Stående maskot med føttene på kortets øvre kant + ÉN hevet flate
   (headline+felt+forhåndsvisning) — erstatter det gamle
   hero-boks+ledig-tekst+felt-stacket for STEG 1 spesifikt (steg 2-4/5
   beholder sitt eksisterende .ob-copy/.ob-baby-hero-oppsett uendret).
   .ob-s1-hero er den EKSPLISITTE dokkings-beholderen (judge-funn D2):
   display:flow-root hindrer .ob-s1-card sin margin-top fra å
   kollapse GJENNOM wrapperen og ut i side-flyten (samme bugklasse som
   hjem-monter.css sin egen "P9-eierfunn: grepet gled fra kanten via
   margin-kollaps"-historie). Maskoten er høyrestilt (right:30px, per
   mock) og kortet reserverer NØYAKTIG maskotens høyde minus et lite,
   kontrollert fot-overlapp — IKKE et vilkårlig negativt marg-hack som
   kunne senke maskoten dypt inn i kortet uansett innholdshøyde. */
.ob-s1-hero{
  position:relative;
  display:flow-root;
  flex:none;
  /* FUNN 2026-08-06 ([MINDRE] Onboarding, «nedre 28 % av skjermen er tom»):
     ledig plass i .ob-body ble tidligere dumpet i ÉN blokk under kortet
     (270 px), så knappen så ut til å sveve. Auto-marger på flex-elementet
     fordeler det som er til overs likt over og under kortet i stedet.
     Auto-marger er trygge i en rullecontainer: negativ ledig plass
     behandles som 0, så kortet faller tilbake til toppen og RULLER på lave
     skjermer — i motsetning til justify-content:center, som ville gjort
     toppen av kortet uoppnåelig. */
  margin-block:auto;
}
.ob-s1-mascot{
  position:absolute;
  top:0;
  right:30px;
  height:150px;width:auto;
  z-index:3;pointer-events:none;
  /* FUNN 2026-08-05 (DoD fase 6A): hentet --dw-ink-hi, som ER kremfarget
     i mørk modus — altså en LYS glorie under maskoten, på appens
     standardtema, i det aller første bildet en ny bruker ser.
     Blokkeren het opprinnelig «--ink-900». Tokenet var byttet til
     --dw-ink-hi underveis, og det SÅ ut som en migrering. Det var det
     ikke: begge er den lyseste teksten i mørk modus, så glorien var
     nøyaktig den samme. En tokenmigrering er ikke en retting.
     --dw-depth-image er dybdekontraktens bildeskygge og er mørk i
     BEGGE temaer — den bærer alfaen selv, så color-mix er unødvendig. */
  filter:drop-shadow(0 10px 22px var(--dw-depth-image));
}
.ob-s1-card{
  position:relative;z-index:2;
  /* Maskotens høyde (150px) minus et ~18px kontrollert fot-overlapp inn i
     kortets EGEN toppolstring (26px) — føttene "hviler på" kanten, langt
     unna H1-teksten som først starter etter polstringen, uansett
     Dynamic-Type-størrelse. */
  margin-top:132px;
  background:var(--ob-surface-raised);
  border-radius:20px;
  padding:26px var(--dw-space-22) var(--dw-space-22);
  text-align:left;
  box-shadow:0 1px 0 color-mix(in srgb, var(--dw-edge-light) 14%, transparent) inset, var(--ob-shadow-illu);
}
.ob-s1-card::before{
  content:"";position:absolute;top:0;left:7%;right:7%;height:1px;
  border-radius:2px;
  background:linear-gradient(90deg, transparent, var(--dw-edge-light), transparent);
  opacity:.18; /* duell §6: 12–20 % på hevede flater */
  pointer-events:none;
}
.ob-s1-h1{
  font-family:var(--ob-font-sans);font-weight:700;
  font-size:clamp(24px, 7vw, 28px);line-height:1.14;
  letter-spacing:-.012em;color:var(--ob-ink-900);margin:0;
  text-wrap:balance;
}
.ob-s1-sub{
  font-family:var(--ob-font-sans);font-size:15px;line-height:1.5;
  color:var(--ob-ink-700);margin:var(--dw-space-8) 0 0;
}
.ob-s1-field{margin-top:var(--dw-space-20);}
.ob-s1-preview{
  margin-top:var(--dw-space-16);padding-top:var(--dw-space-14);
  border-top:1px solid var(--ob-line);
}
.ob-s1-preview-tag{
  display:block;
  font-size:11.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
  color:var(--ob-ink-500);
}
.ob-s1-preview-line{
  display:block;margin-top:var(--dw-space-6);
  font-size:15px;font-weight:500;color:var(--ob-ink-700);line-height:1.55;
}
.ob-s1-preview-named{color:var(--ob-ink-900);font-weight:700;}

/* ── INPUT ── */
.ob-field{
  flex:none;margin-top:var(--dw-space-22);
  display:flex;flex-direction:column;gap:var(--dw-space-8);
}
/* FUNN 2026-08-06 ([MINDRE] Onboarding, tre venstrekanter): etiketten og
   hjelpeteksten hadde padding-left:var(--dw-space-4) — 4 px, altså de 8
   bildepikslene revisjonen målte ved 2x — mens inputfeltets ramme, H1-en og
   forhåndsvisningen står på kortets egen venstrekant. Det ga tre ulike
   venstrekanter i ETT kort på den aller første skjermen forelderen ser.
   Feltgruppen deler nå kant med feltet den beskriver.
   .ob-hint-center beholder sin padding-left:0 som eksplisitt vakt. */
.ob-field label{
  font-size:11.5px;font-weight:700;letter-spacing:1.2px;
  text-transform:uppercase;color:var(--ob-ink-500);
}
.ob-input-shell{
  position:relative;display:flex;align-items:center;
  background:var(--ob-surface-raised);
  border:1.5px solid var(--ob-terracotta-600);
  border-radius:18px;padding:var(--dw-space-16) var(--dw-space-18);
  box-shadow:0 0 0 4px color-mix(in srgb, var(--ob-terracotta-600) 10%, transparent), var(--ob-shadow-1);
  transition:box-shadow var(--dw-m-state) var(--dw-ease);
}
/* P10.1 (judge finding D4): .ob-input-icon removed — no leading icon in
   the contract's input (onboarding-steg1-v2.html), and it was previously
   coloured with the terracotta/amber accent (action-only per DESIGN.md's
   colour-ownership table). */
.ob-input-shell input{
  flex:1;font:inherit;font-size:18px;font-weight:500;color:var(--ob-ink-900);
  background:transparent;border:none;outline:none;width:100%;
  letter-spacing:-.1px;
}
.ob-input-shell input::placeholder{color:var(--ob-ink-400);font-weight:400;}
.ob-hint{
  font-size:12.5px;color:var(--ob-ink-500);
}
.ob-hint-center{
  text-align:center;margin-top:var(--dw-space-14);padding-left:0;font-size:13px;
}
.ob-hint-center strong{color:var(--ob-terracotta-700);font-weight:700;}

/* ── DATE GRID ──
   SLETTET: .ob-date-grid/.ob-date-cell/.ob-date-input ble aldri rendret.
   Steg 2 bruker plattformens egen datovelger (.ob-date-picker), og det
   tredelte dag/måned/år-rutenettet stod igjen som død CSS. D2-funnet på
   .ob-date-input.filled var altså en hevet flate ingen noensinne så: riktig
   retting er å fjerne flaten, ikke å gi den lyslogikk. */

/* ── LOCATION CARD ── */
/* D1: .ob-loc-row er en hårstrek-rad, og en hårstrek trenger en flate å ligge
   PÅ. Kortet henter derfor fyllet fra --dw-raised direkte (ikke via
   --ob-surface-raised, som vasket tokenet og gjorde flaten usynlig for
   dybdekontrakten) og bærer den kompatible formen: inset topplys + dybde. */
.ob-loc-card{
  margin-top:var(--dw-space-22);display:flex;flex-direction:column;gap:var(--dw-space-18);
  padding:var(--dw-space-22);border-radius:24px;
  background:var(--dw-raised);
  border:1px solid var(--ob-line);
  box-shadow:inset 0 1px 0 var(--dw-plate-kant), var(--dw-depth-raised);
}
.ob-loc-row{display:flex;align-items:center;gap:var(--dw-space-14);}
.ob-loc-pin{
  flex:none;width:48px;height:48px;border-radius:50%;
  background:var(--ob-terracotta-100);color:var(--ob-terracotta-700);
  display:flex;align-items:center;justify-content:center;
  box-shadow:inset 0 -2px 4px color-mix(in srgb, var(--dw-accent-pressed) 8%, transparent);
}
.ob-loc-pin svg{width:22px;height:22px;}
.ob-loc-id{display:flex;flex-direction:column;gap:var(--dw-space-2);flex:1;min-width:0;}
.ob-loc-city{
  font-family:var(--ob-font-serif);font-size:22px;color:var(--ob-ink-900);
  line-height:1.05;letter-spacing:-.2px;
}
.ob-loc-coord{font-size:12.5px;font-weight:500;color:var(--ob-ink-500);letter-spacing:.1px;}
.ob-loc-actions{display:flex;gap:var(--dw-space-8);}
.ob-loc-actions button{
  flex:1;display:flex;align-items:center;justify-content:center;gap:var(--dw-space-6);
  padding:11px var(--dw-space-8);border-radius:12px;
  font:inherit;font-size:13px;font-weight:600;color:var(--ob-ink-700);
  background:var(--ob-loc-action-bg);border:1px solid var(--ob-line);cursor:pointer;
  -webkit-tap-highlight-color:transparent;
}
/* KONTRASTRETTING (fase 3). Knappen som faktisk deaktiveres her er
   :first-child — amber flate + mork ink. opacity:.5 over .ob-loc-card
   (--dw-raised) MALT til 2,67:1 mellom tekst og flate. Samme losning som
   .hjm-cta:disabled: demp FLATEN mot flaten under og bytt ink, ikke demp
   hele knappen. MALT etter: 6,33:1 mork, 8,88:1 lys.
   Den andre selektoren er ikke pynt — ".ob-loc-actions button:first-child"
   staar lenger ned i filen med SAMME spesifisitet som ":disabled", og ville
   ellers vunnet paa kilderekkefolge og satt amber tilbake. */
.ob-loc-actions button:disabled,
.ob-loc-actions button:first-child:disabled{
  background:color-mix(in srgb, var(--dw-accent) 40%, var(--dw-raised));
  color:var(--dw-ink-hi);
  cursor:not-allowed;
}
.ob-loc-actions button svg{width:14px;height:14px;}
.ob-manual{
  display:flex;gap:var(--dw-space-8);align-items:stretch;
  padding-top:var(--dw-space-4);
}
/* D2, med skjønn: feltet var fylt med --dw-overlay (nivå 3, ark/dialog) inne
   i et kort på nivå 2. Det er ikke en hevet flate — et skrivefelt er en BRØNN
   i kortet. Riktig retting er derfor å ta bort det hevede fyllet, ikke å
   pynte det med topplys: --dw-canvas ligger under kortet og leser som senket
   i begge temaer. */
.ob-manual input{
  flex:1;font:inherit;font-size:14px;color:var(--ob-ink-900);
  background:var(--dw-canvas);border:1px solid var(--ob-line-strong);border-radius:10px;
  padding:var(--dw-space-10) var(--dw-space-12);outline:none;
}
.ob-manual input:focus-visible{border-color:var(--ob-terracotta-600);box-shadow:0 0 0 3px color-mix(in srgb, var(--ob-terracotta-600) 15%, transparent);}
.ob-manual button{
  font:inherit;font-size:13px;font-weight:600;color:var(--dw-overlay);
  background:var(--ob-terracotta-500);border:none;border-radius:10px;
  padding:var(--dw-space-10) var(--dw-space-14);cursor:pointer;
}
/* KONTRASTRETTING (fase 3). Samme knapptype som over — amber flate paa
   .ob-loc-card. opacity:.5 MALT til 2,67:1; dempet flate + --dw-ink-hi
   MALT til 6,33:1 mork / 8,88:1 lys. */
.ob-manual button:disabled{
  background:color-mix(in srgb, var(--dw-accent) 40%, var(--dw-raised));
  color:var(--dw-ink-hi);
  cursor:not-allowed;
}
.ob-loc-error{
  font-size:12.5px;color:var(--ob-terracotta-700);
  padding:var(--dw-space-8) var(--dw-space-12);border-radius:10px;
  background:color-mix(in srgb, var(--ob-terracotta-600) 8%, transparent);
}

/* ── KALENDER (steg 2) ──
   SLETTET: hele .ob-cal*-blokken ble aldri rendret. Steg 2 åpner
   plattformens datovelger via .ob-date-picker; den håndskrevne kalenderen
   ble erstattet, men CSS-en ble liggende. Med den forsvinner både
   D2-funnet (.ob-cal, hevet fyll uten lyslogikk) og D6-funnet
   (.ob-cal-nav button, 38x38 px) — ingen av dem var flater brukeren kunne
   nå, så retting nummer én er å fjerne dem. */

/* ── STED-COMBOBOX (steg 3, APG-typeahead) ── */
.ob-manual{flex-direction:column;align-items:stretch;}
.ob-combo{position:relative;width:100%;}
/* D2: samme brønn-vurdering som .ob-manual input over — søkefeltet er ikke
   hevet over kortet det står i. */
.ob-combo input{
  width:100%;font:inherit;font-size:14px;color:var(--ob-ink-900);
  background:var(--dw-canvas);border:1px solid var(--ob-line-strong);border-radius:10px;
  padding:11px var(--dw-space-12);outline:none;box-sizing:border-box;
}
.ob-combo input:focus-visible{border-color:var(--ob-terracotta-600);
  box-shadow:0 0 0 3px color-mix(in srgb, var(--ob-terracotta-600) 15%, transparent);}
/* D2 + D4: treffliste. Denne ER hevet med god grunn — den legger seg OVER
   innholdet, så --dw-overlay blir stående, men da må den også bære
   lyslogikken. Og den ruller (max-height), så den får bunn-fade. */
.ob-combo-list{list-style:none;margin:var(--dw-space-6) 0 0;padding:5px;background:var(--dw-overlay);
  border:1px solid var(--ob-line);border-radius:14px;
  box-shadow:inset 0 1px 0 var(--dw-plate-kant), var(--dw-depth-raised);
  max-height:230px;overflow-y:auto;
  -webkit-mask-image: var(--dw-fade-bunn);
  mask-image: var(--dw-fade-bunn);
  -webkit--webkit-mask-image: var(--dw-fade-bunn);
mask-image: var(--dw-fade-bunn);}
.ob-combo-list:empty{display:none;}
.ob-combo-opt{display:flex;align-items:center;gap:9px;padding:11px var(--dw-space-10);border-radius:9px;
  font-size:14px;color:var(--ob-ink-900);cursor:pointer;}
.ob-combo-opt.active,.ob-combo-opt:hover{background:var(--ob-surface);}
.ob-combo-opt svg{width:15px;height:15px;opacity:.7;flex:none;}
.ob-combo-none{padding:11px var(--dw-space-10);font-size:13px;color:var(--ob-ink-700);}
.ob-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;
  clip:rect(0 0 0 0);white-space:nowrap;border:0;}

/* ── SUMMARY ── */
/* D1: .ob-sum-row + .ob-sum-row skiller radene med en hårstrek. Hårstreken
   forutsetter en hevet gruppeflate under seg — listen henter derfor fyllet
   fra --dw-raised direkte og bærer den kompatible formen. */
.ob-summary{
  margin:var(--dw-space-22) 0 0;padding:0;list-style:none;
  display:flex;flex-direction:column;
  background:var(--dw-raised);border:1px solid var(--ob-line);
  border-radius:22px;overflow:hidden;
  box-shadow:inset 0 1px 0 var(--dw-plate-kant), var(--dw-depth-raised);
}
.ob-sum-row{
  display:flex;align-items:center;gap:var(--dw-space-14);
  padding:var(--dw-space-16) var(--dw-space-18);min-height:62px;
}
.ob-sum-row + .ob-sum-row{border-top:1px solid var(--ob-line);}
.ob-sum-icon{
  flex:none;width:38px;height:38px;border-radius:12px;
  background:var(--ob-terracotta-100);color:var(--ob-terracotta-700);
  display:flex;align-items:center;justify-content:center;
}
.ob-sum-icon svg{width:18px;height:18px;}
.ob-sum-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:var(--dw-space-2);}
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
  margin:var(--dw-space-22) 0 0;padding:0;list-style:none;
  display:flex;flex-direction:column;gap:var(--dw-space-12);
}
.ob-feat{
  display:flex;align-items:center;gap:var(--dw-space-14);
  padding:var(--dw-space-14) var(--dw-space-16);border-radius:18px;
  background:var(--ob-feat-bg);
  border:1px solid var(--ob-line);
}
.ob-feat-icon{
  flex:none;width:42px;height:42px;border-radius:13px;
  display:flex;align-items:center;justify-content:center;
  background:var(--ob-terracotta-100);color:var(--ob-terracotta-700);
  box-shadow:inset 0 -2px 4px color-mix(in srgb, var(--dw-accent-pressed) 8%, transparent);
}
.ob-feat-icon.sun{background:color-mix(in srgb, var(--dw-danger) 16%, var(--dw-overlay)); color:var(--dw-danger);}
.ob-feat-icon.rain{background:color-mix(in srgb, var(--dw-warning) 16%, var(--dw-overlay)); color:var(--dw-warning);}
.ob-feat-icon svg{width:20px;height:20px;}
.ob-feat-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:var(--dw-space-2);}
.ob-feat-title{font-size:14.5px;font-weight:600;color:var(--ob-ink-900);line-height:1.2;}
.ob-feat-sub{font-size:12.5px;color:var(--ob-ink-500);line-height:1.3;}

/* ── CTA ZONE ── */
.ob-screen > .ob-cta-zone{
  flex:none;
  padding:18px 24px calc(env(safe-area-inset-bottom, 0px) + 28px);
  display:flex;flex-direction:column;gap:var(--dw-space-10);
  background:linear-gradient(180deg, transparent 0%, var(--ob-cta-gradient-stop) 30%, var(--ob-bg-canvas) 60%);
}
/* Granmynte-CTA-mønster (F80c, jf. HjemScreen): var(--accent-cta) + accent-cta-ink,
   var(--shadow-cta-primary). Terracotta-stigen er nå kun for ikon/aksent-flater
   (loc-pin, sum-icon, feat-icon, brand-mark), ikke for primær-CTA-er. */
.ob-btn-primary{
  width:100%;min-height:56px;
  display:flex;align-items:center;justify-content:center;gap:var(--dw-space-10);
  padding:var(--dw-space-16) var(--dw-space-20);border-radius:18px;
  background:var(--ob-accent-cta);color:var(--ob-accent-cta-ink);
  font-family:var(--ob-font-sans);font-size:16px;font-weight:700;letter-spacing:.1px;
  border:none;cursor:pointer;
  box-shadow:var(--ob-shadow-cta-primary);
  transition:transform var(--dw-m-state) var(--dw-ease), box-shadow var(--dw-m-state) var(--dw-ease);
  -webkit-tap-highlight-color:transparent;
}
.ob-btn-primary:active{
  transform:translateY(1px);
  box-shadow:var(--ob-shadow-cta);
}
/* KONTRASTRETTING (fase 3). Dette er skjermens synligste deaktiverte flate
   (steg 2/3/4 for feltene er fylt ut). opacity:.55 la amber-flaten og
   --dw-ink-on-accent oppa lerretet samtidig og MALTE 2,85:1 mellom dem —
   fra 6,86:1 udempet. Demping av en farget flate kan ikke lose det, fordi
   MORK ink mister kontrast i takt med at flaten morkner mot lerretet;
   losningen er a bytte ink. Samme regnestykke som .hjm-cta:disabled.
   MALT etter: 7,00:1 mork, 8,52:1 lys. Flaten selv faller til 2,14:1 mot
   lerretet (mork), saa knappen leser fortsatt tydelig som deaktivert.
   box-shadow beholdes uendret — bare fargen er i scope her. */
.ob-btn-primary:disabled,.ob-btn-primary[aria-disabled="true"]{
  background:color-mix(in srgb, var(--dw-accent) 40%, var(--dw-canvas));
  color:var(--dw-ink-hi);
  cursor:not-allowed;transform:none;
  box-shadow:var(--ob-shadow-cta);
}
.ob-btn-primary svg{width:18px;height:18px;}
.ob-btn-primary.giant{min-height:64px;font-size:17px;border-radius:22px;}

.ob-btn-ghost{
  width:100%;min-height:46px;
  display:flex;align-items:center;justify-content:center;gap:var(--dw-space-6);
  background:transparent;border:none;
  font-family:var(--ob-font-sans);font-size:14px;font-weight:600;color:var(--ob-ink-500);
  cursor:pointer;letter-spacing:.1px;
  -webkit-tap-highlight-color:transparent;
}

/* ── RESPONSIV ONBOARDING 2026-07 ──────────────────────────────────────────
   Ett spørsmål per skjerm, én fremdriftsindikator og plattformens datovelger.
   Layouten er høydebevisst: handlingen er alltid tilgjengelig, mens innholdet
   kan rulle på små skjermer og når tastaturet er åpent. */
.ob-screen{
  height:100dvh;
  min-height:100dvh;
  overflow:hidden;
  padding-top:max(12px, env(safe-area-inset-top, 0px));
}
/* FUNN 2026-08-06 ([MINDRE] Onboarding, «208 px tomrom under Fortsett»).
   MEKANISMEN: onboarding rendres som main.ob-screen RETT under .app-shell
   (App.tsx: naar onboardingDone er false returneres div.app-shell med
   OnboardingScreen inni; Suspense lager ingen DOM-node). Dermed treffer
   design-tokens.css sin regel .app-shell > main med
   padding-bottom:var(--dw-tabbar-clearance, 90px) denne skjermen — en klaring
   som er reservert for den flytende tab-baren. Onboarding HAR ingen tab-bar.
   Klaringen er 60+16+env+14 = 90 px, og .ob-cta-zone legger sine egne 14 px
   under knappen: 104 CSS-px = nøyaktig de 208 bildepikslene revisjonen målte.
   .ob-screen sin egen padding-bottom har spesifisitet (0,1,0) og taper mot
   .app-shell > main (0,1,1), så rettingen må stå med minst like høy
   spesifisitet. Vi beholder trygg sone, ikke tab-bar-klaringen. */
.app-shell > main.ob-screen{
  padding-bottom:env(safe-area-inset-bottom, 0px);
}
.ob-screen > .ob-topbar{
  width:min(100%, 560px);
  min-height:48px;
  margin:0 auto;
  padding:var(--dw-space-4) var(--dw-space-20);
  display:grid;
  grid-template-columns:44px minmax(0, 1fr) 44px;
  align-items:center;
}
.ob-top-back{
  width:40px;
  height:40px;
  border-radius:14px;
  background:color-mix(in srgb, var(--ob-surface-raised) 74%, transparent);
  box-shadow:none;
}
/* ORDMERKET STÅR TIL VENSTRE, IKKE I MIDTEN.

   Åpningskontrakten §1 er utvetydig: ordmerket har «IDENTISK ankring på
   det globale gridet i launch, onboarding (alle steg) og Hjem», og det
   flytter seg «maks 1 pt mellom native og web». Kontrakten navngir til og
   med denne feilen: «Dagens tilstand bryter dette (onboarding sentrert,
   Hjem venstre) — onboarding flyttes til venstre.»

   Punktet ble MER synlig da åpningsflaten kom (2026-08-06): den venstre-
   justerer ordmerket, så merket HOPPET fra venstre til midten i det
   overleveringen skjedde — akkurat den bevegelsen kontrakten finnes for å
   hindre. Å bygge én side av broen gjorde den andre siden verre.

   flex-start i stedet for center. Spacer-elementet til høyre beholdes
   så tilbakeknappens plass er reservert og linjen ikke hopper mellom steg. */
.ob-top-center{
  min-width:0;
  display:flex;
  align-items:baseline;
  justify-content:flex-start;
  gap:var(--dw-space-8);
}
.ob-top-brand{
  font-family:var(--ob-font-serif);
  font-size:18px;
  letter-spacing:-.2px;
  color:var(--ob-ink-900);
}
/* P10.1 (judge finding D3): step 1's own brand-row treatment, transcribed
   1:1 from onboarding-steg1-v2.html's .brand (13px/700/0.24em tracking,
   sans, uppercase) — deliberately NOT the larger serif .ob-top-brand
   steps 2-4/5 use. */
.ob-s1-brand{
  font-family:var(--ob-font-sans);
  font-size:13px;
  font-weight:700;
  letter-spacing:0.24em;
  color:var(--ob-ink-900);
}
.ob-top-spacer{width:44px;height:44px;}
/* P10/JOB5: segment-bar (docs/mocks/monter/onboarding-steg1-v2.html
   .progress/.progress i) — replaces the old single continuous fill-bar AND
   the "N av 4" text span it duplicated. Amber (--dw-accent, via
   --ob-terracotta-600 which already resolves to the same accent ramp) only
   on the .active segment. */
.ob-screen > .ob-seg-progress{
  /* flex-direction MUST be explicit: design-tokens.css's global
     ".app-shell > main > div{flex-direction:column;flex:1 0 auto;
     display:flex;}" (P8 — carries the route-transition wrapper's height to
     the screen) ALSO matches this element (.ob-screen IS the <main>, this
     div IS a direct child, and .ob-screen sits directly under .app-shell
     pre-onboarding) — found via QA screenshotting: the segments rendered
     with 0 height because nothing here was overriding flex-direction, so
     the browser used the global rule's "column" instead of the row layout
     this element actually needs. This selector's specificity (2 classes)
     already beats that rule's (1 class + 2 types) for any property BOTH
     declare, so declaring flex-direction here is enough to win. */
  flex:none;
  display:flex;flex-direction:row;gap:var(--dw-space-6);
  width:min(calc(100% - 48px), 512px);
  margin:var(--dw-space-2) auto 0;
}
.ob-seg-progress i{
  flex:1;
  height:4px;
  border-radius:2px;
  background:var(--ob-line-strong);
}
.ob-seg-progress i.active{background:var(--ob-terracotta-600);}
.ob-screen > .ob-body{
  width:min(100%, 560px);
  margin:0 auto;
  padding:var(--dw-space-10) var(--dw-space-24) var(--dw-space-20);
  scroll-padding-bottom:28px;
}
.ob-body > *{
  animation:ob-content-in var(--dw-m-handoff) var(--dw-ease) both;
}
@keyframes ob-content-in{
  from{opacity:0;transform:translateY(8px)}
  to{opacity:1;transform:translateY(0)}
}
.ob-baby-hero{
  width:clamp(158px, 25dvh, 218px);
  margin-top:var(--dw-space-6);
  border-radius:28px;
  box-shadow:0 16px 42px color-mix(in srgb, var(--dw-accent-pressed) 14%, transparent), 0 6px 16px color-mix(in srgb, var(--dw-ink-hi) 10%, transparent);
}
.ob-baby-hero.compact{
  width:clamp(96px, 15dvh, 122px);
  margin-top:var(--dw-space-8);
  border-radius:24px;
  box-shadow:0 10px 26px color-mix(in srgb, var(--dw-ink-hi) 12%, transparent);
}
.ob-baby-hero.welcome{
  width:clamp(178px, 28dvh, 224px);
  margin-top:var(--dw-space-14);
  border-radius:30px;
}
.ob-baby-wordmark{
  top:6%;
  font-size:clamp(24px, 7vw, 32px);
}
.ob-baby-context{
  right:7px;
  bottom:7px;
  width:34px;
  height:34px;
}
.ob-baby-context svg{width:17px;height:17px;}
.ob-copy{
  margin-top:var(--dw-space-16);
  gap:7px;
}
.ob-h2{
  font-size:clamp(30px, 8.4vw, 36px);
  line-height:1.04;
}
.ob-h2-hero{
  font-size:clamp(34px, 9.4vw, 42px);
  line-height:1.02;
}
.ob-copy p,.ob-welcome-greet p{
  max-width:360px;
  font-size:14px;
  line-height:1.42;
}
.ob-field{margin-top:var(--dw-space-18);gap:7px;}
.ob-input-shell{
  min-height:58px;
  padding:var(--dw-space-14) var(--dw-space-16);
  border-radius:16px;
  border-color:var(--ob-line-strong);
  box-shadow:var(--ob-shadow-1);
}
.ob-input-shell:focus-within{
  border-color:var(--ob-terracotta-600);
  box-shadow:0 0 0 3px color-mix(in srgb, var(--ob-terracotta-600) 14%, transparent), var(--ob-shadow-1);
}
.ob-date-picker{
  position:relative;
  min-height:68px;
  margin-top:var(--dw-space-20);
  padding:var(--dw-space-12) var(--dw-space-16);
  display:flex;
  align-items:center;
  gap:var(--dw-space-12);
  overflow:hidden;
  border:1px solid var(--ob-line-strong);
  border-radius:18px;
  background:var(--ob-surface-raised);
  box-shadow:var(--ob-shadow-1);
  cursor:pointer;
}
.ob-date-picker.selected{border-color:color-mix(in srgb, var(--ob-terracotta-600) 72%, var(--ob-line));}
.ob-date-icon{
  width:40px;height:40px;flex:none;border-radius:13px;
  display:grid;place-items:center;
  color:var(--ob-terracotta-700);background:var(--ob-terracotta-100);
}
.ob-date-icon svg{width:19px;height:19px;}
.ob-date-copy{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;}
.ob-date-label{font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--ob-ink-500);}
.ob-date-value{font-size:16px;font-weight:650;color:var(--ob-ink-900);}
.ob-date-picker > svg{width:18px;height:18px;color:var(--ob-ink-400);}
.ob-date-picker input{
  position:absolute;inset:0;width:100%;height:100%;opacity:.001;
  cursor:pointer;color:transparent;background:transparent;border:0;
}
/* box-shadow:var(--ob-shadow-1) er FJERNET her: den overstyrte kortets
   inset-topplys og lot flaten stå igjen uten lyslogikk i akkurat den
   layouten skjermen faktisk bruker. Størrelsen på et kort skal ikke
   bestemme om det har lys. */
.ob-loc-card{
  margin-top:var(--dw-space-18);
  gap:var(--dw-space-12);
  padding:var(--dw-space-14);
  border-radius:20px;
}
.ob-loc-row{
  padding:var(--dw-space-2) var(--dw-space-2) var(--dw-space-10);
  border-bottom:1px solid var(--ob-line);
}
.ob-loc-actions{flex-direction:column;gap:var(--dw-space-8);}
.ob-loc-actions button{
  min-height:50px;
  justify-content:flex-start;
  padding:var(--dw-space-12) var(--dw-space-14);
  border-radius:14px;
  font-size:14px;
  background:var(--ob-surface);
}
.ob-loc-actions button:first-child{
  color:var(--ob-accent-cta-ink);
  background:var(--ob-accent-cta);
  border-color:transparent;
}
.ob-manual{padding-top:0;}
.ob-combo input{min-height:50px;border-radius:14px;padding:13px var(--dw-space-14);}
.ob-summary{margin-top:var(--dw-space-18);border-radius:18px;}
/* D5: 58px lå under radgulvet på 62. Padding-komprimeringen beholdes. */
.ob-sum-row{min-height:62px;padding:var(--dw-space-12) var(--dw-space-14);}
.ob-sum-icon{width:36px;height:36px;}
.ob-welcome-greet{margin-top:var(--dw-space-16);gap:var(--dw-space-8);}
.ob-feats{margin-top:var(--dw-space-18);gap:var(--dw-space-8);}
.ob-feat{padding:var(--dw-space-12) var(--dw-space-14);border-radius:16px;}
.ob-screen > .ob-cta-zone{
  width:min(100%, 560px);
  margin:0 auto;
  padding:12px 24px max(14px, env(safe-area-inset-bottom, 0px));
  background:linear-gradient(180deg, transparent 0%, var(--ob-bg-canvas) 24%, var(--ob-bg-canvas) 100%);
}
.ob-btn-primary{min-height:54px;border-radius:16px;}
.ob-btn-primary.giant{min-height:56px;font-size:16px;border-radius:17px;}

@media (max-height:740px){
  .ob-screen > .ob-topbar{min-height:44px;}
  .ob-screen > .ob-body{padding-top:var(--dw-space-6);padding-bottom:var(--dw-space-12);}
  .ob-baby-hero{width:clamp(128px, 21dvh, 158px);}
  .ob-baby-hero.compact{width:82px;margin-top:var(--dw-space-4);border-radius:19px;}
  .ob-baby-hero.welcome{width:142px;margin-top:var(--dw-space-6);}
  .ob-copy{margin-top:11px;gap:5px;}
  .ob-h2{font-size:28px;}
  .ob-h2-hero{font-size:32px;}
  .ob-field,.ob-date-picker,.ob-loc-card,.ob-summary{margin-top:var(--dw-space-12);}
  .ob-hint-center{margin-top:var(--dw-space-8);}
  .ob-screen > .ob-cta-zone{padding-top:var(--dw-space-8);}
  .ob-screen.step-4 .ob-baby-hero{display:none;}
  .ob-screen.step-4 .ob-copy{margin-top:var(--dw-space-8);}
  .ob-screen.step-4 .ob-summary{margin-top:var(--dw-space-10);}
  /* D5: min-height:46px er FJERNET — radgulvet på 62 px gjelder også på lave
     skjermer. Oppsummeringen får heller rulle i .ob-body enn å presses under
     gulvet; komprimeringen ligger fortsatt i padding, gap og ikonstørrelse. */
  .ob-screen.step-4 .ob-sum-row{padding:7px var(--dw-space-12);gap:var(--dw-space-10);}
  .ob-screen.step-4 .ob-sum-icon{width:28px;height:28px;border-radius:9px;}
  .ob-screen.step-4 .ob-sum-icon svg{width:15px;height:15px;}
  .ob-screen.step-4 .ob-sum-value{font-size:15px;}
  .ob-screen.step-4 .ob-sum-edit{width:30px;height:30px;}
  .ob-screen.step-4 .ob-hint-center{font-size:11.5px;line-height:1.3;}
}
@media (orientation:landscape) and (max-height:560px){
  .ob-screen > .ob-body{padding-inline:28px;}
  .ob-baby-hero,.ob-baby-hero.compact{width:72px;margin-top:var(--dw-space-2);border-radius:18px;}
  .ob-baby-hero.welcome{width:90px;}
  .ob-copy{margin-top:var(--dw-space-8);}
  .ob-copy p{display:none;}
}

/* Focus visibility — Morgennatt-fokusring (samme token som HjemScreen). */
.ob-screen :focus-visible{
  outline:2.5px solid var(--dw-focus, var(--dw-accent));
  outline-offset:2px;border-radius:8px;
}

/* Reduced-motion: drep alle overganger/animasjoner. */
@media (prefers-reduced-motion: reduce){
  .ob-screen *,.ob-screen *::before,.ob-screen *::after{
    transition:none !important;animation:none !important;
  }
}
`;
