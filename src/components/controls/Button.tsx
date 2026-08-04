/**
 * Button — appens knappeprimitiv.
 *
 * Fase 2B målte 37 knappevarianter. Samme rolle i samme fil hadde driftet
 * til flere størrelser og radiusverdier; «lukk» fantes i tolv kopier med to
 * geometrier. Denne komponenten er flaten alt skal migreres TIL, ekstrahert
 * fra referanseskjermens `.hjm-cta` — ikke oppfunnet på nytt.
 *
 * A11Y-KONTRAKTEN for `pending` er arvet ordrett fra `ActionButton`
 * (accessibility-lead 2026-07-14). Den komponenten var død kode med null
 * referanser og er slettet, men kontrakten var riktig og overlever her:
 *
 *   - `pending` bruker ALDRI native `disabled`. En disabled knapp faller ut
 *     av tabrekkefølgen midt i en handling, og skjermleseren mister flaten
 *     brukeren nettopp trykket på. `aria-busy` + en klikkvakt beholder
 *     fokus og annonserer at noe skjer.
 *   - Det tilgjengelige navnet er STABILT. Teksten byttes ikke til
 *     «Laster…»; utfallet annonseres av kallerens live-region.
 *
 * `pending` var det største enkelthullet i dagens knapper: 28 navngitte
 * knappestiler i Innstillinger kan ikke migrere uten den.
 *
 * Alle tilstandsfarger er REGNET i begge temaer, ikke gjettet — se
 * `button.css`. Gjennomsiktighet er forbudt på disabled: en dempet farge
 * kan regnes, en dempet alfa arver hva som enn ligger bak.
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import './button.css';

export type ButtonVariant = 'primary' | 'ghost' | 'quiet' | 'destructive';
export type ButtonSize = 'cta' | 'compact';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'disabled'> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Fyller bredden — referansens CTA gjør det. */
  full?: boolean;
  /** Ekte utilgjengelig handling. For «venter», bruk `pending`. */
  disabled?: boolean;
  /** Handlingen pågår. Beholder fokus og tabrekkefølge, i motsetning til `disabled`. */
  pending?: boolean;
};

export function Button({
  children,
  variant = 'primary',
  size = 'compact',
  full = false,
  disabled = false,
  pending = false,
  onClick,
  type = 'button',
  ...rest
}: Props) {
  const klasser = ['dw-btn', `dw-btn--${variant}`, `dw-btn--${size}`];
  if (full) klasser.push('dw-btn--full');

  return (
    <button
      /* type er en prop med trygg standard ('button'), så en knapp aldri
         sender et skjema ved et uhell. */
      type={type}
      className={klasser.join(' ')}
      disabled={disabled || undefined}
      aria-busy={pending || undefined}
      // aria-disabled, ikke disabled: fokus beholdes mens handlingen pågår.
      aria-disabled={pending || undefined}
      onClick={(e) => {
        if (pending) return; // klikkvakt
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
