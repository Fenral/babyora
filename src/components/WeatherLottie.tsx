/**
 * WeatherLottie — F60.8 3D-vær-ikon.
 *
 * Mapper met.no symbolCode → Lottie-animasjon (sol/sky/regn/snø).
 * Faller tilbake til inline CSS-baserte SVG-ikoner hvis Lottie ikke laster
 * (offline, blokkert, prefers-reduced-motion).
 *
 * Native-feel #9 (2026-06-26): byttet fra CDN-lastet <lottie-player>
 * (script i index.html) til lokal `@lottiefiles/dotlottie-react`. Eliminerer
 * tredjepart-script + lar Vite kode-splitte player-bunten ut av initial JS.
 *
 * Brukt av HjemScreen ved siden av temp-figuren (B-strategi mock).
 *
 * F60.14 dark-mode bump (Lottie color-bg-tilpasning):
 *  - Wrap-span har INGEN solid background — Lottie- og fallback-ikonene
 *    rendres mot transparent, så de plasserer seg pent på både warm-grey
 *    light og oklch(0.21) dark canvas uten en hard ramme.
 *  - Drop-shadow-haloene løftes en touch på dark (rgba alpha justert), så
 *    sol/sky/regn/snø får tydelig "glow" mot mørk bakgrunn også.
 *  - Cloud / rain / snow fallback-gradientene beholder skydraps-fargene
 *    bevisst — det er etablert ikonkonvensjon at en sky er lys uansett
 *    bakgrunn (jf. iOS-værwidget i dark-mode).
 */
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DotLottieReact, type DotLottie } from '@lottiefiles/dotlottie-react';
import { useNativeSettings } from '../hooks/useNativeSettings';

type WeatherCondition = 'clear' | 'cloud' | 'rain' | 'snow';

const LOTTIE_URLS: Record<WeatherCondition, string> = {
  // Samme URLs som brukt i mock public/hjem-3d-mock-mye-klaer/.
  clear: 'https://assets10.lottiefiles.com/packages/lf20_KUFdS6.json',
  cloud: 'https://assets2.lottiefiles.com/packages/lf20_ulkjvhsa.json',
  // Regn + snø: pek til velprøvde public Lottie-animasjoner.
  rain: 'https://assets9.lottiefiles.com/packages/lf20_jmBauI.json',
  snow: 'https://assets3.lottiefiles.com/packages/lf20_kbfn4khz.json',
};

function symbolToCondition(symbolCode: string | undefined): WeatherCondition {
  if (!symbolCode) return 'clear';
  const base = symbolCode.replace(/_(day|night|polartwilight)$/, '');
  if (base.includes('snow') || base.includes('sleet')) return 'snow';
  if (base.includes('rain')) return 'rain';
  if (base.includes('clear') || base.includes('fair')) return 'clear';
  return 'cloud';
}

type WeatherLottieProps = {
  symbolCode?: string;
  size?: number;
};

export function WeatherLottie({ symbolCode, size = 46 }: WeatherLottieProps) {
  const { reducedMotion } = useNativeSettings();
  const condition = useMemo(() => symbolToCondition(symbolCode), [symbolCode]);
  const [showFallback, setShowFallback] = useState(true);
  const [dotLottie, setDotLottie] = useState<DotLottie | null>(null);

  // Vis fallback igjen hver gang kondisjon byttes til ny animasjon.
  useEffect(() => {
    setShowFallback(true);
  }, [condition]);

  // Subscribe på dotLottie load/error-events: skjul fallback når animasjonen
  // er rendret, hold fallback synlig ved feil. Failsafe på 2.5s ifall ingen
  // events fyrer (offline, blokkert nettverk).
  useEffect(() => {
    if (!dotLottie) return;
    const onLoad = () => setShowFallback(false);
    const onLoadError = () => setShowFallback(true);
    dotLottie.addEventListener('load', onLoad);
    dotLottie.addEventListener('loadError', onLoadError);
    const failsafe = window.setTimeout(() => {
      if (!dotLottie.isLoaded) setShowFallback(true);
    }, 2500);
    return () => {
      dotLottie.removeEventListener('load', onLoad);
      dotLottie.removeEventListener('loadError', onLoadError);
      window.clearTimeout(failsafe);
    };
  }, [dotLottie, condition]);

  // prefers-reduced-motion: pause dotLottie hvis brukeren ber om det.
  useEffect(() => {
    if (!dotLottie) return;
    if (reducedMotion) {
      try {
        dotLottie.pause();
      } catch {
        /* noop */
      }
    } else {
      try {
        dotLottie.play();
      } catch {
        /* noop */
      }
    }
  }, [dotLottie, reducedMotion]);

  const wrapStyle: CSSProperties = {
    width: size,
    height: size,
    flex: 'none',
    position: 'relative',
    display: 'inline-block',
    filter:
      condition === 'clear'
        ? 'drop-shadow(0 4px 10px rgba(244,167,66,0.45))'
        : condition === 'cloud'
          ? 'drop-shadow(0 4px 10px rgba(80,100,130,0.35))'
          : condition === 'rain'
            ? 'drop-shadow(0 4px 10px rgba(92,143,201,0.45))'
            : 'drop-shadow(0 4px 10px rgba(180,200,220,0.45))',
  };

  const playerStyle: CSSProperties = {
    width: size,
    height: size,
    display: 'block',
  };

  return (
    <span aria-hidden="true" style={wrapStyle}>
      {!reducedMotion && (
        <DotLottieReact
          src={LOTTIE_URLS[condition]}
          autoplay
          loop
          style={playerStyle}
          dotLottieRefCallback={setDotLottie}
        />
      )}
      {showFallback && (
        <FallbackIcon condition={condition} size={size} reduced={reducedMotion} />
      )}
    </span>
  );
}

