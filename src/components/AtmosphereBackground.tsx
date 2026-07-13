/**
 * AtmosphereBackground — atmosfærisk vær-bakgrunn (F60).
 *
 * Stables under skjerm-innhold (position:absolute inset:0, z-index:0,
 * pointer-events:none). Brukes i HjemScreen + UkeScreen.
 *
 * Lag (bottom→top):
 *  1. Tone-gradient (alltid) — temp-normalisert kald→varm
 *  2. Condition-lag (subtil) — sun-bloom for klar, drift-skyer for sky
 *  3. Partikler — snø (drift down-right) + regn (rett ned)
 *  4. Haze + vignette
 *
 * Respekterer prefers-reduced-motion: kun base-gradient.
 */

import { useMemo, type CSSProperties, type ReactElement } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface AtmosphereBackgroundProps {
  /** met.no symbolCode (eks "clearsky_day", "snow", "rain"). */
  symbolCode: string;
  /** Faktisk temperatur (°C). */
  tempC: number;
  /** Vindstyrke (m/s). */
  windMs: number;
  /** Partikkel-tetthet. 0=off, 1=glissen, 2=sparsom (default), 3=tett. */
  intensity?: 0 | 1 | 2 | 3;
}

type Condition = 'klar' | 'sky' | 'snø' | 'regn';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map met.no symbolCode → 4 atmosfære-kategorier.
 * Sleet/sludd → snø (visuelt nærmest), thunder → regn.
 */
function symbolToCondition(symbolCode: string): Condition {
  const s = (symbolCode ?? '').toLowerCase();
  if (s.includes('snow')) return 'snø';
  if (s.includes('sleet') || s.includes('sludd')) return 'snø';
  if (s.includes('rain') || s.includes('drizzle') || s.includes('shower')) return 'regn';
  if (s.includes('thunder')) return 'regn';
  if (s.includes('clearsky') || s.includes('fair') || s === 'clear' || s.includes('sun')) {
    return 'klar';
  }
  // partlycloudy, cloud, fog, default → sky
  return 'sky';
}

/** Clamp helper. */
function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Normaliser temp fra -12..18 °C → 0..1 (kald=0, varm=1).
 */
function tempToTone(tempC: number): number {
  return clamp((tempC - -12) / (18 - -12), 0, 1);
}

/**
 * Tone-gradient som linear-gradient — kald (blå-ink) → varm (varm sand).
 */
