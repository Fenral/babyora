/**
 * VerticalGauge — P10/JOB4 (owner redesign 2026-08-01): shared vertical
 * instrument column for FinnAntrekkScreen's three sliders (temperatur/
 * vind/nedbør), so the calculator reads as ONE instrument-panel row instead
 * of a mixed vertical-thermometer + two horizontal-sliders layout (the
 * mixed layout is explicitly what the owner rejected).
 *
 * Every column shares the exact same top-to-bottom structure: uppercase
 * label → prominent tabular-nums value → vertical track (min/max labels at
 * the ends, 44pt-wide touch target) → a +/- fine-step button pair below the
 * track (44pt each). Reuses the SAME native-range-in-full-track-size a11y
 * technique TemperatureInstrument.tsx (R7 Task 3A) already established
 * (opacity:0 vertical `<input type="range">` layered over decorative
 * graphics) — `aria-orientation="vertical"` is the one addition native
 * range doesn't provide on its own; valuemin/max/now come free from the
 * browser, and arrow-key stepping works with zero extra wiring.
 *
 * Colour is caller-supplied (`fillBottomColor`/`fillTopColor`). P10.1
 * (judge finding C5) revised this: all three gauges now pass the SAME
 * petrol/instrument-family tokens (`--dw-panel`/`--dw-w-clear`) — amber
 * (`--dw-accent`) is a USER-ACTION colour (DESIGN.md's colour-ownership
 * table) and must never fill a WEATHER DATA readout; it is reserved for
 * genuinely interactive states (`:focus-within` on the track below).
 * `fillBottomColor`/`fillTopColor` stay caller-supplied props (not
 * hardcoded in this file) so a future column with a legitimately
 * different data family isn't forced through FinnAntrekkScreen.tsx's own
 * choice — but see that file's own comment on why all three currently
 * agree.
 *
 * P10.2 (owner redesign, 2026-08-01) — "material fills": the owner asked
 * that the three gauges stop looking like identical petrol swatches and
 * instead look like they fill with their own SUBSTANCE. Geometry
 * (track/fill bounding box, corner radius, baseline marker, +/- steppers,
 * the whole a11y contract) is UNCHANGED and IDENTICAL across all three —
 * only the `material` prop changes what the fill looks like inside that
 * same box:
 *  - `'thermal'` (Temperatur): `fillBottomColor`/`fillTopColor` are
 *    IGNORED — the gradient is computed from the live value itself via
 *    gauge-material.ts's `temperatureFillColor`/`temperatureFillDeepColor`
 *    (pure, unit-tested there). This is the one place colour is DATA, not
 *    a `--dw-*` token — see that file's header for the exception + the
 *    explicit distance kept from `--dw-accent` (CTA amber).
 *  - `'air'` (Vind): unchanged petrol fill, plus 2-3 faint horizontal
 *    "streak" lines — CSS-only, static at rest. The streaks may shift ONLY
 *    while the user is actively dragging the track (pointer down) via the
 *    `.is-dragging` class below; never a perpetual/idle animation (calm
 *    doctrine). Den skrå overkanten som sto her (clip-path) er FJERNET
 *    2026-08-06 — se vertical-gauge.css sin egen kommentar på
 *    `.fa-gauge-fill--air`: den lot fyllets overkant bety én ting i venstre
 *    kant og noe annet i høyre, og møtte markørlinjen bare helt til høyre.
 *  - `'water'` (Nedbør): unchanged petrol fill, plus an SVG meniscus cap
 *    at the top edge, a darker-at-the-bottom shading overlay (CSS, not a
 *    new colour), and a ONE-SHOT ~300ms WAAPI "slosh" (slight spring
 *    overshoot on the fill's own scaleY) fired only when `value` actually
 *    changes — never idle, never on mount.
 * All three respect `reducedMotion` (threaded down from
 * useNativeSettings(), which already merges the OS media query with the
 * app's own Innstillinger override — same pattern as every other
 * motion-gated spot in this codebase, e.g. FinnAntrekkScreen's own
 * `resultOpacityStyle`): no slosh, no gust-shift, fills just resize
 * instantly. `material` is optional and defaults to the original flat
 * `fillBottomColor`/`fillTopColor` gradient for any future caller that
 * doesn't opt into a material.
 */
