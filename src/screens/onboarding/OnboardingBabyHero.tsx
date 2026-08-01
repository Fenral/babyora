import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';

/**
 * P10/JOB5 (2026-08-01): swapped from the old lilac sitting-doll
 * illustration (babyora-intro-v3.webp/mp4) to the standing Monter mascot —
 * "old doll asset" was one of the three named violations to sweep from
 * every onboarding step, not just step 1 (which no longer uses this
 * component at all — see OnboardingScreen.tsx's own step-1 markup). This
 * component is now only reached via the 'compact' (steps 2-4) and
 * 'welcome' (step 5) variants; `object-fit: contain` (hjem-monter.css-style
 * "vitrine" treatment, see .ob-baby-media in OnboardingScreen.tsx) shows
 * the whole standing figure instead of cropping it like the old
 * pre-framed square illustration needed.
 */
const POSTER_SRC = '/monter/maskot-staaende-cut-360.png';
const VIDEO_SRC = '/illustrations/onboarding/babyora-intro-v3.mp4';

export type OnboardingBabyHeroProps = {
  reducedMotion: boolean;
  playMotion?: boolean;
  onMotionDone?: () => void;
  variant?: 'signature' | 'compact' | 'welcome';
  context?: 'birthday' | 'location' | 'ready';
};

function ContextMark({ context }: { context: NonNullable<OnboardingBabyHeroProps['context']> }): ReactElement {
  if (context === 'birthday') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3v3M17 3v3M4.5 9h15M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
        <path d="M8 13h3v3H8z" />
      </svg>
    );
  }

  if (context === 'location') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.6 2.6L16.5 9" />
    </svg>
  );
}

/**
 * Babyoras korte signaturøyeblikk i første onboardingsteg.
 *
 * Stillbildet ligger alltid under videoen. Dermed finnes det en umiddelbar
 * fallback ved redusert bevegelse, manglende autoplay eller mediefeil.
 * Videoen spilles én gang og fjernes etterpå, slik at skjemaet forblir rolig.
 */
export function OnboardingBabyHero({
  reducedMotion,
  playMotion = true,
  onMotionDone,
  variant = 'signature',
  context,
}: OnboardingBabyHeroProps): ReactElement {
  const [showVideo, setShowVideo] = useState(playMotion && !reducedMotion);
  const shouldShowVideo = showVideo && !reducedMotion;
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const finishMotion = useCallback(() => {
    setShowVideo(false);
    onMotionDone?.();
  }, [onMotionDone]);

  useEffect(() => {
    if (!shouldShowVideo || !videoRef.current) return;
    void videoRef.current.play().catch(finishMotion);
  }, [finishMotion, shouldShowVideo]);

  return (
    <div className={`ob-baby-hero ${variant}`} data-hero={variant === 'signature' ? 'logo' : undefined}>
      {variant === 'signature' && (
        <span className="ob-baby-wordmark" data-hero="wordmark">Babyora</span>
      )}
      <img
        className="ob-baby-media ob-baby-poster"
        src={POSTER_SRC}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      {shouldShowVideo && (
        <video
          ref={videoRef}
          className="ob-baby-media ob-baby-video"
          src={VIDEO_SRC}
          poster={POSTER_SRC}
          autoPlay
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
          disablePictureInPicture
          onEnded={finishMotion}
          onError={finishMotion}
        />
      )}
      <span className="ob-baby-frame" aria-hidden="true" />
      {context && (
        <span className={`ob-baby-context ${context}`} aria-hidden="true">
          <ContextMark context={context} />
        </span>
      )}
    </div>
  );
}

export default OnboardingBabyHero;
