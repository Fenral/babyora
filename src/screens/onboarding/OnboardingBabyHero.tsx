import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';

const POSTER_SRC = '/illustrations/onboarding/babyora-intro-v3.webp';
const VIDEO_SRC = '/illustrations/onboarding/babyora-intro-v3.mp4';

export type OnboardingBabyHeroProps = {
  reducedMotion: boolean;
  playMotion?: boolean;
  onMotionDone?: () => void;
};

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
    <div className="ob-baby-hero" data-hero="logo">
      <span className="ob-baby-wordmark" data-hero="wordmark">Babyora</span>
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
    </div>
  );
}

export default OnboardingBabyHero;
