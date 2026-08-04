/**
 * SettingsRow — den ENE radvarianten som er verdt sin egen abstraksjon.
 *
 * Fase 2B målte 16 radlignende komponenter og spurte om de deler struktur
 * eller bare ser like ut. Svaret var NEI for de fleste og et entydig JA for
 * denne: 22 forekomster fra 15 kallsteder, målt identiske til 0,06 px.
 * Det eneste som varierer er hva som står til høyre — en pil, en bryter, en
 * verdi, eller ingenting.
 *
 * NAVIGASJON ELLER IKKE. En rad som fører videre er en `<button>`. En rad
 * som bare viser noe, eller som huser en egen kontroll, er en `<div>`.
 * Forskjellen er ikke kosmetisk: en `<button>` som ikke gjør noe, dukker
 * opp i tabrekkefølgen og lover en handling som ikke finnes.
 *
 * HVA DEN BEVISST IKKE ER: en generisk `Row`. Fire plaggrader i appen måler
 * 72,00 / 66,00 / 97,58 / 102,00 px — 36 px spredning, og ingen deler
 * ledende slots eller høyre side. Å samle dem ville vært et designvedtak om
 * at de SKAL bli like, ikke en observasjon om at de allerede er det.
 * Sols stående dom: «en universell rad skjuler reelle forskjeller.»
 */
import type { ReactNode } from 'react';

import './settings-row.css';

type Props = {
  /** Ikonet til venstre. 32x32-boksen tegnes av primitiven. */
  icon?: ReactNode;
  label: string;
  /** Undertekst. Klippes til to linjer så lista beholder rytmen. */
  sub?: string;
  /** Verdien til høyre — klippes ved 42 % så etiketten aldri spises opp. */
  value?: string;
  /** Egen kontroll til høyre: bryter, merke, pil. */
  trailing?: ReactNode;
  /** Fører raden videre, blir den en <button>. Ellers en <div>. */
  onClick?: () => void;
  /** Skillelinje under, innrykket til teksten. */
  divider?: boolean;
};

export function SettingsRow({
  icon, label, sub, value, trailing, onClick, divider = false,
}: Props) {
  const innhold = (
    <>
      {icon ? <span className="dw-rad-ikon" aria-hidden="true">{icon}</span> : null}
      <span className="dw-rad-kropp">
        <span className="dw-rad-etikett">{label}</span>
        {sub ? <span className="dw-rad-under">{sub}</span> : null}
      </span>
      {(value || trailing) && (
        <span className="dw-rad-hoyre">
          {value ? <span className="dw-rad-verdi">{value}</span> : null}
          {trailing}
        </span>
      )}
    </>
  );

  return (
    <>
      {onClick ? (
        <button type="button" className="dw-rad dw-rad--trykkbar" onClick={onClick}>
          {innhold}
        </button>
      ) : (
        <div className="dw-rad">{innhold}</div>
      )}
      {divider ? <div className="dw-rad-skille" role="presentation" /> : null}
    </>
  );
}
