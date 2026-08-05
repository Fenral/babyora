/**
 * Motor 2.0 Task 15 — aldersadaptiv situasjonsvelger (design-spec §15.2).
 *
 * Maks tre primærvalg per aldersstadium; gyldige sekundærvalg bak
 * «Flere situasjoner»-disclosure. IKKE wiret inn i skjermer ennå —
 * konsumeres av R7 (retning B) når visningsflagget aktiveres.
 *
 * A11y (accessibility-lead 2026-07-14, pre-review):
 *  - Native <input type="radio"> i <fieldset>/<legend> — aldri ARIA-radios.
 *  - Apply-on-select; konsumenten annonserer REGENERERT anbefaling via egen
 *    polite live-region (ikke denne komponenten).
 *  - Disclosure: aria-expanded, avslørte radios i samme name-gruppe, knappen
 *    ETTER primærradioene i DOM, auto-ekspandert når valgt verdi er sekundær.
 *  - ≥44pt mål på label; fokus via --focus-ring; aldri farge alene.
 */

import { useId, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { situationChoicesFor } from './situation-choices.js';
import type { Situation } from '../../lib/clothing-engine-v2/types.js';

type Props = {
  ageMonths: number;
  value: Situation;
  onChange: (next: Situation) => void;
};

const fieldset: CSSProperties = { border: 0, margin: 0, padding: 0 };
const srOnly: CSSProperties = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
};
const row: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 };
/* Geometrien alene — ingen materiale. `moreBtn` er en BEVISST flat
   ghost-affordanse (stiplet kant, gjennomsiktig), og skal ikke arve verken
   fyll eller skygge fra brikkene. Uten dette skillet ville den fått en
   dropshadow uten materiale under seg da lyslogikken kom på `labelBase`. */
const chipBase: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  minHeight: 44, padding: '10px 16px', borderRadius: 999,
  border: '1.5px solid var(--ink-200)',
  color: 'var(--ink-900)', fontSize: 15, fontWeight: 500, cursor: 'pointer',
};
/* D2: brikken er et trykkbart materiale, ikke en etikett — den skal være
   hevet, og da må den bære lyslogikk (inset topplys + dybde). */
const labelBase: CSSProperties = {
  ...chipBase,
  background: 'var(--surface)',
  /* HIERARKIET STO PÅ HODET, funnet av en uavhengig kontrollør 2026-08-05.
     Den UVALGTE brikken bar --dw-depth-raised (tre lag, 56 px uskarphet,
     7 px sideforskyvning) mens den VALGTE bar --dw-depth-selected (to lag,
     14 px). Uvalgt lå altså høyere enn valgt — motsatt av hva et valg betyr.
     Feilen var min: briefen sa «kopier den kompatible formen» og forbød å
     lage nye tokens, og da fantes det ingen dybde i brikkeskala å velge.
     Nå --dw-depth-chip (6 px) uvalgt, --dw-depth-selected (14 px) valgt. */
  boxShadow: 'inset 0 1px 0 var(--dw-plate-kant), var(--dw-depth-chip)',
};
/* Valgt brikke: samme materiale, men -selected i stedet for -raised. */
const labelChecked: CSSProperties = {
  ...labelBase,
  border: '1.5px solid var(--accent-cta)', background: 'var(--accent-cta)',
  color: 'var(--accent-cta-ink)', fontWeight: 700,
  boxShadow: 'inset 0 1px 0 var(--dw-plate-kant), var(--dw-depth-selected)',
};
const moreBtn: CSSProperties = {
  ...chipBase, border: '1.5px dashed var(--ink-200)', background: 'transparent',
  color: 'var(--ink-700)', fontWeight: 600,
};

export function AgeAdaptiveSituationPicker({ ageMonths, value, onChange }: Props) {
  const { t } = useTranslation();
  const name = useId();
  const { primary, secondary } = situationChoicesFor(ageMonths);
  // Auto-ekspandert når valgt verdi er sekundær — en valgt radio skjules aldri.
  const [expanded, setExpanded] = useState(secondary.includes(value));
  const showSecondary = expanded || secondary.includes(value);

  const radio = (situation: Situation) => {
    const checked = value === situation;
    return (
      <label key={situation} style={checked ? labelChecked : labelBase} className="sit-choice">
        <input
          type="radio"
          name={name}
          value={situation}
          checked={checked}
          onChange={() => onChange(situation)}
          style={srOnly}
        />
        {t(`engineV2.situations.${situation}`)}
      </label>
    );
  };

  return (
    <fieldset style={fieldset}>
      <legend style={srOnly}>{t('engineV2.situationPicker.legend')}</legend>
      <div style={row}>
        {primary.map(radio)}
        {showSecondary && secondary.map(radio)}
        {secondary.length > 0 && !showSecondary && (
          <button
            type="button"
            style={moreBtn}
            aria-expanded={false}
            onClick={() => setExpanded(true)}
          >
            {t('engineV2.situationPicker.more')}
          </button>
        )}
      </div>
    </fieldset>
  );
}
