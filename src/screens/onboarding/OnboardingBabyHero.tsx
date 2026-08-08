import { type ReactElement } from 'react';

/**
 * INTROFILMEN ER ARKIVERT (2026-08-07).
 *
 * Komponenten hadde et komplett videomaskineri — `playMotion`, `onMotionDone`,
 * `variant="signature"`, en `<video>` med autoplay og onEnded-fallback. Ingen
 * av delene kjørte: ALLE fire kallsteder i OnboardingScreen sendte
 * `playMotion={false}`, og `signature` ble aldri brukt. Filmen
 * (`babyora-intro-v3.mp4`) lå i bundelen uten noensinne å bli avspilt.
 *
 * Den ble erstattet av den stående maskoten i P10/JOB5-redesignet, og
 * maskineriet ble bare stående igjen. Kode som ser levende ut men ikke er
 * det, er nøyaktig feilen som lot widgeten gå usammenkoblet til TestFlight
 * samme uke — derfor er den fjernet i stedet for kommentert bort.
 *
 * Filmen og de fire gamle onboarding-illustrasjonene ligger i
 * `docs/mocks/arkiv/illustrations-onboarding/`. Appens EKTE åpningsanimasjon
 * er `#launch` i index.html: ordmerket toner inn over 520 ms med varmt lys
 * fra øvre venstre. Skal filmen vekkes, er det en beslutning om at åpningen
 * skal ha TO signaturøyeblikk — ikke en opprydding.
 *
 * P10/JOB5 (2026-08-01): swapped from the old lilac sitting-doll
 * illustration (babyora-intro-v3.webp/mp4) to the standing Monter mascot —
 * "old doll asset" was one of the three named violations to sweep from
 * every onboarding step, not just step 1 (which no longer uses this
 * component at all — see OnboardingScreen.tsx's own step-1 markup). This
 * component is now only reached via the 'compact' (steps 2-4) and
 * 'welcome' (step 5) variants; `object-fit: contain` (hjem-monter.css-style
 * cutout treatment, see .ob-baby-media in OnboardingScreen.tsx) shows the
 * whole standing figure without putting the identity mark inside another
 * generic rounded card.
 */
const POSTER_SRC = '/monter/maskot-staaende-cut-360.webp';

export type OnboardingBabyHeroProps = {
  variant?: 'compact' | 'welcome';
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
  variant = 'compact',
  context,
}: OnboardingBabyHeroProps): ReactElement {
  return (
    <div className={`ob-baby-hero ${variant}`}>
      <img
        className="ob-baby-media ob-baby-poster"
        src={POSTER_SRC}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      {context && (
        <span className={`ob-baby-context ${context}`} aria-hidden="true">
          <ContextMark context={context} />
        </span>
      )}
    </div>
  );
}

export default OnboardingBabyHero;