function toneGradient(tempC: number): string {
  const t = tempToTone(tempC);
  // Topp: kald=mørk blå-ink, varm=lys varm-sand
  const topH = 218 - t * 28;       // 218 (kald-blå) → 190 (varm-himmel)
  const topS = 22 + t * 16;        // 22 → 38
  const topL = 64 + t * 22;        // 64 → 86
  // Bunn: holder seg nær canvas (warm grey) men varierer
  const botH = 36 - t * 4;         // 36 → 32
  const botS = 8 + t * 6;          // 8 → 14
  const botL = 86 - t * 4;         // 86 → 82

  return `linear-gradient(180deg, hsl(${topH} ${topS}% ${topL}% / 0.55) 0%, hsl(${botH} ${botS}% ${botL}% / 0.18) 62%, transparent 100%)`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Partikkel-spec (deterministisk via index)
// ─────────────────────────────────────────────────────────────────────────────

interface Particle {
  leftPct: number;
  delaySec: number;
  durationSec: number;
  size: number;
  opacity: number;
}

function makeSnowParticles(count: number): Particle[] {
  // Deterministiske posisjoner (ingen re-render-jitter)
  const seeds = [7, 23, 41, 58, 71, 84, 92, 13, 36, 49, 67];
  return Array.from({ length: count }, (_, i) => {
    const leftPct = seeds[i % seeds.length];
    return {
      leftPct,
      delaySec: (i * 2.7) % 14,
      durationSec: 22 + ((i * 3.1) % 10), // 22-32s
      size: 4 + ((i * 1.7) % 3),          // 4-7px
      opacity: 0.55 + ((i * 0.13) % 0.3), // 0.55-0.85
    };
  });
}

function makeRainParticles(count: number): Particle[] {
  const seeds = [11, 19, 29, 38, 47, 56, 65, 74, 83, 92];
  return Array.from({ length: count }, (_, i) => {
    const leftPct = seeds[i % seeds.length];
    return {
      leftPct,
      delaySec: (i * 1.4) % 6,
      durationSec: 1.4 + ((i * 0.3) % 0.9), // 1.4-2.3s (rask fall)
      size: 1.3 + ((i * 0.2) % 0.6),         // 1.3-1.9px bredde
      opacity: 0.32 + ((i * 0.07) % 0.18),   // 0.32-0.5
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function AtmosphereBackground({
  symbolCode,
  tempC,
  windMs,
  intensity = 2,
}: AtmosphereBackgroundProps): ReactElement {
  const condition = useMemo(() => symbolToCondition(symbolCode), [symbolCode]);

  // Partikkel-antall per intensity (klar/sky = 0)
  const particleCount = useMemo(() => {
    if (condition === 'klar' || condition === 'sky') return 0;
    if (intensity === 0) return 0;
    if (condition === 'snø') {
      return [0, 4, 7, 10][intensity] ?? 7;
    }
    // regn — litt tettere visuelt
    return [0, 5, 8, 12][intensity] ?? 8;
  }, [condition, intensity]);

  const particles = useMemo(() => {
    if (particleCount === 0) return [];
    return condition === 'snø'
      ? makeSnowParticles(particleCount)
      : makeRainParticles(particleCount);
  }, [condition, particleCount]);

  // Vindfaktor for snø-drift (snø driver mer i vind)
  const snowDrift = useMemo(() => clamp(20 + windMs * 6, 14, 80), [windMs]);

  // ───────── Styles ─────────

  const rootStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
    contain: 'strict',
  };

  // Lag 1 — tone-gradient
  const toneLayerStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundImage: toneGradient(tempC),
  };

  // Lag 2 — condition (sun-bloom / sky-drift / regn-haze / snø-haze)
  const conditionLayerStyle: CSSProperties = useMemo(() => {
    const base: CSSProperties = { position: 'absolute', inset: 0 };
    if (condition === 'klar') {
      // Sun-bloom: varm radial top-høyre
      return {
        ...base,
        backgroundImage:
          'radial-gradient(circle at 78% 14%, rgba(201, 107, 54, 0.22) 0%, rgba(246, 227, 217, 0.16) 28%, transparent 55%)',
      };
    }
    if (condition === 'sky') {
      // Diffust sky-overlay (overskyet = jevnere lys)
      return {
        ...base,
        backgroundImage:
          'radial-gradient(ellipse at 50% 0%, rgba(168, 158, 151, 0.22) 0%, transparent 60%), radial-gradient(circle at 22% 30%, rgba(251, 248, 244, 0.18) 0%, transparent 40%)',
      };
    }
    if (condition === 'regn') {
      // Kjølig blå-grå haze
      return {
        ...base,
        backgroundImage:
          'radial-gradient(ellipse at 50% 0%, rgba(63, 90, 120, 0.22) 0%, transparent 65%), linear-gradient(180deg, rgba(63, 90, 120, 0.08) 0%, transparent 50%)',
      };
    }
    // snø — kjølig hvit-blå haze
    return {
      ...base,
      backgroundImage:
        'radial-gradient(ellipse at 50% 0%, rgba(219, 216, 210, 0.32) 0%, transparent 70%), linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, transparent 60%)',
    };
  }, [condition]);

  // Lag 4 — vignette + haze (subtil mørkning kant + lett blå)
  const vignetteStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at center, transparent 55%, rgba(43, 37, 34, 0.08) 100%)',
  };

  // ───────── Render ─────────

  return (
    <div
      aria-hidden="true"
      role="presentation"
      style={rootStyle}
      data-atmosphere-condition={condition}
      data-atmosphere-intensity={intensity}
    >
      {/* Inline scoped keyframes — partikler droppes ved reduced-motion via CSS */}
      <style>{`
        @keyframes atm-snow-fall {
          0%   { transform: translate3d(0, -10%, 0); opacity: 0; }
          10%  { opacity: var(--atm-particle-op, 0.7); }
          90%  { opacity: var(--atm-particle-op, 0.7); }
          100% { transform: translate3d(var(--atm-snow-drift, 40px), 110%, 0); opacity: 0; }
        }
        @keyframes atm-rain-fall {
          0%   { transform: translate3d(0, -12%, 0); opacity: 0; }
          12%  { opacity: var(--atm-particle-op, 0.42); }
          92%  { opacity: var(--atm-particle-op, 0.42); }
          100% { transform: translate3d(0, 112%, 0); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .atm-particle { display: none !important; }
        }
      `}</style>

      {/* Lag 1 — tone-gradient */}
      <div style={toneLayerStyle} />

      {/* Lag 2 — condition */}
      <div style={conditionLayerStyle} />

      {/* Lag 3 — partikler (kun snø/regn) */}
      {particles.map((p, i) => {
        if (condition === 'snø') {
          const style: CSSProperties = {
            position: 'absolute',
            top: 0,
            left: `${p.leftPct}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.92)',
            boxShadow: '0 0 6px rgba(255, 255, 255, 0.35)',
            willChange: 'transform, opacity',
            animation: `atm-snow-fall ${p.durationSec}s linear ${p.delaySec}s infinite`,
            ['--atm-snow-drift' as string]: `${snowDrift}px`,
            ['--atm-particle-op' as string]: String(p.opacity),
          };
          return <span key={`s-${i}`} className="atm-particle" style={style} />;
        }
        // regn
        const style: CSSProperties = {
          position: 'absolute',
          top: 0,
          left: `${p.leftPct}%`,
          width: `${p.size}px`,
          height: '14px',
          borderRadius: '2px',
          background:
            'linear-gradient(180deg, rgba(63, 90, 120, 0) 0%, rgba(63, 90, 120, 0.55) 100%)',
          willChange: 'transform, opacity',
          animation: `atm-rain-fall ${p.durationSec}s linear ${p.delaySec}s infinite`,
          ['--atm-particle-op' as string]: String(p.opacity),
        };
        return <span key={`r-${i}`} className="atm-particle" style={style} />;
      })}

      {/* Lag 4 — vignette */}
      <div style={vignetteStyle} />
    </div>
  );
}

export default AtmosphereBackground;
