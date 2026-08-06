/**
 * SPORETS ENDER LYVER IKKE.
 *
 * MÅLT 2026-08-06 på Juster-skjermen, nedbørsporet på 0,0 mm/t (5×-utsnitt
 * av sporbunnen). To ting motsa tallet som sto rett over sporet:
 *
 *   1. En teal kile fylte nedre del av sporet selv om avlesningen sa 0,0.
 *      MEKANISMEN: fyllet var `calc(0% - 6px)` og ble klippet til 0 av
 *      nettleseren — men meniskus-SVG-en ble tegnet uansett, og den ligger
 *      `top: -4px; height: 10px`, altså UTENFOR fyllets egen boks. Kilen var
 *      meniskusen alene, uten noe fyll under seg.
 *   2. Markørlinjen var en stubb på ca. en tredjedel av bredden i de to
 *      andre sporene. MEKANISMEN: `bottom: calc(0% - 1px)` satte senteret i
 *      sporets bunnkant, og sporet er en pille (44 px bred, 22 px radius) med
 *      `overflow: hidden`. Ett piksel over bunnen er sporet 13,1 px bredt.
 *      En 36 px markør ble til 13 px — 36 %, «en tredjedel».
 *
 * DENNE PORTEN MÅLER GEOMETRIEN, IKKE TEKSTEN. Den leser sporets faktiske
 * bredde og radius fra CSS-en, regner ut hvor bred pillen er akkurat der
 * markørens underkant havner, og krever at hele markøren får plass. Skrives
 * innrykket tilbake til 0, blir tallet 0 px mot 16 px og porten er rød —
 * uten at noen trenger å huske hvorfor 10 px sto der.
 *
 * Rendres med renderToStaticMarkup: repoet har ingen jsdom (se
 * FinnAntrekkScreen.instrument-panel.test.tsx sin egen hodekommentar), så
 * det som måles er de utregnede inline-stilene — som er nettopp der begge
 * feilene bodde.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  VerticalGauge, GAUGE_FILL_INSET_PX, GAUGE_MARKER_INSET_PX,
  type VerticalGaugeProps,
} from '../VerticalGauge';

const CSS = readFileSync(
  resolve(process.cwd(), 'src/components/instrument/vertical-gauge.css'),
  'utf8',
).replace(/\r\n/gu, '\n');

/** Sporhøyden FinnAntrekkScreen faktisk sender (GAUGE_HEIGHT, 2026-08-06). */
const HOEYDE = 152;

const NEDBOER: VerticalGaugeProps = {
  label: 'Nedbør',
  valueLabel: '0.0 mm/t',
  min: 0,
  max: 10,
  step: 0.5,
  value: 0,
  onChange: () => {},
  ariaLabel: 'Nedbør i millimeter per time',
  ariaValueText: '0.0 millimeter per time, opphold',
  minLabel: '0',
  maxLabel: '10 mm/t',
  fillBottomColor: 'var(--dw-panel)',
  fillTopColor: 'var(--dw-w-clear)',
  incrementLabel: 'Mer nedbør',
  decrementLabel: 'Mindre nedbør',
  height: HOEYDE,
  material: 'water',
};

function tegn(props: Partial<VerticalGaugeProps> = {}): string {
  return renderToStaticMarkup(<VerticalGauge {...NEDBOER} {...props} />);
}

/** Henter `style`-attributtet på taggen som bærer klassen. */
function stilFor(html: string, klasse: string): string {
  const tagg = new RegExp(`<[^>]*class="[^"]*\\b${klasse}\\b[^"]*"[^>]*>`, 'u').exec(html);
  expect(tagg, `fant ingen tagg med klassen ${klasse} — porten måler ingenting`).not.toBeNull();
  const stil = /style="([^"]*)"/u.exec(tagg![0]);
  expect(stil, `${klasse} har ingen inline-stil å måle`).not.toBeNull();
  return stil![1];
}