import {
  useEffect, useId, useRef, useState,
  type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactElement,
} from 'react';
import { MOTION } from '../../styles/motion-grammar';
import { temperatureFillColor, temperatureFillDeepColor, type GaugeMaterial } from './gauge-material';
import { DESIMALSKILLE } from './instrument-logic';
import './vertical-gauge.css';

export type { GaugeMaterial };

export type VerticalGaugeProps = Readonly<{
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  ariaValueText: string;
  minLabel: string;
  maxLabel: string;
  fillBottomColor: string;
  fillTopColor: string;
  incrementLabel: string;
  decrementLabel: string;
  /** Track height in px — the owner's spec calls for ~200-220px, shared across all three columns. */
  height?: number;
  disabled?: boolean;
  /**
   * P10.1 (judge finding C9): the live met.no reading at the moment this
   * screen opened (or was seeded from Hjem) — drawn as a thin reference
   * marker on the track so the CHOSEN value (which the user may have
   * dragged away from it) and the ACTUAL weather never blur together.
   * `null`/`undefined` while weather hasn't resolved yet → no marker.
   */
  baselineValue?: number | null;
  /** sr-only description of the baseline marker, e.g. "Faktisk vær nå: -4°". Required whenever `baselineValue` is set. */
  baselineLabel?: string;
  /**
   * P10.2: which SUBSTANCE the fill should read as. Omitted → original
   * flat `fillBottomColor`→`fillTopColor` gradient (back-compat default).
   * See the file header for what each variant does.
   */
  material?: GaugeMaterial;
  /**
   * P10.2: gates the water gauge's WAAPI slosh + the wind gauge's
   * drag-gust shift. Threaded from useNativeSettings() by the caller
   * (same convention as FinnAntrekkScreen's own `resultOpacityStyle` etc)
   * so the app's own Innstillinger override is honoured, not just the OS
   * `prefers-reduced-motion` media query (which vertical-gauge.css's own
   * `@media` block still guards as a defense-in-depth fallback).
   */
  reducedMotion?: boolean;
}>;