// ─── Fallback SVG-ikoner (inline, ingen CDN-avhengighet) ─────────────────

function FallbackIcon({
  condition,
  size,
  reduced,
}: {
  condition: WeatherCondition;
  size: number;
  reduced: boolean;
}) {
  const baseStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: size,
    height: size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const animStyle: CSSProperties = reduced
    ? {}
    : { animation: 'baFallbackBreathe 4.2s ease-in-out infinite' };

  if (condition === 'clear') {
    return (
      <span style={baseStyle}>
        <style>{`@keyframes baFallbackBreathe {0%,100%{transform:scale(1);}50%{transform:scale(1.06);}}`}</style>
        <svg
          width={size * 0.78}
          height={size * 0.78}
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
          style={animStyle}
        >
          <defs>
            <radialGradient id="ba-sun-g" cx="35%" cy="32%" r="60%">
              <stop offset="0%" stopColor="#FFE8B8" />
              <stop offset="55%" stopColor="#F4A742" />
              <stop offset="100%" stopColor="#C9761A" />
            </radialGradient>
          </defs>
          <circle cx="24" cy="24" r="9" fill="url(#ba-sun-g)" />
          <g stroke="#F4A742" strokeWidth="2.2" strokeLinecap="round">
            <path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.5 10.5l4.2 4.2M33.3 33.3l4.2 4.2M37.5 10.5l-4.2 4.2M14.7 33.3l-4.2 4.2" />
          </g>
        </svg>
      </span>
    );
  }

  if (condition === 'cloud') {
    return (
      <span style={baseStyle}>
        <svg
          width={size * 0.82}
          height={size * 0.82}
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="ba-cloud-g" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#E9EEF4" />
              <stop offset="100%" stopColor="#A9B6C5" />
            </linearGradient>
          </defs>
          <path
            d="M12 32h22a6 6 0 0 0 .6-12 9 9 0 0 0-17-1.5A5.5 5.5 0 0 0 12 32z"
            fill="url(#ba-cloud-g)"
            stroke="#7B8896"
            strokeWidth="0.6"
          />
        </svg>
      </span>
    );
  }

  if (condition === 'rain') {
    return (
      <span style={baseStyle}>
        <style>{`@keyframes baRainFall {0%{transform:translateY(0);opacity:0;}20%{opacity:.9;}100%{transform:translateY(8px);opacity:0;}}`}</style>
        <svg
          width={size * 0.82}
          height={size * 0.82}
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="ba-rain-cloud" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#E9EEF4" />
              <stop offset="100%" stopColor="#B9C7D5" />
            </linearGradient>
          </defs>
          <path
            d="M12 26h22a5 5 0 0 0 .5-10 8 8 0 0 0-15-1.3A4.6 4.6 0 0 0 12 26z"
            fill="url(#ba-rain-cloud)"
          />
          <g fill="#5C8FC9">
            <rect
              x="18"
              y="30"
              width="2"
              height="6"
              rx="1"
              style={reduced ? {} : { animation: 'baRainFall 1.3s linear infinite' }}
            />
            <rect
              x="24"
              y="30"
              width="2"
              height="6"
              rx="1"
              style={reduced ? {} : { animation: 'baRainFall 1.3s linear .35s infinite' }}
            />
            <rect
              x="30"
              y="30"
              width="2"
              height="6"
              rx="1"
              style={reduced ? {} : { animation: 'baRainFall 1.3s linear .7s infinite' }}
            />
          </g>
        </svg>
      </span>
    );
  }

  // snow
  return (
    <span style={baseStyle}>
      <svg
        width={size * 0.82}
        height={size * 0.82}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="ba-snow-cloud" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#F4F6FA" />
            <stop offset="100%" stopColor="#C7D3DF" />
          </linearGradient>
        </defs>
        <path
          d="M12 26h22a5 5 0 0 0 .5-10 8 8 0 0 0-15-1.3A4.6 4.6 0 0 0 12 26z"
          fill="url(#ba-snow-cloud)"
        />
        <g fill="#9FB4C7">
          <circle cx="19" cy="34" r="1.6" />
          <circle cx="25" cy="38" r="1.6" />
          <circle cx="31" cy="34" r="1.6" />
        </g>
      </svg>
    </span>
  );
}

export default WeatherLottie;