function pikslerFor(stil: string, egenskap: string): number {
  const m = new RegExp(`(?:^|;)${egenskap}:\\s*(-?[\\d.]+)px`, 'u').exec(stil);
  expect(m, `fant ingen px-verdi for ${egenskap} i «${stil}»`).not.toBeNull();
  return Number(m![1]);
}

/** Regel-blokken for én selektor, slik den står i filen. */
function regel(selektor: string): string {
  const m = new RegExp(`^${selektor.replace(/\./gu, '\\.')}\\s*\\{([^}]*)\\}`, 'mu').exec(CSS);
  expect(m, `fant ikke regelen ${selektor}`).not.toBeNull();
  return m![1];
}

function cssPx(selektor: string, egenskap: string): number {
  const m = new RegExp(`${egenskap}:\\s*(-?[\\d.]+)px`, 'u').exec(regel(selektor));
  expect(m, `${selektor} mangler ${egenskap} i px`).not.toBeNull();
  return Number(m![1]);
}

/**
 * Halve bredden sporet har `y` px over bunnen, gitt en avrundet form med
 * gitt bredde og hjørneradius. Over radien er formen rett; under den er den
 * sirkelens bue — og det er buen som spiste markøren.
 */
function halvbreddeVed(y: number, bredde: number, radius: number): number {
  if (y >= radius) return bredde / 2;
  const dy = radius - y;
  return bredde / 2 - radius + Math.sqrt(Math.max(0, radius * radius - dy * dy));
}

const SPOR_BREDDE = cssPx('.fa-gauge-track', 'width');
const SPOR_RADIUS = cssPx('.fa-gauge-track', 'border-radius');
const MARKOER_SIDEINNRYKK = cssPx('.fa-gauge-baseline', 'left');
const MARKOER_HOEYDE = cssPx('.fa-gauge-baseline', 'height');
const MARKOER_HALVBREDDE = SPOR_BREDDE / 2 - MARKOER_SIDEINNRYKK;

describe('ved minimum er fyllet reelt null', () => {
  it('IKKE-VAKUØSITET: geometrien porten regner på er lest fra CSS, ikke gjettet', () => {
    expect(SPOR_BREDDE).toBeGreaterThan(0);
    expect(SPOR_RADIUS).toBeGreaterThan(0);
    expect(MARKOER_HALVBREDDE).toBeGreaterThan(0);
    expect(regel('.fa-gauge-track')).toContain('overflow: hidden');
  });

  it('fyllets høyde er 0 px — ikke en negativ calc nettleseren klipper i stillhet', () => {
    expect(pikslerFor(stilFor(tegn(), 'fa-gauge-fill'), 'height')).toBe(0);
  });

  it('meniskusen tegnes ikke når fyllet er null', () => {
    /* Meniskusen ligger `top: -4px` UTENFOR fyllets boks, så den overlever
       et fyll på 0 px hvis ingen stopper den. Det var hele den teale kilen
       over markørstubben. */
    expect(regel('.fa-gauge-meniscus')).toMatch(/top:\s*-\d/u);
    expect(tegn()).not.toContain('fa-gauge-meniscus');
  });

  it('IKKE-VAKUØSITET: meniskusen kommer tilbake så snart det finnes fyll å ligge på', () => {
    const html = tegn({ value: 1, valueLabel: '1.0 mm/t' });
    expect(html).toContain('fa-gauge-meniscus');
    expect(pikslerFor(stilFor(html, 'fa-gauge-fill'), 'height')).toBeGreaterThan(0);
  });

  it('fyllets innrykk i koden er det samme som i CSS — ellers bommer overkanten', () => {
    expect(GAUGE_FILL_INSET_PX).toBe(cssPx('.fa-gauge-fill', 'bottom'));
    expect(GAUGE_FILL_INSET_PX).toBe(cssPx('.fa-gauge-fill', 'left'));
  });
});