function clampFraction(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/* ═══ KOMMAET FÅR IKKE SIFFERBREDDE (2026-08-06) ═══════════════════════════
   Kritikken: «0.0 mm/t» leses som «0 . 0» — luften på hver side av
   skilletegnet er omtrent like bred som selve sifferet.

   MEKANISMEN, målt i fontfilen (public/fonts/schibsted-grotesk-latin-wght-
   normal.woff2, upm 2048): `.fa-gauge-value` har
   `font-variant-numeric: tabular-nums`, som slår på OpenType-egenskapen
   `tnum`. Schibsted Grotesk lar den ikke bare gjelde sifrene — den bytter
   OGSÅ skilletegnene til tabulære varianter:

       zero   1252 → zero.tf   1300
       one     703 → one.tf    1300
       period  574 → period.tf 1300      ← +726/2048 em = +7,1 px ved 20 px
       comma   543 → comma.tf  1300      ← +757/2048 em = +7,4 px ved 20 px

   Tegnet selv er ~2 px blekk i en 12,7 px celle. Det er den luften. Den kom
   altså IKKE fra letter-spacing (som står på −0,2 px, altså strammer) og
   ikke fra font-feature-settings, men fra tabular-nums — og et komma arver
   nøyaktig samme bredde som punktumet hadde.

   HVORFOR IKKE BARE SLÅ AV tabular-nums: da mister sifrene den faste
   bredden også (zero 1252 mot one 703 — 27 % forskjell), og verdien
   hopper sidelengs mens brukeren drar i sporet. Tabulære SIFRE er poenget.
   Derfor skilles bare selve skilletegnet ut i sitt eget element, der
   `.fa-gauge-desimal` setter font-variant-numeric tilbake til `normal`.
   ════════════════════════════════════════════════════════════════════════ */
function verdiMedStrammetDesimalskille(valueLabel: string): ReactElement {
  const i = valueLabel.indexOf(DESIMALSKILLE);
  if (i < 0) return <>{valueLabel}</>;
  return (
    <>
      {valueLabel.slice(0, i)}
      <span className="fa-gauge-desimal">{DESIMALSKILLE}</span>
      {valueLabel.slice(i + 1)}
    </>
  );
}

/* ═══ SPORETS ENDER LYVER IKKE (2026-08-06) ══════════════════════════════
   Målt på Juster-skjermen, nedbørsporet på 0,0 mm/t:

   1. FYLLET VAR IKKE NULL. Høyden sto som `calc(0% - 6px)`. Nettleseren
      klipper et negativt resultat til 0, så selve fyllet forsvant — men
      meniskus-SVG-en ble tegnet uansett, og den ligger `top: -4px` med
      `height: 10px` UTENFOR fyllets boks (vertical-gauge.css sier
      eksplisitt at den skal få stikke over). Resultatet var en teal kile
      på ~6 px i bunnen av et spor som leste 0,0. Avlesningen og bildet sa
      hver sin ting.
   2. MARKØREN BLE KLIPPET BORT. Den sto `bottom: calc(0% - 1px)`, altså
      med senter i sporets bunnkant. Sporet er en pille (44 px bredt,
      22 px radius) med `overflow: hidden`: 1 px over bunnen er sporet bare
      13,1 px bredt, så en 36 px markør ble redusert til en stubb på ~36 %
      av bredden — nøyaktig «en tredjedel så bred» som kritikken målte.

   Begge er nå regnet i PIKSLER, ikke i prosent-minus-piksler, fordi
   `height`-propen gir den faktiske sporhøyden og calc-klippingen skjulte
   regnestykket. Fyllet blir reelt null ved minimum, og markøren holdes
   innenfor det avrundede endestykket av innrykket under.
   ══════════════════════════════════════════════════════════════════════ */

/** Fyllets innrykk fra sporets kanter. MÅ være det samme tallet som
 *  vertical-gauge.css sin `.fa-gauge-fill { left/right/bottom: 6px }` —
 *  det er derfor høyden trekker fra nettopp 6 px: fyllets OVERKANT skal
 *  lande på `fraksjon × høyde`, som er der markøren står.
 *  sporets-ender-lyver-ikke.test.tsx leser CSS-en og holder de to like. */
export const GAUGE_FILL_INSET_PX = 6;

/** Markørens minste avstand fra hver sporende, i piksler.
 *  MÅLT, ikke valgt: markøren er `44/2 − 6 = 16` px halvbred, og pillens
 *  bunnkappe (radius 22) er først 16 px halvbred 6,9 px over bunnen. Med
 *  senter på 10 px ligger underkanten på 9 px, der sporet er 17,75 px
 *  halvbredt — 1,75 px klaring, i begge ender, likt i alle tre sporene.
 *  Testen regner denne geometrien på nytt fra CSS-verdiene i stedet for å
 *  gjenta tallet. 10 px er også et trinn på avstandsskalaen. */
export const GAUGE_MARKER_INSET_PX = 10;

export function VerticalGauge({
  label,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
  ariaLabel,
  ariaValueText,
  minLabel,
  maxLabel,
  fillBottomColor,
  fillTopColor,
  incrementLabel,
  decrementLabel,
  height = 208,
  disabled = false,
  baselineValue = null,
  baselineLabel,
  material,
  reducedMotion = false,
}: VerticalGaugeProps): ReactElement {
  const fraction = clampFraction(value, min, max);
  const atMin = value <= min;
  const atMax = value >= max;

  // P10.2: 'thermal' computes its own gradient from the live value (see
  // gauge-material.ts's header) — every other variant keeps the
  // caller-supplied petrol tokens unchanged; only decorative overlays
  // (streaks/meniscus, added in the JSX below) differ per material.
  const gradientBottom = material === 'thermal' ? temperatureFillDeepColor(value) : fillBottomColor;
  const gradientTop = material === 'thermal' ? temperatureFillColor(value) : fillTopColor;

  // P10.2 (Vind/'air'): the streak lines inside the fill may shift ONLY
  // while the user is actively dragging — never at rest (calm doctrine,
  // no perpetual motion). Explicit pointer capture keeps `pointerup`
  // firing on THIS element even if the drag ends outside the (44px-wide)
  // track.
  const [isDragging, setIsDragging] = useState(false);
  const gustActive = material === 'air' && isDragging && !reducedMotion;

  function handlePointerDown(e: ReactPointerEvent<HTMLInputElement>): void {
    if (disabled || material !== 'air') return;
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Pointer capture is a nicety for the drag-only gust shift, not a
      // correctness requirement — safe to ignore if unsupported/rejected.
    }
  }
  function endDrag(): void {
    if (isDragging) setIsDragging(false);
  }

  // P10.2 (Nedbør/'water'): a ONE-SHOT WAAPI "slosh" — a slight spring
  // overshoot on the fill's own scaleY (transform-origin: bottom, set in
  // vertical-gauge.css) — fired only when `value` actually changes, never
  // on mount, never idle. Guarded by both `material` and `reducedMotion`.
  const fillRef = useRef<HTMLDivElement | null>(null);
  const prevValueRef = useRef(value);
  useEffect(() => {
    const changed = prevValueRef.current !== value;
    prevValueRef.current = value;
    if (!changed || material !== 'water' || reducedMotion) return;
    const node = fillRef.current;
    if (!node || typeof node.animate !== 'function') return;
    node.animate(
      [
        { transform: 'scaleY(0.94)' },
        { transform: 'scaleY(1.05)' },
        { transform: 'scaleY(1)' },
      ],
      { duration: MOTION.gaugeSlosh, easing: MOTION.backOvershoot },
    );
  }, [value, material, reducedMotion]);

  // Se blokken «SPORETS ENDER LYVER IKKE» over: fyllets overkant skal
  // ligge på `fraksjon × høyde`, og fordi fyllet starter 6 px over sporets
  // bunn må de 6 pikslene trekkes fra høyden. Ved minimum blir det null —
  // reelt null, ikke en negativ calc som nettleseren klipper i stillhet.
  const fillHeightPx = Math.max(0, fraction * height - GAUGE_FILL_INSET_PX);
  const harFyll = fillHeightPx > 0;

  const fillStyle: CSSProperties = {
    height: `${fillHeightPx.toFixed(2)}px`,
    background: `linear-gradient(to top, ${gradientBottom}, ${gradientTop})`,
    // App-level reduced-motion override (not just the OS media query —
    // see the prop's own doc comment): fills resize instantly, no eased
    // height transition, no slosh/gust below.
    transition: reducedMotion ? 'none' : undefined,
  };

  const fillClassName = [
    'fa-gauge-fill',
    material === 'thermal' ? 'fa-gauge-fill--thermal' : null,
    material === 'air' ? 'fa-gauge-fill--air' : null,
    material === 'water' ? 'fa-gauge-fill--water' : null,
    gustActive ? 'is-dragging' : null,
  ].filter(Boolean).join(' ');

  const baselineFraction = baselineValue === null || baselineValue === undefined
    ? null
    : clampFraction(baselineValue, min, max);
  // Markøren er 2 px høy, så `bottom` er senteret minus 1. Senteret klemmes
  // inn fra begge ender (se GAUGE_MARKER_INSET_PX) slik at hele bredden
  // holder seg innenfor pillens avrundede endestykke — før dette ble
  // markøren spist av bunn-radiusen og sto igjen som en stubb.
  const markerTop = Math.max(GAUGE_MARKER_INSET_PX, height - GAUGE_MARKER_INSET_PX);
  const baselineStyle: CSSProperties | undefined = baselineFraction === null
    ? undefined
    : {
      bottom: `${(Math.min(
        Math.max(baselineFraction * height, GAUGE_MARKER_INSET_PX),
        markerTop,
      ) - 1).toFixed(2)}px`,
    };
  const baselineDescId = useId();
  const hasBaseline = baselineFraction !== null && Boolean(baselineLabel);

  function stepBy(delta: number): void {
    if (disabled) return;
    const raw = value + delta;
    const clamped = Math.max(min, Math.min(max, raw));
    // Snap onto the step grid so repeated +/- taps never drift off it.
    const snapped = Math.round(clamped / step) * step;
    const next = Math.max(min, Math.min(max, snapped));
    if (next !== value) onChange(next);
  }

  return (
    <div className="fa-gauge">
      <p className="fa-gauge-label">{label}</p>
      <p className="fa-gauge-value" aria-hidden="true">
        {verdiMedStrammetDesimalskille(valueLabel)}
      </p>
      {/* ═══ FINSTEGENE STÅR LODDRETT, IKKE I EN RAD UNDER ═══════════════════

          Eierforslag 2026-08-06, og det løser to ting på én gang.

          Før lå alle seks knappene i én vannrett rad under de tre sliderne.
          Målt: 16 px mellom knappene INNI et par, 4–5 px MELLOM parene.
          Grupperingen sa altså det motsatte av hva knappene gjorde — de leste
          som én udifferensiert rad på seks.

          Avstand kunne ikke løse det. De 16 px er et låst gulv (dommerfunn
          C7: bomtrykk med votter), og regnestykket går ikke opp på 390 px:
          6×44 + 3×16 = 312 av ~336 tilgjengelige. Det er 24 px igjen til to
          mellomrom som måtte blitt større enn 16.

          Loddrett trenger ingen avstand for å leses, fordi POSISJONEN BLIR
          BETYDNINGEN: pluss øverst på en loddrett slider er «opp», minus
          nederst er «ned». Knappen står der verdien går. Hvert par tilhører
          synlig sin egen kolonne uten at noe mellomrom må bevise det.

          Breddeskranken forsvinner også: hver kolonne trenger 44 px, ikke
          104. Høyden er der prisen betales — se `.fa-gauge-track-wrap`.
          ══════════════════════════════════════════════════════════════════ */}
      <div className="fa-gauge-track-wrap">
        <button
          type="button"
          className="fa-gauge-step"
          aria-label={incrementLabel}
          aria-disabled={atMax || disabled || undefined}
          onClick={() => !atMax && stepBy(step)}
        >
          +
        </button>
        <span className="fa-gauge-end-label" aria-hidden="true">{maxLabel}</span>
        <div className="fa-gauge-track" style={{ height }}>
          <div aria-hidden="true" className={fillClassName} style={fillStyle} ref={fillRef}>
            {material === 'air' && (
              <>
                <span className="fa-gauge-streak fa-gauge-streak--1" />
                <span className="fa-gauge-streak fa-gauge-streak--2" />
                <span className="fa-gauge-streak fa-gauge-streak--3" />
              </>
            )}
            {/* Meniskusen krever et fyll å ligge på. Den er bevisst plassert
                UTENFOR fyllets boks (`top: -4px`), så uten denne vakten ble
                den tegnet også når fyllet var null — en teal kile i bunnen
                av et spor som leste 0,0 mm/t. */}
            {material === 'water' && harFyll && (
              <svg
                className="fa-gauge-meniscus"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M0,5 Q25,0 50,4 T100,3 L100,10 L0,10 Z" style={{ fill: gradientTop }} />
              </svg>
            )}
          </div>
          {baselineStyle && (
            <span aria-hidden="true" className="fa-gauge-baseline" style={baselineStyle} />
          )}
          <input
            type="range"
            className="fa-gauge-input"
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(Number(e.target.value))}
            onPointerDown={handlePointerDown}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onLostPointerCapture={endDrag}
            aria-label={ariaLabel}
            aria-valuetext={ariaValueText}
            aria-orientation="vertical"
            aria-describedby={hasBaseline ? baselineDescId : undefined}
          />
        </div>
        {hasBaseline && (
          <span id={baselineDescId} className="fa-gauge-sr-only">{baselineLabel}</span>
        )}
        <span className="fa-gauge-end-label" aria-hidden="true">{minLabel}</span>
        <button
          type="button"
          className="fa-gauge-step"
          aria-label={decrementLabel}
          aria-disabled={atMin || disabled || undefined}
          onClick={() => !atMin && stepBy(-step)}
        >
          −
        </button>
      </div>
    </div>
  );
}