describe('markøren holder seg innenfor det avrundede endestykket', () => {
  const baseline = { baselineValue: 0, baselineLabel: 'Faktisk vær nå: 0.0 mm/t' };

  it('på minimum ligger hele markørbredden innenfor pillens bunnkappe', () => {
    const bunn = pikslerFor(stilFor(tegn(baseline), 'fa-gauge-baseline'), 'bottom');
    const plass = halvbreddeVed(bunn, SPOR_BREDDE, SPOR_RADIUS);

    expect(
      plass,
      `Markørens underkant står ${bunn} px over sporbunnen. Der er pillen bare `
      + `${(plass * 2).toFixed(1)} px bred, og markøren er ${(MARKOER_HALVBREDDE * 2).toFixed(1)} px. `
      + 'Sporet har overflow: hidden, så differansen blir klippet bort og markøren '
      + 'står igjen som en stubb — nøyaktig funnet fra 2026-08-06.',
    ).toBeGreaterThanOrEqual(MARKOER_HALVBREDDE);
  });

  it('på maksimum gjelder det samme i den andre enden', () => {
    const bunn = pikslerFor(
      stilFor(tegn({ ...baseline, baselineValue: 10 }), 'fa-gauge-baseline'),
      'bottom',
    );
    const overkant = bunn + MARKOER_HOEYDE;
    const plass = halvbreddeVed(HOEYDE - overkant, SPOR_BREDDE, SPOR_RADIUS);
    expect(plass, 'markørens overkant klippes av topp-radiusen').toBeGreaterThanOrEqual(MARKOER_HALVBREDDE);
  });

  it('IKKE-VAKUØSITET: innrykket gjelder BARE endene — midt i sporet står markøren på verdien sin', () => {
    const bunn = pikslerFor(
      stilFor(tegn({ ...baseline, baselineValue: 5 }), 'fa-gauge-baseline'),
      'bottom',
    );
    /* 5 av 0..10 = halve sporet. Klemmes markøren her også, er den ikke
       lenger en avlesning av været, og porten over ville bestått på en
       markør som alltid sto midt i sporet. */
    expect(bunn).toBeCloseTo(HOEYDE * 0.5 - MARKOER_HOEYDE / 2, 1);
    expect(GAUGE_MARKER_INSET_PX).toBeLessThan(HOEYDE / 2);
  });
});

describe('vindsporets fyll har vannrett overkant, låst til markøren', () => {
  it('den skrå klippingen er borte fra .fa-gauge-fill--air', () => {
    expect(
      regel('.fa-gauge-fill--air'),
      'clip-path er tilbake på luft-fyllet. Den senket fyllets venstre kant '
      + '7 px under den høyre, mens markørlinjen står vannrett — så de møttes '
      + 'bare helt til høyre og etterlot et mørkt gap under venstre halvdel.',
    ).not.toContain('clip-path');
  });

  it('fyllets overkant lander nøyaktig på markørens senter', () => {
    /* Vind: 2 m/s av 0..15. Fyllet starter 6 px over sporbunnen, så
       overkanten er 6 + høyde. Markøren er 2 px høy, så senteret er
       bottom + 1. De to skal være samme piksel — det er dette den skrå
       kanten brøt visuelt, og det som gjør at avlesningen kan stoles på. */
    const html = tegn({
      material: 'air',
      min: 0,
      max: 15,
      step: 1,
      value: 2,
      valueLabel: '2 m/s',
      baselineValue: 2,
      baselineLabel: 'Faktisk vær nå: 2 m/s',
    });
    const fyllOverkant = GAUGE_FILL_INSET_PX + pikslerFor(stilFor(html, 'fa-gauge-fill'), 'height');
    const markoerSenter = pikslerFor(stilFor(html, 'fa-gauge-baseline'), 'bottom') + MARKOER_HOEYDE / 2;

    expect(fyllOverkant).toBeGreaterThan(GAUGE_MARKER_INSET_PX);
    expect(fyllOverkant).toBeCloseTo(markoerSenter, 1);
  });
});
